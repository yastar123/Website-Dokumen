import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join, extname } from 'path';
import { randomUUID } from 'crypto';
import prisma from '@/lib/prisma';
import { verifyJwt, signJwt } from '@/lib/auth';

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

    const formData = await request.formData();
    const file = formData.get('avatar') as File | null;

    if (!file) {
      return NextResponse.json({ message: 'No file provided' }, { status: 400 });
    }

    const maxSize = 3 * 1024 * 1024; // 3MB
    if (file.size > maxSize) {
      return NextResponse.json({ message: 'File too large. Maximum size is 3MB.' }, { status: 400 });
    }

    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ message: 'File type not supported.' }, { status: 400 });
    }

    const fileExtension = extname(file.name) || '.png';
    const uniqueFilename = `${randomUUID()}${fileExtension}`;

    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'avatars');
    await mkdir(uploadsDir, { recursive: true });

    const filePath = join(uploadsDir, uniqueFilename);
    const bytes = await file.arrayBuffer();
    await writeFile(filePath, new Uint8Array(bytes));

    const avatarUrl = `/uploads/avatars/${uniqueFilename}`;

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { avatarUrl },
    });

    // Re-issue JWT with updated avatar
    const newToken = await signJwt({
      id: updated.id,
      email: updated.email,
      name: updated.name,
      role: updated.role,
      avatarUrl: updated.avatarUrl || undefined,
    });

    const response = NextResponse.json({
      message: 'Avatar updated successfully',
      user: {
        id: updated.id,
        name: updated.name,
        email: updated.email,
        role: updated.role,
        avatarUrl: updated.avatarUrl || undefined,
      },
    });

    response.cookies.set('token', newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    console.error('Update avatar error:', error);
    return NextResponse.json({ message: 'Failed to update avatar' }, { status: 500 });
  }
}
