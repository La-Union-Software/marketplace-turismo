import { type ClassValue, clsx } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatPrice(price: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: currency,
  }).format(price);
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

export function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substr(0, maxLength) + '...';
}

export function getCategoryIcon(category: string): string {
  const icons: Record<string, string> = {
    // Alojamiento
    'Hotel': 'bed',
    'Casa': 'home',
    'Departamento': 'building',
    'Cabaña': 'tree-pine',
    'Camping': 'tent',
    'Domo': 'circle-dot',
    // Alquiler de vehículos
    'Alquiler de autos': 'car',
    'Alquiler de bicicletas': 'bike',
    'Alquiler de kayaks': 'waves',
    // Clases/instructorados
    'Clases de sky/snowboard': 'mountain',
    'Cabalgatas': 'horse',
  };
  return icons[category] || 'package';
}

export function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    // Alojamiento
    'Hotel': 'bg-red-100 text-red-800',
    'Casa': 'bg-indigo-100 text-indigo-800',
    'Departamento': 'bg-blue-100 text-blue-800',
    'Cabaña': 'bg-amber-100 text-amber-800',
    'Camping': 'bg-orange-100 text-orange-800',
    'Domo': 'bg-purple-100 text-purple-800',
    // Alquiler de vehículos
    'Alquiler de autos': 'bg-blue-100 text-blue-800',
    'Alquiler de bicicletas': 'bg-green-100 text-green-800',
    'Alquiler de kayaks': 'bg-cyan-100 text-cyan-800',
    // Clases/instructorados
    'Clases de sky/snowboard': 'bg-sky-100 text-sky-800',
    'Cabalgatas': 'bg-amber-100 text-amber-800',
  };
  return colors[category] || 'bg-gray-100 text-gray-800';
} 