// import { PrismaClient, Role } from '@prisma/client';
// import { createHash } from 'crypto';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PrismaClient, Role } = require('@prisma/client');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { createHash } = require('crypto');
const prisma = new PrismaClient();

async function main() {
	const hashPassword = (password) => {
		return createHash('sha256').update(password).digest('hex');
	};

	const adminUsers = [
		{
			email: 'admin1@test.com',
			password: hashPassword('admin123'),
			name: 'John Admin',
			role: Role.ADMIN,
		},
		{
			email: 'admin2@test.com',
			password: hashPassword('admin456'),
			name: 'Sarah Admin',
			role: Role.ADMIN,
		},
		{
			email: 'admin3@test.com',
			password: hashPassword('admin789'),
			name: 'Mike Admin',
			role: Role.ADMIN,
		},
		{
			email: 'aniketh@admin.com',
			password: hashPassword('aniketh123'),
			name: 'Mike Admin',
			role: Role.ADMIN,
		},
	];

	for (const admin of adminUsers) {
		await prisma.user.upsert({
			where: { email: admin.email },
			update: {},
			create: admin,
		});
	}

	console.log('Seed completed:', adminUsers.length, 'admin users created');
}

main()
	.catch((e) => {
		console.error(e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
