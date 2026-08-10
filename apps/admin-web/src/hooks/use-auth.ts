import { createContext, useContext } from 'react';
import type { AdminUser } from '@/lib/types';

export interface AuthContextValue {
  user: AdminUser | null;
  isLoading: boolean;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
