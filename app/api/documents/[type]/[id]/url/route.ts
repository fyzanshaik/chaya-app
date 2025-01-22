import { NextResponse } from 'next/server';
import prisma from '@/utils/prisma';
import { supabase } from '@/utils/supabase';

export async function GET(request: Request, { params }: { params: { type: string; id: string } }) {
	try {
		console.log('Starting GET request for document URL generation');

		const { type: docType, id: docId } = params;
		console.log('Received params:', { docType, docId });

		const userId = request.headers.get('x-user-id');
		console.log('Validating user with userId:', userId);
		if (!userId) {
			console.error('Unauthorized: userId is missing');
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const user = await prisma.user.findUnique({
			where: { id: parseInt(userId) },
			select: { isActive: true },
		});
		console.log('User found:', user);

		if (!user?.isActive) {
			console.error('Account is disabled for userId:', userId);
			return NextResponse.json({ error: 'Account is disabled' }, { status: 403 });
		}

		const folderMap = {
			'profile-pic': 'profile-pic',
			aadhar: 'aadhar-doc',
			bank: 'bank-doc',
			land: 'land-doc',
		} as const;

		const folder = folderMap[docType as keyof typeof folderMap];
		console.log('Folder mapped for docType:', folder);
		if (!folder) {
			console.error('Invalid document type:', docType);
			return NextResponse.json({ error: 'Invalid document type' }, { status: 400 });
		}

		console.log('Finding farmer with docId:', docId);
		const farmer = await prisma.farmer.findFirst({
			where: {
				OR: [{ surveyNumber: docId }, { id: parseInt(docId) || 0 }],
			},
			include: {
				documents: true,
				fields: true,
			},
		});
		console.log('Farmer found:', farmer);

		if (!farmer) {
			console.error('Farmer not found for docId:', docId);
			return NextResponse.json({ error: 'Farmer not found' }, { status: 404 });
		}

		let fileName = '';
		switch (docType) {
			case 'profile-pic':
				fileName = farmer.documents?.profilePicUrl || '';
				break;
			case 'aadhar':
				fileName = farmer.documents?.aadharDocUrl || '';
				break;
			case 'bank':
				fileName = farmer.documents?.bankDocUrl || '';
				break;
			case 'land':
				const { searchParams } = new URL(request.url);
				const fieldIndex = parseInt(searchParams.get('fieldIndex') || '0');
				console.log('Field index for land document:', fieldIndex);
				fileName = farmer.fields[fieldIndex]?.landDocumentUrl || '';
				break;
			default:
				console.error('Invalid document type:', docType);
				return NextResponse.json({ error: 'Invalid document type' }, { status: 400 });
		}
		console.log('File name resolved:', fileName);

		if (!fileName) {
			console.error('Document not found for docType:', docType);
			return NextResponse.json({ error: 'Document not found' }, { status: 404 });
		}

		const filePath = `${folder}/${fileName}`;
		console.log('File path generated:', filePath);

		console.log('Generating signed URL for file:', filePath);
		const { data: signedUrlData, error: signedUrlError } = await supabase.storage.from('farmer-data').createSignedUrl(filePath, 1800); // 30 minutes

		if (signedUrlError) {
			console.error('Supabase error:', signedUrlError);
			return NextResponse.json({ error: 'Failed to generate URL' }, { status: 500 });
		}

		if (!signedUrlData?.signedUrl) {
			console.error('Failed to generate signed URL for file:', filePath);
			return NextResponse.json({ error: 'Failed to generate URL' }, { status: 500 });
		}

		console.log('Signed URL generated successfully:', signedUrlData.signedUrl);
		return NextResponse.json({ url: signedUrlData.signedUrl });
	} catch (error) {
		const err = error as Error;
		console.error('Document URL generation error:', {
			name: err.name,
			message: err.message,
			stack: err.stack,
		});

		return NextResponse.json({ error: 'Failed to generate document URL' }, { status: 500 });
	}
}
