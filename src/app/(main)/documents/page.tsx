"use client";

import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import DocumentThumbnail from "@/components/documents/document-thumbnail";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { 
  Search,
  Download,
  Eye,
  Edit,
  Trash2,
  Filter,
  SortAsc,
  SortDesc,
  FileText,
  Image,
  File,
  FolderOpen,
  Calendar,
  User,
  HardDrive,
  Grid3X3,
  List,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  MoreVertical
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

interface Document {
  id: string;
  originalName: string;
  fileType: string;
  fileSize: number;
  createdAt: string;
  uploadedBy: { id: string; name: string; email: string };
  folder?: { id: string; name: string } | null;
}

interface SearchResponse {
  documents: Document[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
  };
}

export default function DocumentsPage() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || "";
  
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [fileTypeFilter, setFileTypeFilter] = useState("");
  const [folderFilter, setFolderFilter] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<SearchResponse['pagination'] | null>(null);
  const [folders, setFolders] = useState<Array<{id: string; name: string}>>([]);
  const [previewDoc, setPreviewDoc] = useState<Document | null>(null);
  
  const { user } = useAuth();
  const { toast } = useToast();

  // Memoize folders fetch to avoid repeated API calls
  const fetchFolders = useMemo(() => {
    let hasFetched = false;
    return async () => {
      if (hasFetched) return;
      try {
        const response = await fetch('/api/folders');
        if (response.ok) {
          const data = await response.json();
          setFolders(data.folders || []);
          hasFetched = true;
        }
      } catch (error) {
        console.error('Failed to fetch folders:', error);
      }
    };
  }, []);

  useEffect(() => {
    searchDocuments();
  }, [searchQuery, fileTypeFilter, folderFilter, sortBy, sortOrder, currentPage]);

  useEffect(() => {
    fetchFolders();
  }, [fetchFolders]);

  // Sync searchQuery with URL params when they change
  useEffect(() => {
    const urlQuery = searchParams.get('q') || "";
    setSearchQuery(urlQuery);
    setCurrentPage(1); // Reset to first page when query changes
  }, [searchParams]);

  const searchDocuments = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        q: searchQuery,
        fileType: fileTypeFilter,
        folderId: folderFilter,
        sortBy,
        sortOrder,
        page: currentPage.toString(),
        limit: "12",
      });

      const response = await fetch(`/api/documents/search?${params}`);
      if (!response.ok) throw new Error('Failed to search documents');
      
      const data: SearchResponse = await response.json();
      setDocuments(data.documents);
      setPagination(data.pagination);
    } catch (error) {
      // Avoid noisy toast during background refreshes; log instead
      console.error('Failed to load documents', error);
    } finally {
      setIsLoading(false);
    }
  };

  const renameDocument = async (doc: Document) => {
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
      searchDocuments();
    } catch (e) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to rename document' });
    }
  };

  const deleteDocument = async (doc: Document) => {
    if (!window.confirm(`Delete document "${doc.originalName}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/documents/${doc.id}`, { method: 'DELETE' });
      if (!res.ok) {
        let message = 'Failed to delete';
        try {
          const data = await res.json();
          if (data?.message) message = data.message;
        } catch (_) {}
        throw new Error(message);
      }
      // Optimistic UI: remove from list immediately
      setDocuments((prev) => prev.filter((d) => d.id !== doc.id));
      toast({ title: 'Deleted', description: 'Document removed' });
      // Refresh in background without noisy toasts
      searchDocuments();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to delete document';
      toast({ variant: 'destructive', title: 'Error', description: msg });
    }
  };

  const renderPreview = () => {
    if (!previewDoc) return null;
    const isImage = previewDoc.fileType.startsWith('image/');
    const isPdf = previewDoc.fileType === 'application/pdf';
    const anyDoc: any = previewDoc as any;
    const src = (anyDoc.filePath as string | undefined) || `/uploads/${anyDoc.filename || ''}`;
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


  const handleDownload = async (doc: Document) => {
    try {
      const response = await fetch(`/api/documents/${doc.id}/download`);
      if (!response.ok) {
        throw new Error('Download failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = doc.originalName;
      window.document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      window.document.body.removeChild(a);

      toast({
        title: "Download started",
        description: `${doc.originalName} is being downloaded`
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Download failed",
        description: "Failed to download the document"
      });
    }
  };

  const getFileIcon = (fileType: string, size = "h-5 w-5") => {
    if (fileType.startsWith('image/')) 
      return <Image className={`${size} text-green-600`} />;
    if (fileType === 'application/pdf') 
      return <FileText className={`${size} text-red-600`} />;
    if (fileType.includes('word')) 
      return <FileText className={`${size} text-blue-600`} />;
    if (fileType.includes('excel') || fileType.includes('spreadsheet')) 
      return <FileText className={`${size} text-green-700`} />;
    return <File className={`${size} text-gray-600`} />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileTypeLabel = (fileType: string) => {
    if (fileType.startsWith('image/')) return 'Image';
    if (fileType === 'application/pdf') return 'PDF';
    if (fileType.includes('word')) return 'Word';
    if (fileType.includes('excel') || fileType.includes('spreadsheet')) return 'Excel';
    return 'Document';
  };

  // Short type label for badges to avoid long MIME strings on small screens
  const getTypeShortLabel = (fileType: string) => {
    if (!fileType) return 'File';
    if (fileType === 'application/pdf') return 'PDF';
    if (fileType.startsWith('image/')) return 'Image';
    if (fileType.includes('word')) return 'Word';
    if (fileType.includes('excel') || fileType.includes('spreadsheet')) return 'Excel';
    return 'File';
  };

  const clearFilters = () => {
    setSearchQuery("");
    setFileTypeFilter("");
    setFolderFilter("");
    setSortBy("createdAt");
    setSortOrder("desc");
    setCurrentPage(1);
  };

  if (isLoading && documents.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Documents</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Documents</h1>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline">{pagination?.totalCount || 0} documents</Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setCurrentPage(1);
              searchDocuments();
            }}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Search and Filter Controls */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search & Filter
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search documents..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-8"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">File Type</label>
              <Select value={fileTypeFilter} onValueChange={(value) => {
                setFileTypeFilter(value === "all" ? "" : value);
                setCurrentPage(1);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  <SelectItem value="image/">Images</SelectItem>
                  <SelectItem value="application/pdf">PDFs</SelectItem>
                  <SelectItem value="application/msword">Word Documents</SelectItem>
                  <SelectItem value="application/vnd.ms-excel">Excel Files</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Folder</label>
              <Select value={folderFilter} onValueChange={(value) => {
                setFolderFilter(value === "all" ? "" : value);
                setCurrentPage(1);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="All folders" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All folders</SelectItem>
                  {folders.map((folder) => (
                    <SelectItem key={folder.id} value={folder.id}>
                      {folder.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Sort</label>
              <div className="flex gap-2">
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="createdAt">Date</SelectItem>
                    <SelectItem value="originalName">Name</SelectItem>
                    <SelectItem value="fileSize">Size</SelectItem>
                    <SelectItem value="fileType">Type</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                >
                  {sortOrder === "asc" ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={clearFilters}>
                <Filter className="h-4 w-4 mr-2" />
                Clear Filters
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">View:</span>
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("grid")}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documents Display */}
      {documents.length === 0 ? (
        <Card>
          <CardContent className="py-16">
            <div className="text-center text-muted-foreground">
              <FileText className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium mb-2">No documents found</h3>
              <p className="mb-4">
                {searchQuery || fileTypeFilter || folderFilter 
                  ? "Try adjusting your search criteria" 
                  : "Upload your first document to get started"}
              </p>
              <Button asChild>
                <Link href="/upload">Upload Document</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {viewMode === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-2 sm:gap-3">
              {documents.map((doc) => (
                <Card key={doc.id} className="hover:shadow-md transition-shadow overflow-hidden">
                  <CardHeader className="pb-2 sm:pb-3">
                    <div className="relative flex items-start sm:items-center justify-between gap-1 sm:gap-2">
                      <div className="min-w-0 flex-1 pr-9 sm:pr-0">
                        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                          <Badge variant="secondary" className="text-[10px] sm:text-xs shrink-0">{getTypeShortLabel(doc.fileType)}</Badge>
                          <p className="text-sm font-medium whitespace-normal break-words pr-2" title={doc.originalName}>{doc.originalName}</p>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="absolute right-0 top-0 h-7 w-7 sm:static sm:h-8 sm:w-8">
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
                    <DocumentThumbnail doc={doc as any} className="mb-2 sm:mb-3" />
                    <div className="space-y-2 sm:space-y-3">
                      <div className="flex flex-col gap-1.5 sm:gap-2 sm:flex-row sm:items-center sm:justify-between text-xs text-muted-foreground">
                        <div className="hidden sm:flex items-center space-x-1">
                          <FolderOpen className="h-3 w-3" />
                          <span>{doc.folder?.name ?? '—'}</span>
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
                        {getFileIcon(doc.fileType)}
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{doc.originalName}</p>
                          <div className="flex items-center space-x-4 text-xs text-muted-foreground mt-1">
                            <span>{formatFileSize(doc.fileSize)}</span>
                            <span>{formatDistanceToNow(new Date(doc.createdAt), { addSuffix: true })}</span>
                            {doc.folder && (
                              <span className="flex items-center">
                                <FolderOpen className="h-3 w-3 mr-1" />
                                {doc.folder.name}
                              </span>
                            )}
                            {user?.role === 'SUPER_ADMIN' && (
                              <span className="flex items-center">
                                <User className="h-3 w-3 mr-1" />
                                {doc.uploadedBy.name}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 flex-wrap">
                        <Badge variant="secondary" className="text-xs">
                          {getFileTypeLabel(doc.fileType)}
                        </Badge>
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

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.totalCount)} of{' '}
                {pagination.totalCount} documents
              </p>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(pagination.page - 1)}
                  disabled={pagination.page === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <span className="text-sm">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
          {renderPreview()}
        </>
      )}
    </div>
  );
}