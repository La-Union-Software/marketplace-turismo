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
import BackgroundCarousel from '@/components/ui/BackgroundCarousel';

export default function HomePage() {
  const [searchForm, setSearchForm] = useState({
    location: '',
    checkIn: '',
    guests: ''
  });

  const [locationData, setLocationData] = useState<any>(null);

  // Banner images for the carousel
  const bannerImages = [
    '/img/banner-1.jpg',
    '/img/banner-2.jpg',
    '/img/banner-3.jpg',
    '/img/banner-4.jpg'
  ];

  const popularDestinations = [
    { name: 'Buenos Aires', image: '/api/placeholder/300/200', description: 'La ciudad que nunca duerme' },
    { name: 'Bariloche', image: '/api/placeholder/300/200', description: 'Paraíso de la Patagonia' },
    { name: 'Mendoza', image: '/api/placeholder/300/200', description: 'Tierra del vino y la montaña' },
    { name: 'Salta', image: '/api/placeholder/300/200', description: 'Cultura y tradición del norte' },
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
      <section className="relative py-12 sm:py-20 px-4 sm:px-6 lg:px-8 min-h-screen flex items-center">
        {/* Background Carousel */}
        <div className="absolute inset-0 z-0">
          <BackgroundCarousel 
            images={bannerImages} 
            interval={5000}
            className="w-full h-full"
          />
        </div>
        
        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto text-center w-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-white mb-6 drop-shadow-2xl">
              Viví Argentina{' '}
              <span className="gradient-text bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                a tu manera
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-white/95 mb-8 max-w-3xl mx-auto drop-shadow-lg font-medium">
              Elegí entre alojamientos, actividades, excursiones y medios para moverte. Todo en un solo lugar, seguro y fácil de reservar.
            </p>
          </motion.div>

          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="max-w-4xl mx-auto"
          >
            <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm rounded-2xl p-2 flex flex-col lg:flex-row items-stretch lg:items-center space-y-2 lg:space-y-0 lg:space-x-2 shadow-xl border border-white/20">
              <div className="flex-1">
                <AddressSearch
                  value={searchForm.location}
                  onChange={(value) => setSearchForm(prev => ({ ...prev, location: value }))}
                  onSelect={handleLocationSelect}
                  placeholder="Elegí tu siguiente destino"
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
                  <option value="">¿Cuántos viajeros?</option>
                  <option value="1">1 viajero</option>
                  <option value="2">2 viajeros</option>
                  <option value="3">3 viajeros</option>
                  <option value="4">4 viajeros</option>
                  <option value="5+">5+ viajeros</option>
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
              Nuestro comienzo, tu próxima aventura.
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">
            Creando el futuro del turismo juntos
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { 
                icon: '🔑', 
                title: 'Lanzamiento 2025', 
                description: 'Nuevo marketplace para transformar el turismo.' 
              },
              { 
                icon: '📌', 
                title: '100% pensado para Argentina', 
                description: 'Adaptado a viajeros y prestadores locales.' 
              },
              { 
                icon: '🔒', 
                title: 'Seguridad primero', 
                description: 'Políticas claras y protección en cada reserva.' 
              },
              { 
                icon: '🌱', 
                title: 'Creciendo juntos', 
                description: 'Invitamos a negocios y viajeros a ser parte desde el inicio.' 
              },
            ].map((card, index) => (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 1.2 + index * 0.1 }}
                className="text-center"
              >
                <div className="text-4xl mb-4">{card.icon}</div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {card.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {card.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
