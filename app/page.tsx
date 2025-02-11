'use client';

import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/utils/authStore';
import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

export default function Home() {
	const { isAuthenticated } = useAuthStore();
	const router = useRouter();
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const redirectUser = async () => {
			try {
				if (isAuthenticated) {
					await router.push('/dashboard');
				} else {
					await router.push('/signin');
				}
			} finally {
				setIsLoading(false);
			}
		};

		redirectUser();
	}, [isAuthenticated, router]);

	if (isLoading) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-green-50 to-green-100 dark:from-green-900 dark:to-green-950">
				<motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }}>
					<Card className="w-80 h-80 flex flex-col items-center justify-center border-none bg-white/80 backdrop-blur-sm dark:bg-gray-900/80">
						<CardContent className="flex flex-col items-center space-y-6 p-6">
							<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-center">
								<h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-green-400 bg-clip-text text-transparent">Chaya</h1>
								<p className="text-sm text-muted-foreground mt-2">Farmer Management System</p>
							</motion.div>

							<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="relative">
								<div className="w-16 h-16 flex items-center justify-center">
									<Loader2 className="w-8 h-8 animate-spin text-green-600" />
								</div>
							</motion.div>
						</CardContent>
					</Card>
				</motion.div>
			</div>
		);
	}

	return null;
}
