'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  DollarSign, 
  Search, 
  Eye,
  X,
  CheckCircle,
  AlertCircle,
  Clock as ClockIcon,
  Check,
  User,
  CreditCard
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { firebaseDB } from '@/services/firebaseService';
import { mobbexService } from '@/services/mobbexService';
import { Booking, BookingStatus } from '@/types';
import { useRouter } from 'next/navigation';

export default function BookingsPage() {
  const { user, hasRole } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'client' | 'owner'>('client');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchBookings = async () => {
      if (!user) return;

      try {
        setIsLoading(true);
        setError(null);

        let allBookings: Booking[] = [];
        
        // Fetch client bookings if user has client role
        if (hasRole('client')) {
          const clientBookings = await firebaseDB.bookings.getByUserId(user.id);
          allBookings = [...allBookings, ...clientBookings];
        }
        
        // Fetch owner bookings if user has publisher or superadmin role
        if (hasRole('publisher') || hasRole('superadmin')) {
          const ownerBookings = await firebaseDB.bookings.getByOwnerId(user.id);
          allBookings = [...allBookings, ...ownerBookings];
        }

        // Remove duplicates (in case user has both roles and there are overlapping bookings)
        const uniqueBookings = allBookings.filter((booking, index, self) => 
          index === self.findIndex(b => b.id === booking.id)
        );

        setBookings(uniqueBookings);
        setFilteredBookings(uniqueBookings);
      } catch (err) {
        console.error('Error fetching bookings:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch bookings');
      } finally {
        setIsLoading(false);
      }
    };

    fetchBookings();
  }, [user, hasRole]);

  // Set default view mode based on user roles
  useEffect(() => {
    if (user) {
      if (hasRole('publisher') || hasRole('superadmin')) {
        setViewMode('owner'); // Default to owner view if user can manage bookings
      } else {
        setViewMode('client'); // Default to client view for clients only
      }
    }
  }, [user, hasRole]);

  const filterBookings = useCallback(() => {
    let filtered = bookings;

    // Filter by view mode (client vs owner)
    if (viewMode === 'client') {
      filtered = filtered.filter(booking => booking.clientId === user?.id);
    } else {
      filtered = filtered.filter(booking => booking.ownerId === user?.id);
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(booking => 
        booking.post?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.post?.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.client?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(booking => booking.status === statusFilter);
    }

    setFilteredBookings(filtered);
  }, [bookings, searchTerm, statusFilter, viewMode, user?.id]);

  useEffect(() => {
    filterBookings();
  }, [filterBookings]);

  const handleAcceptBooking = async (bookingId: string) => {
    try {
      const booking = bookings.find(b => b.id === bookingId);
      if (!booking) return;

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

      // Get publisher's CUIT for split payment
      const publisherCuit = user?.mobbexCredentials?.cuit;
      console.log('💰 [Bookings] Publisher CUIT for split payment:', publisherCuit);
      
      // Create Mobbex checkout with split payment
      const checkout = await mobbexService.createBookingCheckout({
        bookingId: booking.id,
        postTitle: booking.post.title,
        totalAmount: booking.totalAmount,
        currency: booking.currency,
        clientName: booking.client.name,
        clientEmail: booking.client.email,
        returnUrl: `${window.location.origin}/payment/complete?booking=${bookingId}`,
        webhookUrl: `${window.location.origin}/api/mobbex/webhook`,
        publisherCuit: publisherCuit, // Add publisher CUIT for split payment
        marketplaceFee: 10, // 10% marketplace fee
        userCredentials: userCredentials || undefined
      });

      // Update booking status to pending payment
      await firebaseDB.bookings.updateStatus(bookingId, 'pending_payment', {
        mobbexCheckoutId: checkout.id,
        mobbexCheckoutUrl: checkout.url
      });

      // Create notification for client
      await firebaseDB.notifications.create({
        userId: booking.clientId,
        type: 'payment_pending',
        title: 'Reserva aceptada - Pago pendiente',
        message: `Tu reserva para "${booking.post.title}" ha sido aceptada. Completa el pago para confirmar.`,
        isRead: false,
        data: {
          bookingId,
          postId: booking.postId,
          checkoutUrl: checkout.url
        }
      });

      // Refresh bookings
      window.location.reload();
    } catch (err) {
      console.error('Error accepting booking:', err);
      alert('Error al aceptar la reserva');
    }
  };

  const handleDeclineBooking = async (bookingId: string) => {
    try {
      await firebaseDB.bookings.updateStatus(bookingId, 'declined');

      const booking = bookings.find(b => b.id === bookingId);
      if (booking) {
        // Create notification for client
        await firebaseDB.notifications.create({
          userId: booking.clientId,
          type: 'booking_declined',
          title: 'Reserva rechazada',
          message: `Tu reserva para "${booking.post.title}" ha sido rechazada`,
          isRead: false,
          data: {
            bookingId,
            postId: booking.postId
          }
        });
      }

      // Refresh bookings
      window.location.reload();
    } catch (err) {
      console.error('Error declining booking:', err);
      alert('Error al rechazar la reserva');
    }
  };

  const handlePaymentClick = async (booking: Booking) => {
    if (!booking.mobbexCheckoutUrl) {
      alert('No hay enlace de pago disponible. Contacta al propietario.');
      return;
    }

    try {
      // Check if checkout is still valid
      if (booking.mobbexCheckoutId) {
        const checkoutStatus = await mobbexService.getCheckoutStatus(booking.mobbexCheckoutId);
        if (checkoutStatus.status.code === 200) {
          window.open(booking.mobbexCheckoutUrl, '_blank');
        } else {
          alert('El enlace de pago ha expirado. Contacta al propietario.');
        }
      } else {
        window.open(booking.mobbexCheckoutUrl, '_blank');
      }
    } catch (err) {
      console.error('Error getting checkout status:', err);
      alert('Error al acceder al pago');
    }
  };

  const getStatusColor = (status: BookingStatus) => {
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

  const getStatusText = (status: BookingStatus) => {
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-brown"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-none">
        <div className="glass rounded-xl p-12 text-center">
          <div className="text-red-500 mb-4">
            <AlertCircle className="w-16 h-16 mx-auto" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Error al cargar reservas
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-6">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-gradient-to-r from-primary-brown to-primary-green text-white rounded-lg hover:from-secondary-brown hover:to-secondary-green transition-all duration-300"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-none">
      <div className="space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {viewMode === 'client' ? 'Mis Reservas' : 'Reservas Recibidas'}
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            {viewMode === 'client' 
              ? 'Gestiona todas tus reservas de servicios turísticos'
              : 'Gestiona las reservas de tus publicaciones'
            }
          </p>
        </motion.div>

        {/* View Mode Toggle */}
        {(hasRole('publisher') || hasRole('superadmin')) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="glass rounded-xl p-6"
          >
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Ver:</span>
              <div className="flex border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode('client')}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    viewMode === 'client' 
                      ? 'bg-primary-brown text-white' 
                      : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  Mis Reservas
                </button>
                <button
                  onClick={() => setViewMode('owner')}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    viewMode === 'owner' 
                      ? 'bg-primary-brown text-white' 
                      : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  Reservas Recibidas
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="glass rounded-xl p-6"
          >
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Reservas</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{filteredBookings.length}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="glass rounded-xl p-6"
          >
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pagadas</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {filteredBookings.filter(b => b.status === 'paid').length}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="glass rounded-xl p-6"
          >
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg flex items-center justify-center">
                <ClockIcon className="w-6 h-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pendientes</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {filteredBookings.filter(b => b.status === 'requested' || b.status === 'pending_payment').length}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="glass rounded-xl p-6"
          >
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Completadas</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {filteredBookings.filter(b => b.status === 'completed').length}
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="glass rounded-xl p-6"
        >
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder={viewMode === 'client' 
                    ? "Buscar reservas por título o ubicación..." 
                    : "Buscar reservas por cliente o servicio..."
                  }
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-brown focus:border-transparent"
                />
              </div>
            </div>
            <div className="md:w-48">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-brown focus:border-transparent"
              >
                <option value="all">Todos los estados</option>
                <option value="requested">Solicitadas</option>
                <option value="accepted">Aceptadas</option>
                <option value="declined">Rechazadas</option>
                <option value="pending_payment">Pago Pendiente</option>
                <option value="paid">Pagadas</option>
                <option value="cancelled">Canceladas</option>
                <option value="completed">Completadas</option>
              </select>
            </div>
          </div>
        </motion.div>

        {/* Bookings List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="space-y-6"
        >
          {filteredBookings.map((booking, index) => (
            <motion.div
              key={booking.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.8 + index * 0.1 }}
              className="glass rounded-xl p-6 hover:transform hover:scale-105 transition-all duration-300"
            >
              <div className="flex flex-col lg:flex-row gap-6">
                {/* Service Image */}
                <div className="lg:w-48 lg:h-32 flex-shrink-0">
                  <div className="w-full h-32 lg:h-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 rounded-lg flex items-center justify-center">
                    <span className="text-gray-500 dark:text-gray-400 text-sm">Imagen del servicio</span>
                  </div>
                </div>

                {/* Service Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        {booking.post.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        {booking.post.category}
                      </p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="flex items-center space-x-2">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">{booking.post.location}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <DollarSign className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {formatPrice(booking.totalAmount, booking.currency)}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            Reservado: {formatDate(booking.createdAt)}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            Servicio: {formatDate(booking.startDate)} - {formatDate(booking.endDate)}
                          </span>
                        </div>
                        {viewMode === 'owner' && (
                          <div className="flex items-center space-x-2">
                            <User className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-600 dark:text-gray-400">{booking.client.name}</span>
                          </div>
                        )}
                      </div>

                      {booking.clientData.notes && (
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 mb-4">
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            <strong>Notas:</strong> {booking.clientData.notes}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Status and Actions */}
                    <div className="flex flex-col items-end space-y-3">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(booking.status)}`}>
                        {getStatusText(booking.status)}
                      </span>
                      
                      <div className="flex items-center space-x-2">
                        <button 
                          onClick={() => router.push(`/post/${booking.postId}`)}
                          className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors" 
                          title="Ver servicio"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        
                        {/* Owner Actions */}
                        {viewMode === 'owner' && booking.status === 'requested' && (
                          <>
                            <button 
                              onClick={() => handleAcceptBooking(booking.id)}
                              className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors" 
                              title="Aceptar reserva"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleDeclineBooking(booking.id)}
                              className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors" 
                              title="Rechazar reserva"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        
                        {/* Client Actions */}
                        {viewMode === 'client' && booking.status === 'pending_payment' && (
                          <button 
                            onClick={() => handlePaymentClick(booking)}
                            className="p-2 text-orange-600 hover:text-orange-800 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded transition-colors" 
                            title="Completar pago"
                          >
                            <CreditCard className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}

          {filteredBookings.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass rounded-xl p-12 text-center"
            >
              <Calendar className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No hay reservas
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                {searchTerm || statusFilter !== 'all' 
                  ? 'No se encontraron reservas con los filtros aplicados.'
                  : viewMode === 'client' 
                    ? 'Aún no has realizado ninguna reserva. ¡Explora los servicios disponibles!'
                    : 'Aún no has recibido ninguna reserva para tus publicaciones.'
                }
              </p>
              {!searchTerm && statusFilter === 'all' && viewMode === 'client' && (
                <button 
                  onClick={() => router.push('/alojamientos')}
                  className="px-6 py-3 bg-gradient-to-r from-primary-brown to-primary-green text-white rounded-lg hover:from-secondary-brown hover:to-secondary-green transition-all duration-300"
                >
                  Explorar Servicios
                </button>
              )}
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
