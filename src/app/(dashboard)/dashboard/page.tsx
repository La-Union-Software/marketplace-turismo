'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  Eye, 
  Calendar, 
  DollarSign, 
  FileText,
  Users,
  Clock,
  Settings,
  Heart,
  User
} from 'lucide-react';
import { dummyDashboardStats } from '@/services/dummyData';
import { formatPrice, formatDateTime } from '@/lib/utils';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const { user, hasRole } = useAuth();
  const router = useRouter();
  
  // Redirect clients away from dashboard
  useEffect(() => {
    if (user && hasRole('client') && !hasRole('publisher') && !hasRole('superadmin')) {
      router.push('/bookings');
    }
  }, [user, hasRole, router]);
  
  const isClient = hasRole('client');
  const isPublisher = hasRole('publisher') || hasRole('superadmin');
  
  // Don't render dashboard content for clients
  if (isClient && !isPublisher) {
    return null;
  }
  
  const stats = [
    {
      title: 'Total de Publicaciones',
      value: dummyDashboardStats.totalPosts,
      change: '+12%',
      changeType: 'positive' as const,
      icon: FileText,
      color: 'from-blue-500 to-blue-600',
      showFor: ['publisher', 'superadmin'] as const,
    },
    {
      title: 'Publicaciones Activas',
      value: dummyDashboardStats.activePosts,
      change: '+5%',
      changeType: 'positive' as const,
      icon: Eye,
      color: 'from-green-500 to-green-600',
      showFor: ['publisher', 'superadmin'] as const,
    },
    {
      title: 'Vistas Totales',
      value: dummyDashboardStats.totalViews.toLocaleString(),
      change: '+23%',
      changeType: 'positive' as const,
      icon: TrendingUp,
      color: 'from-purple-500 to-purple-600',
      showFor: ['publisher', 'superadmin'] as const,
    },
    {
      title: 'Reservas',
      value: dummyDashboardStats.totalBookings,
      change: '+8%',
      changeType: 'positive' as const,
      icon: Calendar,
      color: 'from-orange-500 to-orange-600',
      showFor: ['publisher', 'superadmin', 'client'] as const,
    },
    {
      title: 'Ingresos Mensuales',
      value: formatPrice(dummyDashboardStats.monthlyRevenue, 'EUR'),
      change: '+15%',
      changeType: 'positive' as const,
      icon: DollarSign,
      color: 'from-emerald-500 to-emerald-600',
      showFor: ['publisher', 'superadmin'] as const,
    },
  ];

  // Client-specific stats
  const clientStats = [
    {
      title: 'Mis Reservas',
      value: '3',
      change: '+1',
      changeType: 'positive' as const,
      icon: Calendar,
      color: 'from-blue-500 to-blue-600',
    },
    {
      title: 'Favoritos',
      value: '12',
      change: '+2',
      changeType: 'positive' as const,
      icon: Heart,
      color: 'from-pink-500 to-pink-600',
    },
    {
      title: 'Servicios Visitados',
      value: '8',
      change: '+3',
      changeType: 'positive' as const,
      icon: Eye,
      color: 'from-green-500 to-green-600',
    },
    {
      title: 'Próxima Reserva',
      value: 'Mañana',
      change: 'En 24h',
      changeType: 'positive' as const,
      icon: Clock,
      color: 'from-orange-500 to-orange-600',
    },
  ];

  const recentPosts = [
    {
      id: '1',
      title: 'Alquiler de Bicicletas de Montaña',
      category: 'Bicycle Rental',
      views: 156,
      bookings: 3,
      status: 'active' as const,
    },
    {
      id: '2',
      title: 'Hotel Boutique en Madrid',
      category: 'Hotel Stay',
      views: 89,
      bookings: 1,
      status: 'active' as const,
    },
    {
      id: '3',
      title: 'Excursión a la Alhambra',
      category: 'Excursions',
      views: 234,
      bookings: 5,
      status: 'active' as const,
    },
  ];

  // Client-specific recent activity
  const clientRecentActivity = [
    {
      id: '1',
      message: 'Reservaste "Alquiler de Bicicletas de Montaña" para mañana',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    },
    {
      id: '2',
      message: 'Agregaste "Hotel Boutique en Madrid" a tus favoritos',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
    },
    {
      id: '3',
      message: 'Completaste tu perfil de usuario',
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    },
  ];

  // Filter stats based on user role
  const filteredStats = isClient ? clientStats : stats.filter(stat => 
    stat.showFor.some(role => hasRole(role))
  );

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
            Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Bienvenido de vuelta, {user?.name || 'Usuario'}. Aquí tienes un resumen de tu actividad.
          </p>
        </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {filteredStats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: index * 0.1 }}
            className="glass rounded-xl p-6 hover:transform hover:scale-105 transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-lg flex items-center justify-center`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <span className={`text-sm font-medium ${
                stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
              }`}>
                {stat.change}
              </span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              {stat.value}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {stat.title}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Charts and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="glass rounded-xl p-6"
        >
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            {isClient ? 'Actividad Reciente' : 'Actividad Reciente'}
          </h2>
          <div className="space-y-4">
            {isClient ? (
              clientRecentActivity.map((activity, index) => (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.4 + index * 0.1 }}
                  className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="w-2 h-2 bg-primary-brown rounded-full mt-2 flex-shrink-0"></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 dark:text-white">
                      {activity.message}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {formatDateTime(activity.timestamp)}
                    </p>
                  </div>
                </motion.div>
              ))
            ) : (
              dummyDashboardStats.recentActivity.map((activity, index) => (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.4 + index * 0.1 }}
                  className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="w-2 h-2 bg-primary-brown rounded-full mt-2 flex-shrink-0"></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 dark:text-white">
                      {activity.message}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {formatDateTime(activity.timestamp)}
                    </p>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>

        {/* Recent Posts Performance */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="glass rounded-xl p-6"
        >
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            {isClient ? 'Mis Últimas Reservas' : 'Rendimiento de Publicaciones'}
          </h2>
          <div className="space-y-4">
            {isClient ? (
              // Client view - Recent bookings
              [
                {
                  id: '1',
                  title: 'Alquiler de Bicicletas de Montaña',
                  category: 'Bicycle Rental',
                  status: 'confirmed' as const,
                  date: 'Mañana',
                  price: '45 EUR'
                },
                {
                  id: '2',
                  title: 'Hotel Boutique en Madrid Centro',
                  category: 'Hotel Stay',
                  status: 'pending' as const,
                  date: 'Próxima semana',
                  price: '120 EUR'
                },
                {
                  id: '3',
                  title: 'Excursión a la Alhambra',
                  category: 'Excursions',
                  status: 'completed' as const,
                  date: 'Hace 3 días',
                  price: '85 EUR'
                }
              ].map((booking, index) => (
                <motion.div
                  key={booking.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.5 + index * 0.1 }}
                  className="flex items-center justify-between p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {booking.title}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {booking.category}
                    </p>
                  </div>
                  <div className="flex items-center space-x-4 text-sm">
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600 dark:text-gray-300">
                        {booking.date}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <DollarSign className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600 dark:text-gray-300">
                        {booking.price}
                      </span>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      booking.status === 'confirmed' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : booking.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                        : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                    }`}>
                      {booking.status === 'confirmed' ? 'Confirmada' : 
                       booking.status === 'pending' ? 'Pendiente' : 'Completada'}
                    </span>
                  </div>
                </motion.div>
              ))
            ) : (
              // Publisher/Superadmin view - Recent posts performance
              recentPosts.map((post, index) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.5 + index * 0.1 }}
                  className="flex items-center justify-between p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {post.title}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {post.category}
                    </p>
                  </div>
                  <div className="flex items-center space-x-4 text-sm">
                    <div className="flex items-center space-x-1">
                      <Eye className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600 dark:text-gray-300">
                        {post.views}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600 dark:text-gray-300">
                        {post.bookings}
                      </span>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      post.status === 'active' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    }`}>
                      {post.status === 'active' ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.6 }}
        className="glass rounded-xl p-6"
      >
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          Acciones Rápidas
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {isClient ? (
            <>
              <button className="flex items-center justify-center p-4 bg-gradient-to-r from-primary-brown to-primary-green text-white rounded-lg hover:from-secondary-brown hover:to-secondary-green transition-all duration-300 transform hover:scale-105">
                <Calendar className="w-5 h-5 mr-2" />
                Ver Mis Reservas
              </button>
              <button className="flex items-center justify-center p-4 bg-gradient-to-r from-pink-500 to-pink-600 text-white rounded-lg hover:from-pink-600 hover:to-pink-700 transition-all duration-300 transform hover:scale-105">
                <Heart className="w-5 h-5 mr-2" />
                Mis Favoritos
              </button>
              <button className="flex items-center justify-center p-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-300 transform hover:scale-105">
                <User className="w-5 h-5 mr-2" />
                Mi Perfil
              </button>
            </>
          ) : (
            <>
              {/* Nueva Publicación button - Hidden for superadmin users */}
              {!hasRole('superadmin') && (
                <button 
                  onClick={() => {
                    if (!hasRole('publisher')) {
                      router.push('/suscribirse');
                    } else {
                      router.push('/posts/new');
                    }
                  }}
                  className="flex items-center justify-center p-4 bg-gradient-to-r from-primary-brown to-primary-green text-white rounded-lg hover:from-secondary-brown hover:to-secondary-green transition-all duration-300 transform hover:scale-105"
                >
                  <FileText className="w-5 h-5 mr-2" />
                  Nueva Publicación
                </button>
              )}
              <button className="flex items-center justify-center p-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-300 transform hover:scale-105">
                <Users className="w-5 h-5 mr-2" />
                Ver Publicaciones
              </button>
              <button className="flex items-center justify-center p-4 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105">
                <Settings className="w-5 h-5 mr-2" />
                Configuración
              </button>
            </>
          )}
        </div>
      </motion.div>
      </div>
    </div>
  );
} 