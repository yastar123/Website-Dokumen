"use client";

import { createContext, useState, useEffect } from 'react';
import type { DecodedJwtPayload } from '@/types';

interface AuthContextType {
  user: DecodedJwtPayload | null;
  setUser: React.Dispatch<React.SetStateAction<DecodedJwtPayload | null>>;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({
  children,
  initialUser,
}: {
  children: React.ReactNode;
  initialUser: DecodedJwtPayload | null;
}) {
  const [user, setUser] = useState<DecodedJwtPayload | null>(initialUser);

  // You might want to add logic here to re-fetch or re-validate the user
  // on certain events, like window focus.
  useEffect(() => {
    setUser(initialUser);
  }, [initialUser])

  return (
    <AuthContext.Provider value={{ user, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}
