export type ServiceCategory = 
  // Alojamiento
  | 'Hotel'
  | 'Casa'
  | 'Departamento'
  | 'Cabaña'
  | 'Camping'
  | 'Domo'
  // Alquiler de vehículos
  | 'Alquiler de autos'
  | 'Alquiler de bicicletas'
  | 'Alquiler de kayaks'
  // Clases/instructorados
  | 'Clases de sky/snowboard'
  | 'Cabalgatas';

// Role and Permission System
export type UserRole = 'superadmin' | 'publisher' | 'client';

export interface Permission {
  id: string;
  name: string;
  description: string;
  resource: string; // e.g., 'posts', 'users', 'analytics'
  action: string;   // e.g., 'create', 'read', 'update', 'delete'
}

export interface Role {
  id: string;
  name: UserRole;
  displayName: string;
  description: string;
  permissions: Permission[];
  isSystem: boolean; // System roles cannot be modified
  createdAt: Date;
  updatedAt: Date;
}

export interface UserRoleAssignment {
  roleId: string;
  roleName: UserRole;
  assignedAt: Date;
  assignedBy?: string; // User ID who assigned this role
  isActive: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  roles: UserRoleAssignment[];
  isActive: boolean;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  profileCompleted: boolean;
  mobbexCredentials?: {
    accessToken: string;
    entity: {
      name: string;
      logo?: string;
      taxId: string;
    };
    isConnected: boolean;
    connectedAt: Date;
  };
}

// Enhanced Post interface with role-based access
export interface BasePost {
  id: string;
  title: string;
  description: string;
  category: ServiceCategory;
  price: number;
  currency: string;
  location: string;
  images: string[]; // Array of image IDs from the subcollection
  specificFields: Record<string, unknown>; // Specific information fields based on category
  isActive: boolean;
  userId: string;
  publisherId: string; // The user who published this post
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'published';
  moderationNotes?: string;
  moderationBy?: string; // Superadmin who moderated
  moderationAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
}

