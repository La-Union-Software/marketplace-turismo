import { NextRequest, NextResponse } from 'next/server';
import { firebaseDB } from '@/services/firebaseService';

/**
 * Handle MercadoPago subscription webhook notifications
 * POST /api/mercadopago/subscription-webhook
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('🔔 [MercadoPago Subscription Webhook] Received notification:', body);

    const { type, data } = body;

    console.log('🔔 [MercadoPago Subscription Webhook] Processing notification:', { type, data });

    if (type === 'payment') {
      const paymentId = data?.id;
      if (!paymentId) {
        console.error('❌ [MercadoPago Subscription Webhook] No payment ID in webhook data');
        return NextResponse.json({ error: 'No payment ID' }, { status: 400 });
      }

      // Get payment details from MercadoPago
      const paymentDetails = await getPaymentDetails(paymentId);
      
      if (paymentDetails) {
        // Process payment using payment tracking service
        const { paymentTrackingService } = await import('@/services/paymentTrackingService');
        await paymentTrackingService.processPaymentWebhook(paymentDetails);
        
        await processSubscriptionPayment(paymentDetails);
      }
    } else if (type === 'preapproval') {
      const subscriptionId = data?.id;
      if (!subscriptionId) {
        console.error('❌ [MercadoPago Subscription Webhook] No subscription ID in webhook data');
        return NextResponse.json({ error: 'No subscription ID' }, { status: 400 });
      }

      // Get subscription details from MercadoPago
      const subscriptionDetails = await getSubscriptionDetails(subscriptionId);
      
      if (subscriptionDetails) {
        await processSubscriptionStatusChange(subscriptionDetails);
      }
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('❌ [MercadoPago Subscription Webhook] Error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

/**
 * Get payment details from MercadoPago
 */
