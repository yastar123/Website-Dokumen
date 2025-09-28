import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyJwt } from '@/lib/auth';
import { z } from 'zod';
import { join } from 'path';
import { unlink } from 'fs/promises';

const bulkDeleteSchema = z.object({
  ids: z.array(z.string().min(1)).min(1),
});

// POST /api/documents/bulk-delete  (SUPER_ADMIN only)
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    const user = await verifyJwt(token);
    if (!user) return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    if (user.role !== 'SUPER_ADMIN') return NextResponse.json({ message: 'Forbidden' }, { status: 403 });

    const body = await request.json();
    const parsed = bulkDeleteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ message: 'Invalid input', errors: parsed.error.flatten() }, { status: 400 });
    }

    const ids = parsed.data.ids;

    // Fetch the docs first to know filenames for FS cleanup
    const docs = await prisma.document.findMany({
      where: { id: { in: ids } },
      select: { id: true, filename: true, filePath: true, originalName: true },
    });

    if (docs.length === 0) {
      return NextResponse.json({ message: 'No documents found for deletion' }, { status: 404 });
    }

    // DB cleanup in a single transaction: ActivityLogs -> Documents
    await prisma.$transaction([
      prisma.activityLog.deleteMany({ where: { documentId: { in: ids } } }),
      prisma.document.deleteMany({ where: { id: { in: ids } } }),
    ]);

    // Best-effort delete files on disk after DB commit
    await Promise.all(docs.map(async (d) => {
      try {
        const relative = (d.filePath?.replace(/^\//, '')) || join('uploads', d.filename);
        const filePath = join(process.cwd(), 'public', relative);
        await unlink(filePath);
      } catch (_) {}
    }));

    return NextResponse.json({ message: 'Documents deleted', count: docs.length });
  } catch (error) {
    console.error('Bulk delete error:', error instanceof Error ? error.message : error);
    return NextResponse.json({ message: 'Failed to bulk delete documents' }, { status: 500 });
  }
}
