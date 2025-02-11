// app/(auth)/signin/layout.tsx
import '@/app/globals.css';
import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import { cn } from '@/lib/utils';

const geist = Geist({ subsets: ['latin'] });

export const metadata: Metadata = {
	title: 'Sign In - Farmer Data Collection',
	description: 'Access your account to manage and track farmer information',
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
	return (
		<div className={cn(geist.className, 'min-h-screen bg-gradient-to-b from-green-50 to-white dark:from-gray-900 dark:to-gray-950', 'transition-colors duration-300 ease-in-out')}>{children}</div>
	);
}
