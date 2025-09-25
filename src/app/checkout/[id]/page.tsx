'use client';

import { useState, useEffect, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  CreditCard, 
  Lock, 
  CheckCircle, 
  XCircle, 
  ArrowLeft,
  Calendar,
  MapPin,
  User,
  DollarSign
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { firebaseDB } from '@/services/firebaseService';
import { Booking } from '@/types';

function CheckoutContent() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [paymentData, setPaymentData] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    zipCode: ''
  });

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
        if (bookingData.clientId !== user.id) {
          setError('No tienes permisos para ver esta reserva');
          return;
        }

        // Check if booking is in pending payment status
        if (bookingData.status !== 'pending_payment') {
          setError('Esta reserva no está pendiente de pago');
          return;
        }

        setBooking(bookingData);
        
        // Pre-fill user data
        setPaymentData(prev => ({
          ...prev,
          email: user.email || '',
          cardholderName: user.name || ''
        }));
      } catch (err) {
        console.error('Error fetching booking:', err);
        setError(err instanceof Error ? err.message : 'Error al cargar la reserva');
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [user, bookingId]);

  const handleInputChange = (field: string, value: string) => {
    setPaymentData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const formatCardNumber = (value: string) => {
    // Remove all non-digits
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    // Add spaces every 4 digits
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const formatExpiryDate = (value: string) => {
    // Remove all non-digits
    const v = value.replace(/\D/g, '');
    // Add slash after 2 digits
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  const handlePayment = async () => {
    if (!booking) return;

    // Validate required fields
    const requiredFields = ['cardNumber', 'expiryDate', 'cvv', 'cardholderName', 'email', 'phone', 'address', 'city', 'zipCode'];
    const missingFields = requiredFields.filter(field => !paymentData[field as keyof typeof paymentData]);
    
    if (missingFields.length > 0) {
      alert('Por favor completa todos los campos requeridos');
      return;
    }

    try {
      setProcessing(true);
      
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Check CVV for test approval
      const isApproved = paymentData.cvv === '200';
      
      if (isApproved) {
        // Payment successful
        await firebaseDB.bookings.updateStatus(booking.id, 'paid', {
          paymentData: {
            method: 'credit_card',
            cardNumber: paymentData.cardNumber.replace(/\s/g, '').slice(-4),
            status: 'approved',
            processedAt: new Date()
          }
        });

        // Send notification to publisher
        await firebaseDB.notifications.create({
          userId: booking.ownerId,
          type: 'payment_completed',
          title: 'Pago completado',
          message: `El pago para la reserva "${booking.post.title}" ha sido completado exitosamente.`,
          isRead: false,
          data: {
            bookingId: booking.id,
            postId: booking.postId,
            amount: booking.totalAmount,
            currency: booking.currency
          }
        });

        // Redirect to success page
        router.push(`/payment/complete?booking=${booking.id}&status=success`);
      } else {
        // Payment failed
        await firebaseDB.bookings.updateStatus(booking.id, 'requested', {
          paymentData: {
            method: 'credit_card',
            status: 'declined',
            reason: 'CVV inválido',
            processedAt: new Date()
          }
        });

        // Send notification to publisher
        await firebaseDB.notifications.create({
          userId: booking.ownerId,
          type: 'payment_failed',
          title: 'Pago fallido',
          message: `El pago para la reserva "${booking.post.title}" ha fallado.`,
          isRead: false,
          data: {
            bookingId: booking.id,
            postId: booking.postId,
            amount: booking.totalAmount,
            currency: booking.currency
          }
        });

        // Redirect to failure page
        router.push(`/payment/complete?booking=${booking.id}&status=failed`);
      }
    } catch (err) {
      console.error('Error processing payment:', err);
      alert('Error al procesar el pago. Por favor, intenta nuevamente.');
    } finally {
      setProcessing(false);
    }
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: currency
    }).format(price);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-brown mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Cargando checkout...</p>
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Booking Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="space-y-6"
          >
            <div className="glass rounded-xl p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Resumen de la Reserva
              </h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {booking.post.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    {booking.post.category}
                  </p>
                </div>
                
                <div className="space-y-3">
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
                  
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600 dark:text-gray-300">
                      {booking.guestCount} {booking.guestCount === 1 ? 'viajero' : 'viajeros'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="glass rounded-xl p-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                Total a Pagar
              </h3>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatPrice(booking.totalAmount, booking.currency)}
                </span>
                <div className="flex items-center space-x-2 text-green-600">
                  <Lock className="w-4 h-4" />
                  <span className="text-sm">Pago Seguro</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Payment Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-6"
          >
            <div className="glass rounded-xl p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                Información de Pago
              </h2>

              <div className="space-y-6">
                {/* Credit Card Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Tarjeta de Crédito/Débito
                  </h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Número de Tarjeta *
                    </label>
                    <input
                      type="text"
                      value={paymentData.cardNumber}
                      onChange={(e) => handleInputChange('cardNumber', formatCardNumber(e.target.value))}
                      placeholder="1234 5678 9012 3456"
                      maxLength={19}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-brown focus:border-primary-brown dark:bg-gray-800 dark:text-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Fecha de Vencimiento *
                      </label>
                      <input
                        type="text"
                        value={paymentData.expiryDate}
                        onChange={(e) => handleInputChange('expiryDate', formatExpiryDate(e.target.value))}
                        placeholder="MM/YY"
                        maxLength={5}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-brown focus:border-primary-brown dark:bg-gray-800 dark:text-white"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        CVV *
                      </label>
                      <input
                        type="text"
                        value={paymentData.cvv}
                        onChange={(e) => handleInputChange('cvv', e.target.value.replace(/\D/g, '').slice(0, 3))}
                        placeholder="123"
                        maxLength={3}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-brown focus:border-primary-brown dark:bg-gray-800 dark:text-white"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Para pruebas: usa 200 para aprobar, cualquier otro número para rechazar
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Nombre del Titular *
                    </label>
                    <input
                      type="text"
                      value={paymentData.cardholderName}
                      onChange={(e) => handleInputChange('cardholderName', e.target.value)}
                      placeholder="Juan Pérez"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-brown focus:border-primary-brown dark:bg-gray-800 dark:text-white"
                    />
                  </div>
                </div>

                {/* Billing Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Información de Facturación
                  </h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      value={paymentData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="juan@ejemplo.com"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-brown focus:border-primary-brown dark:bg-gray-800 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Teléfono *
                    </label>
                    <input
                      type="tel"
                      value={paymentData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="+54 9 11 1234-5678"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-brown focus:border-primary-brown dark:bg-gray-800 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Dirección *
                    </label>
                    <input
                      type="text"
                      value={paymentData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      placeholder="Av. Corrientes 1234"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-brown focus:border-primary-brown dark:bg-gray-800 dark:text-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Ciudad *
                      </label>
                      <input
                        type="text"
                        value={paymentData.city}
                        onChange={(e) => handleInputChange('city', e.target.value)}
                        placeholder="Buenos Aires"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-brown focus:border-primary-brown dark:bg-gray-800 dark:text-white"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Código Postal *
                      </label>
                      <input
                        type="text"
                        value={paymentData.zipCode}
                        onChange={(e) => handleInputChange('zipCode', e.target.value)}
                        placeholder="C1043"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-brown focus:border-primary-brown dark:bg-gray-800 dark:text-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Payment Button */}
                <button
                  onClick={handlePayment}
                  disabled={processing}
                  className="w-full flex items-center justify-center space-x-2 px-6 py-4 bg-gradient-to-r from-primary-brown to-primary-green text-white rounded-lg hover:from-secondary-brown hover:to-secondary-green transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-lg font-semibold"
                >
                  {processing ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Procesando...</span>
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-5 h-5" />
                      <span>Pagar {formatPrice(booking.totalAmount, booking.currency)}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-brown mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Cargando...</p>
        </div>
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}
