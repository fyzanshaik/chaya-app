import { NextResponse } from 'next/server';
import prisma from '@/utils/prisma';
import { supabase } from '@/utils/supabase';
import * as XLSX from 'xlsx';
import PDFDocument from 'pdfkit';
import { stringify } from 'csv-stringify/sync';

interface ExportOptions {
	format: 'EXCEL' | 'PDF' | 'CSV';
	range: 'ALL' | 'CURRENT_PAGE' | 'CUSTOM_RANGE';
	pageStart?: number;
	pageEnd?: number;
	limit?: number;
}

interface Farmer {
	surveyNumber: string;
	name: string;
	gender: string;
	community: string;
	aadharNumber: string;
	contactNumber: string;
	state: string;
	district: string;
	mandal: string;
	village: string;
	panchayath: string;
	dateOfBirth: Date;
	age: number;
	documents: { profilePicUrl: string; aadharDocUrl: string; bankDocUrl: string } | null;
	bankDetails: { ifscCode: string; accountNumber: string; bankName: string; branchName: string } | null;
	fields: Array<{ areaHa: number; yieldEstimate: number; location: { latitude: number; longitude: number }; landDocumentUrl: string }>;
	createdBy: { name: string };
	createdAt: Date;
	updatedBy: { name: string };
	updatedAt: Date;
}

function formatFarmerData(
	farmer: Farmer,
	urls: {
		profileUrl: { data?: { signedUrl: string } };
		aadharUrl: { data?: { signedUrl: string } };
		bankUrl: { data?: { signedUrl: string } };
		fieldUrls: Array<{ data?: { signedUrl: string } }>;
	}
) {
	return {
		SurveyNumber: farmer.surveyNumber,
		Name: farmer.name,
		Gender: farmer.gender,
		Community: farmer.community,
		AadharNumber: farmer.aadharNumber,
		ContactNumber: farmer.contactNumber,
		State: farmer.state,
		District: farmer.district,
		Mandal: farmer.mandal,
		Village: farmer.village,
		Panchayath: farmer.panchayath,
		DateOfBirth: farmer.dateOfBirth.toISOString().split('T')[0],
		Age: farmer.age,
		ProfilePicUrl: urls.profileUrl.data?.signedUrl,
		AadharDocUrl: urls.aadharUrl.data?.signedUrl,
		BankDocUrl: urls.bankUrl.data?.signedUrl,
		BankDetails: {
			IFSC: farmer.bankDetails?.ifscCode,
			AccountNumber: farmer.bankDetails?.accountNumber,
			BankName: farmer.bankDetails?.bankName,
			BranchName: farmer.bankDetails?.branchName,
		},
		Fields: farmer.fields.map((field: { areaHa: number; yieldEstimate: number; location: { latitude: number; longitude: number }; landDocumentUrl: string }, index: number) => ({
			AreaHa: field.areaHa,
			YieldEstimate: field.yieldEstimate,
			Location: JSON.stringify(field.location),
			LandDocUrl: urls.fieldUrls[index].data?.signedUrl,
		})),
		CreatedBy: farmer.createdBy.name,
		CreatedAt: farmer.createdAt.toLocaleString(),
		UpdatedBy: farmer.updatedBy.name,
		UpdatedAt: farmer.updatedAt.toLocaleString(),
	};
}

