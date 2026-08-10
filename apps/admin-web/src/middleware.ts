import { NextRequest, NextResponse } from 'next/server';
import { TOKEN_COOKIE } from './lib/constants';

/**
 * Gate rapido de borda: so confere a PRESENCA do cookie de sessao, sem
 * decodificar/verificar o JWT (isso e trabalho do backend a cada
 * chamada). O AuthProvider client-side reconfirma o usuario/role
 * contra dado vivo (GET /users/me) em seguida — middleware so evita o
 * flash de UI protegida pra visitante anonimo.
 */
export function middleware(request: NextRequest) {
  const token = request.cookies.get(TOKEN_COOKIE)?.value;
  const isLoginPage = request.nextUrl.pathname === '/login';

  if (!token && !isLoginPage) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  if (token && isLoginPage) {
    return NextResponse.redirect(new URL('/pedidos', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
