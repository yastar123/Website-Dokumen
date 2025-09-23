import type { Role } from "@prisma/client";

export type UserRole = Role;

export interface DecodedJwtPayload {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  iat: number;
  exp: number;
}
