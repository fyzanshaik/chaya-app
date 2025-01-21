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
export async function GET(request: Request, { params }: { params: { identifier: string } }) {
	try {
		console.log('Fetching single farmer. Identifier:', params.identifier);
		const farmer = await prisma.farmer.findFirst({
			where: {
				OR: [{ surveyNumber: params.identifier }, { id: parseInt(params.identifier) || 0 }],
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
export async function PUT(request: Request, { params }: { params: { identifier: string } }) {
	try {
		const userRole = request.headers.get('x-user-role');
		const userId = request.headers.get('x-user-id');
		if (userRole !== 'ADMIN') {
			return NextResponse.json({ error: 'Only admins can edit farmer records' }, { status: 403 });
		}
		const existingFarmer = await prisma.farmer.findFirst({
			where: {
				OR: [{ surveyNumber: params.identifier }, { id: parseInt(params.identifier) || 0 }],
			},
			include: {
				documents: true,
				fields: true,
			},
		});
		if (!existingFarmer) {
			return NextResponse.json({ error: 'Farmer not found' }, { status: 404 });
		}
		const formData = await request.formData();
		async function updateFile(newFile: File | null, currentPath: string | null, folder: string): Promise<string> {
			if (!newFile) return currentPath || '';
			await FileSchema.parseAsync(newFile);
			if (currentPath) {
				await supabase.storage.from('farmer-data').remove([`${folder}/${currentPath}`]);
			}
			const fileExt = newFile.name.split('.').pop() || '';
			const fileName = `${existingFarmer!.surveyNumber}_${Date.now()}.${fileExt}`;
			const { error } = await supabase.storage.from('farmer-data').upload(`${folder}/${fileName}`, newFile);
			if (error) throw new Error(`Failed to upload ${folder} document`);
			return fileName;
		}
		const [profilePicName, aadharDocName, bankDocName] = await Promise.all([
			updateFile(formData.get('profilePic') as File | null, existingFarmer.documents?.profilePicUrl || null, 'profile-pic'),
			updateFile(formData.get('aadharDoc') as File | null, existingFarmer.documents?.aadharDocUrl || null, 'aadhar-doc'),
			updateFile(formData.get('bankDoc') as File | null, existingFarmer.documents?.bankDocUrl || null, 'bank-doc'),
		]);
		type FieldCreate = Omit<Prisma.FieldCreateWithoutFarmerInput, 'id' | 'createdAt' | 'updatedAt'>;
		let fieldsToUpdate: FieldCreate[] = [];
		if (formData.get('fields')) {
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
		}
		const updatedFarmer = await prisma.farmer.update({
			where: {
				id: existingFarmer.id,
			},
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
export async function DELETE(request: Request, { params }: { params: { identifier: string } }) {
	try {
		const userRole = request.headers.get('x-user-role');
		if (userRole !== 'ADMIN') {
			return NextResponse.json({ error: 'Only admins can delete farmer records' }, { status: 403 });
		}
		const farmer = await prisma.farmer.findFirst({
			where: {
				OR: [{ surveyNumber: params.identifier }, { id: parseInt(params.identifier) || 0 }],
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
			`profile-pic/${farmer.documents?.profilePicUrl}`,
			`aadhar-doc/${farmer.documents?.aadharDocUrl}`,
			`bank-doc/${farmer.documents?.bankDocUrl}`,
			...farmer.fields.map((field) => `land-doc/${field.landDocumentUrl}`),
		].filter(Boolean);
		await supabase.storage.from('farmer-data').remove(filesToDelete);
		await prisma.farmer.delete({
			where: { id: farmer.id },
		});
		return NextResponse.json({
			message: 'Farmer deleted successfully',
		});
	} catch (error) {
		console.error('Delete farmer error:', error);
		return NextResponse.json({ error: 'Failed to delete farmer record' }, { status: 500 });
	}
}
