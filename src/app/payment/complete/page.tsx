'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Clock, CreditCard, Calendar, MapPin, User } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { firebaseDB } from '@/services/firebaseService';
import { mobbexService } from '@/services/mobbexService';
import { Booking } from '@/types';

export default function PaymentCompletePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'success' | 'pending' | 'failed' | 'unknown'>('unknown');

  const bookingId = searchParams.get('booking');
  const status = searchParams.get('status');
  const type = searchParams.get('type');
  const transactionId = searchParams.get('transactionid');

  useEffect(() => {
    const fetchBookingAndStatus = async () => {
      if (!bookingId || !user) {
        setError('Parámetros de pago inválidos');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch booking
        const bookingData = await firebaseDB.bookings.getById(bookingId);
        if (!bookingData) {
          setError('Reserva no encontrada');
          return;
        }

        // Check if user has permission to view this booking
        if (bookingData.clientId !== user.id && bookingData.ownerId !== user.id) {
          setError('No tienes permisos para ver esta reserva');
          return;
        }

        setBooking(bookingData);

        // Determine payment status from URL parameters
        if (status === '200' && type && type !== 'none') {
          setPaymentStatus('success');
        } else if (status === '0' && type === 'none') {
          setPaymentStatus('failed');
        } else if (status === '2' || status === '100') {
          setPaymentStatus('pending');
        } else {
          setPaymentStatus('unknown');
        }

        // If we have a transaction ID, try to get more details from Mobbex
        if (transactionId && bookingData.mobbexCheckoutId) {
          try {
            const checkoutStatus = await mobbexService.getCheckoutStatus(bookingData.mobbexCheckoutId);
            if (checkoutStatus.payment?.status?.code === 200) {
              setPaymentStatus('success');
            } else if (checkoutStatus.payment?.status?.code === 400) {
              setPaymentStatus('failed');
            } else {
              setPaymentStatus('pending');
            }
          } catch (err) {
            console.error('Error fetching checkout status:', err);
            // Keep the status from URL parameters
          }
        }

      } catch (err) {
        console.error('Error fetching booking:', err);
        setError(err instanceof Error ? err.message : 'Error al cargar la reserva');
      } finally {
        setLoading(false);
      }
    };

    fetchBookingAndStatus();
  }, [bookingId, user, status, type, transactionId]);

  const getStatusIcon = () => {
    switch (paymentStatus) {
      case 'success':
        return <CheckCircle className="w-16 h-16 text-green-500" />;
      case 'failed':
        return <XCircle className="w-16 h-16 text-red-500" />;
      case 'pending':
        return <Clock className="w-16 h-16 text-yellow-500" />;
      default:
        return <CreditCard className="w-16 h-16 text-gray-500" />;
    }
  };

  const getStatusTitle = () => {
    switch (paymentStatus) {
      case 'success':
        return '¡Pago Exitoso!';
      case 'failed':
        return 'Pago Fallido';
      case 'pending':
        return 'Pago Pendiente';
      default:
        return 'Estado del Pago';
    }
  };

  const getStatusMessage = () => {
    switch (paymentStatus) {
      case 'success':
        return 'Tu pago ha sido procesado exitosamente. Tu reserva está confirmada.';
      case 'failed':
        return 'Tu pago no pudo ser procesado. Por favor, intenta nuevamente.';
      case 'pending':
        return 'Tu pago está siendo procesado. Te notificaremos cuando esté confirmado.';
      default:
        return 'No se pudo determinar el estado del pago.';
    }
  };

  const getStatusColor = () => {
    switch (paymentStatus) {
      case 'success':
        return 'text-green-600 dark:text-green-400';
      case 'failed':
        return 'text-red-600 dark:text-red-400';
      case 'pending':
        return 'text-yellow-600 dark:text-yellow-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
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
          <p className="text-gray-600 dark:text-gray-300">Verificando estado del pago...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-500 mb-4">
            <XCircle className="w-16 h-16 mx-auto" />
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-4xl mx-auto p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <div className="mb-6">
            {getStatusIcon()}
          </div>
          <h1 className={`text-3xl font-bold mb-2 ${getStatusColor()}`}>
            {getStatusTitle()}
          </h1>
          <p className="text-gray-600 dark:text-gray-300 text-lg">
            {getStatusMessage()}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="glass rounded-xl p-8 mb-8"
        >
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Detalles de la Reserva
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {booking.post.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {booking.post.category}
                </p>
              </div>
              
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600 dark:text-gray-300">{booking.post.location}</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600 dark:text-gray-300">
                  {formatDate(booking.startDate)} - {formatDate(booking.endDate)}
                </span>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600 dark:text-gray-300">{booking.client.name}</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <CreditCard className="w-4 h-4 text-gray-400" />
                <span className="text-lg font-bold text-gray-900 dark:text-white">
                  {formatPrice(booking.totalAmount, booking.currency)}
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {booking.guestCount} {booking.guestCount === 1 ? 'huésped' : 'huéspedes'}
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <button
            onClick={() => router.push('/bookings')}
            className="px-6 py-3 bg-gradient-to-r from-primary-brown to-primary-green text-white rounded-lg hover:from-secondary-brown hover:to-secondary-green transition-all duration-300"
          >
            Ver Mis Reservas
          </button>
          
          {paymentStatus === 'failed' && (
            <button
              onClick={() => router.push(`/post/${booking.postId}`)}
              className="px-6 py-3 border border-primary-brown text-primary-brown rounded-lg hover:bg-primary-brown hover:text-white transition-all duration-300"
            >
              Intentar Nuevamente
            </button>
          )}
        </motion.div>
      </div>
    </div>
  );
}
