'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, Save, Eye, EyeOff, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';
import { firebaseDB } from '@/services/firebaseService';
import { useAuth } from '@/lib/auth';

interface MercadoPagoConnectFormProps {
  onClose: () => void;
}

interface MercadoPagoAccount {
  id: string;
  accessToken: string;
  publicKey: string;
  userId: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  updatedBy: string;
}

export default function MercadoPagoConnectForm({ onClose }: MercadoPagoConnectFormProps) {
  const { user } = useAuth();
  const [account, setAccount] = useState<MercadoPagoAccount | null>(null);
  const [formData, setFormData] = useState({
    accessToken: '',
    publicKey: '',
    isActive: false
  });
  const [showAccessToken, setShowAccessToken] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadAccount();
  }, []);

  const loadAccount = async () => {
    try {
      setIsLoading(true);
      const existingAccount = await firebaseDB.systemSettings.getMercadoPagoAccount();
      if (existingAccount) {
        setAccount(existingAccount);
        setFormData({
          accessToken: existingAccount.accessToken,
          publicKey: existingAccount.publicKey,
          isActive: existingAccount.isActive
        });
      }
    } catch (error) {
      console.error('Error loading account:', error);
      setMessage({ type: 'error', text: 'Error loading existing account' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setIsSaving(true);
      setMessage(null);

      if (account) {
        // Update existing account
        await firebaseDB.systemSettings.updateMercadoPagoAccount(formData, user.id);
      } else {
        // Create new account
        await firebaseDB.systemSettings.saveMercadoPagoAccount({
          ...formData,
          userId: user.id,
          updatedBy: user.id
        }, user.id);
      }

      setMessage({ type: 'success', text: 'Account connected successfully!' });
      
      // Reload account to get updated data
      await loadAccount();
      
      // Close form after a short delay
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Error saving account:', error);
      setMessage({ type: 'error', text: 'Error connecting account. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleConnect = async () => {
    if (!user) return;

    try {
      setIsConnecting(true);
      setMessage(null);

      // In a real implementation, this would redirect to MercadoPago OAuth
      // For now, we'll show a message about the OAuth flow
      setMessage({ 
        type: 'success', 
        text: 'OAuth flow would be implemented here. This would redirect to MercadoPago for account authorization.' 
      });

    } catch (error) {
      console.error('Error connecting account:', error);
      setMessage({ type: 'error', text: 'Error connecting account. Please try again.' });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="glass rounded-xl p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading account...</p>
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
        className="glass rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center">
              <Link className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Conectar con MercadoPago
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Gestiona planes de suscripción de la plataforma
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

        {/* Connection Status */}
        {account && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
              <div>
                <p className="text-sm font-medium text-green-800 dark:text-green-300">
                  Cuenta conectada exitosamente
                </p>
                <p className="text-xs text-green-700 dark:text-green-400">
                  Conectada el {new Date(account.createdAt).toLocaleDateString('es-ES')}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* OAuth Connection Button */}
        <div className="mb-6">
          <button
            onClick={handleConnect}
            disabled={isConnecting}
            className="w-full flex items-center justify-center space-x-2 px-6 py-4 bg-secondary text-white rounded-lg hover:bg-accent transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-lg font-semibold"
          >
            {isConnecting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Conectando...</span>
              </>
            ) : (
              <>
                <ExternalLink className="w-5 h-5" />
                <span>Conectar con MercadoPago OAuth</span>
              </>
            )}
          </button>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
            Conecta tu cuenta principal de MercadoPago para gestionar planes de suscripción
          </p>
        </div>

        {/* Manual Configuration Form */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Configuración Manual (Alternativa)
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Access Token Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Access Token
              </label>
              <div className="relative">
                <input
                  type={showAccessToken ? 'text' : 'password'}
                  value={formData.accessToken}
                  onChange={(e) => handleInputChange('accessToken', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Enter your MercadoPago Access Token"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowAccessToken(!showAccessToken)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showAccessToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Public Key Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Public Key
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.publicKey}
                  onChange={(e) => handleInputChange('publicKey', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Enter your MercadoPago Public Key"
                  required
                />
              </div>
            </div>

            {/* Active Toggle */}
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => handleInputChange('isActive', e.target.checked)}
                className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary focus:ring-2"
              />
              <label htmlFor="isActive" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Activar cuenta principal
              </label>
            </div>

            {/* Message */}
            {message && (
              <div className={`flex items-center space-x-2 p-3 rounded-lg ${
                message.type === 'success' 
                  ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-800' 
                  : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800'
              }`}>
                {message.type === 'success' ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <AlertCircle className="w-4 h-4" />
                )}
                <span className="text-sm">{message.text}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Guardando...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Guardar Configuración</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Info Box */}
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">
            Información Importante
          </h4>
          <ul className="text-xs text-blue-700 dark:text-blue-400 space-y-1">
            <li>• Esta cuenta se usará para gestionar todos los planes de suscripción de la plataforma</li>
            <li>• Los planes de suscripción se sincronizarán automáticamente con MercadoPago</li>
            <li>• Mantén tus credenciales seguras y nunca las compartas</li>
            <li>• Usa credenciales de producción para el entorno en vivo</li>
          </ul>
        </div>
      </motion.div>
    </div>
  );
}
