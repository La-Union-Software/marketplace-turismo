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
    'Clases de Esquí': 'mountain',
    'Clases de snowboard': 'mountain',
    'Clases de surf': 'waves',
    'Clases de wingfoil': 'wind',
    'Clases de wing surf': 'wind',
    // Alquileres
    'Alquiler equipo de esquí': 'mountain',
    'Alquiler equipo de snowboard': 'mountain',
    'Alquiler ropa de nieve': 'snowflake',
    'Alquiler equipo de surf': 'waves',
    'Alquiler equipo de wingfoil': 'wind',
    'Alquiler equipo de wing surf': 'wind',
    'Alquiler de carpa': 'tent',
    'Alquiler de sombrilla': 'umbrella',
    'Alquiler': 'package',
    // Excursiones
    'Excursiones lacustres': 'waves',
    'Excursiones terrestres': 'map',
    'Experiencias 4x4': 'car',
    'Cabalgatas': 'horse',
    'Excursiones aéreas': 'plane',
    // Fotografía
    'Vuelo de drone': 'camera',
    'Fotografía': 'camera',
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
    'Clases de Esquí': 'bg-sky-100 text-sky-800',
    'Clases de snowboard': 'bg-purple-100 text-purple-800',
    'Clases de surf': 'bg-blue-100 text-blue-800',
    'Clases de wingfoil': 'bg-cyan-100 text-cyan-800',
    'Clases de wing surf': 'bg-teal-100 text-teal-800',
    // Alquileres
    'Alquiler equipo de esquí': 'bg-sky-100 text-sky-800',
    'Alquiler equipo de snowboard': 'bg-purple-100 text-purple-800',
    'Alquiler ropa de nieve': 'bg-blue-100 text-blue-800',
    'Alquiler equipo de surf': 'bg-blue-100 text-blue-800',
    'Alquiler equipo de wingfoil': 'bg-cyan-100 text-cyan-800',
    'Alquiler equipo de wing surf': 'bg-teal-100 text-teal-800',
    'Alquiler de carpa': 'bg-green-100 text-green-800',
    'Alquiler de sombrilla': 'bg-yellow-100 text-yellow-800',
    'Alquiler': 'bg-gray-100 text-gray-800',
    // Excursiones
    'Excursiones lacustres': 'bg-blue-100 text-blue-800',
    'Excursiones terrestres': 'bg-green-100 text-green-800',
    'Experiencias 4x4': 'bg-orange-100 text-orange-800',
    'Cabalgatas': 'bg-amber-100 text-amber-800',
    'Excursiones aéreas': 'bg-sky-100 text-sky-800',
    // Fotografía
    'Vuelo de drone': 'bg-indigo-100 text-indigo-800',
    'Fotografía': 'bg-pink-100 text-pink-800',
  };
  return colors[category] || 'bg-gray-100 text-gray-800';
}

/**
 * Parses OpenStreetMap address format to extract city and state/province
 * @param address - The full address string from OpenStreetMap
 * @returns Object with city and state, or fallback to original address
 */
export function parseAddress(address: string): { city: string; state: string } {
  if (!address) return { city: '', state: '' };

  // Split by comma and clean up whitespace
  const parts = address.split(',').map(part => part.trim());
  
  if (parts.length < 2) {
    return { city: address, state: '' };
  }

  // Common patterns for OpenStreetMap addresses:
  // "Street Name, City, Province/State, Country"
  // "Street Name, City, Province/State, Postal Code, Country"
  
  let city = '';
  let state = '';
  
  // Try to identify city and state from the parts
  // Usually city is the second part and state is the third
  if (parts.length >= 3) {
    city = parts[1];
    
    // Check if the third part looks like a state/province (not a postal code)
    const thirdPart = parts[2];
    const isPostalCode = /^\d{4,5}$/.test(thirdPart); // Simple postal code check
    
    if (!isPostalCode) {
      state = thirdPart;
    } else if (parts.length >= 4) {
      // If third part is postal code, state might be fourth part
      state = parts[3];
    }
  } else if (parts.length === 2) {
    // Only two parts, assume first is city, second is state
    city = parts[0];
    state = parts[1];
  } else {
    // Fallback to original address
    city = address;
  }

  // Clean up common suffixes and prefixes
  city = city.replace(/^(Calle|Avenida|Plaza|Paseo)\s+/i, '').trim();
  state = state.replace(/\s+(Provincia|Estado|State|Province)$/i, '').trim();
  
  return { city, state };
}

/**
 * Formats address for display showing only city and state
 * @param address - The full address string from OpenStreetMap or address object
 * @returns Formatted string with city and state
 */
export function formatAddressForDisplay(address: string | { country: string; state: string; city: string; postalCode: string; address: string }): string {
  // Handle new address object format
  if (typeof address === 'object' && address !== null) {
    const parts = [];
    if (address.city) parts.push(address.city);
    if (address.state) parts.push(address.state);
    if (address.postalCode) parts.push(address.postalCode);
    
    return parts.length > 0 ? parts.join(', ') : 'Ubicación no especificada';
  }
  
  // Handle legacy string format
  const { city, state } = parseAddress(address);
  
  if (!city && !state) return address;
  if (!state) return city;
  if (!city) return state;
  
  return `${city}, ${state}`;
} 