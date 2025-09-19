'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Mail, Lock, ArrowLeft, User, Phone, AlertCircle, CheckCircle, X } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';

export default function RegisterPage() {
  const router = useRouter();
  const { signup } = useAuth();
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
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');
    
    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      setIsLoading(false);
      return;
    }

    try {
      const userData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
      };

      const user = await signup(formData.email, formData.password, userData);
      if (user) {
        setSuccess('Account created successfully! Redirecting...');
        setTimeout(() => {
          // New users are clients by default, redirect to bookings
          router.push('/bookings');
        }, 2000);
      } else {
        setError('Failed to create account. Please try again.');
      }
    } catch (error: unknown) {
      console.error('Registration error:', error);
      
      // Handle Firebase auth errors
      if (error && typeof error === 'object' && 'code' in error) {
        const firebaseError = error as { code: string };
        if (firebaseError.code === 'auth/email-already-in-use') {
          setError('An account with this email already exists.');
        } else if (firebaseError.code === 'auth/invalid-email') {
          setError('Invalid email address format.');
        } else if (firebaseError.code === 'auth/weak-password') {
          setError('Password is too weak. Please choose a stronger password.');
        } else if (firebaseError.code === 'auth/operation-not-allowed') {
          setError('Email/password accounts are not enabled. Please contact support.');
        } else {
          setError('An error occurred during registration. Please try again.');
        }
      } else {
        setError('An error occurred during registration. Please try again.');
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
              Terms and Conditions
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
                Marketplace Turismo - Terms and Conditions
              </h3>
              
              <div className="space-y-4 text-sm text-gray-700 dark:text-gray-300">
                <section>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">1. Acceptance of Terms</h4>
                  <p>
                    By creating an account and using Marketplace Turismo, you agree to be bound by these terms and conditions. 
                    If you do not agree to these terms, please do not use our service.
                  </p>
                </section>

                <section>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">2. Account Registration</h4>
                  <p>
                    You must provide accurate and complete information when creating your account. You are responsible for 
                    maintaining the confidentiality of your account credentials and for all activities that occur under your account.
                  </p>
                </section>

                <section>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">3. User Responsibilities</h4>
                  <p>
                    As a user of Marketplace Turismo, you agree to use the platform responsibly and in accordance with all 
                    applicable laws and regulations. You are responsible for the content you post and the services you provide.
                  </p>
                </section>

                <section>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">4. Service Availability</h4>
                  <p>
                    We strive to maintain high service availability, but we do not guarantee uninterrupted access to our platform. 
                    We reserve the right to modify, suspend, or discontinue any part of our service at any time.
                  </p>
                </section>

                <section>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">5. Content and Intellectual Property</h4>
                  <p>
                    You retain ownership of the content you post, but grant us a license to use, display, and distribute your 
                    content in connection with our service. You must not post content that infringes on others&apos; intellectual property rights.
                  </p>
                </section>

                <section>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">6. Prohibited Activities</h4>
                  <p>
                    You may not use our service for illegal activities, spam, harassment, or any activity that could harm 
                    other users or the platform. We reserve the right to suspend or terminate accounts that violate these terms.
                  </p>
                </section>

                <section>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">7. Limitation of Liability</h4>
                  <p>
                    Marketplace Turismo is provided &quot;as is&quot; without warranties of any kind. We are not liable for any 
                    damages arising from your use of our service, including but not limited to direct, indirect, or consequential damages.
                  </p>
                </section>

                <section>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">8. Changes to Terms</h4>
                  <p>
                    We may update these terms from time to time. We will notify users of significant changes, and continued 
                    use of our service constitutes acceptance of the updated terms.
                  </p>
                </section>

                <section>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">9. Contact Information</h4>
                  <p>
                    If you have any questions about these terms and conditions, please contact us through our official channels.
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
              I Understand
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
              Privacy Policy
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
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">1. Information We Collect</h4>
                  <p>
                    We collect information you provide directly to us, such as when you create an account, post services, 
                    or communicate with us. This includes your name, email address, phone number, and service details.
                  </p>
                </section>

                <section>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">2. How We Use Your Information</h4>
                  <p>
                    We use your information to provide and improve our services, communicate with you, process transactions, 
                    and ensure platform security. We may also use your information for analytics and marketing purposes.
                  </p>
                </section>

                <section>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">3. Information Sharing</h4>
                  <p>
                    We do not sell your personal information. We may share your information with service providers who 
                    assist us in operating our platform, or when required by law or to protect our rights and safety.
                  </p>
                </section>

                <section>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">4. Data Security</h4>
                  <p>
                    We implement appropriate security measures to protect your personal information against unauthorized 
                    access, alteration, disclosure, or destruction. However, no method of transmission over the internet is 100% secure.
                  </p>
                </section>

                <section>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">5. Cookies and Tracking</h4>
                  <p>
                    We use cookies and similar technologies to enhance your experience, analyze usage patterns, and 
                    provide personalized content. You can control cookie settings through your browser preferences.
                  </p>
                </section>

                <section>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">6. Your Rights</h4>
                  <p>
                    You have the right to access, update, or delete your personal information. You can also opt out of 
                    certain communications and data processing activities. Contact us to exercise these rights.
                  </p>
                </section>

                <section>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">7. Data Retention</h4>
                  <p>
                    We retain your personal information for as long as necessary to provide our services and comply 
                    with legal obligations. We will delete your information when it is no longer needed.
                  </p>
                </section>

                <section>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">8. International Transfers</h4>
                  <p>
                    Your information may be transferred to and processed in countries other than your own. We ensure 
                    appropriate safeguards are in place to protect your information during such transfers.
                  </p>
                </section>

                <section>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">9. Children&apos;s Privacy</h4>
                  <p>
                    Our service is not intended for children under 13 years of age. We do not knowingly collect 
                    personal information from children under 13. If we become aware of such collection, we will delete the information.
                  </p>
                </section>

                <section>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">10. Changes to Privacy Policy</h4>
                  <p>
                    We may update this privacy policy from time to time. We will notify you of any material changes 
                    and post the updated policy on our website.
                  </p>
                </section>

                <section>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">11. Contact Us</h4>
                  <p>
                    If you have any questions about this privacy policy or our data practices, please contact us 
                    through our official channels.
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
              I Understand
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
          Back to home
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
              Create account
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Sign up to start posting your services
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
                Full name *
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
                  placeholder="Your full name"
                />
              </div>
            </div>

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email address *
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
                Phone number
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
                Password *
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
                Must be at least 6 characters long
              </p>
            </div>

            {/* Confirm Password Field */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Confirm password *
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
                I accept the{' '}
                <button
                  type="button"
                  onClick={() => setShowTermsModal(true)}
                  className="text-primary-brown hover:text-secondary-brown underline focus:outline-none focus:ring-2 focus:ring-primary-brown focus:ring-offset-2 rounded"
                >
                  terms and conditions
                </button>
                {' '}and{' '}
                <button
                  type="button"
                  onClick={() => setShowPrivacyModal(true)}
                  className="text-primary-brown hover:text-secondary-brown underline focus:outline-none focus:ring-2 focus:ring-primary-brown focus:ring-offset-2 rounded"
                >
                  privacy policy
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
                &apos;Create account&apos;
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center">
            <div className="flex-1 border-t border-gray-300 dark:border-gray-600"></div>
            <span className="px-4 text-sm text-gray-500 dark:text-gray-400">or</span>
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
              Continue with Google
            </button>
          </div>

          {/* Sign In Link */}
          <div className="mt-8 text-center">
            <p className="text-gray-600 dark:text-gray-300">
              Already have an account?{' '}
              <Link
                href="/login"
                className="text-primary-brown hover:text-secondary-brown font-semibold transition-colors"
              >
                Sign in here
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