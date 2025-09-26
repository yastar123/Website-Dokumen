import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
import prisma from '@/lib/prisma';
import { verifyJwt } from '@/lib/auth';
import { join } from 'path';
import { createReadStream } from 'fs';
import { PassThrough } from 'stream';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const user = await verifyJwt(token);
    if (!user) {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }

    const { id } = params;

    const folder = await prisma.folder.findUnique({
      where: { id },
      include: {
        documents: true,
      },
    });

    if (!folder) {
      return NextResponse.json({ message: 'Folder not found' }, { status: 404 });
    }

    // Stream a zip of the folder's documents
    // Use dynamic import and support both default/named export
    const archiverModule = await import('archiver');
    const archiverFn: any = (archiverModule as any).default ?? archiverModule;
    const archive = archiverFn('zip', { zlib: { level: 9 } });
    const stream = new PassThrough();

    const zipFileName = `${folder.name.replace(/[^a-zA-Z0-9_-]+/g, '_') || 'folder'}.zip`;

    // start archiving async
    (async () => {
      try {
        if (folder.documents.length > 0) {
          for (const doc of folder.documents) {
            const filePath = join(process.cwd(), 'public', 'uploads', doc.filename);
            const fileStream = createReadStream(filePath);
            archive.append(fileStream, { name: doc.originalName });
          }
        } else {
          // Add a placeholder readme if empty
          archive.append(`Folder "${folder.name}" has no documents.`, { name: 'README.txt' });
        }
        await archive.finalize();
      } catch (e) {
        stream.emit('error', e as any);
      }
    })();

    archive.on('error', (err: any) => {
      stream.emit('error', err);
    });

    archive.pipe(stream);

    return new NextResponse(stream as any, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${zipFileName}"`,
      },
    });
  } catch (error) {
    console.error('Folder zip error:', error);
    return NextResponse.json(
      { message: 'Failed to download folder' },
      { status: 500 }
    );
  }
}
