'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, 
  MapPin, 
  Calendar, 
  Users,
  Star,
  TrendingUp
} from 'lucide-react';
import Link from 'next/link';
import AddressSearch from '@/components/ui/AddressSearch';

export default function HomePage() {
  const [searchForm, setSearchForm] = useState({
    location: '',
    checkIn: '',
    guests: ''
  });

  const [locationData, setLocationData] = useState<any>(null);

  const popularDestinations = [
    { name: 'Buenos Aires', image: '/api/placeholder/300/200', description: 'La ciudad que nunca duerme' },
    { name: 'Bariloche', image: '/api/placeholder/300/200', description: 'Paraíso de la Patagonia' },
    { name: 'Mendoza', image: '/api/placeholder/300/200', description: 'Tierra del vino y la montaña' },
    { name: 'Salta', image: '/api/placeholder/300/200', description: 'Cultura y tradición del norte' },
  ];

  const categories = [
    { name: 'Alojamientos', icon: '🏨', href: '/alojamientos', count: '2,500+' },
    { name: 'Experiencias', icon: '🌟', href: '/experiencias', count: '1,200+' },
    { name: 'Vehículos', icon: '🚗', href: '/vehiculos', count: '800+' },
    { name: 'Ofertas', icon: '💎', href: '/ofertas', count: '300+' },
  ];

  const handleLocationSelect = (address: any) => {
    setLocationData(address);
    setSearchForm(prev => ({
      ...prev,
      location: address.display_name
    }));
  };

  const handleSearch = () => {
    // TODO: Implement search functionality
    console.log('Searching for:', { ...searchForm, locationData });
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6">
              Encuentra tu{' '}
              <span className="gradient-text">viaje soñado</span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
              Descubre los mejores destinos de Argentina. Alojamientos únicos, experiencias inolvidables y vehículos para explorar.
            </p>
          </motion.div>

          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="max-w-4xl mx-auto"
          >
            <div className="glass rounded-2xl p-2 flex flex-col lg:flex-row items-stretch lg:items-center space-y-2 lg:space-y-0 lg:space-x-2">
              <div className="flex-1">
                <AddressSearch
                  value={searchForm.location}
                  onChange={(value) => setSearchForm(prev => ({ ...prev, location: value }))}
                  onSelect={handleLocationSelect}
                  placeholder="¿A dónde quieres ir?"
                  className="w-full"
                />
              </div>
              <div className="flex-1 relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="date"
                  value={searchForm.checkIn}
                  onChange={(e) => setSearchForm(prev => ({ ...prev, checkIn: e.target.value }))}
                  className="w-full pl-10 pr-4 py-3 border-0 bg-transparent text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-0"
                />
              </div>
              <div className="flex-1 relative">
                <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <select
                  value={searchForm.guests}
                  onChange={(e) => setSearchForm(prev => ({ ...prev, guests: e.target.value }))}
                  className="w-full pl-10 pr-4 py-3 border-0 bg-transparent text-gray-900 dark:text-white focus:outline-none focus:ring-0 appearance-none"
                >
                  <option value="">¿Cuántos?</option>
                  <option value="1">1 huésped</option>
                  <option value="2">2 huéspedes</option>
                  <option value="3">3 huéspedes</option>
                  <option value="4">4 huéspedes</option>
                  <option value="5+">5+ huéspedes</option>
                </select>
              </div>
              <button 
                onClick={handleSearch}
                className="px-6 py-3 bg-gradient-to-r from-primary-brown to-primary-green text-white rounded-xl hover:from-secondary-brown hover:to-secondary-green transition-all duration-300 transform hover:scale-105 flex items-center justify-center"
              >
                <Search className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Explora por categoría
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Encuentra exactamente lo que buscas para tu próxima aventura
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.map((category, index) => (
              <motion.div
                key={category.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 + index * 0.1 }}
              >
                <Link
                  href={category.href}
                  className="glass rounded-xl p-6 text-center hover:transform hover:scale-105 transition-all duration-300 block"
                >
                  <div className="text-4xl mb-4">{category.icon}</div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {category.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {category.count} opciones disponibles
                  </p>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Destinations */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Destinos populares
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Los lugares más visitados por nuestros viajeros
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {popularDestinations.map((destination, index) => (
              <motion.div
                key={destination.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.8 + index * 0.1 }}
              >
                <Link
                  href={`/destinos/${destination.name.toLowerCase().replace(' ', '-')}`}
                  className="glass rounded-xl overflow-hidden hover:transform hover:scale-105 transition-all duration-300 block"
                >
                  <div className="h-48 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center">
                    <span className="text-gray-500 dark:text-gray-400 text-sm">Imagen de {destination.name}</span>
                  </div>
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      {destination.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {destination.description}
                    </p>
                    <div className="flex items-center mt-3">
                      <div className="flex text-yellow-400">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-current" />
                        ))}
                      </div>
                      <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                        4.8 (120 reseñas)
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.0 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Números que hablan por sí solos
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Miles de viajeros confían en nosotros
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { number: '50K+', label: 'Viajeros satisfechos', icon: '👥' },
              { number: '5K+', label: 'Destinos disponibles', icon: '🗺️' },
              { number: '98%', label: 'Tasa de satisfacción', icon: '⭐' },
              { number: '24/7', label: 'Soporte disponible', icon: '🔄' },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 1.2 + index * 0.1 }}
                className="text-center"
              >
                <div className="text-4xl mb-4">{stat.icon}</div>
                <div className="text-3xl font-bold text-primary-brown mb-2">
                  {stat.number}
                </div>
                <p className="text-gray-600 dark:text-gray-400">
                  {stat.label}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
