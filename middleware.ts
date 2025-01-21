import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define which routes can be accessed by which roles
const ADMIN_ROUTES = ['/api/users']; // Only admin can access
const PROTECTED_ROUTES = ['/api/farmers', '/api/test']; // Both admin and staff can access

export async function middleware(request: NextRequest) {
	try {
		console.log('Middleware:', request.nextUrl.pathname);
		// Check if it's a protected route
		const isAdminRoute = ADMIN_ROUTES.some((route) => request.nextUrl.pathname.startsWith(route));
		const isProtectedRoute = PROTECTED_ROUTES.some((route) => request.nextUrl.pathname.startsWith(route));

		if (!isAdminRoute && !isProtectedRoute) {
			return NextResponse.next();
		}

		// Get session cookie
		const session = request.cookies.get('session');

		if (!session) {
			return NextResponse.json({ error: 'Unauthorized - No session found' }, { status: 401 });
		}

		// Parse session data
		const sessionData = JSON.parse(session.value);

		// Check session expiration
		if (sessionData.exp < Date.now()) {
			return NextResponse.json({ error: 'Session expired' }, { status: 401 });
		}

		// For admin routes, check if user is admin
		if (isAdminRoute && sessionData.role !== 'ADMIN') {
			return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
		}

		// Add user info to request headers for use in API routes
		const requestHeaders = new Headers(request.headers);
		requestHeaders.set('x-user-id', sessionData.userId.toString());
		requestHeaders.set('x-user-role', sessionData.role);

		console.log('Ending middleware');
		return NextResponse.next({
			headers: requestHeaders,
		});
	} catch (error) {
		console.error('Middleware error:', error);
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}

// Configure which routes use this middleware
export const config = {
	matcher: ['/api/users/:path*', '/api/farmers/:path*', '/api/test'],
};
