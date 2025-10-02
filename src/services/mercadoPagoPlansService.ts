import { MercadoPagoAccount, SubscriptionPlan, MercadoPagoPlan } from '@/types';
import { firebaseDB } from './firebaseService';

export interface MercadoPagoSubscriptionPlan {
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

class MercadoPagoPlansService {
  private accessToken: string = '';
  private publicKey: string = '';
  private baseUrl: string = 'https://api.mercadopago.com';

  constructor(account?: MercadoPagoAccount) {
    if (account) {
      this.setAccount(account);
    }
  }

  setAccount(account: MercadoPagoAccount) {
    this.accessToken = account.accessToken;
    this.publicKey = account.publicKey;
  }

  /**
   * Create a subscription plan in MercadoPago
   */
  async createPlan(planData: MercadoPagoSubscriptionPlan): Promise<MercadoPagoPlan> {
    if (!this.accessToken) {
      throw new Error('MercadoPago account not configured');
    }

    const response = await fetch(`${this.baseUrl}/preapproval_plan`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(planData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`MercadoPago API error: ${errorData.message || response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get a subscription plan from MercadoPago
   */
  async getPlan(planId: string): Promise<MercadoPagoPlan> {
    if (!this.accessToken) {
      throw new Error('MercadoPago account not configured');
    }

    const response = await fetch(`${this.baseUrl}/preapproval_plan/${planId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`MercadoPago API error: ${errorData.message || response.statusText}`);
    }

    return response.json();
  }

  /**
   * Update a subscription plan in MercadoPago
   */
  async updatePlan(planId: string, updates: Partial<MercadoPagoSubscriptionPlan>): Promise<MercadoPagoPlan> {
    if (!this.accessToken) {
      throw new Error('MercadoPago account not configured');
    }

    const response = await fetch(`${this.baseUrl}/preapproval_plan/${planId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`MercadoPago API error: ${errorData.message || response.statusText}`);
    }

    return response.json();
  }

  /**
   * Delete a subscription plan from MercadoPago
   */
  async deletePlan(planId: string): Promise<void> {
    if (!this.accessToken) {
      throw new Error('MercadoPago account not configured');
    }

    const response = await fetch(`${this.baseUrl}/preapproval_plan/${planId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`MercadoPago API error: ${errorData.message || response.statusText}`);
    }
  }

  /**
   * Sync platform subscription plan with MercadoPago
   */
  async syncPlatformPlan(platformPlan: SubscriptionPlan): Promise<MercadoPagoPlan> {
    const mercadoPagoPlan: MercadoPagoSubscriptionPlan = {
      id: platformPlan.id,
      name: platformPlan.name,
      description: platformPlan.description,
      amount: platformPlan.price,
      currency: platformPlan.currency,
      frequency: {
        type: platformPlan.billingCycle as 'day' | 'week' | 'month' | 'year',
        frequency: 1, // Default to 1 cycle
      },
      repetitions: 0, // Unlimited for subscription plans
      free_trial: {
        frequency: platformPlan.trialDays || 0,
        frequency_type: 'day',
      },
      payment_methods: {
        excluded_payment_types: [],
        excluded_payment_methods: [],
        installments: 12,
      },
      back_urls: {
        success: `${process.env.NEXT_PUBLIC_BASE_URL}/subscription/success`,
        failure: `${process.env.NEXT_PUBLIC_BASE_URL}/subscription/failure`,
        pending: `${process.env.NEXT_PUBLIC_BASE_URL}/subscription/pending`,
      },
      auto_recurring: true,
      reason: `Suscripción: ${platformPlan.name}`,
      external_reference: platformPlan.id,
    };

    // Check if plan already exists in MercadoPago
    try {
      const existingPlan = await this.getPlan(platformPlan.id);
      // Update existing plan
      return await this.updatePlan(platformPlan.id, mercadoPagoPlan);
    } catch (error) {
      // Plan doesn't exist, create new one
      return await this.createPlan(mercadoPagoPlan);
    }
  }

  /**
   * Sync all platform subscription plans with MercadoPago
   */
  async syncAllPlatformPlans(): Promise<{ success: number; errors: number; results: Array<{ planId: string; status: 'success' | 'error'; error?: string }> }> {
    try {
      const platformPlans = await firebaseDB.plans.getAll();
      const results: Array<{ planId: string; status: 'success' | 'error'; error?: string }> = [];
      let success = 0;
      let errors = 0;

      for (const plan of platformPlans) {
        try {
          await this.syncPlatformPlan(plan);
          results.push({ planId: plan.id, status: 'success' });
          success++;
        } catch (error) {
          results.push({ 
            planId: plan.id, 
            status: 'error', 
            error: error instanceof Error ? error.message : 'Unknown error' 
          });
          errors++;
        }
      }

      return { success, errors, results };
    } catch (error) {
      console.error('Error syncing platform plans:', error);
      throw error;
    }
  }

  /**
   * Create a subscription for a user
   */
  async createUserSubscription(userId: string, planId: string, userEmail: string): Promise<string> {
    if (!this.accessToken) {
      throw new Error('MercadoPago account not configured');
    }

    const subscriptionData = {
      reason: `Suscripción para usuario ${userId}`,
      auto_recurring: {
        frequency: 1,
        frequency_type: 'months',
        transaction_amount: 0, // Will be set by the plan
        currency_id: 'ARS',
        start_date: new Date().toISOString(),
        end_date: null,
      },
      payer_email: userEmail,
      back_url: `${process.env.NEXT_PUBLIC_BASE_URL}/subscription/complete`,
      status: 'pending',
    };

    const response = await fetch(`${this.baseUrl}/preapproval`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(subscriptionData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`MercadoPago API error: ${errorData.message || response.statusText}`);
    }

    const result = await response.json();
    return result.id;
  }

  /**
   * Get subscription details
   */
  async getSubscription(subscriptionId: string): Promise<any> {
    if (!this.accessToken) {
      throw new Error('MercadoPago account not configured');
    }

    const response = await fetch(`${this.baseUrl}/preapproval/${subscriptionId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`MercadoPago API error: ${errorData.message || response.statusText}`);
    }

    return response.json();
  }

  /**
   * Cancel a subscription
   */
  async cancelSubscription(subscriptionId: string): Promise<void> {
    if (!this.accessToken) {
      throw new Error('MercadoPago account not configured');
    }

    const response = await fetch(`${this.baseUrl}/preapproval/${subscriptionId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status: 'cancelled'
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`MercadoPago API error: ${errorData.message || response.statusText}`);
    }
  }

  /**
   * Check if account is configured
   */
  isConfigured(): boolean {
    return !!(this.accessToken && this.publicKey);
  }
}

export default MercadoPagoPlansService;
