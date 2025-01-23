import '@/app/globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
	title: 'Farmer Data Collection',
	description: 'Efficiently manage and track farmer information',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
    <div className={`${inter.className} w-full`}>{children}</div>
  );
}
