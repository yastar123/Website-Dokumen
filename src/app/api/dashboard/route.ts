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

    // Get user's documents count and recent documents
    const [documentsCount, recentDocuments, totalUsers, recentActivity] = await Promise.all([
      // Total documents for current user (or all if admin)
      prisma.document.count({
        where: user.role === 'SUPER_ADMIN' ? {} : { uploadedById: user.id }
      }),
      
      // Recent documents
      prisma.document.findMany({
        where: user.role === 'SUPER_ADMIN' ? {} : { uploadedById: user.id },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          uploadedBy: {
            select: { name: true, email: true }
          },
          folder: {
            select: { name: true }
          }
        }
      }),
      
      // Total users (admin only)
      user.role === 'SUPER_ADMIN' ? prisma.user.count() : 0,
      
      // Recent activity (admin only)
      user.role === 'SUPER_ADMIN' 
        ? prisma.activityLog.findMany({
            orderBy: { createdAt: 'desc' },
            take: 10,
            include: {
              user: {
                select: { name: true, email: true }
              },
              document: {
                select: { originalName: true }
              }
            }
          })
        : []
    ]);

    // Calculate total storage used
    const storageUsed = await prisma.document.aggregate({
      where: user.role === 'SUPER_ADMIN' ? {} : { uploadedById: user.id },
      _sum: {
        fileSize: true
      }
    });

    // Calculate documents by type
    const documentsByType = await prisma.document.groupBy({
      by: ['fileType'],
      where: user.role === 'SUPER_ADMIN' ? {} : { uploadedById: user.id },
      _count: {
        fileType: true
      }
    });

    // Format storage usage
    const formatFileSize = (bytes: number | null) => {
      if (!bytes || bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const stats = {
      documentsCount,
      totalUsers,
      storageUsed: formatFileSize(storageUsed._sum.fileSize),
      storageBytes: storageUsed._sum.fileSize || 0,
      recentDocuments: recentDocuments.map(doc => ({
        id: doc.id,
        originalName: doc.originalName,
        fileType: doc.fileType,
        fileSize: doc.fileSize,
        createdAt: doc.createdAt,
        uploadedBy: doc.uploadedBy,
        folder: doc.folder
      })),
      documentsByType: documentsByType.map(item => ({
        type: item.fileType,
        count: item._count.fileType
      })),
      recentActivity: user.role === 'SUPER_ADMIN' ? recentActivity.map(activity => ({
        id: activity.id,
        action: activity.action,
        details: activity.details,
        createdAt: activity.createdAt,
        user: activity.user,
        document: activity.document
      })) : []
    };

    return NextResponse.json(stats);

  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json(
      { message: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}