async function getPaymentDetails(paymentId: string) {
  try {
    const accessToken = process.env.NEXAR_SUSCRIPTIONS_ACCESS_TOKEN;
    
    if (!accessToken) {
      throw new Error('MercadoPago access token not configured');
    }

    const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get payment details: ${response.statusText}`);
    }

    const payment = await response.json();
    
    console.log('💳 [MercadoPago Subscription Webhook] Payment details:', {
      id: payment.id,
      status: payment.status,
      status_detail: payment.status_detail,
      external_reference: payment.external_reference,
      transaction_amount: payment.transaction_amount
    });

    return payment;
  } catch (error) {
    console.error('❌ [MercadoPago Subscription Webhook] Error getting payment details:', error);
    return null;
  }
}

/**
 * Process subscription payment and update user status
 */
async function processSubscriptionPayment(payment: any) {
  try {
    const { status, external_reference, metadata } = payment;

    // Only process approved payments
    if (status !== 'approved') {
      console.log(`⚠️ [MercadoPago Subscription Webhook] Payment not approved. Status: ${status}`);
      return;
    }

    // Extract data from external_reference or metadata
    const referenceData = external_reference || metadata?.external_reference;
    if (!referenceData || !referenceData.startsWith('subscription_')) {
      console.error('❌ [MercadoPago Subscription Webhook] Invalid external reference:', referenceData);
      return;
    }

    const [, planId, userId] = referenceData.split('_');
    
    if (!planId || !userId) {
      console.error('❌ [MercadoPago Subscription Webhook] Missing planId or userId in reference:', referenceData);
      return;
    }

    console.log('🔄 [MercadoPago Subscription Webhook] Processing subscription for:', { planId, userId });

    // Check if user already has an active subscription
    const existingSubscription = await getActiveUserSubscription(userId);
    if (existingSubscription) {
      console.log('⚠️ [MercadoPago Subscription Webhook] User already has active subscription:', existingSubscription.id);
      return;
    }

    // Get plan details
    const plans = await firebaseDB.plans.getAll();
    const plan = plans.find(p => p.id === planId);
    
    if (!plan) {
      console.error('❌ [MercadoPago Subscription Webhook] Plan not found:', planId);
      return;
    }

    // Create user subscription record
    const subscriptionId = await createUserSubscription({
      userId,
      planId,
      planName: plan.name,
      paymentId: payment.id,
      amount: payment.transaction_amount,
      currency: payment.currency_id,
      status: 'active',
      startDate: new Date(),
      endDate: calculateEndDate(plan.billingCycle),
      metadata: {
        mercadoPagoPaymentId: payment.id,
        paymentStatus: payment.status,
        paymentStatusDetail: payment.status_detail
      }
    });

    // Assign publisher role to user
    await firebaseDB.users.assignRole(userId, 'publisher', 'system');

    console.log('✅ [MercadoPago Subscription Webhook] Subscription created successfully:', {
      subscriptionId,
      userId,
      planName: plan.name,
      paymentId: payment.id
    });

  } catch (error) {
    console.error('❌ [MercadoPago Subscription Webhook] Error processing subscription payment:', error);
  }
}

/**
 * Get active user subscription
 */
async function getActiveUserSubscription(userId: string) {
  try {
    const subscriptionsRef = firebaseDB.db.collection('userSubscriptions');
    const snapshot = await subscriptionsRef
      .where('userId', '==', userId)
      .where('status', '==', 'active')
      .limit(1)
      .get();

    if (snapshot.empty) {
      return null;
    }

    const subscription = snapshot.docs[0].data();
    return {
      id: snapshot.docs[0].id,
      ...subscription
    };
  } catch (error) {
    console.error('Error getting active user subscription:', error);
    return null;
  }
}

/**
 * Create user subscription record
 */
async function createUserSubscription(subscriptionData: any) {
  try {
    const subscriptionsRef = firebaseDB.db.collection('userSubscriptions');
    const docRef = await subscriptionsRef.add({
      ...subscriptionData,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'system'
    });

    return docRef.id;
  } catch (error) {
    console.error('Error creating user subscription:', error);
    throw error;
  }
}

/**
 * Get subscription details from MercadoPago
 */
async function getSubscriptionDetails(subscriptionId: string) {
  try {
    const accessToken = process.env.NEXAR_SUSCRIPTIONS_ACCESS_TOKEN;
    
    if (!accessToken) {
      throw new Error('MercadoPago access token not configured');
    }

    const response = await fetch(`https://api.mercadopago.com/v1/preapproval/${subscriptionId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get subscription details: ${response.statusText}`);
    }

    const subscription = await response.json();
    
    console.log('🔄 [MercadoPago Subscription Webhook] Subscription details:', {
      id: subscription.id,
      status: subscription.status,
      payer_email: subscription.payer_email,
      external_reference: subscription.external_reference
    });

    return subscription;
  } catch (error) {
    console.error('❌ [MercadoPago Subscription Webhook] Error getting subscription details:', error);
    return null;
  }
}

/**
 * Process subscription status changes
 */
