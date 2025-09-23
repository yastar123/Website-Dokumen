"use client";

import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { 
  Search,
  Download,
  Eye,
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
  RefreshCw
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
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<SearchResponse['pagination'] | null>(null);
  const [folders, setFolders] = useState<Array<{id: string; name: string}>>([]);
  
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
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load documents"
      });
    } finally {
      setIsLoading(false);
    }
  };


  const handleDownload = async (document: Document) => {
    try {
      const response = await fetch(`/api/documents/${document.id}/download`);
      if (!response.ok) {
        throw new Error('Download failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = document.originalName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Download started",
        description: `${document.originalName} is being downloaded`
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
        <div className="flex items-center gap-2">
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
                setFileTypeFilter(value);
                setCurrentPage(1);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All types</SelectItem>
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
                setFolderFilter(value);
                setCurrentPage(1);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="All folders" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All folders</SelectItem>
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

          <div className="flex items-center justify-between">
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
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {documents.map((doc) => (
                <Card key={doc.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2 min-w-0 flex-1">
                        {getFileIcon(doc.fileType)}
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate" title={doc.originalName}>
                            {doc.originalName}
                          </p>
                          <Badge variant="secondary" className="text-xs mt-1">
                            {getFileTypeLabel(doc.fileType)}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <HardDrive className="h-3 w-3" />
                          <span>{formatFileSize(doc.fileSize)}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3" />
                          <span>{formatDistanceToNow(new Date(doc.createdAt), { addSuffix: true })}</span>
                        </div>
                      </div>

                      {doc.folder && (
                        <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                          <FolderOpen className="h-3 w-3" />
                          <span>{doc.folder.name}</span>
                        </div>
                      )}

                      {user?.role === 'SUPER_ADMIN' && (
                        <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                          <User className="h-3 w-3" />
                          <span>{doc.uploadedBy.name}</span>
                        </div>
                      )}

                      <div className="flex justify-between items-center pt-2">
                        <Button variant="outline" size="sm" onClick={() => handleDownload(doc)}>
                          <Download className="h-3 w-3 mr-1" />
                          Download
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-3 w-3" />
                        </Button>
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
                    <div key={doc.id} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
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
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary" className="text-xs">
                          {getFileTypeLabel(doc.fileType)}
                        </Badge>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDownload(doc)}>
                          <Download className="h-4 w-4" />
                        </Button>
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
        </>
      )}
    </div>
  );
}