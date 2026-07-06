import { NextRequest, NextResponse } from 'next/server';
import { getStorageService } from '@/shared/services/storage/storage-provider.service';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const fileType = formData.get('fileType') as string; // 'document', 'architecture', 'cost'

    if (!file) {
      console.error('No file uploaded.');
      return NextResponse.json({ error: 'No file uploaded.' }, { status: 400 });
    }

    if (!fileType) {
      console.error('File type not specified.');
      return NextResponse.json({ error: 'File type not specified.' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const storageService = getStorageService();
    const filePath = await storageService.uploadFile(buffer, file.name, file.type);

    console.log(`File uploaded successfully: ${filePath} for type: ${fileType}`);
    return NextResponse.json({ path: filePath }, { status: 200 });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json({ error: 'Failed to upload file.' }, { status: 500 });
  }
}
