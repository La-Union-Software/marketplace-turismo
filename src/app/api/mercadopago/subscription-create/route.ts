import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, PreApprovalPlan } from 'mercadopago';
import { firebaseDB } from '@/services/firebaseService';

/**
 * Create a true recurring subscription using MercadoPago PreApprovalPlan
 * POST /api/mercadopago/subscription-create
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { planId, userId } = body;

    if (!planId || !userId) {
      return NextResponse.json({ error: 'Plan ID and User ID are required' }, { status: 400 });
    }

    console.log('🔄 [MercadoPago Subscription] Creating recurring subscription for:', { planId, userId });

    // Get MercadoPago Subscriptions credentials from environment variables
    const publicKey = process.env.NEXAR_SUSCRIPTIONS_PUBLIC_KEY;
    const accessToken = process.env.NEXAR_SUSCRIPTIONS_ACCESS_TOKEN;
    
    if (!publicKey || !accessToken) {
      console.error('❌ [MercadoPago Subscription] Missing environment variables');
      return NextResponse.json(
        { error: 'MercadoPago Subscriptions credentials not configured. Please set NEXAR_SUSCRIPTIONS_PUBLIC_KEY and NEXAR_SUSCRIPTIONS_ACCESS_TOKEN environment variables.' },
        { status: 500 }
      );
    }

    // Get the plan data from Firebase
    const plans = await firebaseDB.plans.getAll();
    const plan = plans.find(p => p.id === planId);
    
    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    // Get user data
    const user = await firebaseDB.users.getById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user already has an active subscription
    const existingSubscription = await getActiveUserSubscription(userId);
    if (existingSubscription) {
      console.log('⚠️ [MercadoPago Subscription] User already has active subscription:', existingSubscription.id);
      return NextResponse.json({ 
        error: 'User already has an active subscription',
        existingSubscription: existingSubscription.id
      }, { status: 400 });
    }

    // Initialize MercadoPago client
    const config = new MercadoPagoConfig({ 
      accessToken: accessToken,
      options: { timeout: 5000 }
    });
    const preApprovalPlan = new PreApprovalPlan(config);

    // Get base URL with fallback
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://asia-forworn-willena.ngrok-free.dev';
    
    // Ensure URL is valid and remove trailing slash
    let validBaseUrl: string;
    try {
      const url = new URL(baseUrl);
      validBaseUrl = url.origin;
      console.log('✅ [MercadoPago Subscription] Using base URL:', validBaseUrl);
    } catch (error) {
      validBaseUrl = 'https://asia-forworn-willena.ngrok-free.dev';
      console.warn('⚠️ NEXT_PUBLIC_BASE_URL is invalid, using ngrok fallback:', baseUrl);
    }

    // Convert billing cycle to MercadoPago format
    const frequencyMap: Record<string, number> = {
      daily: 1,
      weekly: 7,
      monthly: 1,
      yearly: 12
    };

    const frequencyTypeMap: Record<string, 'days' | 'months'> = {
      daily: 'days',
      weekly: 'days',
      monthly: 'months',
      yearly: 'months'
    };

    const frequency = frequencyMap[plan.billingCycle] || 1;
    const frequencyType = frequencyTypeMap[plan.billingCycle] || 'months';

    // Create PreApprovalPlan data
    const subscriptionData = {
      reason: `Suscripción ${plan.name}`,
      auto_recurring: {
        frequency: frequency,
        frequency_type: frequencyType,
        transaction_amount: plan.price,
        currency_id: plan.currency || 'ARS',
      },
      payer_email: user.email,
      back_url: `${validBaseUrl}/payment/complete`,
      status: 'active', // Must be 'active' for PreApprovalPlan (will be pending until user subscribes)
      external_reference: `subscription_${planId}_${userId}`,
    };

    console.log('📋 [MercadoPago Subscription] Creating PreApprovalPlan:', {
      planName: plan.name,
      price: plan.price,
      frequency: frequency,
      frequencyType: frequencyType,
      userEmail: user.email,
      billingCycle: plan.billingCycle,
      backUrl: subscriptionData.back_url,
      externalReference: subscriptionData.external_reference
    });

    console.log('🔗 [MercadoPago Subscription] Complete subscription data being sent to MercadoPago:', JSON.stringify(subscriptionData, null, 2));

    // Create the PreApprovalPlan
    const result = await preApprovalPlan.create({ body: subscriptionData });

    console.log('✅ [MercadoPago Subscription] PreApprovalPlan created:', {
      id: result.id,
      status: result.status,
      initPoint: result.init_point
    });

    console.log('🔗 [MercadoPago Subscription] Complete MercadoPago response:', JSON.stringify(result, null, 2));

    // Log webhook configuration info
    const webhookUrl = `${validBaseUrl}/api/mercadopago/webhook`;
    console.log('🔔 [MercadoPago Subscription] WEBHOOK CONFIGURATION INFO:');
    console.log('🔔 [MercadoPago Subscription] Webhook URL to configure in MercadoPago dashboard:', webhookUrl);
    console.log('🔔 [MercadoPago Subscription] Back URL (return URL):', subscriptionData.back_url);
    console.log('🔔 [MercadoPago Subscription] External Reference:', subscriptionData.external_reference);
    console.log('🔔 [MercadoPago Subscription] PreApprovalPlan ID:', result.id);

    // Create initial subscription record in our database (pending status)
    const subscriptionId = await createUserSubscription({
      userId,
      planId,
      planName: plan.name,
      mercadoPagoSubscriptionId: result.id,
      amount: plan.price,
      currency: plan.currency || 'ARS',
      status: 'pending',
      billingCycle: plan.billingCycle,
      frequency: frequency,
      frequencyType: frequencyType,
      startDate: new Date(),
      metadata: {
        mercadoPagoSubscriptionId: result.id,
        subscriptionStatus: result.status,
        initPoint: result.init_point
      }
    });

    const responseData = {
      success: true,
      subscriptionId: result.id,
      initPoint: result.init_point,
      publicKey: publicKey,
      localSubscriptionId: subscriptionId,
      plan: {
        id: plan.id,
        name: plan.name,
        price: plan.price,
        currency: plan.currency,
        billingCycle: plan.billingCycle,
        maxPosts: plan.maxPosts,
        maxBookings: plan.maxBookings,
        features: plan.features
      }
    };

    console.log('📤 [MercadoPago Subscription] Returning response to frontend:', JSON.stringify(responseData, null, 2));
    console.log('📤 [MercadoPago Subscription] Frontend will redirect user to:', result.init_point);
    console.log('📤 [MercadoPago Subscription] User will return to:', subscriptionData.back_url);

    return NextResponse.json(responseData);

  } catch (error) {
    console.error('❌ [MercadoPago Subscription] Error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to create subscription',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

/**
 * Get active user subscription
 * Uses subscriptionService which handles Firebase client SDK
 */
async function getActiveUserSubscription(userId: string) {
  try {
    const { subscriptionService } = await import('@/services/subscriptionService');
    return await subscriptionService.getUserActiveSubscription(userId);
  } catch (error) {
    console.error('Error getting active user subscription:', error);
    return null;
  }
}

/**
 * Create user subscription record
 * Uses firebaseDB service methods
 */
async function createUserSubscription(subscriptionData: any) {
  try {
    // Use the existing Firebase service which works with client SDK
    const docId = await firebaseDB.subscriptions.create({
      ...subscriptionData,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'system'
    });

    return docId;
  } catch (error) {
    console.error('Error creating user subscription:', error);
    throw error;
  }
}

export async function GET() {
  return NextResponse.json({ message: 'MercadoPago subscription creation endpoint' });
}
