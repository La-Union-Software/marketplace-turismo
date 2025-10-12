'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Clock, ArrowRight } from 'lucide-react';
import { useAuth } from '@/lib/auth';

type PaymentStatus = 'approved' | 'rejected' | 'pending' | 'loading';

function PaymentCompleteContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  const [status, setStatus] = useState<PaymentStatus>('loading');
  const [message, setMessage] = useState('');
  const [subscriptionDetails, setSubscriptionDetails] = useState<any>(null);

  // Function to verify subscription status and trigger webhook
  const verifySubscriptionStatus = async (preapprovalId: string) => {
    try {
      console.log('🔄 [Payment Complete] Verifying subscription status:', preapprovalId);
      
      // Simulate webhook call to update subscription status
      const response = await fetch('/api/mercadopago/subscription-webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'preapproval',
          data: {
            id: preapprovalId
          }
        }),
      });

      if (response.ok) {
        console.log('✅ [Payment Complete] Subscription status updated successfully');
      } else {
        console.warn('⚠️ [Payment Complete] Failed to update subscription status');
      }
    } catch (error) {
      console.error('❌ [Payment Complete] Error verifying subscription:', error);
      // Don't fail the user experience, just log the error
    }
  };

  useEffect(() => {
    const paymentStatus = searchParams.get('status');
    const paymentId = searchParams.get('payment_id');
    const preapprovalId = searchParams.get('preapproval_id');
    const externalReference = searchParams.get('external_reference');

    console.log('🔍 [Payment Complete] URL params:', {
      status: paymentStatus,
      paymentId,
      preapprovalId,
      externalReference
    });

    // Handle subscription completion (PreApprovalPlan)
    if (preapprovalId) {
      console.log('✅ [Payment Complete] Subscription completion detected:', preapprovalId);
      setStatus('approved');
      setMessage('¡Suscripción exitosa! Tu plan ha sido activado y puedes comenzar a publicar.');
      
      // Trigger webhook to update subscription status and roles via middleware
      verifySubscriptionStatus(preapprovalId);
      
      // Refresh user data to get updated roles (middleware will handle role assignment)
      setTimeout(() => {
        refreshUser?.();
      }, 3000); // Give middleware time to process
      
      // Redirect to dashboard after 5 seconds
      setTimeout(() => {
        router.push('/dashboard');
      }, 5000);
    }
    // Handle regular payment completion
    else if (paymentStatus === 'approved') {
      setStatus('approved');
      setMessage('¡Pago exitoso! Tu suscripción ha sido activada.');
      
      // Refresh user data to get updated roles
      setTimeout(() => {
        refreshUser?.();
      }, 2000);
      
      // Redirect to dashboard after 5 seconds
      setTimeout(() => {
        router.push('/dashboard');
      }, 5000);
    } else if (paymentStatus === 'rejected') {
      setStatus('rejected');
      setMessage('El pago fue rechazado. Por favor, intenta con otro método de pago.');
    } else if (paymentStatus === 'pending') {
      setStatus('pending');
      setMessage('Tu pago está siendo procesado. Te notificaremos cuando esté confirmado.');
    } else {
      // If no status or preapproval_id, check if we can determine success from other params
      if (paymentId || externalReference) {
        setStatus('pending');
        setMessage('Tu pago está siendo procesado. Te notificaremos cuando esté confirmado.');
      } else {
        setStatus('rejected');
        setMessage('Error en el procesamiento del pago. Por favor, contacta soporte.');
      }
    }
  }, [searchParams, router, refreshUser]);

  const getStatusIcon = () => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-16 w-16 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-16 w-16 text-red-500" />;
      case 'pending':
        return <Clock className="h-16 w-16 text-yellow-500" />;
      default:
        return <Clock className="h-16 w-16 text-blue-500 animate-spin" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'approved':
        return 'border-green-200 bg-green-50';
      case 'rejected':
        return 'border-red-200 bg-red-50';
      case 'pending':
        return 'border-yellow-200 bg-yellow-50';
      default:
        return 'border-blue-200 bg-blue-50';
    }
  };

  const handleContinue = () => {
    if (status === 'approved') {
      router.push('/dashboard');
    } else {
      router.push('/suscribirse');
    }
  };

  return (
    <div className="min-h-screen bg-blue-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className={`max-w-md w-full rounded-2xl border-2 p-8 text-center ${getStatusColor()}`}
      >
        {/* Status Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="flex justify-center mb-6"
        >
          {getStatusIcon()}
        </motion.div>

        {/* Status Message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-6"
        >
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {status === 'approved' && '¡Pago Exitoso!'}
            {status === 'rejected' && 'Pago Rechazado'}
            {status === 'pending' && 'Pago Pendiente'}
            {status === 'loading' && 'Procesando...'}
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            {message}
          </p>
        </motion.div>

        {/* Subscription Details */}
        {status === 'approved' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
          >
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              Tu suscripción está activa
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Ahora puedes crear publicaciones y acceder a todas las funcionalidades de editor.
            </p>
          </motion.div>
        )}

        {/* Action Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <button
            onClick={handleContinue}
            className={`w-full px-6 py-3 rounded-lg font-semibold text-white transition-colors flex items-center justify-center space-x-2 ${
              status === 'approved'
                ? 'bg-green-600 hover:bg-green-700'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            <span>
              {status === 'approved' ? 'Ir al Dashboard' : 'Intentar de Nuevo'}
            </span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </motion.div>

        {/* Auto-redirect notice */}
        {status === 'approved' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="mt-4 text-sm text-gray-500 dark:text-gray-400"
          >
            Te redirigiremos automáticamente en unos segundos...
          </motion.div>
        )}

        {/* Support Info */}
        {status === 'rejected' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-4 text-sm text-gray-500 dark:text-gray-400"
          >
            ¿Necesitas ayuda? Contacta a{' '}
            <a href="mailto:soporte@tudominio.com" className="text-blue-600 hover:underline">
              soporte@tudominio.com
            </a>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}

// Loading fallback component
function PaymentCompleteLoading() {
  return (
    <div className="min-h-screen bg-blue-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full rounded-2xl border-2 border-blue-200 bg-blue-50 p-8 text-center">
        <div className="flex justify-center mb-6">
          <Clock className="h-16 w-16 text-blue-500 animate-spin" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Procesando...
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Cargando información del pago
        </p>
      </div>
    </div>
  );
}

// Main page component with Suspense boundary
export default function PaymentCompletePage() {
  return (
    <Suspense fallback={<PaymentCompleteLoading />}>
      <PaymentCompleteContent />
    </Suspense>
  );
}