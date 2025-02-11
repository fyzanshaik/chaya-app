// app/(auth)/signin/page.tsx
'use client';

import { useState } from 'react';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/lib/utils/authStore';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import RightSection from '../components/RightSection';
import { motion } from 'framer-motion';

const formSchema = z.object({
	email: z.string().email({
		message: 'Please enter a valid email address.',
	}),
	password: z.string().min(8, {
		message: 'Password must be at least 8 characters long.',
	}),
});

export default function LoginPage() {
	const [showPassword, setShowPassword] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const router = useRouter();
	const { setUser, setIsAuthenticated } = useAuthStore();
	const { toast } = useToast();

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			email: '',
			password: '',
		},
	});

	async function onSubmit(values: z.infer<typeof formSchema>) {
		setIsLoading(true);
		try {
			const response = await fetch('/api/auth/login', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(values),
			});

			if (response.ok) {
				const data = await response.json();
				setUser(data.user);
				setIsAuthenticated(true);
				toast({
					title: 'Welcome back! 👋',
					description: 'Successfully logged in. Redirecting...',
					duration: 5000,
				});
				router.push(data.user.role === 'ADMIN' ? '/admindashboard' : '/dashboard');
			} else {
				const errorData = await response.json();
				throw new Error(errorData.error || 'Login failed');
			}
		} catch (error) {
			console.error('Login error:', error);
			toast({
				title: 'Login Failed',
				description: error instanceof Error ? error.message : 'An unexpected error occurred',
				variant: 'destructive',
				duration: 2000,
			});
		} finally {
			setIsLoading(false);
		}
	}

	return (
		<main className="min-h-screen flex flex-col md:flex-row">
			<motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }} className="w-full md:w-1/2 flex items-center justify-center p-4 md:p-8">
				<Card className="w-full max-w-md border-0 shadow-lg dark:bg-gray-900/50 backdrop-blur-sm">
					<CardHeader className="space-y-3">
						<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
							<CardTitle className="text-3xl font-bold text-green-800 dark:text-green-400">Welcome Back</CardTitle>
							<CardDescription className="text-gray-600 dark:text-gray-300">Sign in to manage farmer data</CardDescription>
						</motion.div>
					</CardHeader>
					<CardContent>
						<Form {...form}>
							<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
								<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
									<FormField
										control={form.control}
										name="email"
										render={({ field }) => (
											<FormItem>
												<FormLabel className="text-gray-700 dark:text-gray-200">Email</FormLabel>
												<FormControl>
													<Input
														{...field}
														className="border-green-100 bg-white/50 dark:bg-gray-800/50 dark:border-gray-700 focus:border-green-500 dark:focus:border-green-400 transition-colors"
														placeholder="Enter your email"
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								</motion.div>

								<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
									<FormField
										control={form.control}
										name="password"
										render={({ field }) => (
											<FormItem>
												<FormLabel className="text-gray-700 dark:text-gray-200">Password</FormLabel>
												<FormControl>
													<div className="relative">
														<Input
															{...field}
															type={showPassword ? 'text' : 'password'}
															className="border-green-100 bg-white/50 dark:bg-gray-800/50 dark:border-gray-700 focus:border-green-500 dark:focus:border-green-400 transition-colors"
															placeholder="Enter your password"
														/>
														<button
															type="button"
															onClick={() => setShowPassword(!showPassword)}
															className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
														>
															{showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
														</button>
													</div>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								</motion.div>

								<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
									<Button type="submit" className="w-full bg-green-700 hover:bg-green-800 dark:bg-green-600 dark:hover:bg-green-700 transition-colors" disabled={isLoading}>
										{isLoading ? (
											<>
												<Loader2 className="mr-2 h-4 w-4 animate-spin" />
												Signing in...
											</>
										) : (
											'Sign In'
										)}
									</Button>
								</motion.div>
							</form>
						</Form>
					</CardContent>
					<CardFooter className="flex justify-between">
						<Link href="/forgotpassword" className="text-sm text-gray-600 hover:text-green-700 dark:text-gray-400 dark:hover:text-green-400 transition-colors">
							Forgot password? Contact the Administrator
						</Link>
					</CardFooter>
				</Card>
			</motion.div>

			<RightSection />
		</main>
	);
}
