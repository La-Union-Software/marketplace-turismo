'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { usePostCreation } from '@/hooks/usePostCreation';
import PostFormWizard from '@/components/forms/PostFormWizard';

export default function NewPostPage() {
  const { 
    canCreatePost, 
    isLoading, 
    userPlan, 
    redirectToSubscription, 
    redirectToPosts 
  } = usePostCreation();

  useEffect(() => {
    if (!isLoading && canCreatePost === false) {
      // User doesn't have publisher role or can't create posts
      redirectToSubscription();
    }
  }, [canCreatePost, isLoading, redirectToSubscription]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-blue-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Verificando permisos...</p>
        </div>
      </div>
    );
  }

  if (canCreatePost === false) {
    return (
      <div className="min-h-screen bg-blue-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="glass rounded-2xl p-8 max-w-md text-center"
        >
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Acceso Denegado
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            No tienes permisos para crear publicaciones. Redirigiendo a la página de suscripción...
          </p>
          <div className="animate-pulse">
            <div className="w-4 h-4 bg-primary rounded-full mx-auto"></div>
          </div>
        </motion.div>
      </div>
    );
  }

  if (canCreatePost === null) {
    return (
      <div className="min-h-screen bg-blue-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="glass rounded-2xl p-8 max-w-md text-center"
        >
          <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-yellow-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Verificando...
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Estamos verificando tu suscripción y permisos...
          </p>
          <div className="animate-pulse">
            <div className="w-4 h-4 bg-primary rounded-full mx-auto"></div>
          </div>
        </motion.div>
      </div>
    );
  }

  // User can create posts - show the form
  return (
    <div className="min-h-screen bg-blue-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Crear Nueva Publicación
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Completa el formulario para crear tu nueva publicación de servicios turísticos
          </p>
          
          {/* Plan Info */}
          {userPlan && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mt-6 inline-flex items-center space-x-2 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200 px-4 py-2 rounded-full"
            >
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm font-medium">
                Plan: {userPlan.name} - {userPlan.maxPosts} publicaciones disponibles
              </span>
            </motion.div>
          )}
        </motion.div>

        {/* Post Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="max-w-4xl mx-auto"
        >
          <PostFormWizard />
        </motion.div>
      </div>
    </div>
  );
} 