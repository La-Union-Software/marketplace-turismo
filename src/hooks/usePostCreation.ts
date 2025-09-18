import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { firebaseDB } from '@/services/firebaseService';
import { SubscriptionPlan, UserSubscription } from '@/types';

export function usePostCreation() {
  const { user, hasRole } = useAuth();
  const router = useRouter();
  const [canCreatePost, setCanCreatePost] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userPlan, setUserPlan] = useState<SubscriptionPlan | null>(null);
  const [userSubscription, setUserSubscription] = useState<UserSubscription | null>(null);

  useEffect(() => {
    if (!user) {
      setCanCreatePost(false);
      setIsLoading(false);
      return;
    }

    checkPostCreationAbility();
  }, [user, hasRole]); // Add hasRole as dependency to re-run when roles change

  const checkPostCreationAbility = async () => {
    try {
      setIsLoading(true);
      
      console.log('Checking post creation ability for user:', user?.id);
      console.log('User roles:', user?.roles);
      console.log('Has publisher role:', hasRole('publisher'));

      // Check if user has publisher role
      if (!hasRole('publisher')) {
        console.log('User does not have publisher role, denying access');
        setCanCreatePost(false);
        setIsLoading(false);
        return;
      }

      // For now, if user has publisher role, allow them to create posts
      // In the future, this will check subscription and post limits
      console.log('User has publisher role, allowing post creation');
      setCanCreatePost(true);
      
      // Mock plan data for now
      const mockPlan: SubscriptionPlan = {
        id: 'mock-plan',
        name: 'Basic Plan',
        description: 'Basic publishing plan',
        price: 9.99,
        currency: 'USD',
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
      setUserSubscription(null); // No subscription record yet
    } catch (error) {
      console.error('Error checking post creation ability:', error);
      setCanCreatePost(false);
    } finally {
      setIsLoading(false);
    }
  };

  const getUserActiveSubscription = async (): Promise<UserSubscription | null> => {
    try {
      // This would be implemented to get the user's active subscription
      // For now, return null to simulate no subscription
      return null;
    } catch (error) {
      console.error('Error getting user subscription:', error);
      return null;
    }
  };

  const getPlanDetails = async (planId: string): Promise<SubscriptionPlan | null> => {
    try {
      // This would get the plan details from the plans collection
      // For now, return null
      return null;
    } catch (error) {
      console.error('Error getting plan details:', error);
      return null;
    }
  };

  const getUserPostCount = async (): Promise<number> => {
    try {
      // This would count the user's active posts
      // For now, return 0
      return 0;
    } catch (error) {
      console.error('Error getting user post count:', error);
      return 0;
    }
  };

  const redirectToSubscription = () => {
    router.push('/suscribirse');
  };

  const redirectToPosts = () => {
    router.push('/posts');
  };

  const forceRefresh = () => {
    console.log('Force refreshing post creation check...');
    checkPostCreationAbility();
  };

  return {
    canCreatePost,
    isLoading,
    userPlan,
    userSubscription,
    redirectToSubscription,
    redirectToPosts,
    refreshCheck: checkPostCreationAbility,
    forceRefresh
  };
}
