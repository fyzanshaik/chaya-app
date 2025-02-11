// components/AppSidebar.tsx
'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Inbox, User, Settings, Users, Leaf, ChevronRight } from 'lucide-react';
import { SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { ModeToggle } from '@/components/mode-toggle';
import { useAuthStore } from '@/lib/utils/authStore';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import router from 'next/router';

const Skeleton = ({ className }: { className?: string }) => (
	<motion.div initial={{ opacity: 0.5 }} animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.5, repeat: Infinity }} className={cn('bg-gray-200 dark:bg-gray-700 rounded-md', className)} />
);

const AppSidebar = () => {
	const { user, setUser, setIsAuthenticated } = useAuthStore();
	const pathname = usePathname();

	const items = [
		{
			title: 'Farmer Dashboard',
			url: '/dashboard',
			icon: Inbox,
			description: 'View and manage farmer data',
		},
		...(user?.role?.toLowerCase() === 'admin'
			? [
					{
						title: 'Staff Management',
						url: '/admindashboard',
						icon: Users,
						description: 'Manage staff and permissions',
					},
			  ]
			: []),
		{
			title: 'Profile',
			url: '/profile',
			icon: User,
			description: 'View and edit your profile',
		},
		{
			title: 'Settings',
			url: '/',
			icon: Settings,
			description: 'Application settings',
		},
	];

	const handleLogout = async () => {
		try {
			await fetch('/api/auth/logout', { method: 'POST' });
			setUser(null);
			setIsAuthenticated(false);
			router.push('/signin');
		} catch (error) {
			console.error('Logout failed', error);
		}
	};

	return (
		<motion.div
			initial={{ x: -20, opacity: 0 }}
			animate={{ x: 0, opacity: 1 }}
			transition={{ duration: 0.4 }}
			className="flex flex-col h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800"
		>
			<div className="p-4 border-b border-gray-200 dark:border-gray-800">
				<div className="flex items-center justify-between mb-4">
					<motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} transition={{ duration: 0.2 }} className="flex items-center gap-2">
						<Leaf className="h-6 w-6 text-green-600 dark:text-green-400" />
						<span className="text-2xl font-bold bg-gradient-to-r from-green-600 to-green-400 bg-clip-text text-transparent">Chaya</span>
					</motion.div>
					<ModeToggle />
				</div>

				<div className="space-y-1">
					{!user ? (
						<>
							<Skeleton className="h-5 w-3/5 mb-2" />
							<Skeleton className="h-4 w-2/5" />
						</>
					) : (
						<motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
							<div className="font-medium text-gray-900 dark:text-gray-100">{user.name}</div>
							<div className="text-sm text-gray-500 dark:text-gray-400">{user.role}</div>
						</motion.div>
					)}
				</div>
			</div>

			<div className="flex-1 overflow-y-auto py-4">
				<SidebarGroup>
					<SidebarGroupLabel className="px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Menu</SidebarGroupLabel>
					<SidebarGroupContent>
						<SidebarMenu>
							{!user
								? Array.from({ length: 4 }).map((_, idx) => (
										<SidebarMenuItem key={idx} className="px-4">
											<Skeleton className="h-10 w-full my-1" />
										</SidebarMenuItem>
								  ))
								: items.map((item) => (
										<SidebarMenuItem key={item.title}>
											<SidebarMenuButton asChild>
												<Link
													href={item.url}
													className={cn(
														'flex items-center gap-3 px-4 py-2 rounded-lg transition-colors',
														'hover:bg-gray-100 dark:hover:bg-gray-800',
														pathname === item.url && 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400'
													)}
												>
													<item.icon className="h-5 w-5" />
													<span className="flex-1">{item.title}</span>
													{pathname === item.url && (
														<motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ duration: 0.2 }}>
															<ChevronRight className="h-4 w-4" />
														</motion.div>
													)}
												</Link>
											</SidebarMenuButton>
											{pathname === item.url && (
												<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-gray-500 dark:text-gray-400 ml-12 mt-1">
													{item.description}
												</motion.div>
											)}
										</SidebarMenuItem>
								  ))}
						</SidebarMenu>
						<div className="mt-auto p-4 border-t border-gray-200 dark:border-gray-800">
							<AlertDialog>
								<AlertDialogTrigger asChild>
									<Button variant="ghost" className="w-full justify-start text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20">
										<LogOut className="mr-2 h-4 w-4" />
										Logout
									</Button>
								</AlertDialogTrigger>
								<AlertDialogContent>
									<AlertDialogHeader>
										<AlertDialogTitle>Are you sure you want to logout?</AlertDialogTitle>
										<AlertDialogDescription>You will need to sign in again to access your account.</AlertDialogDescription>
									</AlertDialogHeader>
									<AlertDialogFooter>
										<AlertDialogCancel>Cancel</AlertDialogCancel>
										<AlertDialogAction onClick={handleLogout}>Logout</AlertDialogAction>
									</AlertDialogFooter>
								</AlertDialogContent>
							</AlertDialog>
						</div>
					</SidebarGroupContent>
				</SidebarGroup>
			</div>
		</motion.div>
	);
};

export default AppSidebar;
