'use client';

import type React from 'react';
import { useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getDistricts, states } from '@/lib/utils/locationData';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { LocationSchema } from '@/lib/validation/farmer';
import { LocationButton } from './LocationButton';

const FarmerFormSchema = z.object({
	farmerName: z.string().min(1, 'Farmer name is required'),
	relationship: z.string().min(1, 'Relationship is required'),
	gender: z.string().min(1, 'Gender is required'),
	community: z.string().min(1, 'Community is required'),
	aadharNumber: z.string().length(12, 'Aadhar number must be 12 digits'),
	state: z.string().min(1, 'State is required'),
	district: z.string().min(1, 'District is required'),
	mandal: z.string().min(1, 'Mandal is required'),
	village: z.string().min(1, 'Village is required'),
	panchayath: z.string().min(1, 'Panchayath is required'),
	dateOfBirth: z.string().min(1, 'Date of birth is required'),
	age: z.number().min(18, 'Age must be at least 18'),
	contactNumber: z.string().length(10, 'Contact number must be 10 digits'),
	accountNumber: z.string().min(1, 'Account number is required'),
	ifscCode: z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, 'Invalid IFSC code'),
	branchName: z.string().min(1, 'Branch name is required'),
	bankAddress: z.string().min(1, 'Address is required'),
	bankName: z.string().min(1, 'Bank name is required'),
	bankCode: z.string().min(1, 'Bank code is required'),
	fields: z.array(
		z.object({
			// surveyNumber: z.string().min(1, 'Survey number is required'),
			areaHa: z.number().min(1, 'Area in Ha is required'),
			yieldEstimate: z.number().min(1, 'Yield Estimate is required'),
			location: LocationSchema,
			landDocument: z.any(),
		})
	),
});

interface LocationData {
	lat: number;
	lng: number;
	accuracy: number;
	altitude: number | null;
	altitudeAccuracy: number | null;
	timestamp: number;
}

type FarmerFormValues = z.infer<typeof FarmerFormSchema>;

