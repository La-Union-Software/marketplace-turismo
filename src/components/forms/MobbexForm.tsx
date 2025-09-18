'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, Save, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';
import { firebaseDB } from '@/services/firebaseService';
import { MobbexCredentials } from '@/types';
import { useAuth } from '@/lib/auth';

interface MobbexFormProps {
  onClose: () => void;
}

export default function MobbexForm({ onClose }: MobbexFormProps) {
  const { user } = useAuth();
  const [credentials, setCredentials] = useState<MobbexCredentials | null>(null);
  const [formData, setFormData] = useState({
    apiKey: '',
    accessToken: '',
    auditKey: '',
    isActive: false
  });
  const [showAccessToken, setShowAccessToken] = useState(false);
  const [showAuditKey, setShowAuditKey] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadCredentials();
  }, []);

  const loadCredentials = async () => {
    try {
      setIsLoading(true);
      const existingCredentials = await firebaseDB.systemSettings.getMobbexCredentials();
      if (existingCredentials) {
        setCredentials(existingCredentials);
        setFormData({
          apiKey: existingCredentials.apiKey,
          accessToken: existingCredentials.accessToken,
          auditKey: existingCredentials.auditKey || '',
          isActive: existingCredentials.isActive
        });
      }
    } catch (error) {
      console.error('Error loading credentials:', error);
      setMessage({ type: 'error', text: 'Error loading existing credentials' });
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

      if (credentials) {
        // Update existing credentials
        await firebaseDB.systemSettings.updateMobbexCredentials(formData, user.id);
      } else {
        // Create new credentials
        await firebaseDB.systemSettings.saveMobbexCredentials({
          ...formData,
          updatedBy: user.id
        }, user.id);
      }

      setMessage({ type: 'success', text: 'Credentials saved successfully!' });
      
      // Reload credentials to get updated data
      await loadCredentials();
      
      // Close form after a short delay
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Error saving credentials:', error);
      setMessage({ type: 'error', text: 'Error saving credentials. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="glass rounded-xl p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-brown mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading credentials...</p>
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
                Mobbex
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Payment Gateway Configuration
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* API Key Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              API Key
            </label>
            <div className="relative">
              <input
                type="text"
                value={formData.apiKey}
                onChange={(e) => handleInputChange('apiKey', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-brown focus:border-transparent"
                placeholder="Enter your Mobbex API Key"
                required
              />
            </div>
          </div>

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
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-brown focus:border-transparent"
                placeholder="Enter your Mobbex Access Token"
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

          {/* Audit Key Field (Optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Audit Key <span className="text-gray-500">(Optional)</span>
            </label>
            <div className="relative">
              <input
                type={showAuditKey ? 'text' : 'password'}
                value={formData.auditKey}
                onChange={(e) => handleInputChange('auditKey', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-brown focus:border-transparent"
                placeholder="Enter your Mobbex Audit Key (for loyalty features)"
              />
              <button
                type="button"
                onClick={() => setShowAuditKey(!showAuditKey)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                {showAuditKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Required only for loyalty and advanced features
            </p>
          </div>

          {/* Active Toggle */}
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => handleInputChange('isActive', e.target.checked)}
              className="w-4 h-4 text-primary-brown bg-gray-100 border-gray-300 rounded focus:ring-primary-brown focus:ring-2"
            />
            <label htmlFor="isActive" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Enable Mobbex payments
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
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 px-4 py-2 bg-primary-brown text-white rounded-lg hover:bg-secondary-brown transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Credentials</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Info Box */}
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">
            Important Information
          </h4>
          <ul className="text-xs text-blue-700 dark:text-blue-400 space-y-1">
            <li>• Your API Key is safe to share and can be displayed publicly</li>
            <li>• Keep your Access Token secure and never share it</li>
            <li>• Audit Key is optional and only needed for loyalty features</li>
            <li>• Use test credentials for development and production credentials for live payments</li>
            <li>• Credentials are encrypted and stored securely in our database</li>
          </ul>
        </div>
      </motion.div>
    </div>
  );
}
