'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Edit2, Trash2, FileText, Sprout, ChevronDown, MapPin } from 'lucide-react';
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAuthStore } from '@/lib/utils/authStore';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
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
import { FarmerFormEdit } from './FarmerFormEdit';
import ActionButton from './actionButton';

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

interface Column {
	id: keyof Farmer;
	label: string;
	isVisible: boolean;
}

const TableSkeleton = () => (
	<div className="space-y-3">
		{[...Array(5)].map((_, index) => (
			<motion.div
				key={index}
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ duration: 0.2, delay: index * 0.1 }}
				className="h-16 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse"
			/>
		))}
	</div>
);

export default function DetailsTable({ data, isLoading, onDelete, onEdit }: { data: Farmer[]; isLoading: boolean; onDelete: (surveyNumber: string) => Promise<void>; onEdit: () => Promise<void> }) {
	const initialColumns: Column[] = [
		{ id: 'id', label: 'Id', isVisible: false },
		{ id: 'surveyNumber', label: 'Farmer Survey No.', isVisible: false },
		{ id: 'createdBy', label: 'Created By', isVisible: false },
		{ id: 'name', label: 'Name', isVisible: true },
		{ id: 'relationship', label: 'Relationship', isVisible: false },
		{ id: 'gender', label: 'Gender', isVisible: true },
		{ id: 'community', label: 'Community', isVisible: false },
		{ id: 'aadharNumber', label: 'Aadhar Number', isVisible: false },
		{ id: 'contactNumber', label: 'Contact', isVisible: true },
		{ id: 'state', label: 'State', isVisible: true },
		{ id: 'district', label: 'District', isVisible: true },
		{ id: 'mandal', label: 'Mandal', isVisible: true },
		{ id: 'village', label: 'Village', isVisible: true },
		{ id: 'panchayath', label: 'Panchayath', isVisible: true },
		{ id: 'dateOfBirth', label: 'Date of Birth', isVisible: true },
		{ id: 'age', label: 'Age', isVisible: true },
		{ id: 'fields', label: 'Fields', isVisible: true },
	];

	const [columns, setColumns] = useState<Column[]>(initialColumns);
	const { user } = useAuthStore();
	const [selectedFarmer, setSelectedFarmer] = useState<Farmer | null>(null);
	const handleEditFarmer = (farmer: Farmer) => {
		setSelectedFarmer(farmer);
	};

	const toggleColumn = (columnId: keyof Farmer) => {
		setColumns((prevColumns) => prevColumns.map((col) => (col.id === columnId ? { ...col, isVisible: !col.isVisible } : col)));
	};

	const resetColumns = () => {
		setColumns(initialColumns);
	};

	const visibleColumns = columns.filter((col) => col.isVisible);

	const fetchDocumentUrl = async (type: string, surveyNumber: string) => {
		try {
			const response = await fetch(`http://localhost:3000/api/documents/${type}/${surveyNumber}/url`, {
				method: 'GET',
			});
			if (!response.ok) {
				throw new Error('Failed to fetch document URL');
			}
			const data = await response.json();
			if (data.url) {
				window.open(data.url, '_blank');
			}
		} catch (error) {
			console.error('Error fetching document URL:', error);
		}
	};

	return (
		<div className="space-y-4">
			<div className="flex justify-between items-center">
				<h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300">Total Records: {data.length}</h2>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button variant="outline" className="flex items-center gap-2">
							Manage Columns
							<ChevronDown className="h-4 w-4" />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end" className="w-56">
						<ScrollArea className="h-72">
							<div className="p-2 space-y-2">
								<Button variant="ghost" className="w-full justify-start text-sm" onClick={resetColumns}>
									Reset to Default
								</Button>
								<div className="border-t my-2" />
								{columns.map((column) => (
									<DropdownMenuCheckboxItem key={column.id} checked={column.isVisible} onCheckedChange={() => toggleColumn(column.id)} className="capitalize">
										{column.label}
									</DropdownMenuCheckboxItem>
								))}
							</div>
						</ScrollArea>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>

			<div className="rounded-lg border bg-white dark:bg-gray-900 overflow-hidden">
				{isLoading ? (
					<TableSkeleton />
				) : (
					<div className="overflow-x-auto">
						<Table>
							<TableHeader>
								<TableRow className="bg-gray-50 dark:bg-gray-800">
									{visibleColumns.map((column) => (
										<TableHead key={column.id} className="font-semibold text-gray-700 dark:text-gray-300">
											{column.label}
										</TableHead>
									))}
									{user?.role.toLowerCase() === 'admin' && <TableHead className="text-right">Actions</TableHead>}
								</TableRow>
							</TableHeader>
							<TableBody>
								<AnimatePresence>
									{data.map((farmer, index) => (
										<motion.tr
											key={farmer.id}
											initial={{ opacity: 0, y: 20 }}
											animate={{ opacity: 1, y: 0 }}
											transition={{ delay: index * 0.05 }}
											className="border-b hover:bg-gray-50 dark:hover:bg-gray-800/50"
										>
											{visibleColumns.map((column) => {
												if (column.id === 'documents') {
													if (user?.role.toLowerCase() === 'admin') {
														return (
															<TableCell key={column.id} className="flex items-center justify-center">
																<Dialog>
																	<DialogTrigger asChild>
																		<Button variant="ghost" size="sm" className="flex items-center gap-2">
																			<FileText className="h-4 w-4" />
																			<span className="hidden md:inline">Documents</span>
																		</Button>
																	</DialogTrigger>
																	<DialogContent>
																		<DialogHeader>
																			<DialogTitle>Farmer Documents</DialogTitle>
																		</DialogHeader>
																		<div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
																			<Button onClick={() => fetchDocumentUrl('profile-pic', farmer.surveyNumber)} className="w-full">
																				Profile Picture
																			</Button>
																			<Button onClick={() => fetchDocumentUrl('aadhar', farmer.surveyNumber)} className="w-full">
																				Aadhar Document
																			</Button>
																			<Button onClick={() => fetchDocumentUrl('bank', farmer.surveyNumber)} className="w-full">
																				Bank Document
																			</Button>
																		</div>
																	</DialogContent>
																</Dialog>
															</TableCell>
														);
													}
												} else if (column.id === 'fields') {
													return (
														<TableCell key={column.id}>
															<Dialog>
																<DialogTrigger asChild>
																	<Button variant="ghost" size="sm" className="flex items-center gap-2">
																		<Sprout className="h-4 w-4" />
																		<span className="hidden md:inline">Fields</span>
																	</Button>
																</DialogTrigger>
																<DialogContent>
																	<DialogHeader>
																		<DialogTitle>Field Details</DialogTitle>
																	</DialogHeader>
																	<div className="space-y-4">
																		<div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
																			<div>
																				<p className="text-sm text-gray-500 dark:text-gray-400">Area (Ha)</p>
																				<p className="text-lg font-medium">{farmer.fields[0]?.areaHa}</p>
																			</div>
																			<div>
																				<p className="text-sm text-gray-500 dark:text-gray-400">Yield Estimate</p>
																				<p className="text-lg font-medium">{farmer.fields[0]?.yieldEstimate}</p>
																			</div>
																		</div>

																		{/* Location Details Section */}
																		{farmer.fields[0]?.location && (
																			<div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-3">
																				<h4 className="font-medium text-sm text-gray-700 dark:text-gray-300">Location Details</h4>

																				<div className="space-y-2">
																					<div>
																						<p className="text-sm text-gray-500 dark:text-gray-400">Coordinates</p>
																						<p className="text-md">
																							{farmer.fields[0].location.lat.toFixed(6)}°N, {farmer.fields[0].location.lng.toFixed(6)}°E
																						</p>
																					</div>

																					<div>
																						<p className="text-sm text-gray-500 dark:text-gray-400">Accuracy</p>
																						<p className="text-md">±{farmer.fields[0].location.accuracy.toFixed(1)}m</p>
																					</div>

																					{farmer.fields[0].location.altitude !== null && (
																						<div>
																							<p className="text-sm text-gray-500 dark:text-gray-400">Altitude</p>
																							<p className="text-md">
																								{farmer.fields[0].location.altitude.toFixed(1)}m
																								{farmer.fields[0].location.altitudeAccuracy && ` (±${farmer.fields[0].location.altitudeAccuracy.toFixed(1)}m)`}
																							</p>
																						</div>
																					)}

																					<div>
																						<p className="text-sm text-gray-500 dark:text-gray-400">Captured On</p>
																						<p className="text-md">{new Date(farmer.fields[0].location.timestamp).toLocaleString()}</p>
																					</div>
																				</div>

																				{/* Google Maps Link */}
																				<a
																					href={`https://www.google.com/maps?q=${farmer.fields[0].location.lat},${farmer.fields[0].location.lng}`}
																					target="_blank"
																					rel="noopener noreferrer"
																					className="block mt-3"
																				>
																					<Button variant="outline" className="w-full flex items-center gap-2">
																						<MapPin className="h-4 w-4" />
																						View on Google Maps
																					</Button>
																				</a>
																			</div>
																		)}

																		{/* Land Document Button */}
																		{user?.role.toLowerCase() === 'admin' && (
																			<Button onClick={() => fetchDocumentUrl('land', farmer.surveyNumber)} className="w-full">
																				View Land Document
																			</Button>
																		)}
																	</div>
																</DialogContent>
															</Dialog>
														</TableCell>
													);
												} else if (column.id === 'createdBy') {
													return <TableCell key={column.id}>{farmer.createdBy.name}</TableCell>;
												} else if (column.id === 'bankDetails') {
													return null;
												} else {
													return <TableCell key={column.id}>{farmer[column.id]}</TableCell>;
												}
											})}
											{user?.role.toLowerCase() === 'admin' && (
												<TableCell className="text-right">
													<div className="flex items-center justify-end gap-2">
														<Dialog>
															<DialogTrigger asChild>
																<ActionButton icon={Edit2} label="Edit" onClick={() => handleEditFarmer(farmer)} />
															</DialogTrigger>
															<DialogContent className="max-w-4xl">
																<DialogHeader>
																	<DialogTitle>Edit Farmer Data</DialogTitle>
																</DialogHeader>
																{selectedFarmer && <FarmerFormEdit farmerData={selectedFarmer} onSuccess={onEdit} />}
															</DialogContent>
														</Dialog>

														<Dialog>
															<DialogTrigger asChild>
																<ActionButton icon={FileText} label="Documents" />
															</DialogTrigger>
															<DialogContent>
																<DialogHeader>
																	<DialogTitle>Farmer Documents</DialogTitle>
																</DialogHeader>
																<div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
																	<Button onClick={() => fetchDocumentUrl('profile-pic', farmer.surveyNumber)} className="w-full">
																		Profile Picture
																	</Button>
																	<Button onClick={() => fetchDocumentUrl('aadhar', farmer.surveyNumber)} className="w-full">
																		Aadhar Document
																	</Button>
																	<Button onClick={() => fetchDocumentUrl('bank', farmer.surveyNumber)} className="w-full">
																		Bank Document
																	</Button>
																</div>
															</DialogContent>
														</Dialog>

														<Dialog>
															<DialogTrigger asChild>
																<ActionButton icon={Sprout} label="Fields" />
															</DialogTrigger>
															<DialogContent>
																<DialogHeader>
																	<DialogTitle>Field Details</DialogTitle>
																</DialogHeader>
																<div className="space-y-4">
																	<div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
																		<div>
																			<p className="text-sm text-gray-500 dark:text-gray-400">Area (Ha)</p>
																			<p className="text-lg font-medium">{farmer.fields[0]?.areaHa}</p>
																		</div>
																		<div>
																			<p className="text-sm text-gray-500 dark:text-gray-400">Yield Estimate</p>
																			<p className="text-lg font-medium">{farmer.fields[0]?.yieldEstimate}</p>
																		</div>
																	</div>
																	{user?.role.toLowerCase() === 'admin' && (
																		<Button onClick={() => fetchDocumentUrl('land', farmer.surveyNumber)} className="w-full">
																			View Land Document
																		</Button>
																	)}
																</div>
															</DialogContent>
														</Dialog>

														<AlertDialog>
															<AlertDialogTrigger asChild>
																<ActionButton icon={Trash2} label="Delete" variant="destructive" />
															</AlertDialogTrigger>
															<AlertDialogContent>
																<AlertDialogHeader>
																	<AlertDialogTitle>Delete Farmer Record</AlertDialogTitle>
																	<AlertDialogDescription>This action cannot be undone. Are you sure you want to permanently delete this record?</AlertDialogDescription>
																</AlertDialogHeader>
																<AlertDialogFooter>
																	<AlertDialogCancel>Cancel</AlertDialogCancel>
																	<AlertDialogAction onClick={() => onDelete(farmer.surveyNumber)} className="bg-red-600 hover:bg-red-700 text-white">
																		Delete
																	</AlertDialogAction>
																</AlertDialogFooter>
															</AlertDialogContent>
														</AlertDialog>
													</div>
												</TableCell>
											)}
										</motion.tr>
									))}
								</AnimatePresence>
							</TableBody>
						</Table>
					</div>
				)}
			</div>
		</div>
	);
}
