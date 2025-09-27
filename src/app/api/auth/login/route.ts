import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { comparePasswords, hashPassword } from '@/lib/password';
import { signJwt } from '@/lib/auth';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = loginSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ message: 'Invalid input' }, { status: 400 });
    }

    const { email, password } = validation.data;
    const normalizedEmail = email.trim().toLowerCase();

    // Ensure default SUPER ADMIN exists (idempotent)
    const superAdminEmail = 'superadmin@gmail.com';
    if (normalizedEmail === superAdminEmail) {
      await prisma.user.upsert({
        where: { email: superAdminEmail },
        update: {
          role: 'SUPER_ADMIN',
          isActive: true,
        },
        create: {
          name: 'Super Admin',
          email: superAdminEmail,
          password: await hashPassword('11111111'),
          role: 'SUPER_ADMIN',
          isActive: true,
        },
      });
    }

    const user = await prisma.user.findFirst({
      where: { email: { equals: normalizedEmail, mode: 'insensitive' } },
    });

    if (!user || !(await comparePasswords(password, user.password))) {
      return NextResponse.json(
        { message: 'Invalid email or password' },
        { status: 401 }
      );
    }

    if (!user.isActive) {
        return NextResponse.json(
            { message: 'Your account is inactive. Please contact an administrator.' },
            { status: 403 }
        );
    }

    await prisma.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date() },
    });
    
    // In a real app, you would also create an ActivityLog here
    // await prisma.activityLog.create(...)

    const { password: _, ...userWithoutPassword } = user;

    const payload = {
      id: userWithoutPassword.id,
      email: userWithoutPassword.email,
      name: userWithoutPassword.name,
      role: userWithoutPassword.role,
      avatarUrl: (userWithoutPassword as any).avatarUrl || undefined,
    } as any;

    const token = await signJwt(payload);

    const response = NextResponse.json(
      { message: 'Login successful', user: payload },
      { status: 200 }
    );

    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 1 week
    });

    return response;
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

