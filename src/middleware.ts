import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

// Rotas protegidas – requer autenticação
const PROTECTED_PATHS = ['/grape', '/dashboard'];
// Rotas admin-only
const ADMIN_PATHS = ['/admin'];

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    const isProtected = PROTECTED_PATHS.some((p) => pathname.startsWith(p));
    const isAdmin = ADMIN_PATHS.some((p) => pathname.startsWith(p));

    if (!isProtected && !isAdmin) {
        return NextResponse.next();
    }

    const session = await auth();

    // Sem sessão → redireciona para login
    if (!session?.user) {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('callbackUrl', pathname);
        return NextResponse.redirect(loginUrl);
    }

    // Rota admin → verifica role
    if (isAdmin) {
        const role = (session.user as { role?: string }).role;
        if (role !== 'ADMIN') {
            return NextResponse.redirect(new URL('/dashboard', request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/grape/:path*',
        '/dashboard/:path*',
        '/admin/:path*',
    ],
};
