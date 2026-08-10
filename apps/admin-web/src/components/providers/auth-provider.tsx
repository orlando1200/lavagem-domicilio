'use client';

import { useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import Cookies from 'js-cookie';

import { getMe } from '@/lib/api/auth';
import { TOKEN_COOKIE } from '@/lib/api-client';
import { AuthContext } from '@/hooks/use-auth';

/**
 * Reconfirma o usuario/role contra dado vivo (GET /users/me) a cada
 * carregamento das rotas protegidas — o middleware so checa presenca
 * do cookie, nao decodifica o JWT. 401 ja e tratado pelo interceptor
 * do api-client (limpa cookie + redireciona); aqui so cobrimos o caso
 * de token valido mas role != ADMIN.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const { data: user, isLoading, isError } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: getMe,
    retry: false,
  });

  const logout = useCallback(() => {
    Cookies.remove(TOKEN_COOKIE);
    router.push('/login');
  }, [router]);

  useEffect(() => {
    if (isError) {
      logout();
      return;
    }
    if (user && user.role !== 'ADMIN') {
      logout();
    }
  }, [isError, user, logout]);

  return (
    <AuthContext.Provider value={{ user: user ?? null, isLoading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
