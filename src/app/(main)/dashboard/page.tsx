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
  FolderOpen,
  TrendingUp,
  Clock,
  Star
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
    const anyDoc: any = previewDoc as any;
    const src: string | null = anyDoc.filePath ? anyDoc.filePath : null;
    const isImage = previewDoc.fileType.startsWith('image/');
    const isPdf = previewDoc.fileType === 'application/pdf';
    return (
      <Dialog open={!!previewDoc} onOpenChange={(open) => !open && setPreviewDoc(null)}>
        <DialogContent className="max-w-5xl bg-gradient-to-br from-background/95 to-background/80 backdrop-blur-md border-border/50">
          <DialogHeader className="bg-gradient-to-r from-primary/5 to-primary/10 -m-6 p-6 rounded-t-lg">
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-primary" />
              Preview: {previewDoc.originalName}
            </DialogTitle>
          </DialogHeader>
          <div className="min-h-[350px] p-4">
            {src && isImage && (
              // eslint-disable-next-line @next/next/no-img-element
              <img 
                src={src} 
                alt={previewDoc.originalName} 
                className="max-h-[70vh] w-auto mx-auto rounded-lg shadow-lg transition-transform duration-300 hover:scale-105" 
              />
            )}
            {src && isPdf && (
              <object data={src} type="application/pdf" className="w-full h-[70vh] rounded-lg">
                <p className="text-center text-muted-foreground py-8">
                  PDF preview is not available. <a href={src} target="_blank" rel="noreferrer" className="text-primary hover:underline">Open</a>
                </p>
              </object>
            )}
            {(!src || (!isImage && !isPdf)) && (
              <div className="text-center text-muted-foreground py-12 bg-muted/30 rounded-lg border-2 border-dashed border-border/50">
                <File className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <p>Preview not available here.</p>
                <p className="text-sm mt-2">Please go to the Documents page and use the preview there.</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return <Image className="h-4 w-4 text-emerald-600" />;
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
      <div className="space-y-6 animate-in fade-in-50 duration-500">
        <div className="flex flex-col gap-4">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-6 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="md:col-span-2">
            <CardContent className="p-6">
              <Skeleton className="h-48 w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <Skeleton className="h-48 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-700">
      {/* Header Section */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-6 border border-border/50">
        <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
              Dashboard
            </h1>
            <p className="text-muted-foreground">Welcome back! Here's an overview of your documents and activity.</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Badge 
              variant="outline" 
              className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20 hover:from-primary/15 hover:to-primary/10 transition-all duration-300"
            >
              <Star className="w-3 h-3 mr-1" />
              Welcome, {user?.name}
            </Badge>
          </div>
        </div>
      </div>
      
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="group relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 hover:border-primary/30 hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium group-hover:text-primary transition-colors duration-300">Total Documents</CardTitle>
            <div className="relative">
              <FileText className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:scale-110 transition-all duration-300"/>
              <div className="absolute -inset-2 bg-primary/20 rounded-full blur opacity-0 group-hover:opacity-50 transition-opacity duration-300"></div>
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold group-hover:scale-105 transition-transform duration-300">{stats.documentsCount}</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <TrendingUp className="h-3 w-3" />
              <span>{stats.documentsCount === 0 ? 'No documents yet' : 
               user?.role === 'SUPER_ADMIN' ? 'Total across all users' : 'Your documents'}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/10 hover:border-orange-500/30 hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium group-hover:text-orange-600 transition-colors duration-300">Storage Used</CardTitle>
            <div className="relative">
              <HardDrive className="h-4 w-4 text-muted-foreground group-hover:text-orange-600 group-hover:scale-110 transition-all duration-300"/>
              <div className="absolute -inset-2 bg-orange-500/20 rounded-full blur opacity-0 group-hover:opacity-50 transition-opacity duration-300"></div>
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold group-hover:scale-105 transition-transform duration-300">{stats.storageUsed}</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <HardDrive className="h-3 w-3" />
              <span>{user?.role === 'SUPER_ADMIN' ? 'Total storage' : 'Your storage'}</span>
            </div>
          </CardContent>
        </Card>

        {user?.role === 'SUPER_ADMIN' && (
          <Card className="group relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/10 hover:border-emerald-500/30 hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-green-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium group-hover:text-emerald-600 transition-colors duration-300">Total Users</CardTitle>
              <div className="relative">
                <Users className="h-4 w-4 text-muted-foreground group-hover:text-emerald-600 group-hover:scale-110 transition-all duration-300"/>
                <div className="absolute -inset-2 bg-emerald-500/20 rounded-full blur opacity-0 group-hover:opacity-50 transition-opacity duration-300"></div>
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-3xl font-bold group-hover:scale-105 transition-transform duration-300">{stats.totalUsers}</div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                <Users className="h-3 w-3" />
                <span>Active users in system</span>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="group relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/10 hover:border-purple-500/30 hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium group-hover:text-purple-600 transition-colors duration-300">File Types</CardTitle>
            <div className="relative">
              <Activity className="h-4 w-4 text-muted-foreground group-hover:text-purple-600 group-hover:scale-110 transition-all duration-300"/>
              <div className="absolute -inset-2 bg-purple-500/20 rounded-full blur opacity-0 group-hover:opacity-50 transition-opacity duration-300"></div>
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold group-hover:scale-105 transition-transform duration-300">{stats.documentsByType.length}</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <Activity className="h-3 w-3" />
              <span>Different file types</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Recent Documents */}
        <div className="md:col-span-2">
          <Card className="group transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 border-border/50 hover:border-primary/20">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b border-border/30">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Clock className="h-5 w-5 text-primary" />
                  Recent Documents
                </CardTitle>
                <div className="flex gap-2 flex-wrap">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    asChild
                    className="group/btn transition-all duration-300 hover:bg-primary/10 hover:border-primary/30 hover:shadow-md"
                  >
                    <Link href="/documents">
                      <Eye className="h-4 w-4 mr-2 group-hover/btn:scale-110 transition-transform duration-300" />
                      View All
                    </Link>
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    asChild
                    className="group/btn transition-all duration-300 hover:bg-emerald-500/10 hover:border-emerald-500/30 hover:shadow-md"
                  >
                    <Link href="/upload">
                      <UploadIcon className="h-4 w-4 mr-2 group-hover/btn:scale-110 group-hover/btn:-translate-y-0.5 transition-transform duration-300" />
                      Upload New
                    </Link>
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {stats.recentDocuments.length === 0 ? (
                <div className="text-center text-muted-foreground py-16 bg-gradient-to-br from-muted/20 to-muted/10 rounded-lg border-2 border-dashed border-border/50">
                  <div className="relative group">
                    <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50 group-hover:text-muted-foreground/70 transition-colors duration-300" />
                    <div className="absolute inset-0 bg-primary/10 rounded-full blur-xl opacity-0 group-hover:opacity-30 transition-opacity duration-500"></div>
                  </div>
                  <p className="text-lg font-medium">No documents found.</p>
                  <p className="text-sm mt-2 mb-6">Get started by uploading your first document.</p>
                  <Button 
                    className="group hover:shadow-lg hover:shadow-primary/20 transition-all duration-300 hover:scale-105" 
                    asChild
                  >
                    <Link href="/upload">
                      <UploadIcon className="h-4 w-4 mr-2 group-hover:-translate-y-0.5 transition-transform duration-300" />
                      Upload Document
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {stats.recentDocuments.map((doc, index) => (
                    <div 
                      key={doc.id} 
                      className="group relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between p-4 border rounded-lg transition-all duration-300 hover:bg-gradient-to-r hover:from-primary/5 hover:to-primary/10 hover:border-primary/30 hover:shadow-md hover:scale-[1.01]"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg"></div>
                      <div className="relative flex items-center space-x-3 min-w-0 flex-1">
                        <div className="transition-transform duration-300 group-hover:scale-110">
                          {getFileIcon(doc.fileType)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate transition-colors duration-300">
                            {doc.originalName}
                          </p>
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                            <span className="bg-muted/50 px-2 py-0.5 rounded-full">
                              {formatFileSize(doc.fileSize)}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatDistanceToNow(new Date(doc.createdAt), { addSuffix: true })}
                            </span>
                            {doc.folder && (
                              <>
                                <span>•</span>
                                <span className="flex items-center bg-amber-500/10 px-2 py-0.5 rounded-full">
                                  <FolderOpen className="h-3 w-3 mr-1 text-amber-600" />
                                  {doc.folder.name}
                                </span>
                              </>
                            )}
                            {user?.role === 'SUPER_ADMIN' && (
                              <>
                                <span>•</span>
                                <span className="bg-blue-500/10 px-2 py-0.5 rounded-full text-blue-700">
                                  {doc.uploadedBy.name}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="relative flex items-center space-x-2 flex-wrap">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          title="View document" 
                          onClick={() => setPreviewDoc(doc)}
                          className="group/preview transition-all duration-300 hover:bg-blue-500/10 hover:text-blue-600 hover:shadow-md"
                        >
                          <Eye className="h-4 w-4 group-hover/preview:scale-110 transition-transform duration-300" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          title="Download document"
                          onClick={() => handleDownload(doc.id, doc.originalName)}
                          className="group/download transition-all duration-300 hover:bg-emerald-500/10 hover:text-emerald-600 hover:shadow-md"
                        >
                          <Download className="h-4 w-4 group-hover/download:scale-110 group-hover/download:translate-y-0.5 transition-transform duration-300" />
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
          <Card className="group transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/5 border-border/50 hover:border-purple-500/20">
            <CardHeader className="bg-gradient-to-r from-purple-500/5 to-indigo-500/10 border-b border-border/30">
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-purple-600" />
                File Types
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {stats.documentsByType.length === 0 ? (
                <div className="text-center text-muted-foreground py-12 bg-gradient-to-br from-muted/20 to-muted/10 rounded-lg border-2 border-dashed border-border/50">
                  <File className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p>No files uploaded yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {stats.documentsByType.map((item, index) => (
                    <div 
                      key={index} 
                      className="group flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between p-3 rounded-lg transition-all duration-300 hover:bg-gradient-to-r hover:from-purple-500/5 hover:to-indigo-500/5 hover:shadow-sm"
                      style={{ animationDelay: `${index * 150}ms` }}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="transition-transform duration-300 group-hover:scale-110">
                          {getFileIcon(item.type)}
                        </div>
                        <span className="text-sm group-hover:font-medium transition-all duration-300">
                          {getFileTypeLabel(item.type)}
                        </span>
                      </div>
                      <Badge 
                        variant="secondary" 
                        className="transition-all duration-300 group-hover:bg-purple-500/20 group-hover:text-purple-700 group-hover:scale-105"
                      >
                        {item.count}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity (Admin only) */}
          {user?.role === 'SUPER_ADMIN' && stats.recentActivity.length > 0 && (
            <Card className="group transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/5 border-border/50 hover:border-emerald-500/20">
              <CardHeader className="bg-gradient-to-r from-emerald-500/5 to-green-500/10 border-b border-border/30">
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-emerald-600" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {stats.recentActivity.slice(0, 5).map((activity, index) => (
                    <div 
                      key={activity.id} 
                      className="group relative p-3 rounded-lg transition-all duration-300 hover:bg-gradient-to-r hover:from-emerald-500/5 hover:to-green-500/5 hover:shadow-sm border border-transparent hover:border-emerald-500/20"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-emerald-500 to-green-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <div className="text-sm pl-3">
                        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                          <span className="font-medium truncate group-hover:text-emerald-700 transition-colors duration-300">
                            {activity.user.name}
                          </span>
                          <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-full">
                            {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 group-hover:text-muted-foreground/80 transition-colors duration-300">
                          {activity.action.replace('_', ' ').toLowerCase()}
                          {activity.document && (
                            <span className="inline-block ml-2 bg-blue-500/10 px-2 py-0.5 rounded-full text-blue-700">
                              {activity.document.originalName}
                            </span>
                          )}
                        </p>
                      </div>
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