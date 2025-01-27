import { NextResponse } from 'next/server';
import prisma from '@/utils/prisma';
import { createHash } from 'crypto';
import { Role } from '@prisma/client';

export async function POST(request: Request) {
	try {
		const userRole = request.headers.get('x-user-role');
		if (userRole !== 'ADMIN') {
			return NextResponse.json({ error: 'Only admins can create users' }, { status: 403 });
		}
		const body = await request.json();
		const { email, password, name } = body;
		if (!email || !password || !name) {
			return NextResponse.json({ error: 'Email, password, and name are required' }, { status: 400 });
		}
		const hashedPassword = createHash('sha256').update(password).digest('hex');
		const newUser = await prisma.user.create({
			data: {
				email,
				password: hashedPassword,
				name,
				role: Role.STAFF,
			},
			select: {
				id: true,
				email: true,
				name: true,
				role: true,
				createdAt: true,
			},
		});
		return NextResponse.json({ user: newUser });
	} catch (error: unknown) {
		if ((error as { code?: string }).code === 'P2002') {
			return NextResponse.json({ error: 'Email already exists' }, { status: 400 });
		}
		console.error('Create user error:', error);
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}
export async function GET(request: Request) {
	try {
		const userRole = request.headers.get('x-user-role');
		if (userRole !== 'ADMIN') {
			return NextResponse.json({ error: 'Only admins can list users' }, { status: 403 });
		}
		const users = await prisma.user.findMany({
			where: {
				role: Role.STAFF,
			},
			select: {
				id: true,
				email: true,
				name: true,
				role: true,
				isActive: true,
				createdAt: true,
			},
			orderBy: {
				createdAt: 'asc',
			},
		});
		return NextResponse.json({ users });
	} catch (error) {
		console.error('List users error:', error);
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}
