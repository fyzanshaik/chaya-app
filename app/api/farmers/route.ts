import { NextResponse } from 'next/server';
import prisma from '@/utils/prisma';
import { supabase } from '@/utils/supabase';
import { generateSurveyNumber } from '@/utils/helper';
import { CreateFarmerSchema, FileSchema } from '@/lib/validation/farmer';
import { z } from 'zod';
type SupabaseError = {
	message: string;
	statusCode: string;
};
type PrismaError = {
	code: string;
	message: string;
	meta?: {
		target: string[];
	};
};
export async function POST(request: Request) {
	try {
		console.log('=== Starting Farmer Creation ===');
		const userRole = request.headers.get('x-user-role');
		const userId = request.headers.get('x-user-id');
		console.log('Auth Info:', { userRole, userId });
		console.log('Getting form data...');
		const formData = await request.formData();
		console.log('Form Fields Received:', Array.from(formData.keys()));
		console.log('Preparing data for validation...');
		const dataToValidate = {
			farmerName: formData.get('farmerName'),
			relationship: formData.get('relationship'),
			gender: formData.get('gender'),
			community: formData.get('community'),
			aadharNumber: formData.get('aadharNumber'),
			contactNumber: formData.get('contactNumber'),
			state: formData.get('state'),
			district: formData.get('district'),
			mandal: formData.get('mandal'),
			village: formData.get('village'),
			panchayath: formData.get('panchayath'),
			dateOfBirth: formData.get('dateOfBirth'),
			age: formData.get('age'),
			bankDetails: {
				ifscCode: formData.get('ifscCode'),
				accountNumber: formData.get('accountNumber'),
				branchName: formData.get('branchName'),
				bankAddress: formData.get('bankAddress'),
				bankName: formData.get('bankName'),
				bankCode: formData.get('bankCode'),
			},
			fields: JSON.parse(formData.get('fields') as string),
		};
		console.log('Data prepared for validation:', JSON.stringify(dataToValidate, null, 2));
		console.log('Starting Zod validation...');
		let validatedData;
		try {
			validatedData = CreateFarmerSchema.parse(dataToValidate);
			console.log('Validation successful!');
		} catch (validationError) {
			console.error('Validation failed:', validationError);
			throw validationError;
		}
		console.log('Generating survey number...');
		const surveyNumber = await generateSurveyNumber();
		console.log('Generated survey number:', surveyNumber);
		async function uploadFile(file: File | null, folder: string) {
			console.log(`Starting upload for ${folder}...`);
			if (!file) {
				console.error(`No file provided for ${folder}`);
				throw new Error(`${folder} document is required`);
			}
			console.log(`Validating ${folder} file:`, {
				type: file.type,
				size: `${(file.size / (1024 * 1024)).toFixed(2)}MB`,
			});
			try {
				await FileSchema.parseAsync(file);
				console.log(`${folder} file validation passed`);
			} catch (fileError) {
				console.error(`${folder} file validation failed:`, fileError);
				throw fileError;
			}
			const fileExt = file.name.split('.').pop();
			const fileName = `${surveyNumber}_${Date.now()}.${fileExt}`;
			console.log(`Uploading ${folder} as: ${fileName}`);
			const { data, error } = await supabase.storage.from('farmer-data').upload(`${folder}/${fileName}`, file);
			console.log('File uploaded Data:', data);
			if (error) {
				console.error(`${folder} upload failed:`, error);
				throw new Error(`Failed to upload ${folder} document: ${error.message}`);
			}
			console.log(`${folder} upload successful`);
			return fileName;
		}
		console.log('Starting main document uploads...');
		const [profilePicName, aadharDocName, bankDocName] = await Promise.all([
			uploadFile(formData.get('profilePic') as File, 'profile-pic'),
			uploadFile(formData.get('aadharDoc') as File, 'aadhar-doc'),
			uploadFile(formData.get('bankDoc') as File, 'bank-doc'),
		]);
		console.log('Main documents uploaded successfully');
		console.log('Starting field documents upload...');
		const fieldDocs = await Promise.all(validatedData.fields.map((_, index) => uploadFile(formData.get(`fieldDoc_${index}`) as File, 'land-doc')));
		console.log('Field documents uploaded:', fieldDocs);
		console.log('Creating farmer record in database...');
		const farmer = await prisma.farmer.create({
			data: {
				surveyNumber,
				name: validatedData.farmerName,
				relationship: validatedData.relationship,
				gender: validatedData.gender,
				community: validatedData.community,
				aadharNumber: validatedData.aadharNumber,
				state: validatedData.state,
				district: validatedData.district,
				mandal: validatedData.mandal,
				village: validatedData.village,
				panchayath: validatedData.panchayath,
				dateOfBirth: validatedData.dateOfBirth,
				age: validatedData.age,
				contactNumber: validatedData.contactNumber,
				documents: {
					create: {
						profilePicUrl: profilePicName,
						aadharDocUrl: aadharDocName,
						bankDocUrl: bankDocName,
					},
				},
				bankDetails: {
					create: {
						ifscCode: validatedData.bankDetails.ifscCode,
						accountNumber: validatedData.bankDetails.accountNumber,
						branchName: validatedData.bankDetails.branchName,
						address: validatedData.bankDetails.bankAddress,
						bankName: validatedData.bankDetails.bankName,
						bankCode: validatedData.bankDetails.bankCode,
					},
				},
				fields: {
					create: validatedData.fields.map((field, index) => ({
						areaHa: field.areaHa,
						yieldEstimate: field.yieldEstimate,
						location: JSON.parse(field.location),
						landDocumentUrl: fieldDocs[index],
					})),
				},
				createdById: parseInt(userId!),
				updatedById: parseInt(userId!),
			},
		});
		console.log('Farmer record created successfully:', { farmerId: farmer.id });
		return NextResponse.json({
			message: 'Farmer created successfully',
			farmer,
		});
	} catch (error) {
		console.error('=== Error in Farmer Creation ===');
		if (error instanceof Error) {
			console.error('Error type:', error.constructor.name);
		} else {
			console.error('Error type: unknown');
		}
		console.error('Error details:', {
			name: (error as Error).name,
			message: (error as Error).message,
			stack: (error as Error).stack,
		});
		if (error instanceof z.ZodError) {
			console.log('Validation error details:', JSON.stringify(error.errors, null, 2));
			return NextResponse.json(
				{
					error: 'Validation failed',
					details: error.errors.map((e) => ({
						field: e.path.join('.'),
						message: e.message,
					})),
				},
				{ status: 400 }
			);
		}
		if (error instanceof Error && (error.message.includes('document is required') || error.message.includes('file type') || error.message.includes('file size'))) {
			console.log('File handling error:', error.message);
			return NextResponse.json(
				{
					error: 'File validation failed',
					detail: error.message,
				},
				{ status: 400 }
			);
		}
		const supabaseError = error as SupabaseError;
		if (supabaseError.statusCode) {
			console.log('Supabase error:', supabaseError);
			const errorMessages = {
				'413': 'File size too large (max 5MB)',
				'400': 'Invalid file format (allowed: jpg, png, pdf)',
				default: 'File upload failed',
			};
			return NextResponse.json(
				{
					error: errorMessages[supabaseError.statusCode as keyof typeof errorMessages] || errorMessages.default,
					detail: supabaseError.message,
				},
				{ status: supabaseError.statusCode === '413' || supabaseError.statusCode === '400' ? 400 : 500 }
			);
		}
		const prismaError = error as PrismaError;
		if (prismaError.code) {
			console.log('Database error:', prismaError);
			const prismaErrors = {
				P2002: (field: string) => ({
					message: `Duplicate entry for ${field}`,
					detail: `A farmer with this ${field} already exists`,
				}),
				P2003: {
					message: 'Invalid reference',
					detail: 'Referenced record does not exist',
				},
				P2025: {
					message: 'Record not found',
					detail: 'Required related record could not be found',
				},
			};
			if (prismaError.code === 'P2002') {
				const field = prismaError.meta?.target[0];
				if (field) {
					const error = prismaErrors['P2002'](field);
					return NextResponse.json({ error: error.message, detail: error.detail }, { status: 400 });
				}
			}
			const errorInfo = prismaErrors[prismaError.code as keyof typeof prismaErrors];
			if (errorInfo) {
				return NextResponse.json(errorInfo, { status: 400 });
			}
		}
		console.error('Unhandled error:', error);
		return NextResponse.json(
			{
				error: 'Failed to create farmer record',
				detail: 'An unexpected error occurred. Please try again or contact support if the issue persists.',
			},
			{ status: 500 }
		);
	}
}
export async function GET(request: Request) {
	try {
		const userRole = request.headers.get('x-user-role');
		console.log('Fetching farmers. User role:', userRole);
		const { searchParams } = new URL(request.url);
		const page = parseInt(searchParams.get('page') || '1');
		const limit = parseInt(searchParams.get('limit') || '10');
		const search = searchParams.get('search');
		const filterState = searchParams.get('state');
		const filterDistrict = searchParams.get('district');
		console.log('Query params:', { page, limit, search, filterState, filterDistrict });
		const skip = (page - 1) * limit;
		const where: {
			OR?: {
				name?: { contains: string; mode: 'insensitive' };
				surveyNumber?: { contains: string; mode: 'insensitive' };
				aadharNumber?: { contains: string };
				contactNumber?: { contains: string };
			}[];
			state?: string;
			district?: string;
		} = {};
		if (search) {
			where.OR = [
				{ name: { contains: search, mode: 'insensitive' } },
				{ surveyNumber: { contains: search, mode: 'insensitive' } },
				{ aadharNumber: { contains: search } },
				{ contactNumber: { contains: search } },
			];
		}
		if (filterState) {
			where.state = filterState;
		}
		if (filterDistrict) {
			where.district = filterDistrict;
		}
		const [farmers, total] = await prisma.$transaction([
			prisma.farmer.findMany({
				skip,
				take: limit,
				where,
				select: {
					id: true,
					surveyNumber: true,
					name: true,
					aadharNumber: true,
					contactNumber: true,
					state: true,
					district: true,
					village: true,
					createdAt: true,
					createdBy: {
						select: {
							name: true,
						},
					},
					documents: {
						select: {
							profilePicUrl: true,
							aadharDocUrl: true,
							bankDocUrl: true,
						},
					},
					fields: {
						select: {
							areaHa: true,
							yieldEstimate: true,
							landDocumentUrl: true,
						},
					},
				},
				orderBy: {
					createdAt: 'desc',
				},
			}),
			prisma.farmer.count({ where }),
		]);
		return NextResponse.json({
			farmers,
			pagination: {
				total,
				pages: Math.ceil(total / limit),
				currentPage: page,
				limit,
			},
		});
	} catch (error) {
		console.error('Error fetching farmers:', error);
		return NextResponse.json({ error: 'Failed to fetch farmers' }, { status: 500 });
	}
}
