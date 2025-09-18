import { MobbexCredentials } from '@/types';
import { firebaseDB } from '@/services/firebaseService';

const MOBBEX_DEV_CONNECT_API_URL = 'https://api.mobbex.com/p/developer/connect';

export interface MobbexDevConnectRequest {
  returnUrl: string;
}

export interface MobbexDevConnectResponse {
  result: boolean;
  data: {
    id: string;
    url: string;
  };
}

export interface MobbexCredentialsResponse {
  result: boolean;
  data: {
    connectId: string;
    accessToken: string;
    entity: {
      name: string;
      logo?: {
        filename: string;
        url: string;
        mimetype: string;
        extension: string;
        size: number;
        width: number;
        height: number;
        sizes?: {
          medium: string;
          small: string;
          square: string;
        };
        versions?: {
          medium: string;
          small: string;
          square: string;
        };
        created: string;
      };
      taxId: string;
    };
  };
}

class MobbexDevConnectService {
  private apiKey: string | null = null;
  private accessToken: string | null = null;
  private credentialsLoaded: boolean = false;

  constructor() {
    // We'll load credentials from Firestore when needed
  }

  /**
   * Load Mobbex credentials from Firestore systemSettings
   */
  private async loadCredentials(): Promise<void> {
    if (this.credentialsLoaded) return;

    try {
      console.log('Loading Mobbex credentials from system settings...');
      const credentials = await firebaseDB.systemSettings.getMobbexCredentials();
      
      console.log('Raw credentials from Firestore:', {
        exists: !!credentials,
        hasApiKey: !!credentials?.apiKey,
        hasAccessToken: !!credentials?.accessToken,
        isActive: credentials?.isActive,
        apiKeyLength: credentials?.apiKey?.length,
        accessTokenLength: credentials?.accessToken?.length
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
      
      console.log('Mobbex Dev Connect credentials loaded successfully:', {
        apiKeyPrefix: this.apiKey.substring(0, 8) + '...',
        accessTokenPrefix: this.accessToken.substring(0, 8) + '...'
      });
    } catch (error) {
      console.error('Error loading Mobbex credentials from system settings:', error);
      throw error;
    }
  }

  /**
   * Create a Dev Connect request
   * @param returnUrl - URL to redirect after connection process
   * @returns Promise with connection URL and ID
   */
  async createConnection(returnUrl: string): Promise<MobbexDevConnectResponse> {
    try {
      // Load credentials from Firestore
      await this.loadCredentials();

      if (!this.apiKey) {
        throw new Error('Mobbex API key is not configured in system settings. Please contact the Superadmin to configure Mobbex credentials.');
      }

      console.log('Creating Mobbex Dev Connect request with URL:', returnUrl);
      console.log('Using API Key from system settings:', this.apiKey.substring(0, 8) + '...');

      const response = await fetch(MOBBEX_DEV_CONNECT_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.apiKey,
        },
        body: JSON.stringify({
          returnUrl,
        }),
      });

      console.log('Mobbex Dev Connect response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Mobbex Dev Connect error response:', {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          body: errorText
        });
        
        if (response.status === 401) {
          throw new Error(`Invalid Mobbex API key in system settings. Status: ${response.status}, Response: ${errorText}. Please contact the Superadmin to update Mobbex credentials.`);
        } else if (response.status === 400) {
          throw new Error(`Invalid request parameters. Status: ${response.status}, Response: ${errorText}. Please check the return URL format.`);
        } else {
          throw new Error(`Mobbex API error: ${response.status} - ${errorText}`);
        }
      }

      const data: MobbexDevConnectResponse = await response.json();
      console.log('Mobbex Dev Connect response data:', data);
      
      if (!data.result) {
        throw new Error('Failed to create Mobbex Dev Connect request');
      }

      return data;
    } catch (error) {
      console.error('Error creating Mobbex Dev Connect request:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to create Mobbex connection request');
    }
  }

  /**
   * Get credentials after successful connection
   * @param connectId - Connection ID returned from createConnection
   * @returns Promise with user credentials
   */
  async getCredentials(connectId: string): Promise<MobbexCredentialsResponse> {
    try {
      // Load credentials from Firestore
      await this.loadCredentials();

      if (!this.apiKey) {
        throw new Error('Mobbex API key is not configured in system settings. Please contact the Superadmin to configure Mobbex credentials.');
      }

      const response = await fetch(`${MOBBEX_DEV_CONNECT_API_URL}/${connectId}/credentials`, {
        method: 'GET',
        headers: {
          'X-API-Key': this.apiKey,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Mobbex get credentials error response:', errorText);
        
        if (response.status === 401) {
          throw new Error('Invalid Mobbex API key in system settings. Please contact the Superadmin to update Mobbex credentials.');
        } else {
          throw new Error(`Mobbex API error: ${response.status} - ${errorText}`);
        }
      }

      const data: MobbexCredentialsResponse = await response.json();
      
      if (!data.result) {
        throw new Error('Failed to get Mobbex credentials');
      }

      return data;
    } catch (error) {
      console.error('Error getting Mobbex credentials:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to get Mobbex credentials');
    }
  }

  /**
   * Process the return URL parameters to extract connection status
   * @param url - The return URL with query parameters
   * @returns Object with connection status and connectId
   */
  processReturnUrl(url: string): { status: 'done' | 'cancelled'; connectId?: string } {
    try {
      const urlObj = new URL(url);
      const status = urlObj.searchParams.get('connectstatus') as 'done' | 'cancelled';
      const connectId = urlObj.searchParams.get('connectid') || undefined;
      
      return { status, connectId };
    } catch (error) {
      console.error('Error processing return URL:', error);
      return { status: 'cancelled' };
    }
  }

  /**
   * Validate if the API key is configured
   * @returns boolean indicating if API key is available
   */
  isConfigured(): boolean {
    return this.credentialsLoaded && !!this.apiKey;
  }

  /**
   * Check if Mobbex credentials are available in system settings
   * @returns Promise<boolean> indicating if credentials are available
   */
  async checkSystemCredentials(): Promise<boolean> {
    try {
      await this.loadCredentials();
      return this.credentialsLoaded && !!this.apiKey;
    } catch (error) {
      console.error('Error checking system credentials:', error);
      return false;
    }
  }
}

export const mobbexDevConnectService = new MobbexDevConnectService();
