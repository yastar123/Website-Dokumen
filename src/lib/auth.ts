import { SignJWT, jwtVerify } from 'jose';
import type { DecodedJwtPayload } from '@/types';
import { z } from 'zod';

const getJwtSecretKey = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not set in environment variables');
  }
  return new TextEncoder().encode(secret);
};

export async function signJwt(payload: Omit<DecodedJwtPayload, 'iat' | 'exp'>) {
  const secret = getJwtSecretKey();
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(process.env.JWT_EXPIRES_IN || '7d')
    .sign(secret);
  return token;
}

export async function verifyJwt(token: string): Promise<DecodedJwtPayload | null> {
  try {
    const secret = getJwtSecretKey();
    const { payload } = await jwtVerify(token, secret);

    const jwtPayloadSchema = z.object({
      id: z.string(),
      email: z.string().email(),
      name: z.string(),
      avatarUrl: z.string().optional(),
      role: z.enum(['KARYAWAN', 'ADMIN', 'SUPER_ADMIN']),
      iat: z.number().optional(),
      exp: z.number().optional(),
    });

    const parsed = jwtPayloadSchema.safeParse(payload);
    if (!parsed.success) return null;

    // Ensure iat/exp exist as numbers; if absent, reject
    if (parsed.data.iat === undefined || parsed.data.exp === undefined) return null;

    return parsed.data as DecodedJwtPayload;
  } catch (error) {
    return null;
  }
}