async function processSubscriptionStatusChange(subscription: any) {
  try {
    const { status, external_reference, payer_email } = subscription;

    // Extract data from external_reference
    const referenceData = external_reference || '';
    if (!referenceData || !referenceData.startsWith('subscription_')) {
      console.error('❌ [MercadoPago Subscription Webhook] Invalid external reference:', referenceData);
      return;
    }

    const [, planId, userId] = referenceData.split('_');
    
    if (!planId || !userId) {
      console.error('❌ [MercadoPago Subscription Webhook] Missing planId or userId in reference:', referenceData);
      return;
    }

    console.log('🔄 [MercadoPago Subscription Webhook] Processing subscription status change:', {
      subscriptionId: subscription.id,
      status,
      userId,
      planId
    });

    // Find the subscription record in our database
    const subscriptionRecord = await findUserSubscriptionByMercadoPagoId(subscription.id);
    
    if (!subscriptionRecord) {
      console.error('❌ [MercadoPago Subscription Webhook] Subscription record not found:', subscription.id);
      return;
    }

    // Update subscription status based on MercadoPago status
    let newStatus: string;
    let shouldAssignRole = false;

    switch (status) {
      case 'authorized':
        newStatus = 'active';
        shouldAssignRole = true;
        console.log('✅ [MercadoPago Subscription Webhook] Subscription authorized, activating...');
        break;
      case 'cancelled':
        newStatus = 'cancelled';
        console.log('❌ [MercadoPago Subscription Webhook] Subscription cancelled');
        break;
      case 'paused':
        newStatus = 'paused';
        console.log('⏸️ [MercadoPago Subscription Webhook] Subscription paused');
        break;
      default:
        console.log('ℹ️ [MercadoPago Subscription Webhook] Subscription status:', status);
        return; // Don't update for unknown statuses
    }

    // Update subscription record
    await updateUserSubscription(subscriptionRecord.id, {
      status: newStatus,
      mercadoPagoStatus: status,
      updatedAt: new Date(),
      metadata: {
        ...subscriptionRecord.metadata,
        lastStatusUpdate: new Date(),
        mercadoPagoStatus: status
      }
    });

    // Use auth middleware to manage roles and posts
    if (shouldAssignRole || status === 'cancelled') {
      try {
        const { authMiddleware } = await import('@/services/authMiddleware');
        const { globalAuthMiddleware } = await import('@/services/globalAuthMiddleware');
        
        // Clear user cache to force refresh
        globalAuthMiddleware.clearUserCache(userId);
        
        // Update user roles and posts
        await authMiddleware.checkUserSubscriptionAndRoles(userId);
        console.log('✅ [MercadoPago Subscription Webhook] User roles and posts updated via middleware for user:', userId);
      } catch (error) {
        console.error('❌ [MercadoPago Subscription Webhook] Error updating user via middleware:', error);
      }
    }

    console.log('✅ [MercadoPago Subscription Webhook] Subscription status updated:', {
      subscriptionId: subscriptionRecord.id,
      newStatus,
      userId
    });

  } catch (error) {
    console.error('❌ [MercadoPago Subscription Webhook] Error processing subscription status change:', error);
  }
}

/**
 * Find user subscription by MercadoPago subscription ID
 */
async function findUserSubscriptionByMercadoPagoId(mercadoPagoSubscriptionId: string) {
  try {
    const subscriptionsRef = firebaseDB.db.collection('userSubscriptions');
    const snapshot = await subscriptionsRef
      .where('mercadoPagoSubscriptionId', '==', mercadoPagoSubscriptionId)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return null;
    }

    const subscription = snapshot.docs[0].data();
    return {
      id: snapshot.docs[0].id,
      ...subscription
    };
  } catch (error) {
    console.error('Error finding subscription by MercadoPago ID:', error);
    return null;
  }
}

/**
 * Update user subscription record
 */
async function updateUserSubscription(subscriptionId: string, updates: any) {
  try {
    const subscriptionRef = firebaseDB.db.collection('userSubscriptions').doc(subscriptionId);
    await subscriptionRef.update(updates);
  } catch (error) {
    console.error('Error updating user subscription:', error);
    throw error;
  }
}

/**
 * Calculate subscription end date based on billing cycle
 */
function calculateEndDate(billingCycle: string): Date {
  const now = new Date();
  
  switch (billingCycle) {
    case 'monthly':
      return new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
    case 'yearly':
      return new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
    case 'weekly':
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    case 'daily':
      return new Date(now.getTime() + 24 * 60 * 60 * 1000);
    default:
      return new Date(now.getFullYear(), now.getMonth() + 1, now.getDate()); // Default to monthly
  }
}

export async function GET() {
  return NextResponse.json({ message: 'MercadoPago subscription webhook endpoint' });
}
