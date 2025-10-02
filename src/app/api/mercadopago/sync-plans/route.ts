import { NextRequest, NextResponse } from 'next/server';
import { firebaseDB } from '@/services/firebaseService';
import MercadoPagoPlansService from '@/services/mercadoPagoPlansService';

export async function POST(request: NextRequest) {
  try {
    // Get MercadoPago account credentials
    const account = await firebaseDB.systemSettings.getMercadoPagoAccount();
    if (!account || !account.isActive) {
      return NextResponse.json({ 
        error: 'MercadoPago account not configured or not active' 
      }, { status: 400 });
    }

    // Initialize MercadoPago plans service
    const plansService = new MercadoPagoPlansService(account);

    // Sync all platform plans with MercadoPago
    const result = await plansService.syncAllPlatformPlans();

    console.log('✅ [MercadoPago Sync] Plans synchronized:', {
      success: result.success,
      errors: result.errors,
      total: result.results.length
    });

    return NextResponse.json({
      message: 'Plans synchronized successfully',
      success: result.success,
      errors: result.errors,
      results: result.results
    });

  } catch (error) {
    console.error('❌ [MercadoPago Sync] Error syncing plans:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ message: 'MercadoPago plans sync endpoint' });
}
