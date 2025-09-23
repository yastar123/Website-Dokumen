"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  FileText, 
  Image, 
  File, 
  Users, 
  HardDrive, 
  Activity,
  Download,
  Upload as UploadIcon,
  Eye,
  FolderOpen
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface DashboardStats {
  documentsCount: number;
  totalUsers: number;
  storageUsed: string;
  storageBytes: number;
  recentDocuments: Array<{
    id: string;
    originalName: string;
    fileType: string;
    fileSize: number;
    createdAt: string;
    uploadedBy: { name: string; email: string };
    folder?: { name: string } | null;
  }>;
  documentsByType: Array<{
    type: string;
    count: number;
  }>;
  recentActivity: Array<{
    id: string;
    action: string;
    details: string | null;
    createdAt: string;
    user: { name: string; email: string };
    document?: { originalName: string } | null;
  }>;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [previewDoc, setPreviewDoc] = useState<DashboardStats["recentDocuments"][number] | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch('/api/dashboard');
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }
      const data = await response.json();
      setStats(data);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load dashboard data"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderPreview = () => {
    if (!previewDoc) return null;
    // we don't have filename here; rely on a standard path if provided by API in future
    // Attempt to preview by hitting a public path using id is not possible; so we cannot generate preview src reliably.
    // However, if backend includes filePath in recentDocuments later, we can use it. For now, try fallback to /api/documents/[id]/download in object/embed which most browsers won't allow inline.
    // We'll check by mime type; only allow inline for images/pdf if path is known on client via /uploads mapping.
    const anyDoc: any = previewDoc as any;
    const src: string | null = anyDoc.filePath ? anyDoc.filePath : null;
    const isImage = previewDoc.fileType.startsWith('image/');
    const isPdf = previewDoc.fileType === 'application/pdf';
    return (
      <Dialog open={!!previewDoc} onOpenChange={(open) => !open && setPreviewDoc(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Preview: {previewDoc.originalName}</DialogTitle>
          </DialogHeader>
          <div className="min-h-[300px]">
            {src && isImage && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={src} alt={previewDoc.originalName} className="max-h-[70vh] w-auto mx-auto" />
            )}
            {src && isPdf && (
              <object data={src} type="application/pdf" className="w-full h-[70vh]">
                <p>PDF preview is not available. <a href={src} target="_blank" rel="noreferrer">Open</a></p>
              </object>
            )}
            {(!src || (!isImage && !isPdf)) && (
              <div className="text-sm text-muted-foreground">
                Preview not available here. Please go to the Documents page and use the preview there.
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return <Image className="h-4 w-4 text-green-600" />;
    if (fileType === 'application/pdf') return <FileText className="h-4 w-4 text-red-600" />;
    if (fileType.includes('word')) return <FileText className="h-4 w-4 text-blue-600" />;
    if (fileType.includes('excel') || fileType.includes('spreadsheet')) return <FileText className="h-4 w-4 text-green-700" />;
    return <File className="h-4 w-4 text-gray-600" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileTypeLabel = (fileType: string) => {
    if (fileType.startsWith('image/')) return 'Images';
    if (fileType === 'application/pdf') return 'PDFs';
    if (fileType.includes('word')) return 'Word Docs';
    if (fileType.includes('excel') || fileType.includes('spreadsheet')) return 'Spreadsheets';
    return 'Other';
  };

  const handleDownload = async (documentId: string, originalName: string) => {
    try {
      const response = await fetch(`/api/documents/${documentId}/download`);
      if (!response.ok) {
        throw new Error('Download failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = originalName;
      window.document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      window.document.body.removeChild(a);

      toast({
        title: "Download started",
        description: `${originalName} is being downloaded`
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Download failed",
        description: "Failed to download the document"
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-48 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <div className="flex gap-2 flex-wrap">
          <Badge variant="outline">Welcome, {user?.name}</Badge>
        </div>
      </div>
      
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground"/>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.documentsCount}</div>
            <p className="text-xs text-muted-foreground">
              {stats.documentsCount === 0 ? 'No documents yet' : 
               user?.role === 'SUPER_ADMIN' ? 'Total across all users' : 'Your documents'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Storage Used</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground"/>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.storageUsed}</div>
            <p className="text-xs text-muted-foreground">
              {user?.role === 'SUPER_ADMIN' ? 'Total storage' : 'Your storage'}
            </p>
          </CardContent>
        </Card>

        {user?.role === 'SUPER_ADMIN' && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground"/>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground">
                Active users in system
              </p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">File Types</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground"/>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.documentsByType.length}</div>
            <p className="text-xs text-muted-foreground">
              Different file types
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Recent Documents */}
        <div className="md:col-span-2">
          <Card>
            <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle>Recent Documents</CardTitle>
              <div className="flex gap-2 flex-wrap">
                <Button variant="outline" size="sm" asChild>
                  <Link href="/documents">
                    <Eye className="h-4 w-4 mr-2" />
                    View All
                  </Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/upload">
                    <UploadIcon className="h-4 w-4 mr-2" />
                    Upload New
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {stats.recentDocuments.length === 0 ? (
                <div className="text-center text-muted-foreground py-12">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>No documents found.</p>
                  <p className="text-sm mt-2">Get started by uploading your first document.</p>
                  <Button className="mt-4" asChild>
                    <Link href="/upload">Upload Document</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {stats.recentDocuments.map((doc) => (
                    <div key={doc.id} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between p-4 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-center space-x-3 min-w-0 flex-1">
                        {getFileIcon(doc.fileType)}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{doc.originalName}</p>
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                            <span>{formatFileSize(doc.fileSize)}</span>
                            <span>•</span>
                            <span>{formatDistanceToNow(new Date(doc.createdAt), { addSuffix: true })}</span>
                            {doc.folder && (
                              <>
                                <span>•</span>
                                <span className="flex items-center">
                                  <FolderOpen className="h-3 w-3 mr-1" />
                                  {doc.folder.name}
                                </span>
                              </>
                            )}
                            {user?.role === 'SUPER_ADMIN' && (
                              <>
                                <span>•</span>
                                <span>{doc.uploadedBy.name}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 flex-wrap">
                        <Button variant="ghost" size="sm" title="View document" onClick={() => setPreviewDoc(doc)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          title="Download document"
                          onClick={() => handleDownload(doc.id, doc.originalName)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* File Types and Activity */}
        <div className="space-y-6">
          {/* File Types */}
          <Card>
            <CardHeader>
              <CardTitle>File Types</CardTitle>
            </CardHeader>
            <CardContent>
              {stats.documentsByType.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No files uploaded yet</p>
              ) : (
                <div className="space-y-3">
                  {stats.documentsByType.map((item, index) => (
                    <div key={index} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center space-x-2">
                        {getFileIcon(item.type)}
                        <span className="text-sm">{getFileTypeLabel(item.type)}</span>
                      </div>
                      <Badge variant="secondary">{item.count}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity (Admin only) */}
          {user?.role === 'SUPER_ADMIN' && stats.recentActivity.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats.recentActivity.slice(0, 5).map((activity) => (
                    <div key={activity.id} className="text-sm">
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                        <span className="font-medium truncate">{activity.user.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {activity.action.replace('_', ' ').toLowerCase()}
                        {activity.document && ` - ${activity.document.originalName}`}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      {renderPreview()}
    </div>
  );
}
