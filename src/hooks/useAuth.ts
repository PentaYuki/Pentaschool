'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAuthUser, clearAuthUser } from '@/lib/auth-storage';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'STUDENT' | 'TEACHER' | 'ADMIN';
  isActive?: boolean;
}

interface UseAuthOptions {
  requiredRole?: 'STUDENT' | 'TEACHER' | 'ADMIN';
  redirectOnUnauth?: boolean;
}

export const useAuth = (options: UseAuthOptions = {}) => {
  const router = useRouter();
  const { 
    requiredRole, 
    redirectOnUnauth = true 
  } = options;

  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize user from persistent storage (localStorage/cookies) on mount only
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Check if we're on client side
        if (typeof window === 'undefined') {
          setIsLoading(false);
          return;
        }

        const authUser = getAuthUser();
        
        if (!authUser) {
          if (redirectOnUnauth) {
            router.push('/auth/login');
          }
          setIsLoading(false);
          return;
        }

        // Check student active status
        if (authUser.role === 'STUDENT' && !authUser.isActive) {
          clearAuthUser();
          router.push('/auth/login?error=inactive');
          setIsLoading(false);
          return;
        }

        // Check required role
        if (requiredRole && authUser.role !== requiredRole) {
          const redirectPath = authUser.role === 'TEACHER' || authUser.role === 'ADMIN' 
            ? '/teacher' 
            : '/student';
          router.push(redirectPath);
          setIsLoading(false);
          return;
        }

        setUser(authUser);
      } catch (error) {
        console.error('Failed to initialize auth:', error);
        clearAuthUser();
        if (redirectOnUnauth) {
          router.push('/auth/login');
        }
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []); // Empty dependency - only run on mount

  const logout = () => {
    clearAuthUser();
    setUser(null);
    router.push('/auth/login');
  };

  return {
    user,
    isLoading,
    logout,
    isAuthenticated: !!user,
  };
};
