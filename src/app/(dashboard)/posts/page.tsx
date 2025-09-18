'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, Plus, Search, Filter, Edit, Trash2, Eye, MoreVertical } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { firebaseDB } from '@/services/firebaseService';
import { BasePost } from '@/types';
import PostCard from '@/components/ui/PostCard';

export default function PostsPage() {
  const { user, hasRole } = useAuth();
  const router = useRouter();
  const [posts, setPosts] = useState<BasePost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Redirect non-publisher users to subscription page
  useEffect(() => {
    if (user && !hasRole('publisher') && !hasRole('superadmin')) {
      router.push('/suscribirse');
    }
  }, [user, hasRole, router]);

  // Fetch user's posts
  useEffect(() => {
    const fetchPosts = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        setError(null);
        const userPosts = await firebaseDB.posts.getByUserId(user.id);
        setPosts(userPosts);
      } catch (err) {
        console.error('Error fetching posts:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch posts');
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [user]);

  const handleEditPost = (postId: string) => {
    router.push(`/posts/edit/${postId}`);
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta publicación?')) return;
    
    try {
      await firebaseDB.posts.delete(postId);
      setPosts(posts.filter(post => post.id !== postId));
    } catch (err) {
      console.error('Error deleting post:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete post');
    }
  };

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' || post.status === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

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
            Publicaciones
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Gestiona tus publicaciones de servicios turísticos
          </p>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="glass rounded-xl p-6"
        >
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Nueva Publicación button - Hidden for superadmin users */}
              {!hasRole('superadmin') && (
                <button 
                  onClick={() => router.push('/posts/new')}
                  className="flex items-center px-4 py-2 bg-gradient-to-r from-primary-brown to-primary-green text-white rounded-lg hover:from-secondary-brown hover:to-secondary-green transition-all duration-300"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nueva Publicación
                </button>
              )}
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Buscar publicaciones..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-brown focus:border-transparent"
                />
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-brown focus:border-transparent"
              >
                <option value="all">Todos</option>
                <option value="published">Publicados</option>
                <option value="pending">Pendientes</option>
                <option value="draft">Borradores</option>
                <option value="rejected">Rechazados</option>
              </select>
            </div>
          </div>
        </motion.div>

        {/* Posts Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {loading ? (
            <div className="glass rounded-xl p-12 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-brown mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-300">Cargando publicaciones...</p>
            </div>
          ) : error ? (
            <div className="glass rounded-xl p-12 text-center">
              <div className="text-red-500 mb-4">
                <FileText className="w-16 h-16 mx-auto mb-4" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Error al cargar publicaciones
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">{error}</p>
              <button 
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-gradient-to-r from-primary-brown to-primary-green text-white rounded-lg hover:from-secondary-brown hover:to-secondary-green transition-all duration-300"
              >
                Reintentar
              </button>
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="glass rounded-xl p-12 text-center">
              <FileText className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {searchTerm || filterStatus !== 'all' ? 'No se encontraron publicaciones' : 'No hay publicaciones aún'}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                {searchTerm || filterStatus !== 'all' 
                  ? 'Intenta ajustar los filtros de búsqueda' 
                  : 'Comienza creando tu primera publicación de servicios turísticos'
                }
              </p>
              {!hasRole('superadmin') && !searchTerm && filterStatus === 'all' && (
                <button 
                  onClick={() => router.push('/posts/new')}
                  className="px-6 py-3 bg-gradient-to-r from-primary-brown to-primary-green text-white rounded-lg hover:from-secondary-brown hover:to-secondary-green transition-all duration-300"
                >
                  Crear Primera Publicación
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Posts Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPosts.map((post, index) => (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    className="relative group"
                  >
                    <PostCard post={post} />
                    
                    {/* Action Buttons */}
                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEditPost(post.id)}
                          className="p-2 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-full shadow-lg hover:bg-primary-brown hover:text-white transition-colors"
                          title="Editar publicación"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeletePost(post.id)}
                          className="p-2 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-full shadow-lg hover:bg-red-500 hover:text-white transition-colors"
                          title="Eliminar publicación"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
              
              {/* Posts Count */}
              <div className="text-center text-sm text-gray-500 dark:text-gray-400">
                Mostrando {filteredPosts.length} de {posts.length} publicaciones
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
} 