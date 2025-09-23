import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyJwt } from '@/lib/auth';
import { z } from 'zod';
import { unlink } from 'fs/promises';
import { join } from 'path';

const updateDocumentSchema = z.object({
  originalName: z.string().min(1).optional(),
  folderId: z.string().nullable().optional(),
});

// PUT /api/documents/[id] - Update document metadata (SUPER_ADMIN only)
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    const user = await verifyJwt(token);
    if (!user) return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    if (user.role !== 'SUPER_ADMIN') return NextResponse.json({ message: 'Forbidden' }, { status: 403 });

    const body = await request.json();
    const parsed = updateDocumentSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ message: 'Invalid input', errors: parsed.error.flatten() }, { status: 400 });

    const { id } = params;

    const existing = await prisma.document.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ message: 'Document not found' }, { status: 404 });

    const updated = await prisma.document.update({
      where: { id },
      data: {
        ...(parsed.data.originalName ? { originalName: parsed.data.originalName } : {}),
        ...(parsed.data.folderId !== undefined ? { folderId: parsed.data.folderId } : {}),
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'UPLOAD_DOCUMENT',
        details: `Updated document: ${updated.originalName}`,
        documentId: updated.id,
      },
    });

    return NextResponse.json({ message: 'Document updated', document: updated });
  } catch (error) {
    console.error('Update document error:', error);
    return NextResponse.json({ message: 'Failed to update document' }, { status: 500 });
  }
}

// DELETE /api/documents/[id] - Delete document (SUPER_ADMIN only)
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    const user = await verifyJwt(token);
    if (!user) return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    if (user.role !== 'SUPER_ADMIN') return NextResponse.json({ message: 'Forbidden' }, { status: 403 });

    const { id } = params;

    const existing = await prisma.document.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ message: 'Document not found' }, { status: 404 });

    // delete DB first
    await prisma.document.delete({ where: { id } });

    // delete file on disk (best effort)
    try {
      const filePath = join(process.cwd(), 'public', 'uploads', existing.filename);
      await unlink(filePath);
    } catch (e) {
      // ignore if file already gone
    }

    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'DELETE_DOCUMENT',
        details: `Deleted document: ${existing.originalName}`,
        documentId: existing.id,
      },
    });

    return NextResponse.json({ message: 'Document deleted' });
  } catch (error) {
    console.error('Delete document error:', error);
    return NextResponse.json({ message: 'Failed to delete document' }, { status: 500 });
  }
}
