import { NextRequest, NextResponse } from 'next/server';
import { unlink } from 'fs/promises';
import { join } from 'path';
import { verifyJwt } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';

const updateFolderSchema = z.object({
  name: z.string().min(1, 'Folder name is required').max(100, 'Folder name too long'),
});

// PUT /api/folders/[id] - Update folder name
export async function PUT(
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

    const body = await request.json();
    const validation = updateFolderSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { message: 'Invalid input', errors: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { id } = params;
    const { name } = validation.data;

    // Check if folder exists and user has permission
    const existingFolder = await prisma.folder.findUnique({
      where: { id },
      include: { user: { select: { id: true, name: true } } }
    });

    if (!existingFolder) {
      return NextResponse.json(
        { message: 'Folder not found' },
        { status: 404 }
      );
    }

    // Only SUPER_ADMIN can update folders
    if (user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { message: 'Forbidden' },
        { status: 403 }
      );
    }

    // Check if another folder with same name exists for this user
    const duplicateFolder = await prisma.folder.findFirst({
      where: {
        name: { equals: name, mode: 'insensitive' },
        userId: existingFolder.userId,
        id: { not: id }
      }
    });

    if (duplicateFolder) {
      return NextResponse.json(
        { message: 'Folder with this name already exists' },
        { status: 409 }
      );
    }

    // Update folder
    const updatedFolder = await prisma.folder.update({
      where: { id },
      data: { name },
      include: {
        user: {
          select: { name: true, email: true }
        },
        _count: {
          select: {
            documents: true
          }
        }
      }
    });

    return NextResponse.json({
      message: 'Folder updated successfully',
      folder: updatedFolder
    });

  } catch (error) {
    console.error('Update folder error:', error);
    return NextResponse.json(
      { message: 'Failed to update folder' },
      { status: 500 }
    );
  }
}

// DELETE /api/folders/[id] - Delete folder
export async function DELETE(
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

    // Check if folder exists and user has permission
    const existingFolder = await prisma.folder.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            documents: true
          }
        }
      }
    });

    if (!existingFolder) {
      return NextResponse.json(
        { message: 'Folder not found' },
        { status: 404 }
      );
    }

    // Only SUPER_ADMIN can delete folders
    if (user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { message: 'Forbidden' },
        { status: 403 }
      );
    }

    // Collect documents to remove files later
    const docs = await prisma.document.findMany({ where: { folderId: id }, select: { id: true, filename: true } });

    // Build a single transaction that clears ActivityLogs -> Documents -> Folder
    await prisma.$transaction([
      // delete activity logs linked to any document in this folder
      prisma.activityLog.deleteMany({ where: { documentId: { in: docs.map(d => d.id) } } }),
      // delete documents in this folder
      prisma.document.deleteMany({ where: { folderId: id } }),
      // finally delete the folder itself
      prisma.folder.delete({ where: { id } }),
    ]);

    // After DB commit, best-effort delete files on disk
    for (const doc of docs) {
      try {
        const filePath = join(process.cwd(), 'public', 'uploads', doc.filename);
        await unlink(filePath);
      } catch (e) {
        // ignore missing files or fs errors
      }
    }

    return NextResponse.json({
      message: 'Folder deleted successfully'
    });

  } catch (error) {
    console.error('Delete folder error:', error instanceof Error ? error.message : error);
    return NextResponse.json(
      { message: 'Failed to delete folder' },
      { status: 500 }
    );
  }
}