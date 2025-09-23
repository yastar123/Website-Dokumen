import { SignJWT, jwtVerify } from 'jose';
import type { DecodedJwtPayload } from '@/types';

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
    return payload as DecodedJwtPayload;
  } catch (error) {
    return null;
  }
}
