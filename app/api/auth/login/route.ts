import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import prisma from '@/utils/prisma';
import { createHash } from 'crypto';
export async function POST(request: Request) {
	try {
		const body = await request.json();
		const { email, password } = body;
		if (!email || !password) {
			return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
		}
		const user = await prisma.user.findUnique({
			where: { email },
		});
		if (!user) {
			return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
		}
		const hashedPassword = createHash('sha256').update(password).digest('hex');
		if (user.password !== hashedPassword) {
			return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
		}
		const sessionToken = {
			userId: user.id,
			role: user.role,
			exp: Date.now() + 7 * 24 * 60 * 60 * 1000,
		};
		(await cookies()).set('session', JSON.stringify(sessionToken), {
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			sameSite: 'strict',
			maxAge: 7 * 24 * 60 * 60,
		});
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const { password: _, ...userData } = user;
		return NextResponse.json({
			user: userData,
		});
	} catch (error) {
		console.error('Login error:', error);
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}
