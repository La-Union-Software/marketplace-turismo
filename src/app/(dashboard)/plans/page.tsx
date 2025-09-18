'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  CreditCard, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff, 
  CheckCircle, 
  XCircle,
  Calendar,
  Users,
  FileText,
  Star,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '@/lib/auth';

import { firebaseDB } from '@/services/firebaseService';
import { mobbexService } from '@/services/mobbexService';
import { SubscriptionPlan } from '@/types';
import CreatePlanForm from '@/components/forms/CreatePlanForm';
import EditPlanForm from '@/components/forms/EditPlanForm';

export default function PlansPage() {
  const { user } = useAuth();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadPlans = useCallback(async () => {
    try {
      console.log('Loading plans...');
      setIsLoading(true);
      
      // Test if the service is accessible
      console.log('Firebase service accessible:', !!firebaseDB.plans);
      console.log('getAll method accessible:', !!firebaseDB.plans.getAll);
      
      const allPlans = await firebaseDB.plans.getAll();
      console.log('Plans loaded:', allPlans);
      setPlans(allPlans);
    } catch (error) {
      console.error('Error loading plans:', error);
      setMessage({ type: 'error', text: `Error loading subscription plans: ${error instanceof Error ? error.message : 'Unknown error'}` });
    } finally {
      setIsLoading(false);
    }
  }, []);



  useEffect(() => {
    console.log('Plans page useEffect triggered');
    console.log('User roles:', user?.roles);
    
    if (!user) {
      console.log('No user found, keeping loading state');
      return;
    }
    
    const isSuperadmin = user.roles?.some(role => role.roleName === 'superadmin' && role.isActive) || false;
    console.log('Has superadmin role:', isSuperadmin);
    
    if (isSuperadmin) {
      loadPlans();
    } else {
      console.log('User does not have superadmin role');
      setIsLoading(false);
    }
  }, [user, loadPlans]);

  const handleToggleActive = async (planId: string, currentStatus: boolean) => {
    if (!user) return;
    
    try {
      // Find the plan to get its Mobbex subscription ID
      const plan = plans.find(p => p.id === planId);
      if (!plan) {
        setMessage({ type: 'error', text: 'Plan not found' });
        return;
      }

      // Initialize Mobbex service
      await mobbexService.initialize();

      // If plan has Mobbex subscription ID, sync with Mobbex
      if (plan.mobbexSubscriptionId && mobbexService.isServiceConfigured()) {
        try {
          if (currentStatus) {
            // Deactivating - suspend in Mobbex
            await mobbexService.deactivateSubscription(plan.mobbexSubscriptionId);
            console.log('✅ Mobbex subscription suspended');
          } else {
            // Activating - activate in Mobbex
            await mobbexService.activateSubscription(plan.mobbexSubscriptionId);
            console.log('✅ Mobbex subscription activated');
          }
        } catch (mobbexError) {
          console.error('❌ Failed to sync with Mobbex:', mobbexError);
          setMessage({ 
            type: 'error', 
            text: `Failed to sync with Mobbex: ${mobbexError instanceof Error ? mobbexError.message : 'Unknown error'}. Plan status was not changed.` 
          });
          return;
        }
      }

      // Update local plan status
      await firebaseDB.plans.toggleActive(planId, !currentStatus, user.id);
      setMessage({ 
        type: 'success', 
        text: `Plan ${currentStatus ? 'deactivated' : 'activated'} successfully${plan.mobbexSubscriptionId ? ' and synced with Mobbex' : ''}` 
      });
      await loadPlans();
    } catch (error) {
      console.error('Error toggling plan status:', error);
      setMessage({ type: 'error', text: 'Error updating plan status' });
    }
  };

  const handleDeletePlan = async (planId: string) => {
    if (!confirm('Are you sure you want to delete this plan? This action cannot be undone.')) {
      return;
    }

    try {
      await firebaseDB.plans.delete(planId);
      setMessage({ type: 'success', text: 'Plan deleted successfully' });
      await loadPlans();
    } catch (error) {
      console.error('Error deleting plan:', error);
      setMessage({ type: 'error', text: 'Error deleting plan' });
    }
  };

  const getBillingCycleText = (cycle: string) => {
    switch (cycle) {
      case 'monthly': return 'Monthly';
      case 'yearly': return 'Yearly';
      case 'weekly': return 'Weekly';
      case 'daily': return 'Daily';
      default: return cycle;
    }
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive 
      ? 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800'
      : 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-300 dark:border-gray-800';
  };

  const isSuperadmin = user?.roles?.some(role => role.roleName === 'superadmin' && role.isActive) || false;
  
  if (user && !isSuperadmin) {
    return (
      <div className="w-full max-w-none">
        <div className="text-center py-12">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            You don't have permission to access this page.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="w-full max-w-none">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-brown mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading subscription plans...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-none">
      <div className="space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Subscription Plans
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Manage subscription plans and pricing for your users
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <button
              onClick={() => setShowCreateForm(true)}
              className="px-6 py-3 bg-gradient-to-r from-primary-brown to-primary-green text-white rounded-lg hover:from-secondary-brown hover:to-secondary-green transition-all duration-300 flex items-center space-x-2 shadow-lg"
            >
              <Plus className="w-5 h-5" />
              <span>Create Plan</span>
            </button>
          </div>
        </motion.div>

        {/* Message */}
        {message && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex items-center space-x-2 p-4 rounded-lg border ${
              message.type === 'success' 
                ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800' 
                : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <XCircle className="w-5 h-5" />
            )}
            <span>{message.text}</span>
            <button
              onClick={() => setMessage(null)}
              className="ml-auto text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              ✕
            </button>
          </motion.div>
        )}



        {/* Plans Grid */}
        {!isLoading && plans.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-center py-12"
          >
            <CreditCard className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No Plans Created Yet
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Create your first subscription plan to start monetizing your platform
            </p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="px-6 py-3 bg-gradient-to-r from-primary-brown to-primary-green text-white rounded-lg hover:from-secondary-brown hover:to-secondary-green transition-all duration-300 flex items-center space-x-2 mx-auto"
            >
              <Plus className="w-5 h-5" />
              <span>Create First Plan</span>
            </button>
          </motion.div>
        ) : !isLoading && plans.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans.map((plan, index) => (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="glass rounded-xl p-6 hover:transform hover:scale-105 transition-all duration-300"
              >
                {/* Plan Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
                      {plan.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {plan.description}
                    </p>
                  </div>
                  <div className="flex flex-col space-y-2">
                    <span className={`px-3 py-1 text-xs font-medium rounded-full border ${getStatusColor(plan.isActive)}`}>
                      {plan.isActive ? 'Active' : 'Inactive'}
                    </span>
                    {plan.mobbexSubscriptionId && (
                      <div className="flex items-center space-x-1 text-xs text-emerald-600 dark:text-emerald-400">
                        <ExternalLink className="w-3 h-3" />
                        <span>Mobbex</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Price */}
                <div className="mb-6">
                  <div className="flex items-baseline">
                    <span className="text-3xl font-bold text-gray-900 dark:text-white">
                      ${plan.price}
                    </span>
                    <span className="text-gray-600 dark:text-gray-400 ml-2">
                      {plan.currency} /{getBillingCycleText(plan.billingCycle)}
                    </span>
                  </div>
                </div>

                {/* Features */}
                <div className="space-y-3 mb-6">
                  <div className="flex items-center space-x-3">
                    <FileText className="w-4 h-4 text-primary-brown" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Up to {plan.maxPosts} posts
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-4 h-4 text-primary-brown" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Up to {plan.maxBookings} bookings
                    </span>
                  </div>
                  {plan.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center space-x-3">
                      <Star className="w-4 h-4 text-primary-brown" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex space-x-2">
                  <button
                    onClick={() => setEditingPlan(plan)}
                    className="flex-1 px-3 py-2 text-sm text-primary-brown border border-primary-brown rounded-lg hover:bg-primary-brown hover:text-white transition-colors flex items-center justify-center space-x-1"
                  >
                    <Edit className="w-4 h-4" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => handleToggleActive(plan.id, plan.isActive)}
                    className={`px-3 py-2 text-sm rounded-lg transition-colors flex items-center justify-center space-x-1 ${
                      plan.isActive
                        ? 'text-red-600 border border-red-300 hover:bg-red-50 dark:hover:bg-red-900/20'
                        : 'text-green-600 border border-green-300 hover:bg-green-50 dark:hover:bg-green-900/20'
                    }`}
                  >
                    {plan.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    <span>{plan.isActive ? 'Deactivate' : 'Activate'}</span>
                  </button>
                  <button
                    onClick={() => handleDeletePlan(plan.id)}
                    className="px-3 py-2 text-sm text-red-600 border border-red-300 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        ) : null}
      </div>

      {/* Create Plan Form Modal */}
      {showCreateForm && (
        <CreatePlanForm 
          onClose={() => setShowCreateForm(false)}
          onPlanCreated={loadPlans}
        />
      )}

      {/* Edit Plan Form Modal */}
      {editingPlan && (
        <EditPlanForm 
          plan={editingPlan}
          onClose={() => setEditingPlan(null)}
          onPlanUpdated={loadPlans}
        />
      )}
    </div>
  );
}