async function generatePDF(farmers: ReturnType<typeof formatFarmerData>[]): Promise<Buffer> {
	return new Promise((resolve, reject) => {
		try {
			const doc = new PDFDocument();
			const chunks: Buffer[] = [];

			doc.on('data', (chunk) => chunks.push(chunk));
			doc.on('end', () => resolve(Buffer.concat(chunks)));
			doc.on('error', reject);

			doc.fontSize(20).text('Farmers Data Export', { align: 'center' }).moveDown().fontSize(12).text(`Generated on: ${new Date().toLocaleString()}`).moveDown(2);

			farmers.forEach((farmer, index) => {
				if (index > 0) doc.addPage();

				doc.fontSize(16).text(`Farmer Details - ${farmer.Name}`).moveDown();

				doc.fontSize(12)
					.text('Basic Information', { underline: true })
					.moveDown(0.5)
					.text(`Survey Number: ${farmer.SurveyNumber}`)
					.text(`Gender: ${farmer.Gender}`)
					.text(`Community: ${farmer.Community}`)
					.text(`Aadhar Number: ${farmer.AadharNumber}`)
					.text(`Contact: ${farmer.ContactNumber}`)
					.text(`Age: ${farmer.Age}`)
					.text(`Date of Birth: ${farmer.DateOfBirth}`)
					.moveDown();

				doc.text('Location Details', { underline: true })
					.moveDown(0.5)
					.text(`State: ${farmer.State}`)
					.text(`District: ${farmer.District}`)
					.text(`Mandal: ${farmer.Mandal}`)
					.text(`Village: ${farmer.Village}`)
					.text(`Panchayath: ${farmer.Panchayath}`)
					.moveDown();

				doc.text('Bank Information', { underline: true })
					.moveDown(0.5)
					.text(`Bank Name: ${farmer.BankDetails.BankName}`)
					.text(`Branch: ${farmer.BankDetails.BranchName}`)
					.text(`IFSC: ${farmer.BankDetails.IFSC}`)
					.text(`Account Number: ${farmer.BankDetails.AccountNumber}`)
					.moveDown();

				doc.text('Field Details', { underline: true }).moveDown(0.5);

				farmer.Fields.forEach((field: { AreaHa: number; YieldEstimate: number; Location: string }, idx: number) => {
					doc.text(`Field ${idx + 1}:`)
						.text(`Area (Ha): ${field.AreaHa}`)
						.text(`Yield Estimate: ${field.YieldEstimate}`)
						.text(`Location: ${field.Location}`)
						.moveDown(0.5);
				});

				doc.text('Document Links', { underline: true })
					.moveDown(0.5)
					.text('Profile Picture:', { continued: true })
					.fontSize(10)
					.text(` ${farmer.ProfilePicUrl}`)
					.fontSize(12)
					.text('Aadhar Document:', { continued: true })
					.fontSize(10)
					.text(` ${farmer.AadharDocUrl}`)
					.fontSize(12)
					.text('Bank Document:', { continued: true })
					.fontSize(10)
					.text(` ${farmer.BankDocUrl}`)
					.moveDown();

				doc.fontSize(12)
					.text('Record Information', { underline: true })
					.moveDown(0.5)
					.text(`Created By: ${farmer.CreatedBy}`)
					.text(`Created At: ${farmer.CreatedAt}`)
					.text(`Updated By: ${farmer.UpdatedBy}`)
					.text(`Updated At: ${farmer.UpdatedAt}`);
			});

			doc.end();
		} catch (error) {
			reject(error);
		}
	});
}

