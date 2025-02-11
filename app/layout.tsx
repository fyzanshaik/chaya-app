import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from '@/components/theme-provider';
import { SidebarProvider } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

const geistSans = Geist({
	variable: '--font-geist-sans',
	subsets: ['latin'],
});

const geistMono = Geist_Mono({
	variable: '--font-geist-mono',
	subsets: ['latin'],
});

export const metadata: Metadata = {
	title: 'Chaya - Farmer Management System',
	description: 'A modern solution for agricultural management',
	keywords: ['farming', 'agriculture', 'management', 'dashboard'],
	authors: [{ name: 'Chaya Team' }],
	viewport: 'width=device-width, initial-scale=1',
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" suppressHydrationWarning>
			<body className={cn(geistSans.variable, geistMono.variable, 'antialiased min-h-screen bg-background font-sans')}>
				<ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
					<div className="relative flex min-h-screen flex-col">
						<SidebarProvider>
							<main className="flex-1">{children}</main>
						</SidebarProvider>
					</div>
					<Toaster />
				</ThemeProvider>
			</body>
		</html>
	);
}
