import { NextResponse } from 'next/server';
import prisma from '@/utils/prisma';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
	try {
		const userRole = request.headers.get('x-user-role');

		if (userRole !== 'ADMIN') {
			return NextResponse.json({ error: 'Only admins can modify user status' }, { status: 403 });
		}

		const { id } = await params;

		const userId = parseInt(id);

		const user = await prisma.user.findUnique({
			where: { id: userId },
		});

		if (!user) {
			return NextResponse.json({ error: 'User not found' }, { status: 404 });
		}

		if (user.role === 'ADMIN') {
			const adminCount = await prisma.user.count({
				where: {
					role: 'ADMIN',
					isActive: true,
				},
			});

			if (adminCount === 1 && user.isActive) {
				return NextResponse.json({ error: 'Cannot deactivate the last admin user' }, { status: 400 });
			}
		}

		const updatedUser = await prisma.user.update({
			where: { id: userId },
			data: {
				isActive: !user.isActive,
			},
			select: {
				id: true,
				email: true,
				name: true,
				role: true,
				isActive: true,
			},
		});

		return NextResponse.json({
			message: `User ${updatedUser.isActive ? 'activated' : 'deactivated'} successfully`,
			user: updatedUser,
		});
	} catch (error) {
		console.error('Error toggling user status:', error);
		return NextResponse.json({ error: 'Failed to update user status' }, { status: 500 });
	}
}
