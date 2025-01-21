import { z } from 'zod';
import { Gender, Relationship } from '@prisma/client';
const BankDetailsSchema = z.object({
	ifscCode: z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, 'Invalid IFSC code format'),
	accountNumber: z.string().min(8, 'Account number too short'),
	branchName: z.string(),
	bankAddress: z.string(),
	bankName: z.string(),
	bankCode: z.string(),
});
const FieldSchema = z.object({
	areaHa: z.string().transform((val) => parseFloat(val)),
	yieldEstimate: z.string().transform((val) => parseFloat(val)),
	location: z.string(),
});
export const CreateFarmerSchema = z.object({
	farmerName: z.string().min(1, 'Farmer name is required'),
	relationship: z.nativeEnum(Relationship),
	gender: z.nativeEnum(Gender),
	community: z.string(),
	aadharNumber: z.string().regex(/^\d{12}$/, 'Aadhar number must be 12 digits'),
	contactNumber: z.string().regex(/^\d{10}$/, 'Contact number must be 10 digits'),
	state: z.string(),
	district: z.string(),
	mandal: z.string(),
	village: z.string(),
	panchayath: z.string(),
	dateOfBirth: z.string().transform((val) => new Date(val)),
	age: z.string().transform((val) => parseInt(val)),
	bankDetails: BankDetailsSchema,
	fields: z.array(FieldSchema).min(1, 'At least one field is required'),
});
export const FileSchema = z.object({
	size: z.number().max(5 * 1024 * 1024, 'File size must be less than 5MB'),
	type: z.enum(['image/jpeg', 'image/png', 'application/pdf'], {
		errorMap: () => ({ message: 'File must be JPG, PNG, or PDF' }),
	}),
});
export const UpdateFarmerSchema = z.object({
	farmerName: z.string().optional(),
	relationship: z.nativeEnum(Relationship).optional(),
	gender: z.nativeEnum(Gender).optional(),
	community: z.string().optional(),
	aadharNumber: z
		.string()
		.regex(/^\d{12}$/)
		.optional(),
	contactNumber: z
		.string()
		.regex(/^\d{10}$/)
		.optional(),
	state: z.string().optional(),
	district: z.string().optional(),
	mandal: z.string().optional(),
	village: z.string().optional(),
	panchayath: z.string().optional(),
	dateOfBirth: z
		.string()
		.transform((str) => new Date(str))
		.optional(),
	age: z
		.string()
		.transform((str) => parseInt(str))
		.optional(),
	bankDetails: z
		.object({
			ifscCode: z.string(),
			accountNumber: z.string(),
			branchName: z.string(),
			address: z.string(),
			bankName: z.string(),
			bankCode: z.string(),
		})
		.optional(),
});
