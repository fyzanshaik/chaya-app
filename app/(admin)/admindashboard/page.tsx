'use client';

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { type User, useAuthStore } from '@/lib/utils/authStore';
import AppSidebar from '@/app/(dashboard)/components/AppSidebar';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader } from '@/components/ui/sidebar';
import { useRouter } from 'next/navigation';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trash2, UserPlus, Search } from 'lucide-react';
import { z } from 'zod';
import { InputWithError } from './components/ui/input-with-error';

const createUserSchema = z.object({
	email: z.string().email('Invalid email address'),
	password: z.string().min(6, 'Password must be at least 6 characters'),
	name: z.string().min(2, 'Name must be at least 2 characters'),
});

const TableSkeleton = () => (
	<Table>
		<TableHeader>
			<TableRow>
				<TableHead>ID</TableHead>
				<TableHead>Name</TableHead>
				<TableHead>Email</TableHead>
				<TableHead>Status</TableHead>
				<TableHead>Actions</TableHead>
			</TableRow>
		</TableHeader>
		<TableBody>
			{[...Array(5)].map((_, index) => (
				<TableRow key={index}>
					<TableCell>
						<Skeleton className="h-4 w-8" />
					</TableCell>
					<TableCell>
						<Skeleton className="h-4 w-24" />
					</TableCell>
					<TableCell>
						<Skeleton className="h-4 w-32" />
					</TableCell>
					<TableCell>
						<Skeleton className="h-4 w-16" />
					</TableCell>
					<TableCell>
						<Skeleton className="h-4 w-8" />
					</TableCell>
				</TableRow>
			))}
		</TableBody>
	</Table>
);

