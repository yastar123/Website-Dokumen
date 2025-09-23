import { NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { hashPassword } from '@/lib/password';

const payloadSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1).default('Dev User'),
  role: z.enum(['KARYAWAN', 'ADMIN', 'SUPER_ADMIN']).default('KARYAWAN'),
  isActive: z.boolean().default(true),
});

export async function POST(request: Request) {
  try {
    if (process.env.ALLOW_DEV_USER_SEED !== 'true') {
      return NextResponse.json({ message: 'Not allowed' }, { status: 403 });
    }

    const json = await request.json();
    const parsed = payloadSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ message: 'Invalid input', issues: parsed.error.flatten() }, { status: 400 });
    }

    const { email, password, name, role, isActive } = parsed.data;
    const normalizedEmail = email.trim().toLowerCase();

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.upsert({
      where: { email: normalizedEmail },
      update: {
        name,
        role,
        isActive,
        password: passwordHash,
      },
      create: {
        email: normalizedEmail,
        name,
        role,
        isActive,
        password: passwordHash,
      },
    });

    return NextResponse.json({ message: 'User upserted', user: { ...user, password: undefined } }, { status: 200 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
