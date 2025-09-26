import { NextRequest, NextResponse } from 'next/server';
import { verifyJwt } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';

const updateUserSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  role: z.enum(['KARYAWAN', 'ADMIN', 'SUPER_ADMIN']).optional(),
  isActive: z.boolean().optional(),
});

// PUT /api/users/[id] - Update user (admin only)
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
    if (!user || user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validation = updateUserSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { message: 'Invalid input', errors: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { id } = params;
    const updateData = validation.data;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
      select: { id: true, name: true, email: true, role: true, isActive: true }
    });

    if (!existingUser) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    // Prevent admin from demoting themselves
    if (id === user.id && updateData.role && updateData.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { message: 'Cannot change your own admin privileges' },
        { status: 400 }
      );
    }

    // Prevent admin from deactivating themselves
    if (id === user.id && updateData.isActive === false) {
      return NextResponse.json(
        { message: 'Cannot deactivate your own account' },
        { status: 400 }
      );
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
      }
    });

    // Log activity
    const changeParts: string[] = [];
    if (updateData.name !== undefined && updateData.name !== existingUser.name) {
      changeParts.push(`name: ${existingUser.name} → ${updateData.name}`);
    }
    if (updateData.role !== undefined && updateData.role !== existingUser.role) {
      changeParts.push(`role: ${existingUser.role} → ${updateData.role}`);
    }
    if (updateData.isActive !== undefined && updateData.isActive !== existingUser.isActive) {
      changeParts.push(`isActive: ${existingUser.isActive} → ${updateData.isActive}`);
    }
    const changes = changeParts.join(', ');

    if (changes) {
      await prisma.activityLog.create({
        data: {
          userId: user.id,
          action: updateData.role ? 'UPDATE_USER_ROLE' : 'TOGGLE_USER_STATUS',
          details: `Updated user ${existingUser.name}: ${changes}`,
          ipAddress: request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown',
        },
      });
    }

    return NextResponse.json({
      message: 'User updated successfully',
      user: updatedUser
    });

  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json(
      { message: 'Failed to update user' },
      { status: 500 }
    );
  }
}