type CreateUserInput = z.infer<typeof createUserSchema>;
interface CreateUserErrors {
	name?: string;
	email?: string;
	password?: string;
}
export default function AdminDashboard() {
	const router = useRouter();
	const { setUser, setIsAuthenticated, isAuthenticated, hydrated } = useAuthStore();
	const [users, setUsers] = useState<User[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [searchTerm, setSearchTerm] = useState('');
	const [createUserErrors, setCreateUserErrors] = useState<{
		[K in keyof CreateUserInput]?: string;
	}>({});
	const [newUser, setNewUser] = useState<CreateUserInput>({
		name: '',
		email: '',
		password: '',
	});
	const { toast } = useToast();

	useEffect(() => {
		if (hydrated && !isAuthenticated) {
			router.push('/signin');
		}
	}, [hydrated, isAuthenticated, router]);

	const fetchUsers = useCallback(async () => {
		if (!isAuthenticated) return;
		setIsLoading(true);
		try {
			const response = await fetch('/api/users', {
				headers: {
					'x-user-role': 'ADMIN', // Add the required header
				},
			});
			if (!response.ok) throw new Error('Failed to fetch users');
			const data = await response.json();
			setUsers(data.users);
		} catch (error) {
			console.error('Error fetching users:', error);
			toast({
				title: 'Error',
				description: 'Failed to fetch users. Please try again.',
				variant: 'destructive',
			});
		} finally {
			setIsLoading(false);
		}
	}, [isAuthenticated, toast]);
	useEffect(() => {
		if (hydrated && isAuthenticated) {
			fetchUsers();
		}
	}, [hydrated, isAuthenticated, fetchUsers]);

	const validateCreateUser = () => {
		try {
			createUserSchema.parse(newUser);
			setCreateUserErrors({});
			return true;
		} catch (error) {
			if (error instanceof z.ZodError) {
				const errors: CreateUserErrors = {};
				error.errors.forEach((err) => {
					const path = err.path[0] as keyof CreateUserErrors;
					if (path) {
						errors[path] = err.message;
					}
				});
				setCreateUserErrors(errors);
			}
			return false;
		}
	};
	const handleCreateUser = async () => {
		if (!validateCreateUser()) return;

		try {
			const response = await fetch('/api/users', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'x-user-role': 'ADMIN',
				},
				body: JSON.stringify(newUser),
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error || 'Failed to create user');
			}

			toast({
				title: 'Success',
				description: 'User created successfully.',
			});

			setNewUser({
				name: '',
				email: '',
				password: '',
			});

			fetchUsers();
		} catch (err: unknown) {
			console.error('Error creating user:', err);
			const errorMessage = err instanceof Error ? err.message : 'Failed to create user. Please try again.';

			toast({
				title: 'Error',
				description: errorMessage,
				variant: 'destructive',
			});
		}
	};

	const handleDeleteUser = async (userId: number) => {
		try {
			const response = await fetch(`/api/users/${userId}`, {
				method: 'DELETE',
				headers: {
					'x-user-role': 'ADMIN',
				},
			});

			if (!response.ok) {
				throw new Error('Failed to delete user');
			}

			toast({
				title: 'Success',
				description: 'User deleted successfully.',
			});

			fetchUsers();
		} catch (error) {
			console.error('Error deleting user:', error);
			toast({
				title: 'Error',
				description: 'Failed to delete user. Please try again.',
				variant: 'destructive',
			});
		}
	};

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

	const filteredUsers = users.filter((user) => user.name.toLowerCase().includes(searchTerm.toLowerCase()) || user.email.toLowerCase().includes(searchTerm.toLowerCase()));

	return (
		<div className="flex flex-col lg:flex-row min-h-screen bg-background">
			<Sidebar className="border-r border-border lg:w-64 hidden lg:block">
				<SidebarContent>
					<SidebarHeader />
					<AppSidebar />
					<SidebarFooter>
						<Button onClick={handleLogout} className="w-full mt-4">
							Logout
						</Button>
					</SidebarFooter>
				</SidebarContent>
			</Sidebar>

			<main className="flex-1 p-4 md:p-6 space-y-6">
				<div className="flex flex-col md:flex-row items-center justify-between gap-4">
					<h1 className="text-3xl font-bold">Staff Management</h1>
					<div className="flex items-center gap-4 w-full md:w-auto">
						<div className="relative flex-1 md:flex-initial">
							<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
							<Input placeholder="Search staff..." className="pl-10" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
						</div>
						<Dialog>
							<DialogTrigger asChild>
								<Button className="whitespace-nowrap">
									<UserPlus className="h-4 w-4 mr-2" />
									Add Staff
								</Button>
							</DialogTrigger>
							<DialogContent>
								<DialogHeader>
									<DialogTitle>Create New Staff Account</DialogTitle>
								</DialogHeader>
								<div className="space-y-4">
									<div className="space-y-2">
										<Label htmlFor="name">Name</Label>
										<InputWithError id="name" value={newUser.name} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} error={createUserErrors.name} />
									</div>
									<div className="space-y-2">
										<Label htmlFor="email">Email</Label>
										<InputWithError id="email" type="email" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} error={createUserErrors.email} />
									</div>
									<div className="space-y-2">
										<Label htmlFor="password">Password</Label>
										<InputWithError
											id="password"
											type="password"
											value={newUser.password}
											onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
											error={createUserErrors.password}
										/>
									</div>
									<Button className="w-full" onClick={handleCreateUser}>
										Create Staff Account
									</Button>
								</div>
							</DialogContent>
						</Dialog>
					</div>
				</div>

				<div className="rounded-lg border bg-card">
					<div className="overflow-x-auto">
						{isLoading || !hydrated ? (
							<TableSkeleton />
						) : (
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>ID</TableHead>
										<TableHead>Name</TableHead>
										<TableHead>Email</TableHead>
										<TableHead>Status</TableHead>
										<TableHead>Actions</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{filteredUsers.map((user) => (
										<TableRow key={user.id}>
											<TableCell>{user.id}</TableCell>
											<TableCell>{user.name}</TableCell>
											<TableCell>{user.email}</TableCell>
											<TableCell>
												<span
													className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
														user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
													}`}
												>
													{user.isActive ? 'Active' : 'Inactive'}
												</span>
											</TableCell>
											<TableCell>
												<AlertDialog>
													<AlertDialogTrigger asChild>
														<Button variant="ghost" className="h-8 w-8 p-0 text-red-500 hover:text-red-700">
															<Trash2 className="h-4 w-4" />
														</Button>
													</AlertDialogTrigger>
													<AlertDialogContent>
														<AlertDialogHeader>
															<AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
															<AlertDialogDescription>
																This action cannot be undone. This will permanently delete the staff account and remove their data from our servers.
															</AlertDialogDescription>
														</AlertDialogHeader>
														<AlertDialogFooter>
															<AlertDialogCancel>Cancel</AlertDialogCancel>
															<AlertDialogAction onClick={() => handleDeleteUser(Number(user.id))} className="bg-red-600 hover:bg-red-700 text-white">
																Delete
															</AlertDialogAction>
														</AlertDialogFooter>
													</AlertDialogContent>
												</AlertDialog>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						)}
					</div>
				</div>
			</main>
		</div>
	);
}
