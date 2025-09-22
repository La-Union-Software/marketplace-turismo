'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, MapPin, Euro, Calendar, User, Star, Share2, Heart } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { firebaseDB } from '@/services/firebaseService';
import { BasePost, PostImage } from '@/types';
import PostImages from '@/components/ui/PostImages';
import BookingForm from '@/components/booking/BookingForm';

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, hasRole } = useAuth();
  const [post, setPost] = useState<BasePost | null>(null);
  const [images, setImages] = useState<PostImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showBookingForm, setShowBookingForm] = useState(false);

  const postId = params.id as string;

  useEffect(() => {
    const fetchPost = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch post data
        const postData = await firebaseDB.posts.getById(postId);
        if (!postData) {
          setError('Publicación no encontrada');
          return;
        }

        // Check if post is published
        if (postData.status !== 'published' && postData.status !== 'approved') {
          setError('Esta publicación no está disponible');
          return;
        }

        setPost(postData);

        // Fetch images from subcollection
        const postImages = await firebaseDB.postImages.getByPostId(postId);
        setImages(postImages);
      } catch (err) {
        console.error('Error fetching post:', err);
        setError(err instanceof Error ? err.message : 'Error al cargar la publicación');
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [postId]);

  const handleBookingClick = () => {
    if (!user) {
      router.push('/login');
      return;
    }
    
    if (!hasRole('client')) {
      alert('Necesitas ser un cliente para realizar reservas');
      return;
    }
    
    // Prevent users from booking their own services
    if (user.id === post?.userId) {
      alert('No puedes reservar tu propio servicio. Solo puedes reservar servicios de otros usuarios.');
      return;
    }
    
    setShowBookingForm(true);
  };

  const getMinPrice = () => {
    if (!post) return 0;
    // For now, return the fixed price. In the future, this could calculate from dynamic pricing
    return post.price;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-brown mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Cargando publicación...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Error
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
          <button
            onClick={() => router.back()}
            className="px-6 py-3 bg-gradient-to-r from-primary-brown to-primary-green text-white rounded-lg hover:from-secondary-brown hover:to-secondary-green transition-all duration-300"
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Publicación no encontrada
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            La publicación que buscas no existe o ha sido eliminada.
          </p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-gradient-to-r from-primary-brown to-primary-green text-white rounded-lg hover:from-secondary-brown hover:to-secondary-green transition-all duration-300"
          >
            Ir al Inicio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto p-8">
        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-6"
        >
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-600 dark:text-gray-300 hover:text-primary-brown transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Volver
          </button>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content - 75% */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="lg:col-span-3 space-y-8"
          >
            {/* Images */}
            <div className="glass rounded-xl p-6">
              <PostImages 
                postId={post.id} 
                className="w-full"
                showMainImageOnly={false}
                showGallery={true}
              />
            </div>

            {/* Post Details */}
            <div className="glass rounded-xl p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    {post.title}
                  </h1>
                  <div className="flex items-center space-x-4 text-gray-600 dark:text-gray-300">
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 mr-1" />
                      <span>{post.location}</span>
                    </div>
                    <div className="flex items-center">
                      <User className="w-4 h-4 mr-1" />
                      <span>{post.category}</span>
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                    <Share2 className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                  </button>
                  <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                    <Heart className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                  </button>
                </div>
              </div>

              <div className="prose prose-lg dark:prose-invert max-w-none">
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  {post.description}
                </p>
              </div>
            </div>

            {/* Specific Information */}
            {post.specificFields && Object.keys(post.specificFields).length > 0 && (
              <div className="glass rounded-xl p-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                  Información Específica
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(post.specificFields).map(([key, value]) => (
                    <div key={key} className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        {key.charAt(0).toUpperCase() + key.slice(1)}:
                      </span>
                      <span className="text-gray-600 dark:text-gray-400">
                        {typeof value === 'boolean' ? (value ? 'Sí' : 'No') : String(value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Location */}
            <div className="glass rounded-xl p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Ubicación
              </h2>
              <div className="flex items-center text-gray-600 dark:text-gray-300">
                <MapPin className="w-5 h-5 mr-2" />
                <span>{post.location}</span>
              </div>
            </div>
          </motion.div>

          {/* Booking Sidebar - 25% */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:col-span-1"
          >
            <div className="sticky top-8">
              <div className="glass rounded-xl p-6">
                {/* Price */}
                <div className="mb-6">
                  <div className="flex items-baseline space-x-2 mb-2">
                    <span className="text-3xl font-bold text-gray-900 dark:text-white">
                      {getMinPrice()} {post.currency}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      desde
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Precio por noche/día
                  </p>
                </div>

                {/* Booking Button */}
                {user && user.id === post.userId ? (
                  <div className="w-full py-3 px-4 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-lg text-center font-semibold">
                    Este es tu servicio
                  </div>
                ) : (
                  <button
                    onClick={handleBookingClick}
                    className="w-full py-3 px-4 bg-gradient-to-r from-primary-brown to-primary-green text-white rounded-lg hover:from-secondary-brown hover:to-secondary-green transition-all duration-300 font-semibold"
                  >
                    Solicitar Reserva
                  </button>
                )}

                {/* Additional Info */}
                <div className="mt-6 space-y-3 text-sm text-gray-600 dark:text-gray-300">
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span>Reserva flexible</span>
                  </div>
                  <div className="flex items-center">
                    <Star className="w-4 h-4 mr-2" />
                    <span>Cancelación gratuita</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Booking Form Modal */}
      {showBookingForm && (
        <BookingForm
          post={post}
          onClose={() => setShowBookingForm(false)}
          onSuccess={() => {
            setShowBookingForm(false);
            // Show success message or redirect
          }}
        />
      )}
    </div>
  );
}
