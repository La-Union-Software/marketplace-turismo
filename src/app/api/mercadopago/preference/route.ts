import { NextRequest, NextResponse } from 'next/server';
import { firebaseDB } from '@/services/firebaseService';
import MercadoPagoService from '@/services/mercadoPagoService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bookingId, returnUrl } = body;

    if (!bookingId) {
      return NextResponse.json({ error: 'Booking ID is required' }, { status: 400 });
    }

    // Get booking details
    const booking = await firebaseDB.bookings.getById(bookingId);
    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Check if booking is in pending payment status
    if (booking.status !== 'pending_payment') {
      return NextResponse.json({ error: 'Booking is not pending payment' }, { status: 400 });
    }

    // Get MercadoPago credentials
    const credentials = await firebaseDB.systemSettings.getMercadoPagoCredentials();
    if (!credentials || !credentials.isActive) {
      return NextResponse.json({ error: 'MercadoPago is not configured' }, { status: 400 });
    }

    // Initialize MercadoPago service
    const mpService = new MercadoPagoService(credentials);

    // Create preference
    const preference = await mpService.createBookingPreference({
      bookingId: booking.id,
      postTitle: booking.post.title,
      totalAmount: booking.totalAmount,
      currency: booking.currency,
      clientName: booking.clientName,
      clientEmail: booking.clientEmail,
      returnUrl,
      webhookUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/api/mercadopago/webhook`
    });

    console.log('✅ [MercadoPago API] Preference created:', {
      preferenceId: preference.id,
      bookingId: booking.id,
      amount: booking.totalAmount
    });

    return NextResponse.json({
      preferenceId: preference.id,
      initPoint: preference.init_point,
      sandboxInitPoint: preference.sandbox_init_point,
      publicKey: credentials.publicKey
    });

  } catch (error) {
    console.error('❌ [MercadoPago API] Error creating preference:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ message: 'MercadoPago preference endpoint' });
}
