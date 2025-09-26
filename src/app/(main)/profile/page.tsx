"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";

export default function ProfilePage() {
  const { user } = useAuth();
  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-black to-neutral-500 bg-clip-text text-transparent">
        Profile
      </h1>

      <Card className="rounded-2xl border border-neutral-200/60 shadow-sm hover:shadow-md transition-all duration-300 hover:border-neutral-300/80">
        <CardHeader>
          <CardTitle className="text-lg font-semibold tracking-tight">
            Informasi Anda
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Nama */}
            <div className="group p-3 rounded-lg transition-colors hover:bg-neutral-50">
              <p className="font-medium text-sm text-neutral-800">Nama</p>
              <p className="text-neutral-500 group-hover:text-neutral-700 transition-colors">
                {user?.name}
              </p>
            </div>

            {/* Email */}
            <div className="group p-3 rounded-lg transition-colors hover:bg-neutral-50">
              <p className="font-medium text-sm text-neutral-800">Email</p>
              <p className="text-neutral-500 group-hover:text-neutral-700 transition-colors">
                {user?.email}
              </p>
            </div>

            {/* Role */}
            <div className="group p-3 rounded-lg transition-colors hover:bg-neutral-50">
              <p className="font-medium text-sm text-neutral-800">Role</p>
              <p className="text-neutral-500 group-hover:text-neutral-700 transition-colors">
                {user?.role}
              </p>
            </div>

            {/* Info tambahan */}
            <p className="text-center text-sm text-neutral-400 pt-6">
              Lebih banyak pengaturan profil akan segera hadir.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
