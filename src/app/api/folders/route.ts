import { NextRequest, NextResponse } from 'next/server';
import { verifyJwt } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';

const createFolderSchema = z.object({
  name: z.string().min(1, 'Folder name is required').max(100, 'Folder name too long'),
});

// GET /api/folders - List all folders for the current user
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const user = await verifyJwt(token);
    if (!user) {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }

    // Get folders for current user (or all if admin)
    const folders = await prisma.folder.findMany({
      where: user.role === 'SUPER_ADMIN' ? {} : { userId: user.id },
      include: {
        user: {
          select: { name: true, email: true }
        },
        _count: {
          select: {
            documents: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ folders });

  } catch (error) {
    console.error('Folders API error:', error);
    return NextResponse.json(
      { message: 'Failed to fetch folders' },
      { status: 500 }
    );
  }
}

// POST /api/folders - Create new folder
export async function POST(request: NextRequest) {
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
    const validation = createFolderSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { message: 'Invalid input', errors: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { name } = validation.data;

    // Check if folder with same name already exists for this user
    const existingFolder = await prisma.folder.findFirst({
      where: {
        name: { equals: name, mode: 'insensitive' },
        userId: user.id
      }
    });

    if (existingFolder) {
      return NextResponse.json(
        { message: 'Folder with this name already exists' },
        { status: 409 }
      );
    }

    // Create folder
    const folder = await prisma.folder.create({
      data: {
        name,
        userId: user.id,
      },
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
      message: 'Folder created successfully',
      folder
    });

  } catch (error) {
    console.error('Create folder error:', error);
    return NextResponse.json(
      { message: 'Failed to create folder' },
      { status: 500 }
    );
  }
}