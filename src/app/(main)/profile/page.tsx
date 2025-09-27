"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const { toast } = useToast();
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const getInitials = (name: string) => {
    const names = name.split(" ");
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`;
    }
    return name.substring(0, 2);
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    const url = URL.createObjectURL(f);
    setPreview(url);
  };

  const onUpload = async () => {
    if (!file) {
      toast({ variant: "destructive", title: "Pilih file dulu" });
      return;
    }
    try {
      setLoading(true);
      const fd = new FormData();
      fd.append("avatar", file);
      const res = await fetch("/api/profile/avatar", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || "Gagal mengunggah avatar");
      }
      // update auth context
      setUser((prev) => prev ? { ...prev, avatarUrl: data.user.avatarUrl } : prev);
      toast({ title: "Berhasil", description: "Foto profil diperbarui." });
      setPreview(null);
      setFile(null);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Gagal", description: err.message });
    } finally {
      setLoading(false);
    }
  };
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
            {/* Foto Profil */}
            <div className="group p-3 rounded-lg transition-colors hover:bg-neutral-50">
              <p className="font-medium text-sm text-neutral-800">Foto Profil</p>
              <div className="flex items-center gap-4 mt-2">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={preview || user?.avatarUrl || (user ? `https://avatar.vercel.sh/${user.email}.png` : undefined)} alt={user?.name || "avatar"} />
                  <AvatarFallback>{user ? getInitials(user.name) : "?"}</AvatarFallback>
                </Avatar>
                <div className="flex-1 flex flex-col sm:flex-row gap-2">
                  <Input type="file" accept="image/*" onChange={onFileChange} />
                  <Button onClick={onUpload} disabled={!file || loading}>
                    {loading ? "Menyimpan..." : "Simpan"}
                  </Button>
                </div>
              </div>
            </div>

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

            <div className="group p-3 rounded-lg transition-colors hover:bg-neutral-50">
              <p className="font-medium text-sm text-neutral-800">Role</p>
              <p className="text-neutral-500 group-hover:text-neutral-700 transition-colors">
                {user?.role}
              </p>
            </div>

            {/* Info tambahan */}
            <p className="text-center text-sm text-neutral-400 pt-6">
              Anda dapat mengganti foto profil kapan pun.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
