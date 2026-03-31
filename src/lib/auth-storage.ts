/**
 * Enhanced authentication storage with cookies + localStorage
 * Ensures auth persists across page reloads on production (Vercel)
 */

import { User } from '@/hooks/useAuth';

// Use both localStorage and cookies for maximum compatibility
export function saveAuthUser(user: User): void {
  try {
    const userJson = JSON.stringify(user);
    
    // Save to localStorage (immediate access)
    if (typeof window !== 'undefined') {
      localStorage.setItem('user', userJson);
      sessionStorage.setItem('user', userJson);
    }
    
    // Save to cookies (persists across page reloads, sent with requests)
    if (typeof document !== 'undefined') {
      // Set cookie to expire in 7 days
      const expires = new Date();
      expires.setDate(expires.getDate() + 7);
      document.cookie = `auth_user=${encodeURIComponent(userJson)}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
      document.cookie = `auth_id=${user.id}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
      document.cookie = `auth_role=${user.role}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
    }
  } catch (error) {
    console.error('Failed to save auth user:', error);
  }
}

export function getAuthUser(): User | null {
  try {
    if (typeof window === 'undefined') return null;
    
    // Try localStorage first (fastest)
    let userJson = localStorage.getItem('user');
    
    // Fallback to sessionStorage
    if (!userJson) {
      userJson = sessionStorage.getItem('user');
    }
    
    // Fallback to cookies
    if (!userJson && typeof document !== 'undefined') {
      const cookies = document.cookie.split(';');
      for (const cookie of cookies) {
        if (cookie.trim().startsWith('auth_user=')) {
          userJson = decodeURIComponent(cookie.trim().substring(10));
          break;
        }
      }
    }
    
    return userJson ? (JSON.parse(userJson) as User) : null;
  } catch (error) {
    console.error('Failed to get auth user:', error);
    return null;
  }
}

export function clearAuthUser(): void {
  try {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user');
      sessionStorage.removeItem('user');
    }
    
    // Clear cookies
    if (typeof document !== 'undefined') {
      document.cookie = 'auth_user=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax';
      document.cookie = 'auth_id=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax';
      document.cookie = 'auth_role=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax';
    }
  } catch (error) {
    console.error('Failed to clear auth user:', error);
  }
}

/**
 * Get auth user synchronously without needing useEffect
 * Useful for initial page load before hydration
 */
export function getAuthUserSync(): User | null {
  if (typeof document === 'undefined') return null;
  
  try {
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      if (cookie.trim().startsWith('auth_user=')) {
        const userJson = decodeURIComponent(cookie.trim().substring(10));
        return JSON.parse(userJson) as User;
      }
    }
  } catch (error) {
    console.error('Failed to get auth user from cookies:', error);
  }
  
  return null;
}
