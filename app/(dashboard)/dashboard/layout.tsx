'use client';

import { useAuthStore } from '@/lib/utils/authStore';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import AppSidebar from '../components/AppSidebar';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
	const { isAuthenticated, hydrated } = useAuthStore();
	const router = useRouter();

	useEffect(() => {
		if (hydrated && !isAuthenticated) {
			router.push('/signin');
		}
	}, [hydrated, isAuthenticated, router]);

	if (!isAuthenticated) {
		return null;
	}

	return (
		<div className="flex h-screen overflow-hidden bg-[#f8f9fa] dark:bg-gray-900">
			<motion.aside
				initial={{ x: -240 }}
				animate={{ x: 0 }}
				transition={{ type: 'spring', damping: 20, stiffness: 100 }}
				className={cn('w-64 border-r border-gray-200 dark:border-gray-800', 'bg-white dark:bg-gray-900/50', 'backdrop-blur-sm')}
			>
				<AppSidebar />
			</motion.aside>
			<motion.main initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }} className="flex-1 overflow-hidden bg-[#f8f9fa] dark:bg-gray-900">
				{children}
			</motion.main>
		</div>
	);
}
