import { NextRequest, NextResponse } from 'next/server';
import { verifyJwt } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const fileType = searchParams.get('fileType') || '';
    const folderId = searchParams.get('folderId') || '';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    // Build where clause: allow all roles to see all documents
    // If you want to re-introduce restrictions later, adjust this baseWhere accordingly.
    const baseWhere = {};

    // Add search filters
    const where = {
      ...baseWhere,
      ...(query && {
        OR: [
          { originalName: { contains: query, mode: 'insensitive' as const } },
          { uploadedBy: { name: { contains: query, mode: 'insensitive' as const } } },
        ],
      }),
      ...(fileType && { fileType: { startsWith: fileType } }),
      ...(folderId && { folderId }),
    };

    // Get total count for pagination
    const totalCount = await prisma.document.count({ where });

    // Get documents with pagination and sorting
    const documents = await prisma.document.findMany({
      where,
      include: {
        uploadedBy: {
          select: { id: true, name: true, email: true },
        },
        folder: {
          select: { id: true, name: true },
        },
      },
      orderBy: {
        [sortBy]: sortOrder as 'asc' | 'desc',
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    return NextResponse.json({
      documents,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });

  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { message: 'Search failed. Please try again.' },
      { status: 500 }
    );
  }
}