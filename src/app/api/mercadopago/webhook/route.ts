import { NextRequest, NextResponse } from 'next/server';
import { firebaseDB } from '@/services/firebaseService';
import MercadoPagoService from '@/services/mercadoPagoService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-signature') || '';
    const type = request.headers.get('x-request-id') || '';

    console.log('🔔 [MercadoPago Webhook] Received notification:', {
      type,
      signature: signature.substring(0, 20) + '...',
      bodyLength: body.length
    });

    // Parse the notification data
    const notification = JSON.parse(body);
    const { type: notificationType, data } = notification;

    if (notificationType === 'payment') {
      const paymentId = data.id;
      
      // Get MercadoPago credentials
      const credentials = await firebaseDB.systemSettings.getMercadoPagoCredentials();
      if (!credentials || !credentials.isActive) {
        console.error('❌ [MercadoPago Webhook] No active credentials found');
        return NextResponse.json({ error: 'No active credentials' }, { status: 400 });
      }

      // Initialize MercadoPago service
      const mpService = new MercadoPagoService(credentials);
      
      // Get payment details from MercadoPago
      const payment = await mpService.getPayment(paymentId);
      
      console.log('💳 [MercadoPago Webhook] Payment details:', {
        id: payment.id,
        status: payment.status,
        status_detail: payment.status_detail,
        external_reference: payment.external_reference,
        transaction_amount: payment.transaction_amount
      });

      // Find the booking by external reference
      if (payment.external_reference) {
        const booking = await firebaseDB.bookings.getById(payment.external_reference);
        
        if (!booking) {
          console.error('❌ [MercadoPago Webhook] Booking not found:', payment.external_reference);
          return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
        }

        // Update booking status based on payment status
        let newStatus: string;
        let paymentData: any = {
          method: 'mercadopago',
          paymentId: payment.id,
          status: payment.status,
          statusDetail: payment.status_detail,
          processedAt: new Date(),
          transactionAmount: payment.transaction_amount,
          currency: 'ARS' // MercadoPago typically uses ARS for Argentina
        };

        switch (payment.status) {
          case 'approved':
            newStatus = 'paid';
            paymentData.status = 'approved';
            break;
          case 'pending':
            newStatus = 'pending_payment';
            paymentData.status = 'pending';
            break;
          case 'rejected':
          case 'cancelled':
            newStatus = 'requested';
            paymentData.status = 'declined';
            paymentData.reason = payment.status_detail;
            break;
          default:
            console.log('⚠️ [MercadoPago Webhook] Unknown payment status:', payment.status);
            newStatus = 'requested';
            paymentData.status = 'unknown';
        }

        // Update booking status
        await firebaseDB.bookings.updateStatus(booking.id, newStatus, { paymentData });

        // Send notification to publisher
        const notificationType = payment.status === 'approved' ? 'payment_completed' : 
                                payment.status === 'rejected' || payment.status === 'cancelled' ? 'payment_failed' : 
                                'payment_pending';

        const notificationTitle = payment.status === 'approved' ? 'Pago completado' :
                                 payment.status === 'rejected' || payment.status === 'cancelled' ? 'Pago fallido' :
                                 'Pago pendiente';

        const notificationMessage = payment.status === 'approved' ? 
          `El pago para la reserva "${booking.post.title}" ha sido completado exitosamente.` :
          payment.status === 'rejected' || payment.status === 'cancelled' ?
          `El pago para la reserva "${booking.post.title}" ha fallado.` :
          `El pago para la reserva "${booking.post.title}" está pendiente de confirmación.`;

        await firebaseDB.notifications.create({
          userId: booking.ownerId,
          type: notificationType,
          title: notificationTitle,
          message: notificationMessage,
          isRead: false,
          data: {
            bookingId: booking.id,
            postId: booking.postId,
            amount: payment.transaction_amount,
            currency: 'ARS',
            paymentId: payment.id,
            paymentStatus: payment.status
          }
        });

        console.log('✅ [MercadoPago Webhook] Booking updated successfully:', {
          bookingId: booking.id,
          newStatus,
          paymentStatus: payment.status
        });
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('❌ [MercadoPago Webhook] Error processing webhook:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ message: 'MercadoPago webhook endpoint' });
}
