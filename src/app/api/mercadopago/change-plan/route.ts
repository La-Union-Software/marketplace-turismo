import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, PreApproval } from 'mercadopago';
import { firebaseDB } from '@/services/firebaseService';
import { subscriptionService } from '@/services/subscriptionService';

/**
 * Change user's subscription plan
 * POST /api/mercadopago/change-plan
 * 
 * Since MercadoPago doesn't support plan changes directly, this endpoint:
 * 1. Cancels the old subscription in MercadoPago
 * 2. Marks the old subscription as 'cancelled' in Firebase
 * 3. Marks the new subscription as 'active' in Firebase
 * 
 * Note: The new subscription should already be created via subscription-create endpoint
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, oldSubscriptionId, newSubscriptionId } = body ?? {};

    if (!userId || !oldSubscriptionId || !newSubscriptionId) {
      return NextResponse.json(
        { error: 'userId, oldSubscriptionId, and newSubscriptionId are required' },
        { status: 400 },
      );
    }

    console.log('🔄 [Change Plan] Starting plan change:', {
      userId,
      oldSubscriptionId,
      newSubscriptionId,
    });

    // ---- ENV & SDK ---------------------------------------------------------
    const accessToken = process.env.NEXAR_SUSCRIPTIONS_ACCESS_TOKEN;

    if (!accessToken) {
      console.error('❌ [Change Plan] Missing MP access token');
      return NextResponse.json(
        { error: 'MercadoPago credentials not configured' },
        { status: 500 },
      );
    }

    const mp = new MercadoPagoConfig({ accessToken, options: { timeout: 8000 } });
    const preapproval = new PreApproval(mp);

    // ---- Get Old Subscription ----------------------------------------------
    const oldSubscriptionDoc = await firebaseDB.subscriptions.getById(oldSubscriptionId);
    
    if (!oldSubscriptionDoc) {
      return NextResponse.json(
        { error: 'Old subscription not found' },
        { status: 404 },
      );
    }

    if (oldSubscriptionDoc.userId !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized: Subscription does not belong to user' },
        { status: 403 },
      );
    }

    // ---- Get New Subscription ----------------------------------------------
    const newSubscriptionDoc = await firebaseDB.subscriptions.getById(newSubscriptionId);
    
    if (!newSubscriptionDoc) {
      return NextResponse.json(
        { error: 'New subscription not found' },
        { status: 404 },
      );
    }

    if (newSubscriptionDoc.userId !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized: New subscription does not belong to user' },
        { status: 403 },
      );
    }

    // ---- Cancel Old Subscription in MercadoPago ----------------------------
    if (oldSubscriptionDoc.mercadoPagoSubscriptionId) {
      try {
        console.log('🔄 [Change Plan] Canceling old MP subscription:', oldSubscriptionDoc.mercadoPagoSubscriptionId);
        
        await preapproval.update({
          id: oldSubscriptionDoc.mercadoPagoSubscriptionId,
          body: {
            status: 'cancelled',
          },
        });

        console.log('✅ [Change Plan] Old MP subscription cancelled');
      } catch (mpError) {
        console.error('❌ [Change Plan] Error canceling old MP subscription:', mpError);
        // Continue anyway - we'll update Firebase even if MP fails
      }
    }

    // ---- Update Old Subscription in Firebase -------------------------------
    try {
      await firebaseDB.subscriptions.update(oldSubscriptionId, {
        status: 'cancelled',
        updatedAt: new Date(),
        endDate: new Date(),
        metadata: {
          ...oldSubscriptionDoc.metadata,
          cancelledAt: new Date(),
          cancelReason: 'Plan changed',
          newSubscriptionId: newSubscriptionId,
        },
      });

      console.log('✅ [Change Plan] Old subscription marked as cancelled in Firebase');
    } catch (firebaseError) {
      console.error('❌ [Change Plan] Error updating old subscription in Firebase:', firebaseError);
      return NextResponse.json(
        { error: 'Failed to cancel old subscription' },
        { status: 500 },
      );
    }

    // ---- Activate New Subscription in Firebase -----------------------------
    try {
      await firebaseDB.subscriptions.update(newSubscriptionId, {
        status: 'active',
        updatedAt: new Date(),
        startDate: new Date(),
        metadata: {
          ...newSubscriptionDoc.metadata,
          activatedAt: new Date(),
          previousSubscriptionId: oldSubscriptionId,
          upgradedFrom: oldSubscriptionDoc.planName,
        },
      });

      console.log('✅ [Change Plan] New subscription marked as active in Firebase');
    } catch (firebaseError) {
      console.error('❌ [Change Plan] Error activating new subscription in Firebase:', firebaseError);
      return NextResponse.json(
        { error: 'Failed to activate new subscription' },
        { status: 500 },
      );
    }

    // ---- Response ----------------------------------------------------------
    return NextResponse.json({
      success: true,
      message: 'Plan changed successfully',
      oldSubscriptionId,
      newSubscriptionId,
      newPlanName: newSubscriptionDoc.planName,
    });

  } catch (error) {
    console.error('❌ [Change Plan] Unexpected error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to change plan',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 },
    );
  }
}

