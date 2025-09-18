'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole } from '@/types';
import { firebaseAuth, firebaseDB } from '@/services/firebaseService';
import { User as FirebaseUser } from 'firebase/auth';
import { usePermissions } from '@/services/permissionsService';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (email: string, password: string, userData: Partial<User>) => Promise<boolean>;
  logout: () => Promise<void>;
  isLoading: boolean;
  // Role management
  assignRole: (userId: string, roleName: UserRole) => Promise<void>;
  removeRole: (userId: string, roleName: UserRole) => Promise<void>;
  // Permission checking
  hasPermission: (permissionId: string) => boolean;
  hasRole: (roleName: UserRole) => boolean;
  canPerformAction: (resource: string, action: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Get permissions for the current user
  const permissions = usePermissions(user?.roles || []);

  useEffect(() => {
    // Listen to Firebase auth state changes
    const unsubscribe = firebaseAuth.onAuthStateChanged(async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        try {
          // Get user data from database
          const userData = await firebaseDB.users.getById(firebaseUser.uid);
          if (userData) {
            setUser(userData);
          } else {
            // If user data doesn't exist in database, create it with default client role
            const defaultRole = {
              roleId: 'role_client',
              roleName: 'client' as UserRole,
              assignedAt: new Date(),
              isActive: true,
            };

            const newUser: User = {
              id: firebaseUser.uid,
              name: firebaseUser.displayName || 'User',
              email: firebaseUser.email || '',
              phone: '',
              avatar: firebaseUser.photoURL || '',
              roles: [defaultRole],
              isActive: true,
              emailVerified: firebaseUser.emailVerified,
              createdAt: new Date(),
              updatedAt: new Date(),
              profileCompleted: false,
            };
            
            await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
            setUser(newUser);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    // Cleanup subscription
    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      await firebaseAuth.signIn(email, password);
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (email: string, password: string, userData: Partial<User>): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      await firebaseAuth.signUp(email, password, userData);
      return true;
    } catch (error) {
      console.error('Signup error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await firebaseAuth.signOut();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Role management functions
  const assignRole = async (userId: string, roleName: UserRole): Promise<void> => {
    try {
      await firebaseDB.users.assignRole(userId, roleName, user?.id);
      
      // Update local user state if assigning to current user
      if (userId === user?.id) {
        const updatedUser = await firebaseDB.users.getById(userId);
        if (updatedUser) {
          setUser(updatedUser);
        }
      }
    } catch (error) {
      console.error('Error assigning role:', error);
      throw error;
    }
  };

  const removeRole = async (userId: string, roleName: UserRole): Promise<void> => {
    try {
      await firebaseDB.users.removeRole(userId, roleName, user?.id);
      
      // Update local user state if removing from current user
      if (userId === user?.id) {
        const updatedUser = await firebaseDB.users.getById(userId);
        if (updatedUser) {
          setUser(updatedUser);
        }
      }
    } catch (error) {
      console.error('Error removing role:', error);
      throw error;
    }
  };

  const contextValue: AuthContextType = {
    user,
    login,
    signup,
    logout,
    isLoading,
    assignRole,
    removeRole,
    hasPermission: permissions.hasPermission,
    hasRole: permissions.hasRole,
    canPerformAction: permissions.canPerformAction,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 