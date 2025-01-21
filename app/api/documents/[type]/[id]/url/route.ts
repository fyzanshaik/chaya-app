import { NextResponse } from 'next/server';
import prisma from '@/utils/prisma';
import { supabase } from '@/utils/supabase';

export async function GET(request: Request, { params }: { params: { type: string; id: string } }) {
	try {
		const userId = request.headers.get('x-user-id');

		const user = await prisma.user.findUnique({
			where: { id: parseInt(userId!) },
			select: { isActive: true },
		});

		if (!user?.isActive) {
			return NextResponse.json({ error: 'Account is disabled' }, { status: 403 });
		}
		const { searchParams } = new URL(request.url);
		const { type } = params;

		const folderMap = {
			'profile-pic': 'profile-pic',
			aadhar: 'aadhar-doc',
			bank: 'bank-doc',
			land: 'land-doc',
		} as const;

		const folder = folderMap[type as keyof typeof folderMap];
		if (!folder) {
			return NextResponse.json({ error: 'Invalid document type' }, { status: 400 });
		}

		const farmer = await prisma.farmer.findUnique({
			where: { id: parseInt(params.id) },
			include: {
				documents: true,
				fields: true,
			},
		});

		if (!farmer) {
			return NextResponse.json({ error: 'Farmer not found' }, { status: 404 });
		}

		let filePath = '';
		switch (params.type) {
			case 'profile-pic':
				filePath = `${folder}/${farmer.documents?.profilePicUrl}`;
				break;
			case 'aadhar':
				filePath = `${folder}/${farmer.documents?.aadharDocUrl}`;
				break;
			case 'bank':
				filePath = `${folder}/${farmer.documents?.bankDocUrl}`;
				break;
			case 'land':
				const fieldIndex = parseInt(searchParams.get('fieldIndex') || '0');
				filePath = `${folder}/${farmer.fields[fieldIndex]?.landDocumentUrl}`;
				break;
		}

		const { data, error } = await supabase.storage.from('farmer-data').createSignedUrl(filePath, 1800);

		if (error) {
			throw error;
		}

		return NextResponse.json({
			url: data?.signedUrl,
		});
	} catch (error) {
		console.error('Document URL generation error:', error);
		return NextResponse.json({ error: 'Failed to generate document URL' }, { status: 500 });
	}
}
