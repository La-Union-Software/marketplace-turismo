// Mobbex Checkout Service
// Based on the Mobbex API documentation: https://mobbex.dev/checkout

import { firebaseDB } from './firebaseService';

interface MobbexCheckoutRequest {
  total: number;
  description: string;
  currency: string;
  reference: string;
  test?: boolean;
  return_url?: string;
  webhook?: string;
  timeout?: number; // in minutes
  items?: Array<{
    id: string;
    description: string;
    total: number;
    quantity: number;
    image?: string;
  }>;
  split?: Array<{
    entity: string;
    total: number;
    reference: string;
    fee: number;
  }>;
}

interface MobbexCheckoutResponse {
  id: string;
  url: string;
  reference: string;
  total: number;
  currency: string;
  status: string;
  created: string;
  updated: string;
}

interface MobbexCheckoutStatus {
  id: string;
  reference: string;
  total: number;
  currency: string;
  status: {
    code: number;
    text: string;
    message: string;
  };
  payment?: {
    id: string;
    status: {
      code: number;
      text: string;
    };
    total: number;
    currency: string;
    source: {
      type: string;
      name: string;
    };
  };
  created: string;
  updated: string;
}

class MobbexService {
  private apiKey: string = '';
  private accessToken: string = '';
  private baseUrl: string = 'https://api.mobbex.com/p/checkout';
  private credentialsLoaded: boolean = false;

  constructor() {
    // Credentials will be loaded from system settings when needed
  }

  private async loadCredentials(): Promise<void> {
    if (this.credentialsLoaded) return;

    try {
      console.log('🔍 [MobbexService] Loading Mobbex credentials from system settings...');
      const credentials = await firebaseDB.systemSettings.getMobbexCredentials();
      
      console.log('📋 [MobbexService] Raw credentials from Firestore:', {
        exists: !!credentials,
        hasApiKey: !!credentials?.apiKey,
        hasAccessToken: !!credentials?.accessToken,
        isActive: credentials?.isActive,
        apiKeyLength: credentials?.apiKey?.length,
        accessTokenLength: credentials?.accessToken?.length,
        apiKeyPrefix: credentials?.apiKey?.substring(0, 8) + '...',
        accessTokenPrefix: credentials?.accessToken?.substring(0, 8) + '...'
      });
      
      if (!credentials) {
        throw new Error('Mobbex credentials not found in system settings. Please ensure the Superadmin has configured Mobbex settings.');
      }
      
      if (!credentials.isActive) {
        throw new Error('Mobbex credentials are inactive. Please activate them in the system settings.');
      }
      
      if (!credentials.apiKey) {
        throw new Error('Mobbex API key is missing in system settings.');
      }
      
      if (!credentials.accessToken) {
        throw new Error('Mobbex access token is missing in system settings.');
      }

      this.apiKey = credentials.apiKey;
      this.accessToken = credentials.accessToken;
      this.credentialsLoaded = true;
      
      console.log('✅ [MobbexService] Credentials loaded successfully:', {
        apiKeyPrefix: this.apiKey.substring(0, 8) + '...',
        accessTokenPrefix: this.accessToken.substring(0, 8) + '...',
        credentialsLoaded: this.credentialsLoaded
      });
    } catch (error) {
      console.error('❌ [MobbexService] Error loading Mobbex credentials from system settings:', error);
      throw error;
    }
  }

  private async getHeaders() {
    await this.loadCredentials();
    return {
      'Content-Type': 'application/json',
      'x-api-key': this.apiKey,
      'x-access-token': this.accessToken,
    };
  }

