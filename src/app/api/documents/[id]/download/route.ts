import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { verifyJwt } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify authentication
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const user = await verifyJwt(token);
    if (!user) {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }

    // Dynamic route params
    const { id } = params;

    // Find the document
    const document = await prisma.document.findUnique({
      where: { id },
      include: { uploadedBy: true },
    });

    if (!document) {
      return NextResponse.json({ message: 'Document not found' }, { status: 404 });
    }

    // All roles are allowed to download any document

    // Construct file path
    const filePath = join(process.cwd(), 'public', 'uploads', document.filename);

    try {
      // Read the file
      const fileBuffer = await readFile(filePath);

      // Log the download activity
      await prisma.activityLog.create({
        data: {
          userId: user.id,
          action: 'DOWNLOAD_DOCUMENT',
          details: `Downloaded file: ${document.originalName}`,
          documentId: document.id,
          ipAddress: request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown',
        },
      });

      // Return the file with appropriate headers
      return new NextResponse(fileBuffer, {
        headers: {
          'Content-Disposition': `attachment; filename="${document.originalName}"`,
          'Content-Type': document.fileType,
          'Content-Length': document.fileSize.toString(),
        },
      });

    } catch (fileError) {
      console.error('File read error:', fileError);
      return NextResponse.json(
        { message: 'File not found on disk' },
        { status: 404 }
      );
    }

  } catch (error) {
    console.error('Download error:', error);
    return NextResponse.json(
      { message: 'Download failed. Please try again.' },
      { status: 500 }
    );
  }
}