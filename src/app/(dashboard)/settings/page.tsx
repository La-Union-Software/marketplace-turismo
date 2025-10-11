'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Bell, Shield, Globe, CreditCard, Link, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { usePermissions } from '@/services/permissionsService';
import MercadoPagoForm from '@/components/forms/MercadoPagoForm';
import MercadoPagoConnectForm from '@/components/forms/MercadoPagoConnectForm';

export default function SettingsPage() {
  const { user } = useAuth();
  const permissions = usePermissions(user?.roles || []);
  const [showMercadoPagoForm, setShowMercadoPagoForm] = useState(false);
  const [showMercadoPagoConnectForm, setShowMercadoPagoConnectForm] = useState(false);
  const [oauthMessage, setOauthMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Check for OAuth callback messages in URL params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const oauthStatus = urlParams.get('oauth');
    const message = urlParams.get('message');

    if (oauthStatus && message) {
      setOauthMessage({
        type: oauthStatus as 'success' | 'error',
        text: decodeURIComponent(message)
      });

      // Clear URL params
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);

      // Auto-hide message after 5 seconds
      setTimeout(() => {
        setOauthMessage(null);
      }, 5000);
    }
  }, []);

  const settingsSections = [
    {
      title: 'Perfil',
      description: 'Gestiona tu información personal y preferencias',
      icon: User,
      href: '/settings/profile',
      color: 'from-blue-500 to-blue-600'
    },
    {
      title: 'Notificaciones',
      description: 'Configura cómo recibir notificaciones',
      icon: Bell,
      href: '/settings/notifications',
      color: 'from-green-500 to-green-600'
    },
    {
      title: 'Seguridad',
      description: 'Cambia tu contraseña y configuración de seguridad',
      icon: Shield,
      href: '/settings/security',
      color: 'from-red-500 to-red-600'
    },
    {
      title: 'Idioma y Región',
      description: 'Configura el idioma y la zona horaria',
      icon: Globe,
      href: '/settings/locale',
      color: 'from-purple-500 to-purple-600'
    }
  ];

  // Add MercadoPago sections for Superadmin users
  if (permissions.hasRole('superadmin')) {
    settingsSections.push({
      title: 'MercadoPago Credentials',
      description: 'Configura las credenciales de pago de MercadoPago',
      icon: CreditCard,
      href: '#',
      color: 'from-blue-500 to-blue-600'
    });

    settingsSections.push({
      title: 'Conectar con la cuenta principal de Mercado Pago',
      description: 'Conecta tu cuenta principal para gestionar planes de suscripción',
      icon: Link,
      href: '#',
      color: 'from-green-500 to-green-600'
    });
  }

  return (
    <div className="w-full max-w-none">
      <div className="space-y-8">
        {/* OAuth Success/Error Message */}
        <AnimatePresence>
          {oauthMessage && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className={`flex items-center space-x-3 p-4 rounded-lg border ${
                oauthMessage.type === 'success'
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-300'
                  : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300'
              }`}
            >
              {oauthMessage.type === 'success' ? (
                <CheckCircle className="w-5 h-5 flex-shrink-0" />
              ) : (
                <XCircle className="w-5 h-5 flex-shrink-0" />
              )}
              <p className="text-sm font-medium flex-1">{oauthMessage.text}</p>
              <button
                onClick={() => setOauthMessage(null)}
                className="text-current hover:opacity-70 transition-opacity"
              >
                ✕
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Configuración
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Gestiona tu cuenta y preferencias de la plataforma
          </p>
        </motion.div>

        {/* Settings Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {settingsSections.map((section, index) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="glass rounded-xl p-6 hover:transform hover:scale-105 transition-all duration-300 cursor-pointer"
              onClick={() => {
                if (section.title === 'MercadoPago Credentials') {
                  setShowMercadoPagoForm(true);
                } else if (section.title === 'Conectar con la cuenta principal de Mercado Pago') {
                  setShowMercadoPagoConnectForm(true);
                }
                // For other sections, you can add navigation logic here
              }}
            >
              <div className="flex items-start space-x-4">
                <div className={`w-12 h-12 bg-gradient-to-br ${section.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
                  <section.icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {section.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                    {section.description}
                  </p>
                  <button className="text-sm text-primary hover:text-secondary font-medium transition-colors">
                    Configurar →
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Account Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="glass rounded-xl p-6"
        >
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Información de la Cuenta
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nombre
              </label>
              <p className="text-gray-900 dark:text-white">{user?.name || 'No especificado'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email
              </label>
              <p className="text-gray-900 dark:text-white">{user?.email || 'No especificado'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Teléfono
              </label>
              <p className="text-gray-900 dark:text-white">{user?.phone || 'No especificado'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Roles
              </label>
              <div className="flex flex-wrap gap-2">
                {user?.roles
                  .filter(role => role.isActive)
                  .map((role) => (
                    <span
                      key={role.roleId}
                      className={`px-2 py-1 text-xs font-medium rounded-full border ${
                        role.roleName === 'superadmin' 
                          ? 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800'
                          : role.roleName === 'publisher'
                          ? 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800'
                          : 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800'
                      }`}
                    >
                      {role.roleName}
                    </span>
                  ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Danger Zone */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="glass rounded-xl p-6 border border-red-200 dark:border-red-800"
        >
          <h2 className="text-xl font-semibold text-red-800 dark:text-red-200 mb-4">
            Zona de Peligro
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <div>
                <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                  Desactivar Cuenta
                </h3>
                <p className="text-sm text-red-600 dark:text-red-300">
                  Desactiva temporalmente tu cuenta
                </p>
              </div>
              <button className="px-4 py-2 text-sm text-red-600 border border-red-300 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors">
                Desactivar
              </button>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <div>
                <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                  Eliminar Cuenta
                </h3>
                <p className="text-sm text-red-600 dark:text-red-300">
                  Elimina permanentemente tu cuenta y todos los datos
                </p>
              </div>
              <button className="px-4 py-2 text-sm text-white bg-red-600 border border-red-600 rounded-lg hover:bg-red-700 transition-colors">
                Eliminar
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* MercadoPago Credentials Form Modal */}
      {showMercadoPagoForm && (
        <MercadoPagoForm onClose={() => setShowMercadoPagoForm(false)} />
      )}

      {/* MercadoPago Connect Form Modal */}
      {showMercadoPagoConnectForm && (
        <MercadoPagoConnectForm onClose={() => setShowMercadoPagoConnectForm(false)} />
      )}
    </div>
  );
}
