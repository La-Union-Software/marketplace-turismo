'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, Check, Star, Crown, Zap } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { firebaseDB } from '@/services/firebaseService';
import { SubscriptionPlan } from '@/types';
import { useRouter } from 'next/navigation';

export default function SuscribirsePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showPaymentForm, setShowPaymentForm] = useState(false);

  useEffect(() => {
    // Redirect if user is already a publisher or superadmin
    if (user) {
      const hasPublisherRole = user.roles?.some(role => 
        (role.roleName === 'publisher' || role.roleName === 'superadmin') && role.isActive
      );
      if (hasPublisherRole) {
        router.push('/dashboard');
        return;
      }
    }

    loadPlans();
  }, [user, router]);

  const loadPlans = async () => {
    try {
      const availablePlans = await firebaseDB.plans.getAll();
      // Only show active and visible plans
      const visiblePlans = availablePlans.filter(plan => plan.isActive && plan.isVisible);
      setPlans(visiblePlans);
    } catch (error) {
      console.error('Error loading plans:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlanSelect = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    setShowPaymentForm(true);
  };

  const handleBackToPlans = () => {
    setSelectedPlan(null);
    setShowPaymentForm(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-blue-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Cargando planes...</p>
        </div>
      </div>
    );
  }

  if (showPaymentForm && selectedPlan) {
    return (
      <PaymentForm 
        plan={selectedPlan} 
        onBack={handleBackToPlans}
        onSuccess={() => router.push('/dashboard')}
      />
    );
  }

  return (
    <div className="min-h-screen bg-blue-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            Conviértete en <span className="gradient-text">Editor</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Accede a todas las herramientas necesarias para publicar y gestionar tus servicios turísticos. 
            Elige el plan que mejor se adapte a tus necesidades.
          </p>
        </motion.div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="glass rounded-2xl p-8 hover:transform hover:scale-105 transition-all duration-300 cursor-pointer"
              onClick={() => handlePlanSelect(plan)}
            >
              {/* Plan Header */}
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  {plan.name.toLowerCase().includes('basic') && <Zap className="w-8 h-8 text-white" />}
                  {plan.name.toLowerCase().includes('premium') && <Star className="w-8 h-8 text-white" />}
                  {plan.name.toLowerCase().includes('enterprise') && <Crown className="w-8 h-8 text-white" />}
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {plan.name}
                </h3>
                <div className="text-4xl font-bold text-primary mb-1">
                  ${plan.price}
                  <span className="text-lg text-gray-500 dark:text-gray-400 font-normal">
                    /{plan.billingCycle === 'monthly' ? 'mes' : plan.billingCycle === 'yearly' ? 'año' : plan.billingCycle}
                  </span>
                </div>
                <p className="text-gray-600 dark:text-gray-300">
                  {plan.description}
                </p>
              </div>

              {/* Features */}
              <div className="space-y-4 mb-8">
                <div className="flex items-center space-x-3">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300">
                    Hasta {plan.maxPosts} publicaciones
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300">
                    Hasta {plan.maxBookings} reservas
                  </span>
                </div>
                {plan.features.map((feature, featureIndex) => (
                  <div key={featureIndex} className="flex items-center space-x-3">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300">
                      {feature}
                    </span>
                  </div>
                ))}
              </div>

              {/* CTA Button */}
              <button className="w-full bg-primary text-white py-3 px-6 rounded-lg font-semibold hover:bg-secondary transition-all duration-300 transform hover:scale-105">
                Seleccionar Plan
              </button>
            </motion.div>
          ))}
        </div>

        {/* Additional Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="text-center mt-16"
        >
          <div className="glass rounded-xl p-8 max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              ¿Por qué suscribirse?
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CreditCard className="w-6 h-6 text-blue-600" />
                </div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                Publica tus servicios turisticos
                </h4>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  Crea y gestiona múltiples publicaciones de servicios turísticos
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Star className="w-6 h-6 text-green-600" />
                </div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Herramientas avanzadas
                </h4>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  Accede a analytics, gestión de reservas y más funcionalidades
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Zap className="w-6 h-6 text-purple-600" />
                </div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Soporte prioritario
                </h4>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  Recibe ayuda rápida y personalizada para tu negocio
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// Payment Form Component using MercadoPago Checkout Pro
interface PaymentFormProps {
  plan: SubscriptionPlan;
  onBack: () => void;
  onSuccess: () => void;
}

function PaymentForm({ plan, onBack, onSuccess }: PaymentFormProps) {
  const { user } = useAuth();
  const [isCreatingPreference, setIsCreatingPreference] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePayment = async () => {
    if (!user) {
      setError('Debes estar logueado para realizar el pago');
      return;
    }

    setIsCreatingPreference(true);
    setError(null);

    try {
      console.log('🛒 [Subscription Payment] Creating preference for plan:', plan.name);

      const response = await fetch('/api/mercadopago/subscription-preference', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId: plan.id,
          userId: user.id,
          returnUrl: `${window.location.origin}/payment/complete`
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create payment preference');
      }

      const result = await response.json();
      console.log('✅ [Subscription Payment] Preference created:', result.preferenceId);

      // Redirect to MercadoPago Checkout Pro
      if (result.initPoint) {
        window.location.href = result.initPoint;
      } else {
        throw new Error('No payment URL received');
      }

    } catch (error) {
      console.error('❌ [Subscription Payment] Error:', error);
      setError(error instanceof Error ? error.message : 'Error al procesar el pago');
    } finally {
      setIsCreatingPreference(false);
    }
  };

  return (
    <div className="min-h-screen bg-blue-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="glass rounded-2xl p-8 w-full max-w-md"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <CreditCard className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Confirmar Suscripción
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Plan: <span className="font-semibold">{plan.name}</span>
          </p>
          <p className="text-lg font-bold text-primary">
            ${plan.price}/{plan.billingCycle === 'monthly' ? 'mes' : plan.billingCycle === 'yearly' ? 'año' : plan.billingCycle}
          </p>
        </div>

        {/* Plan Details */}
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
            Incluye:
          </h3>
          <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
            <li>• Hasta {plan.maxPosts} publicaciones</li>
            <li>• Hasta {plan.maxBookings} reservas</li>
            {plan.features.slice(0, 3).map((feature, index) => (
              <li key={index}>• {feature}</li>
            ))}
          </ul>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Payment Button */}
        <div className="space-y-4">
          <button
            onClick={handlePayment}
            disabled={isCreatingPreference}
            className="w-full px-6 py-3 bg-primary text-white rounded-lg hover:bg-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {isCreatingPreference ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Preparando pago...</span>
              </>
            ) : (
              <>
                <CreditCard className="w-4 h-4" />
                <span>Pagar con MercadoPago</span>
              </>
            )}
          </button>

          <button
            onClick={onBack}
            className="w-full px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Volver a Planes
          </button>
        </div>

        {/* Security Notice */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            🔒 Pago seguro procesado por MercadoPago
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Aceptamos todas las tarjetas y métodos de pago
          </p>
        </div>
      </motion.div>
    </div>
  );
}