// Post Image interface for subcollection
export interface PostImage {
  id: string;
  data: string; // Base64 image data
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface BicycleRentalPost extends BasePost {
  category: 'Bicycle Rental';
  bikeType: 'Mountain' | 'Road' | 'City' | 'Electric';
  duration: 'Hour' | 'Day' | 'Week';
  includes: string[];
  requirements: string[];
}

export interface CarRentalPost extends BasePost {
  category: 'Car Rental';
  carType: 'Economy' | 'Compact' | 'SUV' | 'Luxury' | 'Van';
  transmission: 'Manual' | 'Automatic';
  fuelType: 'Gasoline' | 'Diesel' | 'Electric' | 'Hybrid';
  seats: number;
  includes: string[];
  requirements: string[];
}

export interface ExcursionPost extends BasePost {
  category: 'Excursions';
  duration: string;
  groupSize: number;
  includes: string[];
  itinerary: string[];
  requirements: string[];
}

export interface ExperiencePost extends BasePost {
  category: 'Experiences';
  duration: string;
  groupSize: number;
  includes: string[];
  activities: string[];
  requirements: string[];
}

export interface HotelStayPost extends BasePost {
  category: 'Hotel Stay';
  roomType: 'Single' | 'Double' | 'Suite' | 'Family';
  amenities: string[];
  checkIn: string;
  checkOut: string;
  policies: string[];
}

export interface VacationHomePost extends BasePost {
  category: 'Vacation Home Rental';
  propertyType: 'Apartment' | 'House' | 'Villa' | 'Cabin';
  bedrooms: number;
  bathrooms: number;
  maxGuests: number;
  amenities: string[];
  checkIn: string;
  checkOut: string;
  policies: string[];
}

export interface CampingStayPost extends BasePost {
  category: 'Camping Stay';
  siteType: 'Tent' | 'RV' | 'Cabin' | 'Glamping';
  maxGuests: number;
  amenities: string[];
  checkIn: string;
  checkOut: string;
  policies: string[];
}

export type Post = 
  | BicycleRentalPost
  | CarRentalPost
  | ExcursionPost
  | ExperiencePost
  | HotelStayPost
  | VacationHomePost
  | CampingStayPost;

export interface DashboardStats {
  totalPosts: number;
  activePosts: number;
  totalViews: number;
  totalBookings: number;
  monthlyRevenue: number;
  recentActivity: Activity[];
}

export interface Activity {
  id: string;
  type: 'post_created' | 'post_updated' | 'booking_received' | 'view_increased';
  message: string;
  timestamp: Date;
  postId?: string;
}

export interface SearchFilters {
  category?: ServiceCategory;
  location?: string;
  priceRange?: {
    min: number;
    max: number;
  };
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export interface FormStep {
  id: string;
  title: string;
  description: string;
  isCompleted: boolean;
}

// System Settings Types
export interface MercadoPagoCredentials {
  id: string;
  publicKey: string;
  accessToken: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  updatedBy: string; // User ID who last updated the credentials
}

export interface MobbexCredentials {
  id: string;
  apiKey: string;
  accessToken: string;
  auditKey?: string; // Optional audit key for loyalty features
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  updatedBy: string; // User ID who last updated the credentials
}

export interface SystemSettings {
  id: string;
  mercadoPago: MercadoPagoCredentials;
  mobbex: MobbexCredentials;
  createdAt: Date;
  updatedAt: Date;
}

// Subscription Plans Types
export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  billingCycle: 'monthly' | 'yearly' | 'weekly' | 'daily';
  features: string[];
  maxPosts: number;
  maxBookings: number;
  isActive: boolean;
  isVisible: boolean;
  mercadoPagoPlanId?: string; // Mercado Pago subscription plan ID
  mercadoPagoPreferenceId?: string; // Mercado Pago preference ID
  mobbexSubscriptionId?: string; // Mobbex subscription ID for sync
  createdAt: Date;
  updatedAt: Date;
  createdBy: string; // User ID who created the plan
  updatedBy: string; // User ID who last updated the plan
}

export interface MercadoPagoPlan {
  id: string;
  name: string;
  description: string;
  amount: number;
  currency: string;
  frequency: {
    type: 'day' | 'week' | 'month' | 'year';
    frequency: number;
  };
  repetitions: number; // 0 for unlimited
  free_trial: {
    frequency: number;
    frequency_type: 'day' | 'week' | 'month' | 'year';
  };
  payment_methods: {
    excluded_payment_types: string[];
    excluded_payment_methods: string[];
    installments: number;
  };
  back_urls: {
    success: string;
    failure: string;
    pending: string;
  };
  auto_recurring: boolean;
  reason: string;
  external_reference?: string;
}

export interface UserSubscription {
  id: string;
  userId: string;
  planId: string;
  plan: SubscriptionPlan;
  status: 'active' | 'cancelled' | 'expired' | 'pending' | 'suspended';
  startDate: Date;
  endDate: Date;
  mercadoPagoSubscriptionId?: string;
  mercadoPagoPreferenceId?: string;
  mobbexSubscriptionId?: string; // Mobbex subscription ID
  mobbexSubscriberId?: string; // Mobbex subscriber ID
  lastPaymentDate?: Date;
  nextPaymentDate?: Date;
  totalPayments: number;
  createdAt: Date;
  updatedAt: Date;
}

// Mobbex Subscription Types
export interface MobbexSubscription {
  id: string;
  name: string;
  description: string;
  total: number;
  currency: string;
  reference: string;
  features: string[];
  returnUrl: string;
  webhook: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface MobbexSubscriber {
  id: string;
  subscriptionId: string;
  customer: {
    identification: string;
    email: string;
    name: string;
  };
  startDate: {
    day: number;
    month: number;
  };
  reference: string;
  total: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Pricing Types
export type PricingType = 'fixed' | 'dynamic';

export interface FixedPricing {
  type: 'fixed';
  price: number;
  currency: string;
}

export interface DynamicPricingSeason {
  id: string;
  startDate: string; // YYYY-MM-DD format
  endDate: string; // YYYY-MM-DD format
  price: number;
  currency: string;
  weekdays: Weekday[];
}

export type Weekday = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export interface DynamicPricing {
  type: 'dynamic';
  seasons: DynamicPricingSeason[];
}

export type Pricing = FixedPricing | DynamicPricing;

// Booking Types
export type BookingStatus = 'requested' | 'accepted' | 'declined' | 'pending_payment' | 'paid' | 'cancelled' | 'completed';

export interface Booking {
  id: string;
  postId: string;
  post: BasePost; // Populated when fetching
  clientId: string;
  client: User; // Populated when fetching
  ownerId: string;
  owner: User; // Populated when fetching
  status: BookingStatus;
  startDate: Date;
  endDate: Date;
  totalAmount: number;
  currency: string;
  guestCount: number;
  clientData: {
    name: string;
    email: string;
    phone: string;
    notes?: string;
  };
  mobbexCheckoutId?: string;
  mobbexTransactionId?: string;
  paymentData?: {
    method: string;
    installments: number;
    status: string;
  };
  createdAt: Date;
  updatedAt: Date;
  acceptedAt?: Date;
  declinedAt?: Date;
  paidAt?: Date;
  cancelledAt?: Date;
  completedAt?: Date;
}

// Notification Types
export type NotificationType = 'booking_request' | 'booking_accepted' | 'booking_declined' | 'payment_pending' | 'payment_completed' | 'booking_cancelled';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: {
    bookingId?: string;
    postId?: string;
    checkoutUrl?: string;
    [key: string]: unknown;
  };
  isRead: boolean;
  createdAt: Date;
  readAt?: Date;
} 