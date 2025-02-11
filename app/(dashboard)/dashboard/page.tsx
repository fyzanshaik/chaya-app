'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Plus, FileDown, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import DetailsTable from '../components/DetailsTable';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { FarmerForm } from '../components/FarmerForm';
import { useAuthStore } from '@/lib/utils/authStore';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type Gender = 'MALE' | 'FEMALE' | 'OTHER';
type Community = 'GENERAL' | 'OBC' | 'BC' | 'SC' | 'ST';
type FarmerDocs = {
	profilePicUrl: string;
	aadharDocUrl: string;
	bankDocUrl: string;
};

interface LocationData {
	lat: number;
	lng: number;
	accuracy: number;
	altitude: number | null;
	altitudeAccuracy: number | null;
	timestamp: number;
}

type FarmerField = {
	areaHa: number;
	yieldEstimate: number;
	location: LocationData;
	landDocumentUrl: string;
};
type BankDetails = {
	accountNumber: string;
	ifscCode: string;
	branchName: string;
	address: string;
	bankName: string;
	bankCode: string;
};
interface Farmer {
	id: number;
	surveyNumber: string;
	name: string;
	relationship: string;
	gender: Gender;
	community: Community;
	aadharNumber: string;
	state: string;
	district: string;
	mandal: string;
	village: string;
	panchayath: string;
	dateOfBirth: string;
	age: number;
	contactNumber: string;
	createdAt: string;
	createdBy: {
		name: string;
	};
	documents: FarmerDocs;
	fields: FarmerField[];
	bankDetails: BankDetails;
}

type SearchType = 'name' | 'state' | 'surveyNumber';

