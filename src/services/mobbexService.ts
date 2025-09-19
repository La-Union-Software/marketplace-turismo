// Mobbex Checkout Service
// Based on the Mobbex API documentation: https://mobbex.dev/checkout

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
  private apiKey: string;
  private accessToken: string;
  private baseUrl: string = 'https://api.mobbex.com/p/checkout';

  constructor() {
    // These should come from environment variables
    this.apiKey = process.env.NEXT_PUBLIC_MOBBEX_API_KEY || '';
    this.accessToken = process.env.NEXT_PUBLIC_MOBBEX_ACCESS_TOKEN || '';
  }

  private getHeaders() {
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
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          ...data,
          test: process.env.NODE_ENV === 'development' || data.test || false,
          timeout: data.timeout || 1440, // 24 hours default
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Mobbex API Error: ${errorData.message || response.statusText}`);
      }

      const result = await response.json();
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
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.apiKey,
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
        throw new Error(`Mobbex API Error: ${errorData.message || response.statusText}`);
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
      const response = await fetch(`${this.baseUrl}/${checkoutId}`, {
        method: 'GET',
        headers: this.getHeaders(),
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
      const response = await fetch(`${this.baseUrl}/${checkoutId}`, {
        method: 'DELETE',
        headers: this.getHeaders(),
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
   * Create checkout for booking payment
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
    userCredentials?: {
      accessToken: string;
      entity: {
        name: string;
        taxId: string;
      };
    };
  }): Promise<MobbexCheckoutResponse> {
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
      ]
    };

    // Use user credentials if provided, otherwise use global credentials
    if (bookingData.userCredentials) {
      return await this.createCheckoutWithCredentials(checkoutData, bookingData.userCredentials.accessToken);
    } else {
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