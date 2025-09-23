"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { Download, File, FileText, FolderOpen, Grid3X3, Image, List, Eye, ChevronLeft, Edit, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface DocumentItem {
  id: string;
  originalName: string;
  fileType: string;
  fileSize: number;
  createdAt: string;
  uploadedBy: { id: string; name: string; email: string };
  folder?: { id: string; name: string } | null;
  filePath?: string;
}

interface SearchResponse {
  documents: DocumentItem[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
  };
}

interface FolderData {
  id: string;
  name: string;
}

export default function FolderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();

  const folderId = useMemo(() => (typeof params?.id === "string" ? params.id : Array.isArray(params?.id) ? params.id[0] : ""), [params]);

  const [folder, setFolder] = useState<FolderData | null>(null);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [previewDoc, setPreviewDoc] = useState<DocumentItem | null>(null);

  useEffect(() => {
    if (!folderId) return;
    const run = async () => {
      setIsLoading(true);
      try {
        // get folder name from list
        const fRes = await fetch('/api/folders');
        if (fRes.ok) {
          const data = await fRes.json();
          const f = (data.folders as FolderData[]).find(x => x.id === folderId) || null;
          setFolder(f);
        }
        // get documents in folder
        const params = new URLSearchParams({ q: '', fileType: '', folderId, sortBy: 'createdAt', sortOrder: 'desc', page: '1', limit: '50' });
        const dRes = await fetch(`/api/documents/search?${params}`);
        if (!dRes.ok) throw new Error('Failed to fetch documents');
        const dData: SearchResponse = await dRes.json();
        setDocuments(dData.documents);
      } catch (e) {
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to load folder documents' });
      } finally {
        setIsLoading(false);
      }
    };
    run();
  }, [folderId, toast]);

  const getFileIcon = (fileType: string, size = "h-5 w-5") => {
    if (fileType.startsWith('image/')) return <Image className={`${size} text-green-600`} />;
    if (fileType === 'application/pdf') return <FileText className={`${size} text-red-600`} />;
    if (fileType.includes('word')) return <FileText className={`${size} text-blue-600`} />;
    if (fileType.includes('excel') || fileType.includes('spreadsheet')) return <FileText className={`${size} text-green-700`} />;
    return <File className={`${size} text-gray-600`} />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDownload = async (doc: DocumentItem) => {
    try {
      const response = await fetch(`/api/documents/${doc.id}/download`);
      if (!response.ok) throw new Error('Download failed');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = doc.originalName;
      window.document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      window.document.body.removeChild(a);
    } catch (e) {
      toast({ variant: 'destructive', title: 'Download failed' });
    }
  };

  const renameDocument = async (doc: DocumentItem) => {
    const newName = window.prompt('Rename document', doc.originalName);
    if (!newName || newName.trim() === doc.originalName) return;
    try {
      const res = await fetch(`/api/documents/${doc.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ originalName: newName.trim() }),
      });
      if (!res.ok) throw new Error('Failed to rename');
      toast({ title: 'Renamed', description: 'Document name updated' });
      setDocuments((docs: DocumentItem[]) => docs.map((d: DocumentItem) => d.id === doc.id ? { ...d, originalName: newName.trim() } : d));
    } catch (e) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to rename document' });
    }
  };

  const deleteDocument = async (doc: DocumentItem) => {
    if (!window.confirm(`Delete document "${doc.originalName}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/documents/${doc.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      toast({ title: 'Deleted', description: 'Document removed' });
      setDocuments((docs: DocumentItem[]) => docs.filter((d: DocumentItem) => d.id !== doc.id));
    } catch (e) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete document' });
    }
  };

  const renderPreview = () => {
    if (!previewDoc) return null;
    const isImage = previewDoc.fileType.startsWith('image/');
    const isPdf = previewDoc.fileType === 'application/pdf';
    const src = previewDoc.filePath || `/uploads/${(previewDoc as any).filename || ''}`; // fallback
    return (
      <Dialog open={!!previewDoc} onOpenChange={(open) => !open && setPreviewDoc(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Preview: {previewDoc.originalName}</DialogTitle>
          </DialogHeader>
          <div className="min-h-[400px]">
            {isImage && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={src} alt={previewDoc.originalName} className="max-h-[70vh] w-auto mx-auto" />
            )}
            {isPdf && (
              <object data={src} type="application/pdf" className="w-full h-[70vh]">
                <p>PDF preview is not available. <a href={src} target="_blank" rel="noreferrer">Open</a></p>
              </object>
            )}
            {!isImage && !isPdf && (
              <div className="text-sm text-muted-foreground">No inline preview available for this file type.</div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  if (!folderId) return null;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ChevronLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Folder</h1>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i}><CardContent className="p-6"><Skeleton className="h-20 w-full" /></CardContent></Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ChevronLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">{folder?.name || 'Folder'}</h1>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" asChild>
            <a href={`/api/folders/${folderId}/download`}>Download Folder</a>
          </Button>
          <span className="text-sm text-muted-foreground">View:</span>
          <Button variant={viewMode === 'grid' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('grid')}>
            <Grid3X3 className="h-4 w-4" />
          </Button>
          <Button variant={viewMode === 'list' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('list')}>
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {documents.length === 0 ? (
        <Card><CardContent className="py-16 text-center text-muted-foreground">No documents in this folder.</CardContent></Card>
      ) : viewMode === 'grid' ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {documents.map((doc) => (
            <Card key={doc.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2 min-w-0 flex-1">
                    {getFileIcon(doc.fileType)}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate" title={doc.originalName}>{doc.originalName}</p>
                      <Badge variant="secondary" className="text-xs mt-1">{doc.fileType}</Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-xs text-muted-foreground">
                    <div className="flex items-center space-x-1">
                      <FolderOpen className="h-3 w-3" />
                      <span>{folder?.name}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <FileText className="h-3 w-3" />
                      <span>{formatDistanceToNow(new Date(doc.createdAt), { addSuffix: true })}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center pt-2 gap-2 flex-wrap">
                    <Button variant="outline" size="sm" onClick={() => handleDownload(doc)}>
                      <Download className="h-3 w-3 mr-1" /> Download
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setPreviewDoc(doc)}>
                      <Eye className="h-3 w-3" />
                    </Button>
                    {user?.role === 'SUPER_ADMIN' && (
                      <div className="flex items-center gap-1 flex-wrap">
                        <Button variant="ghost" size="sm" onClick={() => renameDocument(doc)} title="Rename">
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => deleteDocument(doc)} title="Delete">
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {documents.map((doc) => (
                <div key={doc.id} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center space-x-3 min-w-0 flex-1">
                    {getFileIcon(doc.fileType)}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{doc.originalName}</p>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground mt-1">
                        <span>{formatFileSize(doc.fileSize)}</span>
                        <span>{formatDistanceToNow(new Date(doc.createdAt), { addSuffix: true })}</span>
                        <span className="flex items-center"><FolderOpen className="h-3 w-3 mr-1" />{folder?.name}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 flex-wrap">
                    <Badge variant="secondary" className="text-xs">{doc.fileType}</Badge>
                    <Button variant="ghost" size="sm" onClick={() => setPreviewDoc(doc)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDownload(doc)}>
                      <Download className="h-4 w-4" />
                    </Button>
                    {user?.role === 'SUPER_ADMIN' && (
                      <>
                        <Button variant="ghost" size="sm" onClick={() => renameDocument(doc)} title="Rename">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => deleteDocument(doc)} title="Delete">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {renderPreview()}
    </div>
  );
}