export default function UserDashboard() {
	const { user, isAuthenticated, hydrated } = useAuthStore();
	const router = useRouter();
	const [farmers, setFarmers] = useState<Farmer[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [isExporting, setIsExporting] = useState(false);
	const [searchTerm, setSearchTerm] = useState('');
	const [searchType, setSearchType] = useState<SearchType>('name');
	const { toast } = useToast();

	useEffect(() => {
		if (hydrated) {
			if (!isAuthenticated) {
				router.push('/signin');
			}
		}
	}, [hydrated, isAuthenticated, router]);

	const fetchFarmers = useCallback(async () => {
		if (hydrated) {
			if (!isAuthenticated) {
				return;
			}
		}
		setIsLoading(true);
		try {
			let url = '/api/farmers';
			if (searchTerm) {
				url += `?${searchType}=${encodeURIComponent(searchTerm)}`;
			}
			const response = await fetch(url, {
				method: 'GET',
			});
			if (!response.ok) {
				throw new Error('Failed to fetch farmers');
			}
			const data = await response.json();
			setFarmers(data.farmers);
		} catch (err) {
			console.error('Error fetching farmers data', err);
			toast({
				title: 'Error',
				description: 'Failed to fetch farmers. Please try again.',
				variant: 'destructive',
			});
		} finally {
			setIsLoading(false);
		}
	}, [hydrated, isAuthenticated, searchTerm, searchType, toast]);

	useEffect(() => {
		if (hydrated && isAuthenticated) {
			fetchFarmers();
		}
	}, [hydrated, isAuthenticated, fetchFarmers]);

	const filteredFarmers = farmers.filter((farmer) => {
		const normalizedSearchTerm = searchTerm.toLowerCase().trim();

		if (searchType === 'name') {
			return farmer.name.toLowerCase().includes(normalizedSearchTerm);
		} else if (searchType === 'state') {
			return farmer.state.toLowerCase().includes(normalizedSearchTerm);
		} else if (searchType === 'surveyNumber') {
			return farmer.surveyNumber.toLowerCase().includes(normalizedSearchTerm);
		} else {
			return true;
		}
	});

	// const handleLogout = async () => {
	// 	try {
	// 		await fetch('/api/auth/logout', { method: 'POST' });
	// 		setUser(null);
	// 		setIsAuthenticated(false);
	// 		router.push('/signin');
	// 	} catch (error) {
	// 		console.error('Logout failed', error);
	// 	}
	// };

	const handleSearch = () => {
		setIsLoading(true);
	};

	const deleteFarmer = async (surveyNumber: string) => {
		try {
			const response = await fetch(`/api/farmers/${surveyNumber}`, {
				method: 'DELETE',
			});
			if (!response.ok) {
				throw new Error('Failed to delete farmer');
			}
			toast({
				title: 'Success',
				description: 'Farmer deleted successfully',
			});
			await fetchFarmers();
		} catch (error) {
			console.error('Error deleting farmer:', error);
			toast({
				title: 'Error',
				description: 'Failed to delete farmer. Please try again.',
				variant: 'destructive',
			});
		}
	};

	const handleExport = async (format: string) => {
		setIsExporting(true);
		try {
			const response = await fetch('http://localhost:3000/api/export/farmers', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					options: {
						format: format,
						range: 'ALL',
					},
				}),
			});

			if (!response.ok) {
				throw new Error('Failed to export farmers');
			}

			const blob = await response.blob();
			const url = window.URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `farmer-data.${format.toLowerCase()}`;
			document.body.appendChild(a);
			a.click();
			a.remove();
			toast({
				title: 'Success',
				description: 'Farmers exported successfully.',
			});
		} catch (error) {
			console.error('Error exporting farmers:', error);
			toast({
				title: 'Error',
				description: 'Failed to export farmers. Please try again.',
				variant: 'destructive',
			});
		} finally {
			setIsExporting(false);
		}
	};

	return (
		<div className="h-screen flex flex-col bg-[#f8f9fa] dark:bg-gray-900">
			{/* Header Section */}
			<div className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 backdrop-blur-sm p-6">
				<div className="flex items-center justify-between max-w-[1920px] mx-auto">
					<motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
						<h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Farmer Dashboard</h1>
						<p className="text-gray-500 dark:text-gray-400 mt-1">Manage and track farmer information</p>
					</motion.div>

					<div className="flex items-center gap-3">
						<Dialog>
							<DialogTrigger asChild>
								<Button className="bg-green-600 hover:bg-green-700 text-white">
									<Plus className="mr-2 h-4 w-4" />
									Add Farmer
								</Button>
							</DialogTrigger>
							<DialogContent className="max-w-4xl">
								<DialogHeader>
									<DialogTitle>Add New Farmer</DialogTitle>
								</DialogHeader>
								<FarmerForm onSuccess={fetchFarmers} />
							</DialogContent>
						</Dialog>

						{user?.role?.toLowerCase() === 'admin' && (
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button variant="outline" disabled={isExporting} className="border-gray-200 dark:border-gray-800">
										{isExporting ? (
											<>
												<Loader2 className="mr-2 h-4 w-4 animate-spin" />
												Exporting...
											</>
										) : (
											<>
												<FileDown className="mr-2 h-4 w-4" />
												Export
											</>
										)}
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent align="end">
									<DropdownMenuLabel>Choose Format</DropdownMenuLabel>
									<DropdownMenuSeparator />
									<DropdownMenuItem onClick={() => handleExport('CSV')} className="cursor-pointer">
										Export as CSV
									</DropdownMenuItem>
									<DropdownMenuItem onClick={() => handleExport('JSON')} className="cursor-pointer">
										Export as JSON
									</DropdownMenuItem>
									<DropdownMenuItem onClick={() => handleExport('EXCEL')} className="cursor-pointer">
										Export as XLSX
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						)}
					</div>
				</div>
			</div>

			{/* Main Content Area */}
			<div className="flex-1 overflow-y-auto p-6">
				<div className="max-w-[1920px] mx-auto space-y-6">
					{/* Search Section */}
					<Card className="border-none shadow-sm bg-white dark:bg-gray-900/50 backdrop-blur-sm">
						<CardContent className="p-4">
							<div className="flex gap-3">
								<Select value={searchType} onValueChange={(value: SearchType) => setSearchType(value)}>
									<SelectTrigger className="w-[200px]">
										<SelectValue placeholder="Search by" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="name">Farmer Name</SelectItem>
										<SelectItem value="state">State</SelectItem>
										<SelectItem value="surveyNumber">Survey Number</SelectItem>
									</SelectContent>
								</Select>
								<div className="flex-1">
									<Input type="text" placeholder={`Search by ${searchType}...`} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full" />
								</div>
								<Button onClick={handleSearch} variant="secondary" className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700">
									Search
								</Button>
							</div>
						</CardContent>
					</Card>

					{/* Data Table Section */}
					<Card className="border-none shadow-sm bg-white dark:bg-gray-900/50 backdrop-blur-sm">
						<CardHeader className="pb-0">
							<CardTitle>Farmer Records</CardTitle>
						</CardHeader>
						<CardContent>
							<DetailsTable isLoading={isLoading} data={filteredFarmers} onDelete={deleteFarmer} onEdit={fetchFarmers} />
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}
