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

// Payment Form Component
interface PaymentFormProps {
  plan: SubscriptionPlan;
  onBack: () => void;
  onSuccess: () => void;
}

function PaymentForm({ plan, onBack, onSuccess }: PaymentFormProps) {
  const { user, assignRole } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentData, setPaymentData] = useState({
    cardNumber: '',
    cardHolder: '',
    expiryDate: '',
    cvv: '',
    email: user?.email || ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsProcessing(true);
    
    try {
      // Mock payment process - simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock successful payment
      // In real implementation, this would call Mercado Pago API
      
      // Assign publisher role to user using auth context
      await assignRole(user.id, 'publisher');
      
      // Create user subscription record
      // This would be implemented in the real version
      
      // Force a page reload to refresh the auth context
      // This ensures the user's new role is loaded
      // window.location.reload();
      
      onSuccess();
    } catch (error) {
      console.error('Payment error:', error);
      alert('Error en el pago. Por favor, intenta de nuevo.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleInputChange = (field: keyof typeof paymentData, value: string) => {
    setPaymentData(prev => ({ ...prev, [field]: value }));
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
            Información de Pago
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Plan: <span className="font-semibold">{plan.name}</span>
          </p>
          <p className="text-lg font-bold text-primary">
            ${plan.price}/{plan.billingCycle === 'monthly' ? 'mes' : plan.billingCycle === 'yearly' ? 'año' : plan.billingCycle}
          </p>
        </div>

        {/* Payment Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Número de Tarjeta
            </label>
            <input
              type="text"
              value={paymentData.cardNumber}
              onChange={(e) => handleInputChange('cardNumber', e.target.value)}
              placeholder="1234 5678 9012 3456"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Titular de la Tarjeta
            </label>
            <input
              type="text"
              value={paymentData.cardHolder}
              onChange={(e) => handleInputChange('cardHolder', e.target.value)}
              placeholder="Nombre Apellido"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Fecha de Vencimiento
              </label>
              <input
                type="text"
                value={paymentData.expiryDate}
                onChange={(e) => handleInputChange('expiryDate', e.target.value)}
                placeholder="MM/AA"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                CVV
              </label>
              <input
                type="text"
                value={paymentData.cvv}
                onChange={(e) => handleInputChange('cvv', e.target.value)}
                placeholder="123"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email
            </label>
            <input
              type="email"
              value={paymentData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
              required
            />
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onBack}
              className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Volver
            </button>
            <button
              type="submit"
              disabled={isProcessing}
              className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Procesando...</span>
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4" />
                  <span>Pagar ${plan.price}</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Security Notice */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            🔒 Tu información está protegida con encriptación SSL de 256 bits
          </p>
        </div>
      </motion.div>
    </div>
  );
}
