import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST() {
	try {
		const cookieStore = await cookies();
		cookieStore.delete('session');

		return NextResponse.json({
			message: 'Logged out successfully',
		});
	} catch (error) {
		console.error('Logout error:', error);
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}
