import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { firebaseDB } from '@/services/firebaseService';
import { SubscriptionPlan, UserSubscription } from '@/types';

export function useUserPlan() {
  const { user, hasRole } = useAuth();
  const [userPlan, setUserPlan] = useState<SubscriptionPlan | null>(null);
  const [userSubscription, setUserSubscription] = useState<UserSubscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    loadUserPlan();
  }, [user]);

  const loadUserPlan = async () => {
    try {
      setIsLoading(true);

      // Only check for plans if user has publisher role
      if (!hasRole('publisher')) {
        setIsLoading(false);
        return;
      }

      // For now, we'll use a mock plan since we don't have real subscriptions yet
      // In the future, this would fetch the user's actual subscription
      const mockPlan: SubscriptionPlan = {
        id: 'mock-plan',
        name: 'Basic Plan',
        description: 'Basic publishing plan',
        price: 9.99,
        currency: 'ARS',
        billingCycle: 'monthly',
        features: ['Basic publishing', 'Standard support'],
        maxPosts: 10,
        maxBookings: 5,
        isActive: true,
        isVisible: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'system',
        updatedBy: 'system'
      };

      setUserPlan(mockPlan);
      setUserSubscription(null);
    } catch (error) {
      console.error('Error loading user plan:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshPlan = () => {
    loadUserPlan();
  };

  return {
    userPlan,
    userSubscription,
    isLoading,
    refreshPlan
  };
}