export function FarmerForm({ onSuccess }: { onSuccess?: () => void }) {
	const handleLocationUpdate = (index: number) => (locationData: LocationData) => {
		form.setValue(`fields.${index}.location`, locationData);
	};

	const form = useForm<FarmerFormValues>({
		resolver: zodResolver(FarmerFormSchema),
		defaultValues: {
			farmerName: '',
			relationship: '',
			gender: '',
			community: '',
			aadharNumber: '',
			state: '',
			district: '',
			mandal: '',
			village: '',
			panchayath: '',
			dateOfBirth: '',
			age: 0,
			contactNumber: '',
			accountNumber: '',
			ifscCode: '',
			branchName: '',
			bankAddress: '',
			bankName: '',
			bankCode: '',
			fields: [
				{
					// surveyNumber: '',
					areaHa: 0,
					yieldEstimate: 0,
					location: {
						lat: 0,
						lng: 0,
						accuracy: 0,
						altitude: null,
						altitudeAccuracy: null,
						timestamp: Date.now(),
					},
					landDocument: null,
				},
			],
		},
	});

	const { toast } = useToast();
	const { fields, append, remove } = useFieldArray({
		control: form.control,
		name: 'fields',
	});

	const [files, setFiles] = useState<{
		profilePic: File | null;
		aadharDoc: File | null;
		bankDoc: File | null;
	}>({
		profilePic: null,
		aadharDoc: null,
		bankDoc: null,
	});
	const [landFiles, setLandFiles] = useState<(File | null)[]>([]);

	const [loadingIFSC, setLoadingIFSC] = useState(false);
	const [filteredDistricts, setFilteredDistricts] = useState<string[]>([]);
	const [districtInput, setDistrictInput] = useState('');
	const [showDistrictDropdown, setShowDistrictDropdown] = useState(false);
	const selectedState = form.watch('state');
	const selectedDistrict = form.watch('district');

	useEffect(() => {
		if (selectedState) {
			const districts = getDistricts(selectedState);
			setFilteredDistricts(districts);
			form.setValue('district', '');
			setDistrictInput('');
			setShowDistrictDropdown(true);
		} else {
			setFilteredDistricts([]);
			setShowDistrictDropdown(false);
		}
	}, [form, selectedState]);

	useEffect(() => {
		if (selectedDistrict === '') {
			setShowDistrictDropdown(true);
		}
	}, [selectedDistrict]);

	const handleDistrictInputChange = (value: string) => {
		setDistrictInput(value);
		form.setValue('district', value);

		if (selectedState) {
			const districts = getDistricts(selectedState);
			const filtered = districts.filter((district) => district.toLowerCase().includes(value.toLowerCase()));
			setFilteredDistricts(filtered);
			setShowDistrictDropdown(true);
		}
	};

	const handleDistrictSelect = (district: string) => {
		form.setValue('district', district);
		setDistrictInput(district);
		setShowDistrictDropdown(false);
	};

	const handleIFSCChange = async (ifscCode: string) => {
		if (!ifscCode) {
			return;
		}

		setLoadingIFSC(true);
		form.clearErrors('ifscCode');
		try {
			const response = await fetch(`https://ifsc.razorpay.com/${ifscCode}`);
			if (!response.ok) {
				form.setError('ifscCode', {
					type: 'manual',
					message: 'Failed to fetch IFSC details.',
				});
				return;
			}
			const data = await response.json();

			form.setValue('branchName', data.BRANCH || '');
			form.setValue('bankAddress', data.ADDRESS || '');
			form.setValue('bankName', data.BANK || '');
			form.setValue('bankCode', data.BANKCODE || '');
		} catch (error) {
			console.error('Error fetching IFSC details:', error);
			form.setError('ifscCode', {
				type: 'manual',
				message: 'Failed to fetch IFSC details.',
			});
		} finally {
			setLoadingIFSC(false);
		}
	};

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, fieldIndex?: number) => {
		const { name, files: uploadedFiles } = e.target;
		if (uploadedFiles && uploadedFiles[0]) {
			if (fieldIndex !== undefined) {
				setLandFiles((prev) => {
					const newLandFiles = [...prev];
					newLandFiles[fieldIndex] = uploadedFiles[0];
					return newLandFiles;
				});
			} else {
				setFiles((prev) => ({ ...prev, [name]: uploadedFiles[0] }));
			}
		}
	};

	const calculateAge = (dob: string) => {
		const birthDate = new Date(dob);
		const today = new Date();
		let age = today.getFullYear() - birthDate.getFullYear();
		const m = today.getMonth() - birthDate.getMonth();
		if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
			age--;
		}
		return age;
	};

	const onSubmit = async (data: FarmerFormValues) => {
		const formData = new FormData();

		// Append form fields
		Object.entries(data).forEach(([key, value]) => {
			if (key === 'fields') {
				formData.append(
					key,
					JSON.stringify(
						(value as FarmerFormValues['fields']).map((field, index) => ({
							// surveyNumber: field.surveyNumber,
							areaHa: String(field.areaHa),
							yieldEstimate: String(field.yieldEstimate),
							location: JSON.stringify(field.location),
							landDocument: landFiles[index] ? landFiles[index]?.name : null,
						}))
					)
				);
			} else if (key !== 'bankDetails') {
				formData.append(key, String(value));
			}
		});

		// Append main document files
		if (files.profilePic) formData.append('profilePic', files.profilePic);
		if (files.aadharDoc) formData.append('aadharDoc', files.aadharDoc);
		if (files.bankDoc) formData.append('bankDoc', files.bankDoc);

		// Append land documents for each field
		landFiles.forEach((file, index) => {
			if (file) {
				formData.append(`fieldDoc_${index}`, file);
			}
		});

		try {
			const response = await fetch('/api/farmers', {
				method: 'POST',
				body: formData,
			});

			if (response.ok) {
				toast({
					title: 'Success',
					description: `Farmer Created successfully.`,
				});
				if (onSuccess) {
					onSuccess();
				}
			} else {
				const errorData = await response.json();
				console.error(errorData.message);
				toast({
					title: 'Error',
					description: 'Failed to create farmer. Please try again.',
					variant: 'destructive',
				});
			}
		} catch (error) {
			console.error('Error submitting form:', error);
			toast({
				title: 'Error',
				description: 'Failed to create farmer. Please try again.',
				variant: 'destructive',
			});
		}
	};

	return (
		<ScrollArea className="h-[80vh]">
			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 p-6">
				<Tabs defaultValue="personal" className="w-full">
					<TabsList className="grid w-full grid-cols-5">
						<TabsTrigger value="personal">Personal</TabsTrigger>
						<TabsTrigger value="location">Location</TabsTrigger>
						<TabsTrigger value="bank">Bank</TabsTrigger>
						<TabsTrigger value="fields">Fields</TabsTrigger>
						<TabsTrigger value="documents">Documents</TabsTrigger>
					</TabsList>
					<TabsContent value="personal">
						<div className="space-y-4">
							<div>
								<Label htmlFor="farmerName">Farmer Name</Label>
								<Input {...form.register('farmerName')} id="farmerName" placeholder="Farmer Name" />
								{form.formState.errors.farmerName && <p className="mt-1 text-sm text-red-600">{form.formState.errors.farmerName.message}</p>}
							</div>
							<div>
								<Label htmlFor="relationship">Relationship</Label>
								<Select onValueChange={(value) => form.setValue('relationship', value)} defaultValue={form.getValues('relationship')}>
									<SelectTrigger className="w-full">
										<SelectValue placeholder="Select relationship" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="SELF">SELF</SelectItem>
										<SelectItem value="SPOUSE">SPOUSE</SelectItem>
										<SelectItem value="CHILD">CHILD</SelectItem>
										<SelectItem value="OTHER">OTHER</SelectItem>
									</SelectContent>
								</Select>
								{form.formState.errors.relationship && <p className="mt-1 text-sm text-red-600">{form.formState.errors.relationship.message}</p>}
							</div>
							<div>
								<Label htmlFor="gender">Gender</Label>
								<Select onValueChange={(value) => form.setValue('gender', value)} defaultValue={form.getValues('gender')}>
									<SelectTrigger className="w-full">
										<SelectValue placeholder="Select gender" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="MALE">MALE</SelectItem>
										<SelectItem value="FEMALE">FEMALE</SelectItem>
										<SelectItem value="OTHER">OTHER</SelectItem>
									</SelectContent>
								</Select>
								{form.formState.errors.gender && <p className="mt-1 text-sm text-red-600">{form.formState.errors.gender.message}</p>}
							</div>
							<div>
								<Label htmlFor="community">Community</Label>
								<Select onValueChange={(value) => form.setValue('community', value)} defaultValue={form.getValues('community')}>
									<SelectTrigger className="w-full">
										<SelectValue placeholder="Select community" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="OBC">OBC</SelectItem>
										<SelectItem value="OC">OC</SelectItem>
										<SelectItem value="BC">BC</SelectItem>
										<SelectItem value="SC">SC</SelectItem>
										<SelectItem value="ST">ST</SelectItem>
									</SelectContent>
								</Select>
								{form.formState.errors.community && <p className="mt-1 text-sm text-red-600">{form.formState.errors.community.message}</p>}
							</div>
							<div>
								<Label htmlFor="aadharNumber">Aadhar Number</Label>
								<Input {...form.register('aadharNumber')} id="aadharNumber" placeholder="Aadhar Number" />
								{form.formState.errors.aadharNumber && <p className="mt-1 text-sm text-red-600">{form.formState.errors.aadharNumber.message}</p>}
							</div>
							<div>
								<Label htmlFor="dateOfBirth">Date of Birth</Label>
								<Input
									{...form.register('dateOfBirth', {
										onChange: (e) => {
											const age = calculateAge(e.target.value);
											form.setValue('age', age, { shouldValidate: true });
										},
									})}
									id="dateOfBirth"
									type="date"
								/>
								{form.formState.errors.dateOfBirth && <p className="mt-1 text-sm text-red-600">{form.formState.errors.dateOfBirth.message}</p>}
							</div>
							<div>
								<Label htmlFor="age">Age</Label>
								<Input {...form.register('age', { valueAsNumber: true })} id="age" type="number" readOnly />
								{form.formState.errors.age && <p className="mt-1 text-sm text-red-600">{form.formState.errors.age.message}</p>}
							</div>
							<div>
								<Label htmlFor="contactNumber">Contact Number</Label>
								<Input {...form.register('contactNumber')} id="contactNumber" placeholder="Contact Number" />
								{form.formState.errors.contactNumber && <p className="mt-1 text-sm text-red-600">{form.formState.errors.contactNumber.message}</p>}
							</div>
						</div>
					</TabsContent>
					<TabsContent value="location">
						<div className="space-y-4">
							<div>
								<Label htmlFor="state">State</Label>
								<Select onValueChange={(value) => form.setValue('state', value)} defaultValue={form.watch('state')}>
									<SelectTrigger id="state">
										<SelectValue placeholder="Select a state" />
									</SelectTrigger>
									<SelectContent>
										{states.map((state) => (
											<SelectItem key={state} value={state}>
												{state}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								{form.formState.errors.state && <p className="mt-1 text-sm text-red-600">{form.formState.errors.state.message}</p>}
							</div>
							<div>
								<Label htmlFor="district">District</Label>
								<Input
									id="district"
									placeholder="Search or select a district"
									value={districtInput}
									onChange={(e) => handleDistrictInputChange(e.target.value)}
									autoComplete="off"
									onFocus={() => setShowDistrictDropdown(true)}
								/>
								{showDistrictDropdown && filteredDistricts.length > 0 && (
									<div className="border rounded-md mt-1 bg-white shadow-md">
										{filteredDistricts.map((district) => (
											<div key={district} className="px-4 py-2 hover:bg-gray-100 cursor-pointer" onClick={() => handleDistrictSelect(district)}>
												{district}
											</div>
										))}
									</div>
								)}
								{form.formState.errors.district && <p className="mt-1 text-sm text-red-600">{form.formState.errors.district.message}</p>}
							</div>
							<div>
								<Label htmlFor="mandal">Mandal</Label>
								<Input {...form.register('mandal')} id="mandal" placeholder="Mandal" />
								{form.formState.errors.mandal && <p className="mt-1 text-sm text-red-600">{form.formState.errors.mandal.message}</p>}
							</div>
							<div>
								<Label htmlFor="village">Village</Label>
								<Input {...form.register('village')} id="village" placeholder="Village" />
								{form.formState.errors.village && <p className="mt-1 text-sm text-red-600">{form.formState.errors.village.message}</p>}
							</div>
							<div>
								<Label htmlFor="panchayath">Panchayath</Label>
								<Input {...form.register('panchayath')} id="panchayath" placeholder="Panchayath" />
								{form.formState.errors.panchayath && <p className="mt-1 text-sm text-red-600">{form.formState.errors.panchayath.message}</p>}
							</div>
						</div>
					</TabsContent>
					<TabsContent value="bank">
						<div className="space-y-4">
							<div>
								<Label htmlFor="accountNumber">Account Number</Label>
								<Input {...form.register('accountNumber')} id="accountNumber" placeholder="Account Number" />
								{form.formState.errors.accountNumber && <p className="mt-1 text-sm text-red-600">{form.formState.errors.accountNumber.message}</p>}
							</div>
							<div>
								<Label htmlFor="ifscCode">IFSC Code</Label>
								<Input
									{...form.register('ifscCode', {
										onBlur: (e) => handleIFSCChange(e.target.value),
									})}
									id="ifscCode"
									placeholder="IFSC Code"
									disabled={loadingIFSC}
								/>
								{loadingIFSC && <p className="text-sm text-blue-500">Fetching IFSC details...</p>}
								{form.formState.errors.ifscCode && !loadingIFSC && <p className="mt-1 text-sm text-red-600">{form.formState.errors.ifscCode.message}</p>}
							</div>
							<div>
								<Label htmlFor="branchName">Branch Name</Label>
								<Input {...form.register('branchName')} id="branchName" placeholder="Branch Name" />
								{form.formState.errors.branchName && <p className="mt-1 text-sm text-red-600">{form.formState.errors.branchName.message}</p>}
							</div>
							<div>
								<Label htmlFor="address">Address</Label>
								<Input {...form.register('bankAddress')} id="address" placeholder="Address" />
								{form.formState.errors.bankAddress && <p className="mt-1 text-sm text-red-600">{form.formState.errors.bankAddress.message}</p>}
							</div>
							<div>
								<Label htmlFor="bankName">Bank Name</Label>
								<Input {...form.register('bankName')} id="bankName" placeholder="Bank Name" />
								{form.formState.errors.bankName && <p className="mt-1 text-sm text-red-600">{form.formState.errors.bankName.message}</p>}
							</div>
							<div>
								<Label htmlFor="bankCode">Bank Code</Label>
								<Input {...form.register('bankCode')} id="bankCode" placeholder="Bank Code" />
								{form.formState.errors.bankCode && <p className="mt-1 text-sm text-red-600">{form.formState.errors.bankCode.message}</p>}
							</div>
						</div>
					</TabsContent>

					<TabsContent value="fields">
						{fields.map((field, index) => (
							<div key={field.id} className="space-y-4 mb-6">
								<h4 className="font-medium">Field {index + 1}</h4>
								<div className="grid grid-cols-2 gap-4">
									{/* <div> */}
									{/* <Label htmlFor={`surveyNumber-${index}`}>Survey Number</Label>
										<Input {...form.register(`fields.${index}.surveyNumber`)} id={`surveyNumber-${index}`} placeholder="Survey Number" />
										{form.formState.errors.fields?.[index]?.surveyNumber && <p className="mt-1 text-sm text-red-600">{form.formState.errors.fields[index].surveyNumber.message}</p>}
									</div> */}
									<div>
										<Label htmlFor={`areaHa-${index}`}>Area (Ha)</Label>
										<Input
											{...form.register(`fields.${index}.areaHa`, {
												valueAsNumber: true,
											})}
											id={`areaHa-${index}`}
											type="number"
											step="0.01"
											placeholder="Area in Hectares"
										/>
										{form.formState.errors.fields?.[index]?.areaHa && <p className="mt-1 text-sm text-red-600">{form.formState.errors.fields[index].areaHa.message}</p>}
									</div>
									<div>
										<Label htmlFor={`yieldEstimate-${index}`}>Yield Estimate</Label>
										<Input
											{...form.register(`fields.${index}.yieldEstimate`, {
												valueAsNumber: true,
											})}
											id={`yieldEstimate-${index}`}
											type="number"
											step="0.01"
											placeholder="Yield Estimate"
										/>
										{form.formState.errors.fields?.[index]?.yieldEstimate && <p className="mt-1 text-sm text-red-600">{form.formState.errors.fields[index].yieldEstimate.message}</p>}
									</div>
									<div className="col-span-2 space-y-2">
										<Label>Field Location</Label>
										<LocationButton onLocationUpdate={handleLocationUpdate(index)} fieldIndex={index} />

										{/* Display location data if it exists */}
										{form.watch(`fields.${index}.location`) && (
											<div className="mt-2 p-3 bg-gray-50 rounded-md space-y-1">
												<p className="text-sm text-gray-600">Latitude: {form.watch(`fields.${index}.location.lat`).toFixed(6)}°N</p>
												<p className="text-sm text-gray-600">Longitude: {form.watch(`fields.${index}.location.lng`).toFixed(6)}°E</p>
												<p className="text-sm text-gray-600">Accuracy: ±{form.watch(`fields.${index}.location.accuracy`).toFixed(1)}m</p>
												{form.watch(`fields.${index}.location.altitude`) && (
													<p className="text-sm text-gray-600">
														Altitude: {form.watch(`fields.${index}.location.altitude`)}m
														{form.watch(`fields.${index}.location.altitudeAccuracy`) && ` (±${form.watch(`fields.${index}.location.altitudeAccuracy`)}m)`}
													</p>
												)}
												<p className="text-sm text-gray-600">Captured: {new Date(form.watch(`fields.${index}.location.timestamp`)).toLocaleString()}</p>
											</div>
										)}
									</div>
									<div>
										<Label htmlFor={`landDocument-${index}`}>Land Document</Label>
										<Input type="file" id={`landDocument-${index}`} onChange={(e) => handleFileChange(e, index)} accept="application/pdf" />
										{landFiles[index] && <p className="mt-1 text-sm text-green-600">File selected: {landFiles[index]?.name}</p>}
									</div>
								</div>
								{index > 0 && (
									<Button
										type="button"
										variant="outline"
										onClick={() => {
											remove(index);
											setLandFiles((prev) => {
												const newLandFiles = [...prev];
												newLandFiles.splice(index, 1);
												return newLandFiles;
											});
										}}
										className="mt-2"
									>
										Remove Field
									</Button>
								)}
							</div>
						))}
						<Button
							type="button"
							onClick={() => {
								append({
									areaHa: 0,
									yieldEstimate: 0,
									location: {
										lat: 0,
										lng: 0,
										accuracy: 0,
										altitude: null,
										altitudeAccuracy: null,
										timestamp: Date.now(),
									},
								});
								setLandFiles((prev) => [...prev, null]);
							}}
							className="mt-2"
						>
							Add Field
						</Button>
					</TabsContent>
					<TabsContent value="documents">
						<div className="space-y-4">
							<div className="grid grid-cols-2 gap-4">
								<div>
									<Label htmlFor="profilePic">Profile Picture</Label>
									<Input type="file" id="profilePic" name="profilePic" onChange={handleFileChange} accept="image/*" />
									{files.profilePic && <p className="mt-1 text-sm text-green-600">File selected: {files.profilePic.name}</p>}
								</div>
								<div>
									<Label htmlFor="aadharDoc">Aadhar Document</Label>
									<Input type="file" id="aadharDoc" name="aadharDoc" onChange={handleFileChange} accept="application/pdf" />
									{files.aadharDoc && <p className="mt-1 text-sm text-green-600">File selected: {files.aadharDoc.name}</p>}
								</div>
								<div>
									<Label htmlFor="bankDoc">Bank Document</Label>
									<Input type="file" id="bankDoc" name="bankDoc" onChange={handleFileChange} accept="application/pdf" />
									{files.bankDoc && <p className="mt-1 text-sm text-green-600">File selected: {files.bankDoc.name}</p>}
								</div>
							</div>
						</div>
					</TabsContent>
				</Tabs>
				<Button type="submit" className="w-full">
					Submit
				</Button>
			</form>
		</ScrollArea>
	);
}
