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
import { Download, File, FileText, FolderOpen, Grid3X3, Image, List, Eye, ChevronLeft, Edit, Trash2, MoreVertical } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import DocumentThumbnail from "@/components/documents/document-thumbnail";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";

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

// Short type label for badges to avoid long MIME strings on small screens
const getTypeShortLabel = (fileType: string) => {
  if (!fileType) return 'File';
  if (fileType === 'application/pdf') return 'PDF';
  if (fileType.startsWith('image/')) return 'Image';
  if (fileType.includes('word')) return 'Word';
  if (fileType.includes('excel') || fileType.includes('spreadsheet')) return 'Excel';
  return 'File';
};

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
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

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

  // Keep file extension, truncate base name nicely for UI
  const shortenFileName = (name: string, max = 28) => {
    if (!name) return '';
    const dot = name.lastIndexOf('.');
    const hasExt = dot > 0 && dot < name.length - 1;
    const base = hasExt ? name.slice(0, dot) : name;
    const ext = hasExt ? name.slice(dot) : '';
    if (base.length <= max) return name; // no need to cut
    return base.slice(0, Math.max(0, max - 3)) + '...' + ext;
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

  // Selection helpers (SUPER_ADMIN bulk actions)
  const toggleSelect = (id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const copy = new Set(prev);
      if (checked) copy.add(id); else copy.delete(id);
      return copy;
    });
  };

  const allIds = documents.map((d) => d.id);
  const allSelected = selectedIds.size > 0 && selectedIds.size === documents.length;
  const toggleSelectAll = (checked: boolean) => {
    setSelectedIds(checked ? new Set(allIds) : new Set());
  };

  const bulkDeleteSelected = async () => {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`Delete ${selectedIds.size} selected document(s)? This cannot be undone.`)) return;
    try {
      const res = await fetch('/api/documents/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({} as any));
        throw new Error((data as any)?.message || 'Bulk delete failed');
      }
      setDocuments((prev: DocumentItem[]) => prev.filter((d) => !selectedIds.has(d.id)));
      setSelectedIds(new Set());
      toast({ title: 'Deleted', description: 'Selected documents removed' });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to delete selected documents';
      toast({ variant: 'destructive', title: 'Error', description: msg });
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
          {user?.role === 'SUPER_ADMIN' && (
            <>
              <div className="flex items-center gap-1 ml-2">
                <Checkbox id="selectAll" checked={allSelected} onCheckedChange={(v) => toggleSelectAll(!!v)} />
                <label htmlFor="selectAll" className="text-sm">Select all</label>
              </div>
              <Button
                variant="destructive"
                size="sm"
                disabled={selectedIds.size === 0}
                onClick={bulkDeleteSelected}
              >
                <Trash2 className="h-4 w-4 mr-1" /> Delete selected ({selectedIds.size})
              </Button>
            </>
          )}
        </div>
      </div>

      {documents.length === 0 ? (
        <Card><CardContent className="py-16 text-center text-muted-foreground">No documents in this folder.</CardContent></Card>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-2 sm:gap-3">
          {documents.map((doc) => (
            <Card key={doc.id} className="hover:shadow-md transition-shadow overflow-hidden">
              <CardHeader className="pb-2 sm:pb-3">
                <div className="relative flex items-start sm:items-center justify-between gap-1 sm:gap-2">
                  <div className="min-w-0 flex-1 pr-12 sm:pr-12">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      {user?.role === 'SUPER_ADMIN' && (
                        <Checkbox
                          checked={selectedIds.has(doc.id)}
                          onCheckedChange={(v) => toggleSelect(doc.id, !!v)}
                          className="mr-1"
                        />
                      )}
                      <Badge variant="secondary" className="text-[10px] sm:text-xs shrink-0">{getTypeShortLabel(doc.fileType)}</Badge>
                    </div>
                    <p
                      className="mt-1 text-sm font-medium truncate pr-2 leading-snug block min-w-0"
                      title={doc.originalName}
                    >
                      {shortenFileName(doc.originalName)}
                    </p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="absolute right-0 top-0 h-7 w-7 z-10 sm:static sm:h-8 sm:w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" sideOffset={4} className="w-44">
                      <DropdownMenuItem onClick={() => setPreviewDoc(doc)}>
                        <Eye className="mr-2 h-4 w-4" />
                        <span>Preview</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDownload(doc)}>
                        <Download className="mr-2 h-4 w-4" />
                        <span>Download</span>
                      </DropdownMenuItem>
                      {user?.role === 'SUPER_ADMIN' && (
                        <DropdownMenuItem onClick={() => renameDocument(doc)}>
                          <Edit className="mr-2 h-4 w-4" />
                          <span>Rename</span>
                        </DropdownMenuItem>
                      )}
                      {user?.role === 'SUPER_ADMIN' && (
                        <DropdownMenuItem onClick={() => deleteDocument(doc)} className="text-destructive">
                          <Trash2 className="mr-2 h-4 w-4" />
                          <span>Delete</span>
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {/* Visual thumbnail preview like Google Drive */}
                <DocumentThumbnail doc={doc} className="mb-2 sm:mb-3" />
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex flex-col gap-1.5 sm:gap-2 sm:flex-row sm:items-center sm:justify-between text-xs text-muted-foreground">
                    <div className="hidden sm:flex items-center space-x-1">
                      <FolderOpen className="h-3 w-3" />
                      <span>{folder?.name}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <FileText className="h-3 w-3" />
                      <span>{formatDistanceToNow(new Date(doc.createdAt), { addSuffix: true })}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center pt-1 sm:pt-2 gap-2 flex-wrap"></div>
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
                    {user?.role === 'SUPER_ADMIN' && (
                      <Checkbox
                        checked={selectedIds.has(doc.id)}
                        onCheckedChange={(v) => toggleSelect(doc.id, !!v)}
                      />
                    )}
                    {getFileIcon(doc.fileType)}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate" title={doc.originalName}>{shortenFileName(doc.originalName)}</p>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground mt-1">
                        <span>{formatFileSize(doc.fileSize)}</span>
                        <span>{formatDistanceToNow(new Date(doc.createdAt), { addSuffix: true })}</span>
                        <span className="flex items-center"><FolderOpen className="h-3 w-3 mr-1" />{folder?.name}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                    <Badge variant="secondary" className="text-[10px] sm:text-xs">{getTypeShortLabel(doc.fileType)}</Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" sideOffset={4} className="w-44">
                        <DropdownMenuItem onClick={() => setPreviewDoc(doc)}>
                          <Eye className="mr-2 h-4 w-4" />
                          <span>Preview</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDownload(doc)}>
                          <Download className="mr-2 h-4 w-4" />
                          <span>Download</span>
                        </DropdownMenuItem>
                        {user?.role === 'SUPER_ADMIN' && (
                          <DropdownMenuItem onClick={() => renameDocument(doc)}>
                            <Edit className="mr-2 h-4 w-4" />
                            <span>Rename</span>
                          </DropdownMenuItem>
                        )}
                        {user?.role === 'SUPER_ADMIN' && (
                          <DropdownMenuItem onClick={() => deleteDocument(doc)} className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            <span>Delete</span>
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
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
