import { NextResponse } from 'next/server';

export async function GET(request: Request) {
	try {
		const userId = request.headers.get('x-user-id');
		const userRole = request.headers.get('x-user-role');

		return NextResponse.json({
			message: 'Auth test successful',
			user: {
				id: userId,
				role: userRole,
			},
			sessionExists: true,
		});
	} catch (error) {
		console.error('Test route error:', error);
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}
