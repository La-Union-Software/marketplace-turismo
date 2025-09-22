'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, DollarSign, Calendar, Info } from 'lucide-react';
import { Booking, CancellationPenalty } from '@/types';
import { formatPenaltyAmount, generatePenaltyDescription } from '@/lib/cancellationUtils';

interface CancellationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  booking: Booking;
  penalty: CancellationPenalty;
  isCancelling?: boolean;
}

export default function CancellationModal({
  isOpen,
  onClose,
  onConfirm,
  booking,
  penalty,
  isCancelling = false
}: CancellationModalProps) {
  const [isConfirmed, setIsConfirmed] = useState(false);

  const handleConfirm = () => {
    if (isConfirmed) {
      onConfirm();
    }
  };

  const handleClose = () => {
    setIsConfirmed(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-full">
                <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Cancelar Reserva
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Confirma la cancelación de tu reserva
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              disabled={isCancelling}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
            >
              <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Booking Info */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                {booking.post.title}
              </h3>
              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4" />
                  <span>
                    {new Date(booking.startDate).toLocaleDateString('es-ES')} - {new Date(booking.endDate).toLocaleDateString('es-ES')}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <DollarSign className="w-4 h-4" />
                  <span>
                    Total: {new Intl.NumberFormat('es-ES', {
                      style: 'currency',
                      currency: booking.currency
                    }).format(booking.totalAmount)}
                  </span>
                </div>
              </div>
            </div>

            {/* Penalty Information */}
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900 dark:text-white">
                Penalización de Cancelación
              </h3>
              
              {penalty.penaltyAmount === 0 ? (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <div className="p-1 bg-green-100 dark:bg-green-900/40 rounded-full">
                      <Info className="w-4 h-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-green-800 dark:text-green-300">
                        Sin Penalización
                      </p>
                      <p className="text-sm text-green-700 dark:text-green-400">
                        Cancelación sin costo adicional
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <div className="p-1 bg-red-100 dark:bg-red-900/40 rounded-full">
                      <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-red-800 dark:text-red-300">
                        Penalización Aplicable
                      </p>
                      <p className="text-sm text-red-700 dark:text-red-400">
                        {generatePenaltyDescription(penalty, booking.currency)}
                      </p>
                      <p className="text-lg font-bold text-red-800 dark:text-red-300 mt-2">
                        {formatPenaltyAmount(penalty, booking.currency)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Days Information */}
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <p>
                  Días antes de la reserva: <span className="font-medium">{penalty.daysBeforeBooking}</span>
                </p>
                {penalty.applicablePolicy && (
                  <p>
                    Política aplicable: Cancelación con {penalty.applicablePolicy.days_quantity} días o menos
                  </p>
                )}
              </div>
            </div>

            {/* Confirmation Checkbox */}
            <div className="space-y-3">
              <label className="flex items-start space-x-3 p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer">
                <input
                  type="checkbox"
                  checked={isConfirmed}
                  onChange={(e) => setIsConfirmed(e.target.checked)}
                  disabled={isCancelling}
                  className="w-4 h-4 text-primary-brown border-gray-300 rounded focus:ring-primary-brown focus:ring-2 mt-0.5"
                />
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  <p className="font-medium mb-1">
                    Confirmo que deseo cancelar esta reserva
                  </p>
                  <p>
                    Entiendo que {penalty.penaltyAmount === 0 
                      ? 'no habrá penalización por esta cancelación'
                      : `se aplicará una penalización de ${formatPenaltyAmount(penalty, booking.currency)}`
                    } y que esta acción no se puede deshacer.
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleClose}
              disabled={isCancelling}
              className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirm}
              disabled={!isConfirmed || isCancelling}
              className={`px-6 py-2 rounded-lg transition-all duration-300 ${
                !isConfirmed || isCancelling
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-red-600 text-white hover:bg-red-700'
              }`}
            >
              {isCancelling ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Cancelando...</span>
                </div>
              ) : (
                'Confirmar Cancelación'
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
