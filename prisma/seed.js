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
			email: 'chaya@admin.com',
			password: hashPassword('chaya123'),
			name: 'Chaya Admin',
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
