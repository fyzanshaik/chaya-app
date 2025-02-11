import { NextResponse } from 'next/server';
import prisma from '@/utils/prisma';

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
	try {
		const userRole = request.headers.get('x-user-role');
		const { id } = await params;

		if (!id) {
			return NextResponse.json({ error: 'Invalid identifier provided' }, { status: 400 });
		}

		if (userRole !== 'ADMIN') {
			return NextResponse.json({ error: 'Only admins can delete user records' }, { status: 403 });
		}

		const userId = Number.parseInt(id);
		if (isNaN(userId)) {
			return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
		}

		// Find user
		const user = await prisma.user.findUnique({
			where: { id: userId },
		});

		if (!user) {
			return NextResponse.json({ error: 'User not found' }, { status: 404 });
		}

		// Delete user
		await prisma.user.delete({
			where: { id: userId },
		});

		return NextResponse.json({
			message: 'User deleted successfully',
		});
	} catch (error) {
		console.error('Delete user error:', error);

		if (error instanceof Error) {
			return NextResponse.json(
				{
					error: 'Failed to delete user record',
					detail: error.message,
				},
				{ status: 500 }
			);
		}

		return NextResponse.json({ error: 'Failed to delete user record' }, { status: 500 });
	}
}
