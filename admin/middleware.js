import { NextResponse } from 'next/server';

export function middleware(request) {
  // Membaca cookie sesuai instruksi: tkj_token
  const token = request.cookies.get('tkj_token')?.value;
  const { pathname } = request.nextUrl;

  // Rute yang perlu dilindungi sesuai instruksi
  const protectedRoutes = ['/dashboard', '/orders', '/products', '/customers', '/promos', '/stores'];
  
  // Cek apakah pathname saat ini dimulai dengan salah satu rute yang dilindungi
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));

  if (isProtectedRoute && !token) {
    // Redirect ke login jika tidak ada token
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname === '/login' && token) {
    // Redirect ke dashboard jika sudah login mencoba akses halaman login
    const dashboardUrl = new URL('/dashboard', request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  return NextResponse.next();
}

export const config = {
  // Mengecualikan asset statis, API, dan Next.js internals
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
