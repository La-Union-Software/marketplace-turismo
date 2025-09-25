'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Mail, Lock, ArrowLeft, User, Phone, AlertCircle, CheckCircle, X } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';

export default function RegisterPage() {
  const router = useRouter();
  const { signup, user } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  // Handle redirect after successful signup
  useEffect(() => {
    if (signupSuccess && user) {
      setSuccess('¡Cuenta creada exitosamente! Redirigiendo...');
      setTimeout(() => {
        // New users are clients by default, redirect to bookings
        router.push('/bookings');
      }, 2000);
    }
  }, [signupSuccess, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');
    
    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden.');
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      setIsLoading(false);
      return;
    }

    try {
      const userData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
      };

      const success = await signup(formData.email, formData.password, userData);
      if (success) {
        setSignupSuccess(true);
      } else {
        setError('Error al crear la cuenta. Por favor, inténtalo de nuevo.');
      }
    } catch (error: unknown) {
      console.error('Registration error:', error);
      
      // Handle Firebase auth errors
      if (error && typeof error === 'object' && 'code' in error) {
        const firebaseError = error as { code: string };
        if (firebaseError.code === 'auth/email-already-in-use') {
          setError('Ya existe una cuenta con este correo electrónico.');
        } else if (firebaseError.code === 'auth/invalid-email') {
          setError('Formato de correo electrónico inválido.');
        } else if (firebaseError.code === 'auth/weak-password') {
          setError('La contraseña es muy débil. Por favor, elige una contraseña más segura.');
        } else if (firebaseError.code === 'auth/operation-not-allowed') {
          setError('Las cuentas de correo electrónico/contraseña no están habilitadas. Por favor, contacta con soporte.');
        } else {
          setError('Ocurrió un error durante el registro. Por favor, inténtalo de nuevo.');
        }
      } else {
        setError('Ocurrió un error durante el registro. Por favor, inténtalo de nuevo.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const renderTermsModal = () => {
    if (!showTermsModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
        >
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Términos y Condiciones
            </h2>
            <button
              onClick={() => setShowTermsModal(false)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>
          
          <div className="p-6 overflow-y-auto max-h-[60vh]">
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Marketplace Turismo - Términos y Condiciones
              </h3>
              
              <div className="space-y-4 text-sm text-gray-700 dark:text-gray-300">
                <section>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">📑 TÉRMINOS Y CONDICIONES – MARKETPLACE TURISMO (Argentina)</h4>
                  <p className="mb-4">
                    Estos Términos y Condiciones regulan el acceso y uso de la Plataforma. Al registrarse o utilizarla, los usuarios aceptan su cumplimiento conforme a la Ley de Defensa del Consumidor N.º 24.240, el Código Civil y Comercial de la Nación (CCCN) y demás normativa aplicable.
                  </p>
                </section>

                <section>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">1. Objeto</h4>
                  <p className="mb-2">
                    Marketplace Turismo actúa como intermediario digital que conecta a clientes con prestadores de servicios turísticos (negocios).
                  </p>
                  <p className="mb-4">
                    La Plataforma no presta servicios turísticos por sí misma, ni es responsable de su ejecución.
                  </p>
                </section>

                <section>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">2. Registro</h4>
                  <ul className="list-disc pl-6 mb-4 space-y-1">
                    <li>Solo pueden registrarse personas mayores de 18 años.</li>
                    <li>Los datos aportados deben ser veraces y actualizados.</li>
                    <li>El usuario es responsable del uso de su cuenta y credenciales.</li>
                  </ul>
                </section>

                <section>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">3. Reservas</h4>
                  <ul className="list-disc pl-6 mb-4 space-y-1">
                    <li>Una reserva se confirma únicamente cuando el negocio acepta la solicitud.</li>
                    <li>Al confirmarse, se genera un voucher de reserva con los datos del servicio contratado.</li>
                    <li>El voucher es personal e intransferible.</li>
                    <li>Cancelaciones y cambios se rigen por las políticas de cada prestador, que deben estar publicadas en la Plataforma conforme al art. 1100 del CCCN (información clara y accesible al consumidor).</li>
                  </ul>
                </section>

                <section>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">4. Pagos</h4>
                  <ul className="list-disc pl-6 mb-4 space-y-1">
                    <li>Los pagos se procesan exclusivamente mediante pasarelas externas seguras (ej. Mercado Pago, Mobbex).</li>
                    <li>Marketplace Turismo no recibe ni almacena directamente dinero ni datos financieros de usuarios.</li>
                    <li>La Plataforma solo registra la confirmación de la operación para gestionar la reserva.</li>
                    <li>El pago al negocio se libera una vez cumplidas las condiciones pactadas por la pasarela (ejemplo: 12 horas posteriores al check-in sin reclamos).</li>
                    <li>Cualquier reclamo relacionado al procesamiento del pago deberá canalizarse a través de la pasarela correspondiente.</li>
                  </ul>
                </section>

                <section>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">5. Responsabilidades</h4>
                  <ul className="list-disc pl-6 mb-4 space-y-1">
                    <li>Los negocios son responsables de la calidad, seguridad y cumplimiento del servicio ofrecido.</li>
                    <li>Los clientes son responsables de respetar las normas de uso establecidas por cada negocio.</li>
                    <li>Marketplace Turismo no se hace responsable por daños, incumplimientos o conflictos entre las partes, aunque podrá intervenir como mediador cuando existan pruebas verificables.</li>
                  </ul>
                </section>

                <section>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">6. Propiedad intelectual</h4>
                  <p className="mb-4">
                    Todos los logos, diseños, marcas y contenidos de Marketplace Turismo están protegidos por la Ley de Propiedad Intelectual N.º 11.723. Su uso sin autorización está prohibido.
                  </p>
                </section>

                <section>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">7. Suspensión de cuentas</h4>
                  <p className="mb-4">
                    Marketplace Turismo podrá suspender o dar de baja cuentas en casos de fraude, incumplimiento de estos términos, uso indebido de la plataforma o conducta inadecuada.
                  </p>
                </section>

                <section>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">8. Jurisdicción y ley aplicable</h4>
                  <p className="mb-2">Para cualquier conflicto:</p>
                  <ul className="list-disc pl-6 mb-4 space-y-1">
                    <li>Entre negocios, proveedores o usuarios comerciales: será competente la jurisdicción de los tribunales ordinarios de San Carlos de Bariloche, Provincia de Río Negro, República Argentina, con renuncia a cualquier otro fuero o jurisdicción.</li>
                    <li>Entre consumidores finales y la Plataforma: se aplicará lo dispuesto por la Ley de Defensa del Consumidor N.º 24.240 y el Código Civil y Comercial de la Nación, respetando la opción de reclamar en el domicilio del consumidor o en el de la Plataforma.</li>
                  </ul>
                </section>

                <section>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">9. Modificaciones</h4>
                  <p>
                    La Plataforma podrá modificar estos Términos en cualquier momento. Los cambios entrarán en vigencia desde su publicación en el sitio web.
                  </p>
                </section>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end p-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setShowTermsModal(false)}
              className="px-6 py-2 bg-gradient-to-r from-primary-brown to-primary-green text-white rounded-lg hover:from-secondary-brown hover:to-secondary-green transition-all duration-300"
            >
              Entiendo
            </button>
          </div>
        </motion.div>
      </div>
    );
  };

  const renderPrivacyModal = () => {
    if (!showPrivacyModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
        >
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Política de Privacidad
            </h2>
            <button
              onClick={() => setShowPrivacyModal(false)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>
          
          <div className="p-6 overflow-y-auto max-h-[60vh]">
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Marketplace Turismo - Privacy Policy
              </h3>
              
              <div className="space-y-4 text-sm text-gray-700 dark:text-gray-300">
                <section>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">📑 POLÍTICA DE PRIVACIDAD – MARKETPLACE TURISMO (Argentina)</h4>
                  <p className="mb-4">
                    Marketplace Turismo (en adelante, "la Plataforma") respeta y protege los datos personales de sus usuarios (clientes, negocios, revendedores y referidos), conforme a lo dispuesto por la Ley N.º 25.326 de Protección de Datos Personales y sus modificatorias.
                  </p>
                </section>

                <section>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">1. Datos que recopilamos</h4>
                  <ul className="list-disc pl-6 mb-4 space-y-1">
                    <li><strong>Información personal:</strong> nombre, apellido, DNI, CUIT/CUIL (cuando corresponda), domicilio, correo electrónico, teléfono.</li>
                    <li><strong>Información comercial:</strong> descripción de servicios, precios, facturación.</li>
                    <li><strong>Datos de uso:</strong> historial de reservas, puntuaciones, preferencias.</li>
                    <li><strong>Datos de pago:</strong> la Plataforma no almacena información sensible de tarjetas o cuentas bancarias. Los pagos se procesan a través de pasarelas externas seguras (ej. Mercado Pago, Mobbex), que cumplen con las normas de seguridad PCI DSS.</li>
                  </ul>
                </section>

                <section>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">2. Finalidad</h4>
                  <p className="mb-2">Los datos se recaban para:</p>
                  <ul className="list-disc pl-6 mb-4 space-y-1">
                    <li>Gestionar reservas y generar vouchers.</li>
                    <li>Facilitar la comunicación entre clientes y negocios.</li>
                    <li>Emitir facturas según normativa de AFIP.</li>
                    <li>Analizar estadísticas de uso para mejorar la experiencia.</li>
                    <li>Cumplir obligaciones legales y contractuales.</li>
                  </ul>
                </section>

                <section>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">3. Protección y resguardo</h4>
                  <ul className="list-disc pl-6 mb-4 space-y-1">
                    <li>Los datos se almacenan en servidores seguros, con cifrado SSL.</li>
                    <li>Solo el personal autorizado accede a la información, bajo deber de confidencialidad.</li>
                    <li>No se ceden a terceros sin consentimiento, salvo obligación legal.</li>
                  </ul>
                </section>

                <section>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">4. Derechos ARCO (Acceso, Rectificación, Cancelación y Oposición)</h4>
                  <p className="mb-4">
                    Los usuarios pueden ejercer estos derechos según lo previsto en la Ley 25.326, enviando solicitud al correo oficial de la Plataforma.
                    La Dirección Nacional de Protección de Datos Personales es la autoridad de control en Argentina, y los usuarios pueden presentar reclamos ante ella si consideran vulnerados sus derechos.
                  </p>
                </section>

                <section>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">5. Cookies</h4>
                  <p className="mb-4">
                    Se utilizan cookies para optimizar la experiencia. Pueden deshabilitarse desde el navegador.
                  </p>
                </section>

                <section>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">6. Cambios en la política</h4>
                  <p>
                    La Plataforma podrá modificar la presente política en cualquier momento. Los cambios entrarán en vigencia desde su publicación en el sitio web.
                  </p>
                </section>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end p-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setShowPrivacyModal(false)}
              className="px-6 py-2 bg-gradient-to-r from-primary-brown to-primary-green text-white rounded-lg hover:from-secondary-brown hover:to-secondary-green transition-all duration-300"
            >
              Entiendo
            </button>
          </div>
        </motion.div>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="absolute inset-0 bg-gradient-to-br from-primary-brown/20 via-primary-green/20 to-accent-brown/20"></div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative w-full max-w-md"
      >
        {/* Back to Home */}
        <Link 
          href="/"
          className="absolute -top-16 left-0 flex items-center text-gray-600 dark:text-gray-300 hover:text-primary-brown transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver al inicio
        </Link>

        {/* Register Card */}
        <div className="glass rounded-2xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-primary-brown to-primary-green rounded-full flex items-center justify-center"
            >
              <span className="text-2xl font-bold text-white">MT</span>
            </motion.div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Crear cuenta
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Regístrate para comenzar a publicar tus servicios
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center space-x-3"
            >
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <span className="text-sm text-red-700 dark:text-red-300">{error}</span>
            </motion.div>
          )}

          {/* Success Message */}
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center space-x-3"
            >
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
              <span className="text-sm text-green-700 dark:text-green-300">{success}</span>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name Field */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nombre completo *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => updateFormData('name', e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-brown focus:border-transparent transition-colors"
                  placeholder="Tu nombre completo"
                />
              </div>
            </div>

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Dirección de correo electrónico *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateFormData('email', e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-brown focus:border-transparent transition-colors"
                  placeholder="your@email.com"
                />
              </div>
            </div>

            {/* Phone Field */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Número de teléfono
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => updateFormData('phone', e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-brown focus:border-transparent transition-colors"
                  placeholder="+34 600 123 456"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Contraseña *
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => updateFormData('password', e.target.value)}
                  required
                  className="w-full pl-10 pr-12 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-brown focus:border-transparent transition-colors"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Debe tener al menos 6 caracteres
              </p>
            </div>

            {/* Confirm Password Field */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Confirmar contraseña *
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => updateFormData('confirmPassword', e.target.value)}
                  required
                  className="w-full pl-10 pr-12 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-brown focus:border-transparent transition-colors"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Terms and Conditions */}
            <div className="flex items-start">
              <input
                type="checkbox"
                required
                className="w-4 h-4 text-primary-brown border-gray-300 rounded focus:ring-primary-brown focus:ring-2 mt-1"
              />
              <span className="ml-2 text-sm text-gray-600 dark:text-gray-300">
                Acepto los{' '}
                <button
                  type="button"
                  onClick={() => setShowTermsModal(true)}
                  className="text-primary-brown hover:text-secondary-brown underline focus:outline-none focus:ring-2 focus:ring-primary-brown focus:ring-offset-2 rounded"
                >
                  términos y condiciones
                </button>
                {' '}y la{' '}
                <button
                  type="button"
                  onClick={() => setShowPrivacyModal(true)}
                  className="text-primary-brown hover:text-secondary-brown underline focus:outline-none focus:ring-2 focus:ring-primary-brown focus:ring-offset-2 rounded"
                >
                  política de privacidad
                </button>
              </span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-primary-brown to-primary-green text-white py-3 px-4 rounded-lg font-semibold hover:from-secondary-brown hover:to-secondary-green transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center"
            >
              {isLoading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                />
              ) : (
                'Crear cuenta'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center">
            <div className="flex-1 border-t border-gray-300 dark:border-gray-600"></div>
            <span className="px-4 text-sm text-gray-500 dark:text-gray-400">o</span>
            <div className="flex-1 border-t border-gray-300 dark:border-gray-600"></div>
          </div>

          {/* Social Login */}
          <div className="space-y-3">
            <button className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continuar con Google
            </button>
          </div>

          {/* Sign In Link */}
          <div className="mt-8 text-center">
            <p className="text-gray-600 dark:text-gray-300">
              ¿Ya tienes una cuenta?{' '}
              <Link
                href="/login"
                className="text-primary-brown hover:text-secondary-brown font-semibold transition-colors"
              >
                Inicia sesión aquí
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
      
      {/* Terms and Privacy Modals */}
      <AnimatePresence>
        {renderTermsModal()}
        {renderPrivacyModal()}
      </AnimatePresence>
    </div>
  );
} 