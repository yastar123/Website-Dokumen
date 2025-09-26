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

    // If folder has documents, delete them (DB + disk)
    if (existingFolder._count.documents > 0) {
      const docs = await prisma.document.findMany({ where: { folderId: id } });
      for (const doc of docs) {
        try {
          await prisma.document.delete({ where: { id: doc.id } });
        } catch (_) {}
        try {
          const filePath = join(process.cwd(), 'public', 'uploads', doc.filename);
          await unlink(filePath);
        } catch (_) {}
      }
    }

    // Delete folder
    await prisma.folder.delete({ where: { id } });

    return NextResponse.json({
      message: 'Folder deleted successfully'
    });

  } catch (error) {
    console.error('Delete folder error:', error);
    return NextResponse.json(
      { message: 'Failed to delete folder' },
      { status: 500 }
    );
  }
}