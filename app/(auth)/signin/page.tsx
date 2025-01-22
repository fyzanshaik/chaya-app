'use client';
import { useState } from 'react';
// import Image from 'next/image';
import { Eye, EyeOff } from 'lucide-react';

export default function SignIn() {
	const [showPassword, setShowPassword] = useState(false);
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		try {
			const res = await fetch('/api/auth/login', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ email, password }),
			});

			if (res.ok) {
				window.location.href = '/dashboard';
			} else {
				const data = await res.json();
				alert(data.error || 'Login failed');
			}
		} catch (error) {
			console.log(error);
			alert('Login failed');
		}
	};

	return (
		<main className="min-h-screen flex">
			{/* Left side - Login Form */}
			<div className="w-full md:w-1/2 flex items-center justify-center p-8">
				<div className="w-full max-w-md space-y-8">
					<div className="text-center">
						<h1 className="text-4xl font-bold text-green-800 mb-2">Welcome Back</h1>
						<p className="text-gray-600">Sign in to manage farmer data</p>
					</div>

					<form onSubmit={handleSubmit} className="mt-8 space-y-6">
						<div className="space-y-4">
							<div>
								<label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
									Email
								</label>
								<input
									id="email"
									type="email"
									required
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									className="appearance-none rounded-lg relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
									placeholder="Enter your email"
								/>
							</div>

							<div>
								<label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
									Password
								</label>
								<div className="relative">
									<input
										id="password"
										type={showPassword ? 'text' : 'password'}
										required
										value={password}
										onChange={(e) => setPassword(e.target.value)}
										className="appearance-none rounded-lg relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
										placeholder="Enter your password"
									/>
									<button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 flex items-center pr-3">
										{showPassword ? <EyeOff className="h-5 w-5 text-gray-400" /> : <Eye className="h-5 w-5 text-gray-400" />}
									</button>
								</div>
							</div>
						</div>

						<button
							type="submit"
							className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200"
						>
							Sign In
						</button>
					</form>
				</div>
			</div>

			{/* Right side - Decorative */}
			<div className="hidden md:block md:w-1/2 bg-green-50 relative overflow-hidden">
				<div className="absolute inset-0 bg-gradient-to-br from-green-100 to-green-50">
					{/* SVG Pattern Overlay */}
					{/* <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Cg fill='%23166534' fill-opacity='0.1'%3E%3Cpath d='M0 0h40v40H0V0zm40 40h40v40H40V40zm0-40h2l-2 2V0zm0 4l4-4h2l-6 6V4zm0 4l8-8h2L40 10V8zm0 4L52 0h2L40 14v-2zm0 4L56 0h2L40 18v-2zm0 4L60 0h2L40 22v-2zm0 4L64 0h2L40 26v-2zm0 4L68 0h2L40 30v-2zm0 4L72 0h2L40 34v-2zm0 4L76 0h2L40 38v-2zm0 4L80 0v2L42 40h-2zm4 0L80 4v2L46 40h-2zm4 0L80 8v2L50 40h-2zm4 0l28-28v2L54 40h-2zm4 0l24-24v2L58 40h-2zm4 0l20-20v2L62 40h-2zm4 0l16-16v2L66 40h-2zm4 0l12-12v2L70 40h-2zm4 0l8-8v2l-6 6h-2zm4 0l4-4v2l-2 2h-2z'/%3E%3C/g%3E%3C/svg%3E\") }}" /> */}

					<div className="absolute inset-0 flex items-center justify-center p-8">
						<div className="text-center">
							<h2 className="text-3xl font-bold text-green-800 mb-4">Farmer Data Collection</h2>
							<p className="text-green-700 max-w-md mx-auto">Efficiently manage and track farmer information for sustainable agriculture</p>
						</div>
					</div>
				</div>
			</div>
		</main>
	);
}