  /**
   * Create a new checkout session
   */
  async createCheckout(data: MobbexCheckoutRequest): Promise<MobbexCheckoutResponse> {
    try {
      console.log('🚀 [MobbexService] Creating checkout with data:', {
        total: data.total,
        description: data.description,
        currency: data.currency,
        reference: data.reference,
        test: process.env.NODE_ENV === 'development' || data.test || false,
        timeout: data.timeout || 1440
      });

      const headers = await this.getHeaders();
      console.log('🔑 [MobbexService] Using headers:', {
        'Content-Type': headers['Content-Type'],
        'x-api-key': headers['x-api-key']?.substring(0, 8) + '...',
        'x-access-token': headers['x-access-token']?.substring(0, 8) + '...'
      });

      const requestBody = {
        ...data,
        test: process.env.NODE_ENV === 'development' || data.test || false,
        timeout: data.timeout || 1440, // 24 hours default
      };

      console.log('📤 [MobbexService] Sending request to:', this.baseUrl);
      console.log('📤 [MobbexService] Request body:', requestBody);

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody),
      });

      console.log('📥 [MobbexService] Response received:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries())
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ [MobbexService] API Error Response:', {
          status: response.status,
          statusText: response.statusText,
          errorData
        });
        
        if (response.status === 401) {
          throw new Error(`Invalid Mobbex API credentials. Status: ${response.status}. Please check the system settings.`);
        } else {
          throw new Error(`Mobbex API Error: ${errorData.message || response.statusText}`);
        }
      }

      const result = await response.json();
      console.log('✅ [MobbexService] Checkout created successfully:', {
        id: result.id,
        url: result.url,
        reference: result.reference,
        total: result.total,
        currency: result.currency
      });
      return result;
    } catch (error) {
      console.error('Error creating Mobbex checkout:', error);
      throw new Error('Failed to create checkout session');
    }
  }

  /**
   * Create a new Mobbex checkout with user credentials
   */
  async createCheckoutWithCredentials(data: MobbexCheckoutRequest, userAccessToken: string): Promise<MobbexCheckoutResponse> {
    try {
      const headers = await this.getHeaders();
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': headers['x-api-key'],
          'X-Access-Token': userAccessToken,
        },
        body: JSON.stringify({
          ...data,
          test: process.env.NODE_ENV === 'development' || data.test || false,
          timeout: data.timeout || 1440, // 24 hours default
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Mobbex API Error Response (with user credentials):', {
          status: response.status,
          statusText: response.statusText,
          errorData
        });
        
        if (response.status === 401) {
          throw new Error(`Invalid Mobbex API credentials. Status: ${response.status}. Please check the system settings.`);
        } else {
          throw new Error(`Mobbex API Error: ${errorData.message || response.statusText}`);
        }
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error creating Mobbex checkout with user credentials:', error);
      throw new Error('Failed to create checkout session');
    }
  }

  /**
   * Get checkout status
   */
  async getCheckoutStatus(checkoutId: string): Promise<MobbexCheckoutStatus> {
    try {
      const headers = await this.getHeaders();
      const response = await fetch(`${this.baseUrl}/${checkoutId}`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Mobbex API Error: ${errorData.message || response.statusText}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error getting Mobbex checkout status:', error);
      throw new Error('Failed to get checkout status');
    }
  }

  /**
   * Delete a checkout
   */
  async deleteCheckout(checkoutId: string): Promise<void> {
    try {
      const headers = await this.getHeaders();
      const response = await fetch(`${this.baseUrl}/${checkoutId}`, {
        method: 'DELETE',
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Mobbex API Error: ${errorData.message || response.statusText}`);
      }
    } catch (error) {
      console.error('Error deleting Mobbex checkout:', error);
      throw new Error('Failed to delete checkout');
    }
  }

  /**
   * Create checkout for booking payment with marketplace split
   */
  async createBookingCheckout(bookingData: {
    bookingId: string;
    postTitle: string;
    totalAmount: number;
    currency: string;
    clientName: string;
    clientEmail: string;
    returnUrl?: string;
    webhookUrl?: string;
    publisherCuit?: string; // CUIT of the publisher for split payment
    marketplaceFee?: number; // Fee percentage for marketplace (default 10%)
    userCredentials?: {
      accessToken: string;
      entity: {
        name: string;
        taxId: string;
      };
    };
  }): Promise<MobbexCheckoutResponse> {
    console.log('🎯 [MobbexService] createBookingCheckout called with:', {
      bookingId: bookingData.bookingId,
      postTitle: bookingData.postTitle,
      totalAmount: bookingData.totalAmount,
      currency: bookingData.currency,
      hasUserCredentials: !!bookingData.userCredentials,
      publisherCuit: bookingData.publisherCuit,
      marketplaceFee: bookingData.marketplaceFee,
      returnUrl: bookingData.returnUrl,
      webhookUrl: bookingData.webhookUrl
    });

    // Calculate split payment if publisher CUIT is provided
    let split: Array<{
      entity: string;
      total: number;
      reference: string;
      fee: number;
    }> | undefined;

    if (bookingData.publisherCuit) {
      const marketplaceFeePercent = bookingData.marketplaceFee || 10; // Default 10% marketplace fee
      const marketplaceFeeAmount = Math.round((bookingData.totalAmount * marketplaceFeePercent) / 100);
      const publisherAmount = bookingData.totalAmount - marketplaceFeeAmount;

      console.log('💰 [MobbexService] Calculating split payment:', {
        totalAmount: bookingData.totalAmount,
        marketplaceFeePercent,
        marketplaceFeeAmount,
        publisherAmount,
        publisherCuit: bookingData.publisherCuit
      });

      split = [
        {
          entity: bookingData.publisherCuit, // Publisher's CUIT
          total: publisherAmount,
          reference: `publisher_${bookingData.bookingId}`,
          fee: 0 // No additional fee for publisher
        }
      ];

      // Add marketplace fee as a separate split if there's a fee
      if (marketplaceFeeAmount > 0) {
        split.push({
          entity: 'marketplace', // This should be the marketplace entity ID from system settings
          total: marketplaceFeeAmount,
          reference: `marketplace_${bookingData.bookingId}`,
          fee: 0
        });
      }
    }

    const checkoutData: MobbexCheckoutRequest = {
      total: bookingData.totalAmount,
      description: `Reserva: ${bookingData.postTitle}`,
      currency: bookingData.currency,
      reference: `booking_${bookingData.bookingId}`,
      test: process.env.NODE_ENV === 'development',
      return_url: bookingData.returnUrl || `${process.env.NEXT_PUBLIC_BASE_URL}/payment/complete`,
      webhook: bookingData.webhookUrl || `${process.env.NEXT_PUBLIC_BASE_URL}/api/mobbex/webhook`,
      timeout: 1440, // 24 hours as requested
      items: [
        {
          id: bookingData.bookingId,
          description: bookingData.postTitle,
          total: bookingData.totalAmount,
          quantity: 1,
        }
      ],
      ...(split && { split }) // Add split parameter if available
    };

    console.log('📋 [MobbexService] Prepared checkout data:', checkoutData);

    // Use user credentials if provided, otherwise use global credentials
    if (bookingData.userCredentials) {
      console.log('🔑 [MobbexService] Using user credentials for checkout creation');
      return await this.createCheckoutWithCredentials(checkoutData, bookingData.userCredentials.accessToken);
    } else {
      console.log('🔑 [MobbexService] Using system credentials for checkout creation');
      return await this.createCheckout(checkoutData);
    }
  }

  /**
   * Handle webhook verification and processing
   */
  async processWebhook(webhookData: Record<string, unknown>): Promise<{
    bookingId: string;
    status: 'approved' | 'rejected' | 'pending';
    transactionId?: string;
    paymentMethod?: string;
  }> {
    try {
      // Extract booking ID from reference
      const reference = webhookData.data?.checkout?.reference || webhookData.reference;
      const bookingId = reference?.replace('booking_', '');
      
      if (!bookingId) {
        throw new Error('Invalid webhook data: missing booking reference');
      }

      // Determine status based on Mobbex status codes
      const statusCode = webhookData.data?.payment?.status?.code || webhookData.status?.code;
      let status: 'approved' | 'rejected' | 'pending';
      
      switch (statusCode) {
        case 200:
        case 3:
          status = 'approved';
          break;
        case 400:
        case 2:
          status = 'rejected';
          break;
        default:
          status = 'pending';
      }

      return {
        bookingId,
        status,
        transactionId: webhookData.data?.payment?.id || webhookData.transactionId,
        paymentMethod: webhookData.data?.payment?.source?.type || webhookData.type,
      };
    } catch (error) {
      console.error('Error processing Mobbex webhook:', error);
      throw new Error('Failed to process webhook');
    }
  }
}

export const mobbexService = new MobbexService();
export default mobbexService;