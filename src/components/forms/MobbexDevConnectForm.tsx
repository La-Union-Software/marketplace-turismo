'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  CreditCard, 
  ExternalLink, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  Unlink,
  Building2
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { firebaseDB } from '@/services/firebaseService';
import { mobbexDevConnectService } from '@/services/mobbexDevConnectService';

interface MobbexDevConnectFormProps {
  onClose: () => void;
}

export default function MobbexDevConnectForm({ onClose }: MobbexDevConnectFormProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [cuit, setCuit] = useState('');
  const [isConnected, setIsConnected] = useState(false);

  const loadCredentials = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const userCredentials = await firebaseDB.userMobbexCredentials.get(user.id);
      if (userCredentials && userCredentials.cuit) {
        setCuit(userCredentials.cuit);
        setIsConnected(true);
      }
    } catch (error) {
      console.error('Error loading credentials:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadCredentials();
  }, [loadCredentials]);

  const handleSaveCuit = async () => {
    if (!user) return;

    // Validate CUIT format (11 numeric digits)
    const cuitRegex = /^\d{11}$/;
    if (!cuitRegex.test(cuit)) {
      setMessage({ 
        type: 'error', 
        text: 'El CUIT debe contener exactamente 11 dígitos numéricos' 
      });
      return;
    }

    try {
      console.log('🎯 [MobbexDevConnectForm] Saving CUIT for user:', user.id, 'CUIT:', cuit);
      setIsSaving(true);
      setMessage(null);

      // Save CUIT to user document
      await firebaseDB.userMobbexCredentials.save(user.id, {
        cuit: cuit,
        isConnected: true,
        connectedAt: new Date()
      });

      setIsConnected(true);
      setMessage({ 
        type: 'success', 
        text: 'CUIT guardado exitosamente. Ahora podrás recibir pagos cuando apruebes reservas.' 
      });
    } catch (error) {
      console.error('❌ [MobbexDevConnectForm] Error saving CUIT:', error);
      setMessage({ 
        type: 'error', 
        text: 'Error al guardar el CUIT. Por favor, intenta nuevamente.' 
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDisconnect = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      await firebaseDB.userMobbexCredentials.disconnect(user.id);
      setCuit('');
      setIsConnected(false);
      setMessage({ 
        type: 'success', 
        text: 'CUIT eliminado exitosamente' 
      });
    } catch (error) {
      console.error('Error disconnecting from Mobbex:', error);
      setMessage({ 
        type: 'error', 
        text: 'Error al eliminar el CUIT' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="glass rounded-xl p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-brown mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading Mobbex connection...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="glass rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Mobbex Dev Connect
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Connect your Mobbex account
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* CUIT Configuration */}
        {isConnected ? (
          <div className="space-y-6">
            {/* Connected Status */}
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center space-x-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="text-sm font-medium text-green-800 dark:text-green-300">
                  CUIT Configurado
                </span>
              </div>
              <p className="text-xs text-green-700 dark:text-green-400">
                Tu CUIT está configurado y podrás recibir pagos cuando apruebes reservas.
              </p>
            </div>

            {/* CUIT Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Información del CUIT
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Building2 className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {cuit}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      CUIT Registrado
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Disconnect Button */}
            <button
              onClick={handleDisconnect}
              disabled={isLoading}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2 text-red-600 border border-red-300 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Unlink className="w-4 h-4" />
              )}
              <span>Eliminar CUIT</span>
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Not Connected Status */}
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <div className="flex items-center space-x-2 mb-2">
                <AlertCircle className="w-5 h-5 text-yellow-500" />
                <span className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                  CUIT No Configurado
                </span>
              </div>
              <p className="text-xs text-yellow-700 dark:text-yellow-400">
                Configura tu CUIT para recibir pagos cuando apruebes reservas.
              </p>
            </div>

            {/* CUIT Input */}
            <div className="space-y-4">
              <div>
                <label htmlFor="cuit" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  CUIT (11 dígitos)
                </label>
                <input
                  type="text"
                  id="cuit"
                  value={cuit}
                  onChange={(e) => {
                    // Only allow numeric input and limit to 11 digits
                    const value = e.target.value.replace(/\D/g, '').slice(0, 11);
                    setCuit(value);
                  }}
                  placeholder="12345678901"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-800 dark:text-white"
                  maxLength={11}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Ingresa tu CUIT de 11 dígitos para recibir pagos
                </p>
              </div>

              {/* Save Button */}
              <button
                onClick={handleSaveCuit}
                disabled={isSaving || cuit.length !== 11}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-lg hover:from-emerald-600 hover:to-emerald-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <CheckCircle className="w-5 h-5" />
                )}
                <span>
                  {isSaving ? 'Guardando...' : 'Guardar CUIT'}
                </span>
              </button>
            </div>

            {/* Info Box */}
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">
                Cómo funciona
              </h4>
              <ul className="text-xs text-blue-700 dark:text-blue-400 space-y-1">
                <li>• Ingresa tu CUIT de 11 dígitos</li>
                <li>• Cuando apruebes una reserva, se creará un pago</li>
                <li>• El pago se dividirá entre la plataforma y tu cuenta</li>
                <li>• Recibirás tu parte del pago automáticamente</li>
              </ul>
            </div>
          </div>
        )}

        {/* Message */}
        {message && (
          <div className={`flex items-center space-x-2 p-3 rounded-lg ${
            message.type === 'success' 
              ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-800' 
              : message.type === 'error'
              ? 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800'
              : 'bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle className="w-4 h-4" />
            ) : message.type === 'error' ? (
              <AlertCircle className="w-4 h-4" />
            ) : (
              <AlertCircle className="w-4 h-4" />
            )}
            <span className="text-sm">{message.text}</span>
          </div>
        )}

        {/* Close Button */}
        <div className="flex justify-end pt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
}
