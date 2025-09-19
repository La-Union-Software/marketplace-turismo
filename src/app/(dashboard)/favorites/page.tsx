'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  Heart, 
  MapPin, 
  DollarSign, 
  Search, 
  Filter, 
  Eye,
  Trash2,
  Calendar,
  Star,
  Clock,
  CheckCircle
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import RequireClient from '@/components/auth/ProtectedRoute';

export default function FavoritesPage() {
  return (
    <RequireClient>
      <FavoritesManagement />
    </RequireClient>
  );
}

interface FavoritePost {
  id: string;
  postId: string;
  title: string;
  category: string;
  description: string;
  image: string;
  location: string;
  price: number;
  currency: string;
  rating: number;
  addedAt: Date;
  isAvailable: boolean;
}

function FavoritesManagement() {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<FavoritePost[]>([]);
  const [filteredFavorites, setFilteredFavorites] = useState<FavoritePost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [availabilityFilter, setAvailabilityFilter] = useState<'all' | 'available' | 'unavailable'>('all');

  // Mock data for demonstration
  useEffect(() => {
    const mockFavorites: FavoritePost[] = [
      {
        id: '1',
        postId: 'post1',
        title: 'Alquiler de Bicicletas de Montaña',
        category: 'Bicycle Rental',
        description: 'Explora las mejores rutas de montaña con nuestras bicicletas profesionales. Incluye casco, mapa y kit de reparación.',
        image: '/api/placeholder/300/200',
        location: 'Sierra de Guadarrama, Madrid',
        price: 45,
        currency: 'EUR',
        rating: 4.8,
        addedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        isAvailable: true
      },
      {
        id: '2',
        postId: 'post2',
        title: 'Hotel Boutique en Madrid Centro',
        category: 'Hotel Stay',
        description: 'Habitaciones elegantes en el corazón de Madrid. Cerca de los principales puntos turísticos y transporte público.',
        image: '/api/placeholder/300/200',
        location: 'Madrid Centro, España',
        price: 120,
        currency: 'EUR',
        rating: 4.6,
        addedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
        isAvailable: true
      },
      {
        id: '3',
        postId: 'post3',
        title: 'Excursión a la Alhambra',
        category: 'Excursions',
        description: 'Visita guiada al impresionante palacio de la Alhambra en Granada. Incluye transporte desde Madrid y entradas.',
        image: '/api/placeholder/300/200',
        location: 'Granada, España',
        price: 85,
        currency: 'EUR',
        rating: 4.9,
        addedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
        isAvailable: false
      },
      {
        id: '4',
        postId: 'post4',
        title: 'Alquiler de Coche Compacto',
        category: 'Car Rental',
        description: 'Coche económico perfecto para explorar la ciudad. Incluye seguro básico y kilómetros ilimitados.',
        image: '/api/placeholder/300/200',
        location: 'Aeropuerto de Barajas, Madrid',
        price: 65,
        currency: 'EUR',
        rating: 4.4,
        addedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000), // 20 days ago
        isAvailable: true
      },
      {
        id: '5',
        postId: 'post5',
        title: 'Casa Rural en la Sierra',
        category: 'Vacation Home Rental',
        description: 'Hermosa casa rural con vistas panorámicas. Ideal para escapadas románticas o familiares.',
        image: '/api/placeholder/300/200',
        location: 'Sierra de Gredos, Ávila',
        price: 150,
        currency: 'EUR',
        rating: 4.7,
        addedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000), // 25 days ago
        isAvailable: true
      }
    ];

    setFavorites(mockFavorites);
    setFilteredFavorites(mockFavorites);
    setIsLoading(false);
  }, []);

  const filterFavorites = useCallback(() => {
    let filtered = favorites;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(favorite => 
        favorite.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        favorite.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        favorite.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(favorite => favorite.category === categoryFilter);
    }

    // Availability filter
    if (availabilityFilter !== 'all') {
      filtered = filtered.filter(favorite => 
        availabilityFilter === 'available' ? favorite.isAvailable : !favorite.isAvailable
      );
    }

    setFilteredFavorites(filtered);
  }, [favorites, searchTerm, categoryFilter, availabilityFilter]);

  useEffect(() => {
    filterFavorites();
  }, [filterFavorites]);

  const removeFavorite = (favoriteId: string) => {
    setFavorites(favorites.filter(f => f.id !== favoriteId));
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'Bicycle Rental': 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800',
      'Hotel Stay': 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800',
      'Excursions': 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800',
      'Car Rental': 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800',
      'Vacation Home Rental': 'bg-pink-100 text-pink-800 border-pink-200 dark:bg-pink-900/20 dark:text-pink-300 dark:border-pink-800',
      'Camping Stay': 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800',
      'Experiences': 'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-300 dark:border-indigo-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-300 dark:border-gray-800';
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: currency
    }).format(price);
  };

  const categories = ['Bicycle Rental', 'Hotel Stay', 'Excursions', 'Car Rental', 'Vacation Home Rental', 'Camping Stay', 'Experiences'];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-brown"></div>
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
            Mis Favoritos
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Guarda y organiza tus servicios turísticos favoritos
          </p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="glass rounded-xl p-6"
          >
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-pink-600 rounded-lg flex items-center justify-center">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Favoritos</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{favorites.length}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="glass rounded-xl p-6"
          >
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Disponibles</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {favorites.filter(f => f.isAvailable).length}
                </p>
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
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg flex items-center justify-center">
                <Star className="w-6 h-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Promedio Rating</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {(favorites.reduce((acc, f) => acc + f.rating, 0) / favorites.length).toFixed(1)}
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="glass rounded-xl p-6"
        >
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Buscar en tus favoritos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-brown focus:border-transparent"
                />
              </div>
            </div>
            <div className="md:w-48">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-brown focus:border-transparent"
              >
                <option value="all">Todas las categorías</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:w-40">
              <select
                value={availabilityFilter}
                onChange={(e) => setAvailabilityFilter(e.target.value as 'all' | 'available' | 'unavailable')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-brown focus:border-transparent"
              >
                <option value="all">Todas</option>
                <option value="available">Disponibles</option>
                <option value="unavailable">No disponibles</option>
              </select>
            </div>
          </div>
        </motion.div>

        {/* Favorites Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {filteredFavorites.map((favorite, index) => (
            <motion.div
              key={favorite.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.6 + index * 0.1 }}
              className="glass rounded-xl overflow-hidden hover:transform hover:scale-105 transition-all duration-300"
            >
              {/* Image */}
              <div className="h-48 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center">
                <span className="text-gray-500 dark:text-gray-400 text-sm">Imagen del servicio</span>
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${getCategoryColor(favorite.category)}`}>
                    {favorite.category}
                  </span>
                  <div className="flex items-center space-x-1">
                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {favorite.rating}
                    </span>
                  </div>
                </div>

                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
                  {favorite.title}
                </h3>
                
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">
                  {favorite.description}
                </p>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600 dark:text-gray-400 truncate">
                      {favorite.location}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <DollarSign className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {formatPrice(favorite.price, favorite.currency)}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      Agregado {formatDate(favorite.addedAt)}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <button className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors" title="Ver detalles">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => removeFavorite(favorite.id)}
                      className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors" 
                      title="Eliminar de favoritos"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
                    favorite.isAvailable 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' 
                      : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                  }`}>
                    {favorite.isAvailable ? 'Disponible' : 'No disponible'}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {filteredFavorites.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-xl p-12 text-center"
          >
            <Heart className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No hay favoritos
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              {searchTerm || categoryFilter !== 'all' || availabilityFilter !== 'all'
                ? 'No se encontraron favoritos con los filtros aplicados.'
                : 'Aún no has agregado ningún servicio a tus favoritos. ¡Explora y guarda los que más te gusten!'
              }
            </p>
            {!searchTerm && categoryFilter === 'all' && availabilityFilter === 'all' && (
              <button className="px-6 py-3 bg-gradient-to-r from-primary-brown to-primary-green text-white rounded-lg hover:from-secondary-brown hover:to-secondary-green transition-all duration-300">
                Explorar Servicios
              </button>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