export async function POST(request: Request) {
	try {
		const userRole = request.headers.get('x-user-role');
		const userId = request.headers.get('x-user-id');

		if (!userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const user = await prisma.user.findUnique({
			where: { id: parseInt(userId) },
			select: { isActive: true },
		});

		if (!user?.isActive) {
			return NextResponse.json({ error: 'Account is disabled' }, { status: 403 });
		}

		if (userRole !== 'ADMIN') {
			return NextResponse.json({ error: 'Only admins can export data' }, { status: 403 });
		}

		const body = await request.json();
		const options: ExportOptions = body.options;
		console.log('Export options:', options);

		let skip = 0;
		let take = undefined;

		if (options.range === 'CURRENT_PAGE') {
			skip = (options.pageStart! - 1) * (options.limit || 10);
			take = options.limit || 10;
		} else if (options.range === 'CUSTOM_RANGE') {
			skip = (options.pageStart! - 1) * (options.limit || 10);
			take = (options.pageEnd! - options.pageStart! + 1) * (options.limit || 10);
		}

		const farmers = await prisma.farmer.findMany({
			skip,
			take,
			include: {
				documents: true,
				bankDetails: true,
				fields: true,
				createdBy: { select: { name: true } },
				updatedBy: { select: { name: true } },
			},
			orderBy: { createdAt: 'desc' },
		});

		const farmersWithUrls = await Promise.all(
			farmers.map(async (farmer) => {
				const [profileUrl, aadharUrl, bankUrl] = await Promise.all([
					supabase.storage.from('farmer-data').createSignedUrl(`profile-pic/${farmer.documents?.profilePicUrl}`, 7 * 24 * 60 * 60),
					supabase.storage.from('farmer-data').createSignedUrl(`aadhar-doc/${farmer.documents?.aadharDocUrl}`, 7 * 24 * 60 * 60),
					supabase.storage.from('farmer-data').createSignedUrl(`bank-doc/${farmer.documents?.bankDocUrl}`, 7 * 24 * 60 * 60),
				]);

				const fieldUrlResponses = await Promise.all(farmer.fields.map((field) => supabase.storage.from('farmer-data').createSignedUrl(`land-doc/${field.landDocumentUrl}`, 7 * 24 * 60 * 60)));

				const formattedFarmer = {
					...farmer,
					fields: farmer.fields.map((field) => ({
						...field,
						location: field.location as { latitude: number; longitude: number },
					})),
				};
				return formatFarmerData(formattedFarmer, {
					profileUrl: { data: profileUrl.data || undefined },
					aadharUrl: { data: aadharUrl.data || undefined },
					bankUrl: { data: bankUrl.data || undefined },
					fieldUrls: fieldUrlResponses.map((url) => ({ data: url.data || undefined })),
				});
			})
		);

		let fileName: string;
		let fileBuffer: Buffer;

		switch (options.format) {
			case 'PDF':
				fileBuffer = await generatePDF(farmersWithUrls);
				fileName = `exports/farmers_${Date.now()}.pdf`;
				break;

			case 'CSV':
				const flatData = farmersWithUrls.map((farmer) => ({
					SurveyNumber: farmer.SurveyNumber,
					Name: farmer.Name,
					Gender: farmer.Gender,
					Community: farmer.Community,
					AadharNumber: farmer.AadharNumber,
					ContactNumber: farmer.ContactNumber,
					State: farmer.State,
					District: farmer.District,
					Mandal: farmer.Mandal,
					Village: farmer.Village,
					Panchayath: farmer.Panchayath,
					DateOfBirth: farmer.DateOfBirth,
					Age: farmer.Age,
					ProfilePicUrl: farmer.ProfilePicUrl,
					AadharDocUrl: farmer.AadharDocUrl,
					BankDocUrl: farmer.BankDocUrl,
					BankDetails: JSON.stringify(farmer.BankDetails),
					Fields: JSON.stringify(farmer.Fields),
					CreatedBy: farmer.CreatedBy,
					CreatedAt: farmer.CreatedAt,
					UpdatedBy: farmer.UpdatedBy,
					UpdatedAt: farmer.UpdatedAt,
				}));

				fileBuffer = Buffer.from(stringify(flatData, { header: true }));
				fileName = `exports/farmers_${Date.now()}.csv`;
				break;

			case 'EXCEL':
			default:
				const wb = XLSX.utils.book_new();
				const ws = XLSX.utils.json_to_sheet(
					farmersWithUrls.map((f) => ({
						...f,
						BankDetails: JSON.stringify(f.BankDetails),
						Fields: JSON.stringify(f.Fields),
					}))
				);
				XLSX.utils.book_append_sheet(wb, ws, 'Farmers');
				fileBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
				fileName = `exports/farmers_${Date.now()}.xlsx`;
				break;
		}

		const { error: uploadError } = await supabase.storage.from('farmer-data').upload(fileName, fileBuffer);

		if (uploadError) {
			throw new Error(`Failed to upload export file: ${uploadError.message}`);
		}

		const { data: urlData, error: urlError } = await supabase.storage.from('farmer-data').createSignedUrl(fileName, 24 * 60 * 60);

		if (urlError) {
			throw new Error(`Failed to generate download URL: ${urlError.message}`);
		}

		return NextResponse.json({
			downloadUrl: urlData?.signedUrl,
			exportedCount: farmers.length,
		});
	} catch (error: unknown) {
		if (error instanceof Error) {
			console.error('Export error:', {
				message: error.message,
				stack: error.stack,
			});
		} else {
			console.error('Export error:', error);
		}

		return NextResponse.json(
			{
				error: 'Failed to export farmers data',
				details: error instanceof Error ? error.message : 'Unknown error',
			},
			{
				status: 500,
			}
		);
	}
}
