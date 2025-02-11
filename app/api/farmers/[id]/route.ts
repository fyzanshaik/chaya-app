import prisma from '@/utils/prisma';
import { supabase } from '@/utils/supabase';
import { NextResponse } from 'next/server';
import { FarmerDocuments, Field, Farmer, Prisma } from '@prisma/client';
import { FileSchema } from '@/lib/validation/farmer';
import { Gender, Relationship } from '@prisma/client';
import { z } from 'zod';
interface SignedDocuments extends FarmerDocuments {
	profilePicSignedUrl?: string;
	aadharDocSignedUrl?: string;
	bankDocSignedUrl?: string;
}
interface SignedField extends Field {
	landDocumentSignedUrl?: string;
}
interface FarmerWithSignedUrls extends Farmer {
	documents: SignedDocuments;
	fields: SignedField[];
}
export async function GET(request: Request, { params }: { params: Promise<{ identifier: string }> }) {
	try {
		const { identifier } = await params;

		console.log('Fetching single farmer. Identifier:', identifier);

		const farmer = await prisma.farmer.findFirst({
			where: {
				OR: [{ surveyNumber: identifier }, { id: parseInt(identifier) || 0 }],
			},
			include: {
				documents: true,
				bankDetails: true,
				fields: true,
				createdBy: {
					select: {
						name: true,
					},
				},
				updatedBy: {
					select: {
						name: true,
					},
				},
			},
		});
		if (!farmer) {
			return NextResponse.json({ error: 'Farmer not found' }, { status: 404 });
		}
		let profileUrl, aadharUrl, bankUrl;
		if (farmer.documents) {
			({ data: profileUrl } = await supabase.storage.from('farmer-data').createSignedUrl(`profile-pic/${farmer.documents.profilePicUrl}`, 3600));
			({ data: aadharUrl } = await supabase.storage.from('farmer-data').createSignedUrl(`aadhar-doc/${farmer.documents.aadharDocUrl}`, 3600));
			({ data: bankUrl } = await supabase.storage.from('farmer-data').createSignedUrl(`bank-doc/${farmer.documents.bankDocUrl}`, 3600));
		}
		const farmerResponse = {
			...farmer,
			documents: {
				...farmer.documents,
				profilePicSignedUrl: profileUrl?.signedUrl,
				aadharDocSignedUrl: aadharUrl?.signedUrl,
				bankDocSignedUrl: bankUrl?.signedUrl,
			} as SignedDocuments,
			fields: await Promise.all(
				farmer.fields.map(async (field) => {
					const { data: landDocUrl } = await supabase.storage.from('farmer-data').createSignedUrl(`land-doc/${field.landDocumentUrl}`, 3600);
					return {
						...field,
						landDocumentSignedUrl: landDocUrl?.signedUrl,
					} as SignedField;
				})
			),
		} as FarmerWithSignedUrls;
		return NextResponse.json({ farmer: farmerResponse });
	} catch (error) {
		console.error('Error fetching farmer:', error);
		return NextResponse.json({ error: 'Failed to fetch farmer details' }, { status: 500 });
	}
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
	try {
		const userRole = request.headers.get('x-user-role');
		const userId = request.headers.get('x-user-id');
		const { id } = await params;

		if (!id) {
			return NextResponse.json({ error: 'Invalid identifier provided' }, { status: 400 });
		}

		if (userRole !== 'ADMIN') {
			return NextResponse.json({ error: 'Only admins can edit farmer records' }, { status: 403 });
		}

		const existingFarmer = await prisma.farmer.findFirst({
			where: {
				OR: [{ surveyNumber: id }, { id: parseInt(id) || 0 }],
			},
			include: {
				documents: true,
				fields: true,
			},
		});

		if (!existingFarmer) {
			return NextResponse.json({ error: 'Farmer not found' }, { status: 404 });
		}

		const contentType = request.headers.get('content-type') || '';
		if (!contentType.includes('multipart/form-data')) {
			return NextResponse.json({ error: 'Content-Type must be multipart/form-data' }, { status: 400 });
		}

		const formData = await request.formData();

		async function updateFile(newFile: File | null, currentPath: string | null, folder: string): Promise<string> {
			if (!newFile) return currentPath || '';

			try {
				await FileSchema.parseAsync(newFile);

				if (currentPath) {
					const { error: deleteError } = await supabase.storage.from('farmer-data').remove([`${folder}/${currentPath}`]);

					if (deleteError) {
						console.error(`Error deleting old file: ${deleteError.message}`);
					}
				}

				const fileExt = newFile.name.split('.').pop() || '';
				const fileName = `${existingFarmer!.surveyNumber}_${Date.now()}.${fileExt}`;

				const { error: uploadError } = await supabase.storage.from('farmer-data').upload(`${folder}/${fileName}`, newFile);

				if (uploadError) {
					throw new Error(`Failed to upload ${folder} document: ${uploadError.message}`);
				}

				return fileName;
			} catch (error) {
				console.error(`File handling error for ${folder}:`, error);
				throw error;
			}
		}

		const [profilePicName, aadharDocName, bankDocName] = await Promise.all([
			updateFile(formData.get('profilePic') as File | null, existingFarmer.documents?.profilePicUrl || null, 'profile-pic'),
			updateFile(formData.get('aadharDoc') as File | null, existingFarmer.documents?.aadharDocUrl || null, 'aadhar-doc'),
			updateFile(formData.get('bankDoc') as File | null, existingFarmer.documents?.bankDocUrl || null, 'bank-doc'),
		]);

		type FieldCreate = Omit<Prisma.FieldCreateWithoutFarmerInput, 'id' | 'createdAt' | 'updatedAt'>;
		let fieldsToUpdate: FieldCreate[] = [];

		if (formData.get('fields')) {
			try {
				const parsedFields = JSON.parse(formData.get('fields') as string);
				fieldsToUpdate = await Promise.all(
					parsedFields.map(async (field: FieldCreate, index: number) => {
						const fieldDoc = formData.get(`fieldDoc_${index}`) as File | null;
						const landDocName = await updateFile(fieldDoc, field.landDocumentUrl, 'land-doc');

						return {
							areaHa: field.areaHa,
							yieldEstimate: field.yieldEstimate,
							location: field.location,
							landDocumentUrl: landDocName,
						};
					})
				);
			} catch (error) {
				console.error('Fields parsing error:', error);
				return NextResponse.json({ error: 'Invalid fields data format' }, { status: 400 });
			}
		}

		const updatedFarmer = await prisma.farmer.update({
			where: { id: existingFarmer.id },
			data: {
				...(formData.get('farmerName') && {
					name: formData.get('farmerName') as string,
				}),
				...(formData.get('relationship') && {
					relationship: formData.get('relationship') as Relationship,
				}),
				...(formData.get('gender') && {
					gender: formData.get('gender') as Gender,
				}),
				...(formData.get('community') && {
					community: formData.get('community') as string,
				}),
				...(formData.get('aadharNumber') && {
					aadharNumber: formData.get('aadharNumber') as string,
				}),
				...(formData.get('state') && {
					state: formData.get('state') as string,
				}),
				...(formData.get('district') && {
					district: formData.get('district') as string,
				}),
				...(formData.get('mandal') && {
					mandal: formData.get('mandal') as string,
				}),
				...(formData.get('village') && {
					village: formData.get('village') as string,
				}),
				...(formData.get('panchayath') && {
					panchayath: formData.get('panchayath') as string,
				}),
				...(formData.get('dateOfBirth') && {
					dateOfBirth: new Date(formData.get('dateOfBirth') as string),
				}),
				...(formData.get('age') && {
					age: parseInt(formData.get('age') as string),
				}),
				...(formData.get('contactNumber') && {
					contactNumber: formData.get('contactNumber') as string,
				}),

				documents: {
					update: {
						profilePicUrl: profilePicName,
						aadharDocUrl: aadharDocName,
						bankDocUrl: bankDocName,
					},
				},

				...(formData.get('bankDetails') && {
					bankDetails: {
						update: {
							ifscCode: formData.get('ifscCode') as string,
							accountNumber: formData.get('accountNumber') as string,
							branchName: formData.get('branchName') as string,
							address: formData.get('bankAddress') as string,
							bankName: formData.get('bankName') as string,
							bankCode: formData.get('bankCode') as string,
						},
					},
				}),

				fields:
					fieldsToUpdate.length > 0
						? {
								deleteMany: {},
								create: fieldsToUpdate,
						  }
						: undefined,

				updatedById: parseInt(userId!),
			},
		});

		return NextResponse.json({
			message: 'Farmer updated successfully',
			farmer: updatedFarmer,
		});
	} catch (error) {
		console.error('Update farmer error:', error);

		if (error instanceof z.ZodError) {
			return NextResponse.json(
				{
					error: 'Validation failed',
					details: error.errors,
				},
				{ status: 400 }
			);
		}

		return NextResponse.json({ error: 'Failed to update farmer details' }, { status: 500 });
	}
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
	try {
		const userRole = request.headers.get('x-user-role');
		const { id } = await params;

		if (!id) {
			return NextResponse.json({ error: 'Invalid identifier provided' }, { status: 400 });
		}

		if (userRole !== 'ADMIN') {
			return NextResponse.json({ error: 'Only admins can delete farmer records' }, { status: 403 });
		}

		// Find farmer with their documents
		const farmer = await prisma.farmer.findFirst({
			where: {
				OR: [{ surveyNumber: id }, { id: parseInt(id) || 0 }],
			},
			include: {
				documents: true,
				fields: true,
			},
		});

		if (!farmer) {
			return NextResponse.json({ error: 'Farmer not found' }, { status: 404 });
		}

		const filesToDelete = [
			farmer.documents?.profilePicUrl && `profile-pic/${farmer.documents.profilePicUrl}`,
			farmer.documents?.aadharDocUrl && `aadhar-doc/${farmer.documents.aadharDocUrl}`,
			farmer.documents?.bankDocUrl && `bank-doc/${farmer.documents.bankDocUrl}`,
			...farmer.fields.map((field) => field.landDocumentUrl && `land-doc/${field.landDocumentUrl}`),
		].filter((filePath): filePath is string => !!filePath);

		if (filesToDelete.length > 0) {
			const { error: storageError } = await supabase.storage.from('farmer-data').remove(filesToDelete);

			if (storageError) {
				console.error('Storage deletion error:', storageError);
			}
		}

		await prisma.farmer.delete({
			where: { id: farmer.id },
		});

		return NextResponse.json({
			message: 'Farmer and associated data deleted successfully',
		});
	} catch (error) {
		console.error('Delete farmer error:', error);

		if (error instanceof Error) {
			return NextResponse.json(
				{
					error: 'Failed to delete farmer record',
					detail: error.message,
				},
				{ status: 500 }
			);
		}

		return NextResponse.json({ error: 'Failed to delete farmer record' }, { status: 500 });
	}
}
