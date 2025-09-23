"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, FolderOpen, Upload, Eye, Download, Shield, Search, Settings, Activity, FileText, HelpCircle, ChevronLeft } from "lucide-react";

export default function HelpPage() {
  const router = useRouter();

  useEffect(() => {
    // Scroll top on mount for better UX
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ChevronLeft className="h-4 w-4 mr-1" /> Kembali
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Bantuan & Tutorial</h1>
          <Badge variant="secondary">Semua Peran</Badge>
        </div>
        <Button asChild>
          <Link href="/upload">
            <Upload className="h-4 w-4 mr-2" /> Mulai Unggah
          </Link>
        </Button>
      </div>

      {/* Quick Nav */}
      <Card>
        <CardHeader>
          <CardTitle>Navigasi Cepat</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Link href="#overview" className="text-sm text-primary hover:underline">Ringkasan</Link>
            <Link href="#upload" className="text-sm text-primary hover:underline">Unggah Dokumen</Link>
            <Link href="#documents" className="text-sm text-primary hover:underline">Jelajah & Pratinjau</Link>
            <Link href="#folders" className="text-sm text-primary hover:underline">Folder</Link>
            <Link href="#search" className="text-sm text-primary hover:underline">Pencarian & Filter</Link>
            <Link href="#roles" className="text-sm text-primary hover:underline">Peran & Izin</Link>
            <Link href="#monitoring" className="text-sm text-primary hover:underline">Pemantauan (Admin)</Link>
            <Link href="#faq" className="text-sm text-primary hover:underline">FAQ</Link>
            <Link href="#tips" className="text-sm text-primary hover:underline">Tips & Pintasan</Link>
          </div>
        </CardContent>
      </Card>

      {/* Overview */}
      <section id="overview" className="space-y-4">
        <h2 className="text-2xl font-semibold">Ringkasan</h2>
        <p className="text-muted-foreground">
          Website ini membantu Anda untuk mengunggah, mengelola, mencari, melakukan pratinjau, dan mengunduh dokumen dengan aman.
          Gunakan folder untuk mengelompokkan file, pratinjau gambar/PDF secara langsung, dan pantau aktivitas (khusus Super Admin).
        </p>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Unggah</CardTitle></CardHeader>
            <CardContent className="text-sm text-muted-foreground flex items-center gap-2"><Upload className="h-4 w-4"/> Tarik & lepas atau pilih file</CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Pratinjau</CardTitle></CardHeader>
            <CardContent className="text-sm text-muted-foreground flex items-center gap-2"><Eye className="h-4 w-4"/> Lihat gambar/PDF langsung</CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Pencarian</CardTitle></CardHeader>
            <CardContent className="text-sm text-muted-foreground flex items-center gap-2"><Search className="h-4 w-4"/> Saring berdasarkan tipe, folder, tanggal</CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Unduh</CardTitle></CardHeader>
            <CardContent className="text-sm text-muted-foreground flex items-center gap-2"><Download className="h-4 w-4"/> Unduh file dan folder (ZIP)</CardContent>
          </Card>
        </div>
      </section>

      <Separator />

      {/* Step-by-step tabs */}
      <Tabs defaultValue="upload" className="w-full">
        <TabsList className="flex flex-wrap">
          <TabsTrigger value="upload" id="upload"><Upload className="h-4 w-4 mr-2"/>Unggah</TabsTrigger>
          <TabsTrigger value="documents" id="documents"><FileText className="h-4 w-4 mr-2"/>Dokumen</TabsTrigger>
          <TabsTrigger value="folders" id="folders"><FolderOpen className="h-4 w-4 mr-2"/>Folder</TabsTrigger>
          <TabsTrigger value="search" id="search"><Search className="h-4 w-4 mr-2"/>Pencarian</TabsTrigger>
          <TabsTrigger value="roles" id="roles"><Shield className="h-4 w-4 mr-2"/>Peran</TabsTrigger>
          <TabsTrigger value="monitoring" id="monitoring"><Activity className="h-4 w-4 mr-2"/>Pemantauan</TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-3">
          <Card>
            <CardHeader><CardTitle>Unggah Dokumen</CardTitle></CardHeader>
            <CardContent>
              <ol className="list-decimal pl-5 space-y-2 text-sm">
                <li>Buka halaman <Link className="text-primary hover:underline" href="/upload">Unggah</Link>.</li>
                <li>Tarik & lepas file atau klik untuk memilih. Format yang didukung: gambar, PDF, Word, Excel, dan lainnya.</li>
                <li>Opsional: pilih folder sebelum mengunggah agar lebih rapi.</li>
                <li>Klik <strong>Unggah</strong> dan tunggu sampai selesai. File akan muncul di halaman <Link className="text-primary hover:underline" href="/documents">Dokumen</Link>.</li>
              </ol>
              <div className="text-xs text-muted-foreground mt-3">Tips: Anda dapat mengunggah banyak file sekaligus.</div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="space-y-3">
          <Card>
            <CardHeader><CardTitle>Jelajah & Pratinjau Dokumen</CardTitle></CardHeader>
            <CardContent>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li>Buka <Link className="text-primary hover:underline" href="/documents">Dokumen</Link>.</li>
                <li>Gunakan tampilan Grid atau List. Klik ikon <Eye className="inline h-3 w-3"/> untuk pratinjau gambar/PDF di dialog.</li>
                <li>Klik ikon <Download className="inline h-3 w-3"/> untuk mengunduh file.</li>
                <li><strong>SUPER_ADMIN</strong> dapat mengganti nama atau menghapus file melalui tombol aksi.</li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="folders" className="space-y-3">
          <Card>
            <CardHeader><CardTitle>Mengelola Folder</CardTitle></CardHeader>
            <CardContent>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li>Buka <Link className="text-primary hover:underline" href="/folders">Folder</Link> untuk melihat semua folder.</li>
                <li>Klik <span className="font-medium">View</span> untuk melihat isi folder. Klik <span className="font-medium">Download</span> untuk mengunduh seluruh folder dalam format ZIP.</li>
                <li>Di dalam halaman detail folder, gunakan tombol <span className="font-medium">Download Folder</span> untuk mengunduh semua file sekaligus.</li>
                <li><strong>SUPER_ADMIN</strong> dapat mengganti nama atau menghapus folder. Menghapus folder akan menghapus seluruh dokumen di dalamnya.</li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="search" className="space-y-3">
          <Card>
            <CardHeader><CardTitle>Pencarian, Filter, Penyortiran</CardTitle></CardHeader>
            <CardContent>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li>Gunakan kolom pencarian pada halaman <Link className="text-primary hover:underline" href="/documents">Dokumen</Link> untuk mencari berdasarkan nama file.</li>
                <li>Saring berdasarkan tipe file, folder, dan urutkan berdasarkan tanggal atau nama (naik/turun).</li>
                <li>Kontrol halaman (pagination) ada di bagian bawah bila hasilnya banyak.</li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roles" className="space-y-3">
          <Card>
            <CardHeader><CardTitle>Peran & Izin</CardTitle></CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm">KARYAWAN</CardTitle></CardHeader>
                  <CardContent className="text-sm text-muted-foreground space-y-1">
                    <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-600"/> Unggah dokumen</div>
                    <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-600"/> Unduh dokumen</div>
                    <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-600"/> Melihat folder yang tersedia</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm">ADMIN</CardTitle></CardHeader>
                  <CardContent className="text-sm text-muted-foreground space-y-1">
                    <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-600"/> Semua kemampuan Karyawaan</div>
                    <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-600"/> Melihat semua folder</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm">SUPER_ADMIN</CardTitle></CardHeader>
                  <CardContent className="text-sm text-muted-foreground space-y-1">
                    <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-600"/> Semua kemampuan Admin</div>
                    <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-600"/> Ganti nama/Hapus file</div>
                    <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-600"/> Ganti nama/Hapus folder</div>
                    <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-600"/> Pemantauan Aktivitas</div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-3">
          <Card>
            <CardHeader><CardTitle>Pemantauan (Super Admin)</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Buka halaman <Link className="text-primary hover:underline" href="/monitoring">Pemantauan</Link> untuk melihat aktivitas terbaru seperti login, unggah, unduh, dan perubahan.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Separator />

      {/* FAQ */}
      <section id="faq" className="space-y-4">
        <div className="flex items-center gap-2">
          <HelpCircle className="h-5 w-5"/>
          <h2 className="text-2xl font-semibold">FAQ</h2>
        </div>
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="q1">
            <AccordionTrigger>Kenapa saya tidak bisa melihat semua folder?</AccordionTrigger>
            <AccordionContent>
              Saat ini semua peran dapat melihat seluruh folder. Jika kebijakan berubah, <strong>KARYAWAN</strong> bisa dibatasi hanya melihat folder tertentu.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="q2">
            <AccordionTrigger>Bagaimana cara unduh folder sekaligus?</AccordionTrigger>
            <AccordionContent>
              Buka halaman <Link href="/folders" className="text-primary hover:underline">Folder</Link>, tekan tombol <strong>Download</strong> pada kartu folder, atau buka detail folder dan klik <strong>Download Folder</strong>. File akan diunduh dalam format ZIP.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="q3">
            <AccordionTrigger>Kenapa file saya tidak bisa dipratinjau?</AccordionTrigger>
            <AccordionContent>
              Saat ini pratinjau langsung tersedia untuk gambar dan PDF. Tipe lain tetap dapat diunduh melalui tombol <strong>Download</strong>.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </section>

      <Separator />

      {/* Tips */}
      <section id="tips" className="space-y-4">
        <h2 className="text-2xl font-semibold">Tips & Pintasan</h2>
        <ul className="list-disc pl-5 text-sm space-y-1 text-muted-foreground">
          <li><strong>G</strong> untuk beralih ke Grid dan <strong>L</strong> untuk List di halaman Dokumen.</li>
          <li>Gunakan filter Folder dan Tipe File untuk mempersempit hasil pencarian.</li>
          <li>Gunakan tombol <strong>View</strong> pada kartu folder untuk melihat isi dengan cepat.</li>
        </ul>
      </section>

      <div className="flex justify-end">
        <Button asChild variant="secondary">
          <Link href="/documents">Lanjut ke Dokumen</Link>
        </Button>
      </div>
    </div>
  );
}
