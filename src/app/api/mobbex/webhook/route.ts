import { NextRequest, NextResponse } from 'next/server';
import { mobbexService } from '@/services/mobbexService';
import { firebaseDB } from '@/services/firebaseService';

export async function POST(request: NextRequest) {
  try {
    const webhookData = await request.json();
    
    // Process the webhook data
    const { bookingId, status, transactionId, paymentMethod } = await mobbexService.processWebhook(webhookData);
    
    if (!bookingId) {
      return NextResponse.json({ error: 'Invalid webhook data' }, { status: 400 });
    }

    // Get the booking
    const booking = await firebaseDB.bookings.getById(bookingId);
    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Update booking status based on payment result
    let newStatus: 'paid' | 'cancelled' | 'pending_payment';
    let additionalData: Record<string, unknown> = {};

    switch (status) {
      case 'approved':
        newStatus = 'paid';
        additionalData = {
          mobbexTransactionId: transactionId,
          paymentData: {
            method: paymentMethod || 'unknown',
            installments: 1,
            status: 'approved'
          }
        };
        break;
      case 'rejected':
        newStatus = 'cancelled';
        break;
      default:
        newStatus = 'pending_payment';
    }

    // Update booking status
    await firebaseDB.bookings.updateStatus(bookingId, newStatus, additionalData);

    // Create notifications
    if (status === 'approved') {
      // Notify client about successful payment
      await firebaseDB.notifications.create({
        userId: booking.clientId,
        type: 'payment_completed',
        title: 'Pago confirmado',
        message: `Tu pago para "${booking.post.title}" ha sido procesado exitosamente`,
        data: {
          bookingId,
          postId: booking.postId
        }
      });

      // Notify owner about payment completion
      await firebaseDB.notifications.create({
        userId: booking.ownerId,
        type: 'payment_completed',
        title: 'Pago recibido',
        message: `Se ha confirmado el pago de ${booking.client.name} para "${booking.post.title}"`,
        data: {
          bookingId,
          postId: booking.postId
        }
      });
    } else if (status === 'rejected') {
      // Notify client about failed payment
      await firebaseDB.notifications.create({
        userId: booking.clientId,
        type: 'payment_pending',
        title: 'Pago rechazado',
        message: `Tu pago para "${booking.post.title}" fue rechazado. Por favor, intenta nuevamente`,
        data: {
          bookingId,
          postId: booking.postId
        }
      });
    }

    return NextResponse.json({ success: true, status: newStatus });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
