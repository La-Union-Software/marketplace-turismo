'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronDown, 
  MapPin, 
  Home, 
  Star, 
  Bed, 
  Car, 
  Sparkles,
  Plus
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import NotificationBell from '@/components/ui/NotificationBell';

const popularDestinations = [
  { name: 'Buenos Aires', region: 'Capital Federal', href: '/destinos/buenos-aires' },
  { name: 'Bariloche', region: 'Río Negro', href: '/destinos/bariloche' },
  { name: 'Mendoza', region: 'Mendoza', href: '/destinos/mendoza' },
  { name: 'Córdoba', region: 'Córdoba', href: '/destinos/cordoba' },
  { name: 'Salta', region: 'Salta', href: '/destinos/salta' },
  { name: 'Ushuaia', region: 'Tierra del Fuego', href: '/destinos/ushuaia' },
  { name: 'Puerto Madryn', region: 'Chubut', href: '/destinos/puerto-madryn' },
  { name: 'Iguazú', region: 'Misiones', href: '/destinos/iguazu' },
  { name: 'El Calafate', region: 'Santa Cruz', href: '/destinos/el-calafate' },
  { name: 'Mar del Plata', region: 'Buenos Aires', href: '/destinos/mar-del-plata' }
];

export default function Header() {
  const [isDestinationsOpen, setIsDestinationsOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const { user, hasRole } = useAuth();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDestinationsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navigationItems = [
    { name: 'Inicio', href: '/', icon: Home },
    { name: 'Ofertas', href: '/ofertas', icon: Star },
    { name: 'Alojamientos', href: '/alojamientos', icon: Bed },
    { name: 'Vehículos', href: '/vehiculos', icon: Car },
    { name: 'Experiencias', href: '/experiencias', icon: Sparkles },
  ];

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  return (
    <header className="sticky top-0 z-50 glass border-b border-gray-200 dark:border-gray-700 w-full">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-brown to-primary-green rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">MT</span>
            </div>
            <span className="text-xl font-bold gradient-text hidden sm:block">
              Marketplace Turismo
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-8">
            {navigationItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive(item.href)
                    ? 'text-primary-brown bg-primary-brown/10'
                    : 'text-gray-700 dark:text-gray-300 hover:text-primary-brown hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <item.icon className="w-4 h-4" />
                <span>{item.name}</span>
              </Link>
            ))}

            {/* Destinations Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDestinationsOpen(!isDestinationsOpen)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive('/destinos')
                    ? 'text-primary-brown bg-primary-brown/10'
                    : 'text-gray-700 dark:text-gray-300 hover:text-primary-brown hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <MapPin className="w-4 h-4" />
                <span>Destinos populares</span>
                <ChevronDown 
                  className={`w-4 h-4 transition-transform ${
                    isDestinationsOpen ? 'rotate-180' : ''
                  }`} 
                />
              </button>

              <AnimatePresence>
                {isDestinationsOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute top-full left-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
                  >
                    <div className="p-4">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                        Destinos más populares
                      </h3>
                      <div className="grid grid-cols-1 gap-2">
                        {popularDestinations.map((destination) => (
                          <Link
                            key={destination.name}
                            href={destination.href}
                            onClick={() => setIsDestinationsOpen(false)}
                            className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group"
                          >
                            <div>
                              <div className="font-medium text-gray-900 dark:text-white group-hover:text-primary-brown transition-colors">
                                {destination.name}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {destination.region}
                              </div>
                            </div>
                            <MapPin className="w-4 h-4 text-gray-400 group-hover:text-primary-brown transition-colors" />
                          </Link>
                        ))}
                      </div>
                      <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-600">
                        <Link
                          href="/destinos"
                          onClick={() => setIsDestinationsOpen(false)}
                          className="block text-center text-sm text-primary-brown hover:text-secondary-brown font-medium transition-colors"
                        >
                          Ver todos los destinos →
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </nav>

          {/* Right Side - Publicar Button and User Menu */}
          <div className="flex items-center space-x-4">
            {/* Publicar Button - Hidden for superadmin users */}
            {user && !hasRole('superadmin') && (
              <Link
                href="/posts/new"
                className="hidden sm:flex items-center space-x-2 px-4 py-2 bg-primary-brown text-white rounded-lg hover:bg-secondary-brown transition-all duration-300 transform hover:scale-105 shadow-md"
              >
                <Plus className="w-4 h-4" />
                <span>Publicar</span>
              </Link>
            )}

            {/* User Menu / Login Button */}
            {user ? (
              <div className="flex items-center space-x-3">
                {/* Notification Bell */}
                <NotificationBell userId={user.id} />
                
                <Link
                  href="/dashboard"
                  className="flex items-center space-x-2 px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-primary-brown hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-primary-brown to-primary-green rounded-full flex items-center justify-center">
                    <span className="text-white font-medium text-sm">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="hidden sm:block text-sm font-medium">
                    {user.name}
                  </span>
                </Link>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  href="/login"
                  className="hidden sm:block px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-primary-brown transition-colors"
                >
                  Iniciar sesión
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 bg-primary-brown text-white rounded-lg hover:bg-secondary-brown transition-colors"
                >
                  Registrarse
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:text-primary-brown hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="lg:hidden border-t border-gray-200 dark:border-gray-700"
            >
              <div className="py-4 space-y-2">
                {navigationItems.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                      isActive(item.href)
                        ? 'text-primary-brown bg-primary-brown/10'
                        : 'text-gray-700 dark:text-gray-300 hover:text-primary-brown hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </Link>
                ))}

                {/* Mobile Destinations */}
                <div className="px-4 py-3">
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Destinos populares
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {popularDestinations.slice(0, 6).map((destination) => (
                      <Link
                        key={destination.name}
                        href={destination.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="p-2 text-sm text-gray-600 dark:text-gray-400 hover:text-primary-brown hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
                      >
                        {destination.name}
                      </Link>
                    ))}
                  </div>
                  <Link
                    href="/destinos"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block mt-3 text-sm text-primary-brown hover:text-secondary-brown font-medium"
                  >
                    Ver todos →
                  </Link>
                </div>

                {/* Mobile Publicar Button */}
                <div className="px-4">
                  <Link
                    href="/posts/new"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center justify-center space-x-2 w-full px-4 py-3 bg-primary-brown text-white rounded-lg hover:bg-secondary-brown transition-all duration-300 shadow-md"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Publicar</span>
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
