import { NextRequest, NextResponse } from 'next/server';
import { firebaseDB } from '@/services/firebaseService';
import { calculateCancellationPenalty } from '@/lib/cancellationUtils';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const bookingId = params.id;
    const { cancelledBy } = await request.json();

    if (!bookingId) {
      return NextResponse.json(
        { error: 'Booking ID is required' },
        { status: 400 }
      );
    }

    if (!cancelledBy || !['client', 'owner'].includes(cancelledBy)) {
      return NextResponse.json(
        { error: 'cancelledBy must be either "client" or "owner"' },
        { status: 400 }
      );
    }

    // Get booking data
    const booking = await firebaseDB.bookings.getById(bookingId);
    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Check if booking can be cancelled
    if (booking.status === 'cancelled') {
      return NextResponse.json(
        { error: 'Booking is already cancelled' },
        { status: 400 }
      );
    }

    if (booking.status === 'completed') {
      return NextResponse.json(
        { error: 'Cannot cancel completed booking' },
        { status: 400 }
      );
    }

    if (booking.status === 'declined') {
      return NextResponse.json(
        { error: 'Cannot cancel declined booking' },
        { status: 400 }
      );
    }

    // Only allow cancellation for specific statuses
    if (!['requested', 'pending_payment', 'paid'].includes(booking.status)) {
      return NextResponse.json(
        { error: 'Booking cannot be cancelled in its current status' },
        { status: 400 }
      );
    }

    // Calculate penalty if cancelled by client
    let penaltyAmount = 0;
    if (cancelledBy === 'client' && booking.post.cancellationPolicies?.length > 0) {
      const penalty = calculateCancellationPenalty(
        booking.post.cancellationPolicies,
        booking.totalAmount,
        new Date(booking.startDate)
      );
      penaltyAmount = penalty.penaltyAmount;
    }

    // Update booking status
    await firebaseDB.bookings.updateStatus(bookingId, 'cancelled', {
      cancelledAt: new Date(),
      cancelledBy,
      penaltyAmount
    });

    // Create notifications
    const notificationType = cancelledBy === 'client' 
      ? 'booking_cancelled_by_client' 
      : 'booking_cancelled_by_owner';

    // Notify the other party
    const otherPartyId = cancelledBy === 'client' ? booking.ownerId : booking.clientId;
    const otherPartyName = cancelledBy === 'client' ? booking.owner.name : booking.client.name;
    
    await firebaseDB.notifications.create({
      userId: otherPartyId,
      type: notificationType,
      title: 'Reserva Cancelada',
      message: `${otherPartyName} ha cancelado la reserva para "${booking.post.title}"`,
      isRead: false,
      data: {
        bookingId,
        postId: booking.postId,
        cancelledBy,
        penaltyAmount
      }
    });

    // Notify the person who cancelled (for confirmation)
    const cancellerId = cancelledBy === 'client' ? booking.clientId : booking.ownerId;
    const cancellerName = cancelledBy === 'client' ? booking.client.name : booking.owner.name;
    
    await firebaseDB.notifications.create({
      userId: cancellerId,
      type: notificationType,
      title: 'Cancelación Confirmada',
      message: `Has cancelado exitosamente la reserva para "${booking.post.title}"${penaltyAmount > 0 ? ` (Penalización: ${penaltyAmount} ${booking.currency})` : ''}`,
      isRead: false,
      data: {
        bookingId,
        postId: booking.postId,
        cancelledBy,
        penaltyAmount
      }
    });

    return NextResponse.json({ 
      success: true, 
      penaltyAmount,
      message: 'Booking cancelled successfully' 
    });

  } catch (error) {
    console.error('Error cancelling booking:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
