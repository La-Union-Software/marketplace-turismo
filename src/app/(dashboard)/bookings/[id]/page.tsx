'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  MapPin, 
  DollarSign, 
  User, 
  Phone, 
  Mail, 
  MessageSquare,
  Check,
  X,
  CreditCard,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { firebaseDB } from '@/services/firebaseService';
import { mobbexService } from '@/services/mobbexService';
import { Booking } from '@/types';

export default function BookingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, hasRole } = useAuth();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const bookingId = params.id as string;

  useEffect(() => {
    const fetchBooking = async () => {
      if (!user || !bookingId) return;

      try {
        setLoading(true);
        setError(null);

        const bookingData = await firebaseDB.bookings.getById(bookingId);
        if (!bookingData) {
          setError('Reserva no encontrada');
          return;
        }

        // Check if user has permission to view this booking
        if (bookingData.clientId !== user.id && bookingData.ownerId !== user.id && !hasRole('superadmin')) {
          setError('No tienes permisos para ver esta reserva');
          return;
        }

        setBooking(bookingData);
      } catch (err) {
        console.error('Error fetching booking:', err);
        setError(err instanceof Error ? err.message : 'Error al cargar la reserva');
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [user, bookingId, hasRole]);

  const handleAcceptBooking = async () => {
    if (!booking) return;

    try {
      // Get user's Mobbex credentials if available
      let userCredentials = null;
      if (user?.mobbexCredentials?.isConnected) {
        userCredentials = {
          accessToken: user.mobbexCredentials.accessToken,
          entity: {
            name: user.mobbexCredentials.entity.name,
            taxId: user.mobbexCredentials.entity.taxId,
          },
        };
      }

      // Create Mobbex checkout
      const checkout = await mobbexService.createBookingCheckout({
        bookingId: booking.id,
        postTitle: booking.post.title,
        totalAmount: booking.totalAmount,
        currency: booking.currency,
        clientName: booking.client.name,
        clientEmail: booking.client.email,
        returnUrl: `${window.location.origin}/payment/complete?booking=${booking.id}`,
        webhookUrl: `${window.location.origin}/api/mobbex/webhook`,
        userCredentials: userCredentials
      });

      // Update booking status to pending payment
      await firebaseDB.bookings.updateStatus(booking.id, 'pending_payment', {
        mobbexCheckoutId: checkout.id
      });

      // Create notification for client
      await firebaseDB.notifications.create({
        userId: booking.clientId,
        type: 'payment_pending',
        title: 'Reserva aceptada - Pago pendiente',
        message: `Tu reserva para "${booking.post.title}" ha sido aceptada. Completa el pago para confirmar.`,
        data: {
          bookingId: booking.id,
          postId: booking.postId,
          checkoutUrl: checkout.url
        }
      });

      // Refresh booking data
      window.location.reload();
    } catch (err) {
      console.error('Error accepting booking:', err);
      alert('Error al aceptar la reserva');
    }
  };

  const handleDeclineBooking = async () => {
    if (!booking) return;

    try {
      await firebaseDB.bookings.updateStatus(booking.id, 'declined');

      // Create notification for client
      await firebaseDB.notifications.create({
        userId: booking.clientId,
        type: 'booking_declined',
        title: 'Reserva rechazada',
        message: `Tu reserva para "${booking.post.title}" ha sido rechazada`,
        data: {
          bookingId: booking.id,
          postId: booking.postId
        }
      });

      // Refresh booking data
      window.location.reload();
    } catch (err) {
      console.error('Error declining booking:', err);
      alert('Error al rechazar la reserva');
    }
  };

  const handlePaymentClick = async () => {
    if (!booking?.mobbexCheckoutId) return;

    try {
      const checkoutStatus = await mobbexService.getCheckoutStatus(booking.mobbexCheckoutId);
      if (checkoutStatus.status.code === 200) {
        window.open(checkoutStatus.url, '_blank');
      } else {
        alert('El enlace de pago ha expirado. Contacta al propietario.');
      }
    } catch (err) {
      console.error('Error getting checkout status:', err);
      alert('Error al acceder al pago');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'requested':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800';
      case 'accepted':
        return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800';
      case 'declined':
        return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800';
      case 'pending_payment':
        return 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800';
      case 'paid':
        return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-300 dark:border-gray-800';
      case 'completed':
        return 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-300 dark:border-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'requested':
        return 'Solicitada';
      case 'accepted':
        return 'Aceptada';
      case 'declined':
        return 'Rechazada';
      case 'pending_payment':
        return 'Pago Pendiente';
      case 'paid':
        return 'Pagada';
      case 'cancelled':
        return 'Cancelada';
      case 'completed':
        return 'Completada';
      default:
        return status;
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: currency
    }).format(price);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-brown mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Cargando reserva...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-500 mb-4">
            <AlertCircle className="w-16 h-16 mx-auto" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Error
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
          <button
            onClick={() => router.push('/bookings')}
            className="px-6 py-3 bg-gradient-to-r from-primary-brown to-primary-green text-white rounded-lg hover:from-secondary-brown hover:to-secondary-green transition-all duration-300"
          >
            Volver a Reservas
          </button>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Reserva no encontrada
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            La reserva que buscas no existe o no tienes permisos para verla.
          </p>
          <button
            onClick={() => router.push('/bookings')}
            className="px-6 py-3 bg-gradient-to-r from-primary-brown to-primary-green text-white rounded-lg hover:from-secondary-brown hover:to-secondary-green transition-all duration-300"
          >
            Volver a Reservas
          </button>
        </div>
      </div>
    );
  }

  const isOwner = booking.ownerId === user?.id;
  const isClient = booking.clientId === user?.id;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-4xl mx-auto p-8">
        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-6"
        >
          <button
            onClick={() => router.push('/bookings')}
            className="flex items-center text-gray-600 dark:text-gray-300 hover:text-primary-brown transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Volver a Reservas
          </button>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="lg:col-span-2 space-y-6"
          >
            {/* Booking Header */}
            <div className="glass rounded-xl p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    {booking.post.title}
                  </h1>
                  <p className="text-gray-600 dark:text-gray-300">
                    {booking.post.category}
                  </p>
                </div>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(booking.status)}`}>
                  {getStatusText(booking.status)}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600 dark:text-gray-300">{booking.post.location}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <DollarSign className="w-4 h-4 text-gray-400" />
                  <span className="text-lg font-bold text-gray-900 dark:text-white">
                    {formatPrice(booking.totalAmount, booking.currency)}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600 dark:text-gray-300">
                    {formatDate(booking.startDate)} - {formatDate(booking.endDate)}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600 dark:text-gray-300">
                    {booking.guestCount} {booking.guestCount === 1 ? 'huésped' : 'huéspedes'}
                  </span>
                </div>
              </div>
            </div>

            {/* Client Information */}
            <div className="glass rounded-xl p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Información del Cliente
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600 dark:text-gray-300">{booking.client.name}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600 dark:text-gray-300">{booking.client.email}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600 dark:text-gray-300">{booking.clientData.phone}</span>
                </div>
              </div>
              {booking.clientData.notes && (
                <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <MessageSquare className="w-4 h-4 text-gray-400 mt-1" />
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Notas:
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {booking.clientData.notes}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* Actions Sidebar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:col-span-1"
          >
            <div className="glass rounded-xl p-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                Acciones
              </h3>
              
              <div className="space-y-3">
                {/* Owner Actions */}
                {isOwner && booking.status === 'requested' && (
                  <>
                    <button
                      onClick={handleAcceptBooking}
                      className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <Check className="w-4 h-4" />
                      <span>Aceptar Reserva</span>
                    </button>
                    <button
                      onClick={handleDeclineBooking}
                      className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      <X className="w-4 h-4" />
                      <span>Rechazar Reserva</span>
                    </button>
                  </>
                )}

                {/* Client Actions */}
                {isClient && booking.status === 'pending_payment' && (
                  <button
                    onClick={handlePaymentClick}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>Completar Pago</span>
                  </button>
                )}

                {/* View Post Button */}
                <button
                  onClick={() => router.push(`/post/${booking.postId}`)}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2 border border-primary-brown text-primary-brown rounded-lg hover:bg-primary-brown hover:text-white transition-colors"
                >
                  <span>Ver Servicio</span>
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
