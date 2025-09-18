'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, Save, X, Plus, Minus } from 'lucide-react';
import { firebaseDB } from '@/services/firebaseService';
import { mobbexService } from '@/services/mobbexService';
import { SubscriptionPlan } from '@/types';
import { useAuth } from '@/lib/auth';

interface EditPlanFormProps {
  plan: SubscriptionPlan;
  onClose: () => void;
  onPlanUpdated: () => void;
}

export default function EditPlanForm({ plan, onClose, onPlanUpdated }: EditPlanFormProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: plan.name,
    description: plan.description,
    price: plan.price,
    currency: plan.currency || 'ARS',
    billingCycle: plan.billingCycle,
    features: plan.features.length > 0 ? plan.features : [''],
    maxPosts: plan.maxPosts,
    maxBookings: plan.maxBookings,
    isActive: plan.isActive,
    isVisible: plan.isVisible !== undefined ? plan.isVisible : true
  });
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Store original plan data for rollback
    const originalPlanData = {
      name: plan.name,
      description: plan.description,
      price: plan.price,
      currency: plan.currency,
      billingCycle: plan.billingCycle,
      features: plan.features,
      maxPosts: plan.maxPosts,
      maxBookings: plan.maxBookings,
      isActive: plan.isActive,
      isVisible: plan.isVisible !== undefined ? plan.isVisible : true
    };

    try {
      setIsSaving(true);
      setMessage(null);

      // Filter out empty features
      const cleanFeatures = formData.features.filter(feature => feature.trim() !== '');
      
      const planData = {
        ...formData,
        features: cleanFeatures
      };

      // If plan has Mobbex subscription ID, update Mobbex first
      if (plan.mobbexSubscriptionId) {
        try {
          console.log('Updating Mobbex subscription first...');
          await mobbexService.initialize();
          
          if (mobbexService.isServiceConfigured()) {
            // Update subscription details
            await mobbexService.updateSubscription(plan.mobbexSubscriptionId, {
              name: formData.name,
              description: formData.description,
              total: formData.price,
              currency: formData.currency
            });
            console.log('✅ Mobbex subscription details updated successfully');

            // Handle activation/deactivation sync
            if (formData.isActive !== plan.isActive) {
              if (formData.isActive) {
                // Activating - activate in Mobbex
                await mobbexService.activateSubscription(plan.mobbexSubscriptionId);
                console.log('✅ Mobbex subscription activated');
              } else {
                // Deactivating - suspend in Mobbex
                await mobbexService.deactivateSubscription(plan.mobbexSubscriptionId);
                console.log('✅ Mobbex subscription suspended');
              }
            }
          } else {
            throw new Error('Mobbex service not configured');
          }
        } catch (mobbexError) {
          console.error('❌ Failed to update Mobbex subscription:', mobbexError);
          setMessage({ 
            type: 'error', 
            text: 'Failed to update Mobbex subscription. Plan was not updated to maintain data consistency. Please check your Mobbex credentials and try again.' 
          });
          return;
        }
      }

      // Only update Firebase if Mobbex update succeeded (or if no Mobbex subscription)
      try {
        await firebaseDB.plans.update(plan.id, planData, user.id);
        console.log('✅ Local plan updated successfully');
      } catch (firebaseError) {
        console.error('❌ Failed to update local plan:', firebaseError);
        setMessage({ 
          type: 'error', 
          text: 'Failed to update local plan. Please try again.' 
        });
        return;
      }

      setMessage({ 
        type: 'success', 
        text: `Plan updated successfully${plan.mobbexSubscriptionId ? ' and synced with Mobbex' : ''}!` 
      });
      
      // Reload plans and close form
      setTimeout(() => {
        onPlanUpdated();
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Error updating plan:', error);
      setMessage({ type: 'error', text: 'Error updating plan. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addFeature = () => {
    setFormData(prev => ({ ...prev, features: [...prev.features, ''] }));
  };

  const removeFeature = (index: number) => {
    setFormData(prev => ({ 
      ...prev, 
      features: prev.features.filter((_, i) => i !== index) 
    }));
  };

  const updateFeature = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.map((feature, i) => i === index ? value : feature)
    }));
  };

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
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Edit Plan
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Update subscription plan details
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Plan Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-brown focus:border-transparent"
                placeholder="e.g., Basic Plan, Premium Plan"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Price *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
                  className="w-full pl-8 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-brown focus:border-transparent"
                  placeholder="0.00"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Currency *
              </label>
              <select
                value={formData.currency}
                onChange={(e) => handleInputChange('currency', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-brown focus:border-transparent"
                required
              >
                <option value="ARS">ARS (Argentine Peso)</option>
                <option value="USD">USD (US Dollar)</option>
                <option value="EUR">EUR (Euro)</option>
                <option value="BRL">BRL (Brazilian Real)</option>
                <option value="CLP">CLP (Chilean Peso)</option>
                <option value="COP">COP (Colombian Peso)</option>
                <option value="MXN">MXN (Mexican Peso)</option>
                <option value="PEN">PEN (Peruvian Sol)</option>
                <option value="UYU">UYU (Uruguayan Peso)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-brown focus:border-transparent"
              placeholder="Describe what this plan offers..."
              required
            />
          </div>

          {/* Billing and Limits */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Billing Cycle *
              </label>
              <select
                value={formData.billingCycle}
                onChange={(e) => handleInputChange('billingCycle', e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-brown focus:border-transparent"
                required
              >
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
                <option value="weekly">Weekly</option>
                <option value="daily">Daily</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Max Posts *
              </label>
              <input
                type="number"
                min="1"
                value={formData.maxPosts}
                onChange={(e) => handleInputChange('maxPosts', parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-brown focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Max Bookings *
              </label>
              <input
                type="number"
                min="1"
                value={formData.maxBookings}
                onChange={(e) => handleInputChange('maxBookings', parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-brown focus:border-transparent"
                required
              />
            </div>
          </div>



          {/* Features */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Features
            </label>
            <div className="space-y-2">
              {formData.features.map((feature, index) => (
                <div key={index} className="flex space-x-2">
                  <input
                    type="text"
                    value={feature}
                    onChange={(e) => updateFeature(index, e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-brown focus:border-transparent"
                    placeholder={`Feature ${index + 1}`}
                  />
                  {formData.features.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeFeature(index)}
                      className="px-3 py-2 text-red-600 border border-red-300 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addFeature}
                className="flex items-center space-x-2 px-3 py-2 text-primary-brown border border-primary-brown rounded-lg hover:bg-primary-brown hover:text-white transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add Feature</span>
              </button>
            </div>
          </div>

          {/* Visibility and Active Toggles */}
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="isVisible"
                checked={formData.isVisible}
                onChange={(e) => {
                  const isVisible = e.target.checked;
                  handleInputChange('isVisible', isVisible);
                  // If plan is visible, it must also be active
                  if (isVisible && !formData.isActive) {
                    handleInputChange('isActive', true);
                  }
                }}
                className="w-4 h-4 text-primary-brown bg-gray-100 border-gray-300 rounded focus:ring-primary-brown focus:ring-2"
              />
              <label htmlFor="isVisible" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Plan is showing to users
              </label>
            </div>
            
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => {
                  const isActive = e.target.checked;
                  handleInputChange('isActive', isActive);
                  // If plan is not active, it cannot be visible
                  if (!isActive && formData.isVisible) {
                    handleInputChange('isVisible', false);
                  }
                }}
                className="w-4 h-4 text-primary-brown bg-gray-100 border-gray-300 rounded focus:ring-primary-brown focus:ring-2"
              />
              <label htmlFor="isActive" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Plan is active and available for users
              </label>
            </div>
          </div>

          {/* Message */}
          {message && (
            <div className={`flex items-center space-x-2 p-3 rounded-lg ${
              message.type === 'success' 
                ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-800' 
                : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800'
            }`}>
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
                  <span>Updating...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Update Plan</span>
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
