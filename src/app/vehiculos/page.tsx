'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Grid, List, Search, MapPin, DollarSign, Car, Zap, Users, ChevronLeft, ChevronRight } from 'lucide-react';
import { firebaseDB } from '@/services/firebaseService';
import { BasePost, ServiceCategory } from '@/types';
import PostCard from '@/components/ui/PostCard';
import { useRouter } from 'next/navigation';

const VEHICULO_CATEGORIES: ServiceCategory[] = ['Alquiler de autos', 'Alquiler de bicicletas', 'Alquiler de kayaks'];

export default function VehiculosPage() {
  const [posts, setPosts] = useState<BasePost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [priceRange, setPriceRange] = useState({ min: 0, max: 50000 });
  const [locationFilter, setLocationFilter] = useState('');
  const [vehicleTypeFilter, setVehicleTypeFilter] = useState<string>('all');
  const [transmissionFilter, setTransmissionFilter] = useState<string>('all');
  const [fuelTypeFilter, setFuelTypeFilter] = useState<string>('all');
  const [seatsFilter, setSeatsFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [postsPerPage] = useState(12);
  const router = useRouter();

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get all posts and filter by vehículo categories
        const allPosts = await firebaseDB.posts.getAll();
        console.log('All posts:', allPosts.length);
        console.log('Sample post:', allPosts[0]);
        
        const vehiculoPosts = allPosts.filter(post => {
          const matchesCategory = VEHICULO_CATEGORIES.includes(post.category);
          const matchesStatus = post.status === 'published' || post.status === 'approved';
          const isEnabled = post.isEnabled !== false; // Default to true if undefined
          
          console.log('Post filter:', {
            title: post.title,
            category: post.category,
            matchesCategory,
            status: post.status,
            matchesStatus,
            isEnabled: post.isEnabled,
            passes: matchesCategory && matchesStatus && isEnabled
          });
          
          return matchesCategory && matchesStatus && isEnabled;
        });
        
        console.log('Filtered vehículo posts:', vehiculoPosts.length);
        setPosts(vehiculoPosts);
      } catch (err) {
        console.error('Error fetching posts:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch posts');
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  const filteredPosts = posts.filter(post => {
    const matchesSearch = searchTerm === '' || 
                         post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesLocation = locationFilter === '' || 
                           post.location.toLowerCase().includes(locationFilter.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || post.category === selectedCategory;
    
    const matchesPrice = post.price >= priceRange.min && post.price <= priceRange.max;
    
    // Vehicle-specific filters
    const matchesVehicleType = vehicleTypeFilter === 'all' || 
                               (post.specificFields?.carType && post.specificFields.carType === vehicleTypeFilter) ||
                               (post.specificFields?.bikeType && post.specificFields.bikeType === vehicleTypeFilter);
    
    const matchesTransmission = transmissionFilter === 'all' || 
                               (post.specificFields?.transmission && post.specificFields.transmission === transmissionFilter);
    
    const matchesFuelType = fuelTypeFilter === 'all' || 
                           (post.specificFields?.fuelType && post.specificFields.fuelType === fuelTypeFilter);
    
    const matchesSeats = seatsFilter === 'all' || 
                        (post.specificFields?.seats && Number(post.specificFields.seats) >= Number(seatsFilter));
    
    return matchesSearch && matchesLocation && matchesCategory && matchesPrice && 
           matchesVehicleType && matchesTransmission && matchesFuelType && matchesSeats;
  });

  // Pagination
  const indexOfLastPost = currentPage * postsPerPage;
  const indexOfFirstPost = indexOfLastPost - postsPerPage;
  const currentPosts = filteredPosts.slice(indexOfFirstPost, indexOfLastPost);
  const totalPages = Math.ceil(filteredPosts.length / postsPerPage);

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePostClick = (postId: string) => {
    router.push(`/post/${postId}`);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0
    }).format(price);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto p-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Vehículos
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Alquila el vehículo perfecto para tu aventura
          </p>
        </motion.div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters */}
          <motion.aside
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="lg:w-80 flex-shrink-0"
          >
            <div className="glass rounded-xl p-6 sticky top-8 space-y-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Filtros
              </h2>

              {/* Text Search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Buscar
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Buscar..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              </div>

              {/* Location Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  Ubicación
                </label>
                <input
                  type="text"
                  placeholder="Ciudad o provincia..."
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Car className="w-4 h-4 inline mr-1" />
                  Tipo de Vehículo
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="all">Todos los tipos</option>
                  {VEHICULO_CATEGORIES.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              {/* Price Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <DollarSign className="w-4 h-4 inline mr-1" />
                  Rango de Precio
                </label>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Desde:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{formatPrice(priceRange.min)}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="50000"
                    step="500"
                    value={priceRange.min}
                    onChange={(e) => setPriceRange({ ...priceRange, min: parseInt(e.target.value) })}
                    className="w-full"
                  />
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Hasta:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{formatPrice(priceRange.max)}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="50000"
                    step="500"
                    value={priceRange.max}
                    onChange={(e) => setPriceRange({ ...priceRange, max: parseInt(e.target.value) })}
                    className="w-full"
                  />
                </div>
              </div>

              {/* Vehicle Type Filter (for cars) */}
              {selectedCategory === 'Alquiler de autos' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Categoría de Auto
                  </label>
                  <select
                    value={vehicleTypeFilter}
                    onChange={(e) => setVehicleTypeFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="all">Todas</option>
                    <option value="Economy">Económico</option>
                    <option value="Compact">Compacto</option>
                    <option value="SUV">SUV</option>
                    <option value="Luxury">Lujo</option>
                    <option value="Van">Van</option>
                  </select>
                </div>
              )}

              {/* Transmission Filter (for cars) */}
              {selectedCategory === 'Alquiler de autos' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Transmisión
                  </label>
                  <select
                    value={transmissionFilter}
                    onChange={(e) => setTransmissionFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="all">Todas</option>
                    <option value="Manual">Manual</option>
                    <option value="Automatic">Automática</option>
                  </select>
                </div>
              )}

              {/* Fuel Type Filter (for cars) */}
              {selectedCategory === 'Alquiler de autos' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Zap className="w-4 h-4 inline mr-1" />
                    Combustible
                  </label>
                  <select
                    value={fuelTypeFilter}
                    onChange={(e) => setFuelTypeFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="all">Todos</option>
                    <option value="Gasoline">Nafta</option>
                    <option value="Diesel">Diesel</option>
                    <option value="Electric">Eléctrico</option>
                    <option value="Hybrid">Híbrido</option>
                  </select>
                </div>
              )}

              {/* Seats Filter (for cars) */}
              {selectedCategory === 'Alquiler de autos' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Users className="w-4 h-4 inline mr-1" />
                    Asientos
                  </label>
                  <select
                    value={seatsFilter}
                    onChange={(e) => setSeatsFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="all">Cualquier cantidad</option>
                    <option value="2">2+ asientos</option>
                    <option value="4">4+ asientos</option>
                    <option value="5">5+ asientos</option>
                    <option value="7">7+ asientos</option>
                  </select>
                </div>
              )}

              {/* Bike Type Filter (for bicycles) */}
              {selectedCategory === 'Alquiler de bicicletas' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tipo de Bicicleta
                  </label>
                  <select
                    value={vehicleTypeFilter}
                    onChange={(e) => setVehicleTypeFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="all">Todas</option>
                    <option value="Mountain">Montaña</option>
                    <option value="Road">Ruta</option>
                    <option value="City">Ciudad</option>
                    <option value="Electric">Eléctrica</option>
                  </select>
                </div>
              )}

              {/* Reset Filters */}
              <button
                onClick={() => {
                  setSearchTerm('');
                  setLocationFilter('');
                  setSelectedCategory('all');
                  setPriceRange({ min: 0, max: 50000 });
                  setVehicleTypeFilter('all');
                  setTransmissionFilter('all');
                  setFuelTypeFilter('all');
                  setSeatsFilter('all');
                }}
                className="w-full px-4 py-2 text-sm text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Limpiar Filtros
              </button>
            </div>
          </motion.aside>

          {/* Main Content */}
          <div className="flex-1">
            {/* Top Bar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="glass rounded-xl p-6 mb-6"
            >
              <div className="flex items-center justify-between">
                <p className="text-gray-600 dark:text-gray-300">
                  {filteredPosts.length} {filteredPosts.length === 1 ? 'vehículo encontrado' : 'vehículos encontrados'}
                </p>
                
                {/* View Mode Toggle */}
                <div className="flex border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 ${viewMode === 'grid' ? 'bg-primary text-white' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300'}`}
                  >
                    <Grid className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 ${viewMode === 'list' ? 'bg-primary text-white' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300'}`}
                  >
                    <List className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Results */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              {error ? (
                <div className="glass rounded-xl p-12 text-center">
                  <p className="text-red-600 dark:text-red-400">{error}</p>
                  <button 
                    onClick={() => window.location.reload()}
                    className="mt-4 px-6 py-3 bg-primary text-white rounded-lg hover:bg-secondary transition-all duration-300"
                  >
                    Reintentar
                  </button>
                </div>
              ) : currentPosts.length === 0 ? (
                <div className="glass rounded-xl p-12 text-center">
                  <Car className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    No se encontraron vehículos
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    Intenta ajustar los filtros de búsqueda
                  </p>
                </div>
              ) : (
                <>
                  {/* Posts Grid/List */}
                  <div className={viewMode === 'grid' 
                    ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' 
                    : 'space-y-4'
                  }>
                    {currentPosts.map((post, index) => (
                      <motion.div
                        key={post.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: index * 0.05 }}
                        className="cursor-pointer"
                        onClick={() => handlePostClick(post.id)}
                      >
                        <PostCard post={post} />
                      </motion.div>
                    ))}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-center space-x-2 mt-8">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      
                      {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                        let pageNumber;
                        if (totalPages <= 5) {
                          pageNumber = i + 1;
                        } else if (currentPage <= 3) {
                          pageNumber = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNumber = totalPages - 4 + i;
                        } else {
                          pageNumber = currentPage - 2 + i;
                        }
                        
                        return (
                          <button
                            key={pageNumber}
                            onClick={() => handlePageChange(pageNumber)}
                            className={`px-4 py-2 rounded-lg transition-colors ${
                              currentPage === pageNumber
                                ? 'bg-primary text-white'
                                : 'border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
                            }`}
                          >
                            {pageNumber}
                          </button>
                        );
                      })}
                      
                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  )}

                  {/* Posts Count */}
                  <div className="text-center text-sm text-gray-500 dark:text-gray-400 mt-4">
                    Mostrando {indexOfFirstPost + 1}-{Math.min(indexOfLastPost, filteredPosts.length)} de {filteredPosts.length}
                  </div>
                </>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}