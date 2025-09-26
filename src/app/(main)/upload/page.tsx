"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
  Upload, 
  FileText, 
  Image, 
  File, 
  X, 
  CheckCircle, 
  AlertCircle, 
  CloudUpload,
  Shield,
  Zap,
  FolderOpen,
  Sparkles
} from "lucide-react";
import { useDropzone } from "react-dropzone";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";

interface UploadFile {
  file: File;
  progress: number;
  status: 'uploading' | 'success' | 'error';
  id: string;
}

export default function UploadPage() {
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string>("");
  const [folders, setFolders] = useState<Array<{id: string; name: string}>>([]);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    fetchFolders();
  }, []);

  const fetchFolders = async () => {
    try {
      const response = await fetch('/api/folders');
      if (response.ok) {
        const data = await response.json();
        setFolders(data.folders || []);
      }
    } catch (error) {
      console.error('Failed to fetch folders:', error);
    }
  };

  const onDrop = (acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map(file => ({
      file,
      progress: 0,
      status: 'uploading' as const,
      id: Math.random().toString(36).substr(2, 9)
    }));
    
    setUploadFiles(prev => [...prev, ...newFiles]);
    
    newFiles.forEach(uploadFile => {
      uploadFileToServer(uploadFile);
    });
  };

  const uploadFileToServer = async (uploadFile: UploadFile) => {
    const formData = new FormData();
    formData.append('file', uploadFile.file);
    if (selectedFolder) {
      formData.append('folderId', selectedFolder);
    }

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      // Simulate progress
      const interval = setInterval(() => {
        setUploadFiles(prev => prev.map(f => 
          f.id === uploadFile.id 
            ? { ...f, progress: Math.min(f.progress + 10, 90) }
            : f
        ));
      }, 200);

      const result = await response.json();
      clearInterval(interval);

      setUploadFiles(prev => prev.map(f => 
        f.id === uploadFile.id 
          ? { ...f, progress: 100, status: 'success' }
          : f
      ));

      toast({
        title: "Upload successful",
        description: `${uploadFile.file.name} has been uploaded successfully.`
      });
      
    } catch (error) {
      setUploadFiles(prev => prev.map(f => 
        f.id === uploadFile.id 
          ? { ...f, status: 'error' }
          : f
      ));
      
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: `Failed to upload ${uploadFile.file.name}`
      });
    }
  };

  const removeFile = (id: string) => {
    setUploadFiles(prev => prev.filter(f => f.id !== id));
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'text/plain': ['.txt'],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
  });

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

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-700">
      {/* Header Section */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-emerald-500/5 via-background to-blue-500/5 p-6 border border-border/50">
        <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
              Upload Documents
            </h1>
            <p className="text-muted-foreground flex items-center gap-2">
              <CloudUpload className="h-4 w-4" />
              Securely upload and organize your documents
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Badge 
              variant="outline" 
              className="bg-gradient-to-r from-emerald-500/10 to-blue-500/10 border-emerald-500/20 hover:from-emerald-500/15 hover:to-blue-500/15 transition-all duration-300"
            >
              <Sparkles className="w-3 h-3 mr-1" />
              {user?.name}
            </Badge>
          </div>
        </div>
      </div>
      
      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          {/* Upload Card */}
          <Card className="group relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/10 border-border/50 hover:border-emerald-500/20">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <CardHeader className="relative bg-gradient-to-r from-emerald-500/5 to-blue-500/10 border-b border-border/30">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Upload className="h-5 w-5 text-emerald-600 group-hover:scale-110 transition-transform duration-300" />
                Upload Files
              </CardTitle>
            </CardHeader>
            <CardContent className="relative space-y-6 p-6">
              {/* Folder Selection */}
              <div className="space-y-3">
                <Label htmlFor="folder" className="flex items-center gap-2 text-sm font-medium">
                  <FolderOpen className="h-4 w-4 text-amber-600" />
                  Select Folder (Optional)
                </Label>
                <Select 
                  value={selectedFolder} 
                  onValueChange={(value) => setSelectedFolder(value === "none" ? "" : value)}
                >
                  <SelectTrigger className="group transition-all duration-300 hover:bg-gradient-to-r hover:from-muted/50 hover:to-muted/30 hover:border-amber-500/30 focus:border-amber-500/50 focus:shadow-lg focus:shadow-amber-500/10">
                    <SelectValue placeholder="Select a folder" />
                  </SelectTrigger>
                  <SelectContent className="bg-background/95 backdrop-blur-md border-border/60">
                    <SelectItem value="none" className="hover:bg-gradient-to-r hover:from-muted/50 hover:to-muted/30">
                      No folder
                    </SelectItem>
                    {folders.map((folder) => (
                      <SelectItem 
                        key={folder.id} 
                        value={folder.id}
                        className="hover:bg-gradient-to-r hover:from-amber-500/10 hover:to-amber-500/5"
                      >
                        <div className="flex items-center gap-2">
                          <FolderOpen className="h-4 w-4 text-amber-600" />
                          {folder.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Drop Zone */}
              <div
                {...getRootProps()}
                className={`group/dropzone relative border-2 border-dashed rounded-xl p-12 text-center transition-all duration-300 cursor-pointer overflow-hidden ${
                  isDragActive
                    ? 'border-emerald-500 bg-gradient-to-br from-emerald-500/10 to-blue-500/10 scale-105 shadow-xl shadow-emerald-500/20'
                    : 'border-border hover:border-emerald-500/50 hover:bg-gradient-to-br hover:from-emerald-500/5 hover:to-blue-500/5 hover:shadow-lg hover:shadow-emerald-500/10'
                }`}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-blue-500/5 opacity-0 group-hover/dropzone:opacity-100 transition-opacity duration-500"></div>
                <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/20 via-blue-500/20 to-purple-500/20 rounded-xl blur opacity-0 group-hover/dropzone:opacity-30 transition-opacity duration-500"></div>
                
                <input {...getInputProps()} />
                <div className="relative z-10">
                  <div className="relative group/icon mb-6">
                    <CloudUpload className={`mx-auto h-16 w-16 transition-all duration-500 ${
                      isDragActive 
                        ? 'text-emerald-500 scale-125 animate-bounce' 
                        : 'text-muted-foreground/70 group-hover/dropzone:text-emerald-500 group-hover/dropzone:scale-110'
                    }`} />
                    <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-xl opacity-0 group-hover/icon:opacity-50 transition-opacity duration-500"></div>
                  </div>
                  
                  {isDragActive ? (
                    <div className="space-y-2">
                      <p className="text-xl font-semibold text-emerald-600 animate-pulse">
                        Drop the files here...
                      </p>
                      <div className="h-1 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full mx-auto w-32 animate-pulse"></div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <p className="text-xl font-semibold group-hover/dropzone:text-emerald-600 transition-colors duration-300">
                        Drag & drop files here, or click to select
                      </p>
                      <p className="text-sm text-muted-foreground mb-6">
                        Supports: Images (PNG, JPG, GIF), Documents (PDF, DOC, DOCX, XLS, XLSX, TXT)
                      </p>
                      <Button 
                        variant="outline" 
                        className="group/btn transition-all duration-300 hover:bg-gradient-to-r hover:from-emerald-500/10 hover:to-blue-500/10 hover:border-emerald-500/30 hover:shadow-lg hover:shadow-emerald-500/20 hover:scale-105"
                      >
                        <Upload className="mr-2 h-4 w-4 group-hover/btn:scale-110 group-hover/btn:-translate-y-0.5 transition-transform duration-300" />
                        Choose Files
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Upload Progress */}
          {uploadFiles.length > 0 && (
            <Card className="group transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10 border-border/50 hover:border-blue-500/20 animate-in slide-in-from-bottom-4 duration-500">
              <CardHeader className="bg-gradient-to-r from-blue-500/5 to-purple-500/10 border-b border-border/30">
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-blue-600" />
                  Upload Progress
                  <Badge variant="secondary" className="ml-auto">
                    {uploadFiles.filter(f => f.status === 'success').length}/{uploadFiles.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-3">
                  {uploadFiles.map((uploadFile, index) => (
                    <div 
                      key={uploadFile.id} 
                      className="group/file relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between p-4 border rounded-xl transition-all duration-300 hover:bg-gradient-to-r hover:from-blue-500/5 hover:to-purple-500/5 hover:border-blue-500/30 hover:shadow-md"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-transparent opacity-0 group-hover/file:opacity-100 transition-opacity duration-300 rounded-xl"></div>
                      
                      <div className="relative flex-shrink-0 transition-transform duration-300 group-hover/file:scale-110">
                        {getFileIcon(uploadFile.file.type)}
                      </div>
                      
                      <div className="relative flex-1 min-w-0 space-y-2">
                        <p className="text-sm font-medium truncate group-hover/file:text-blue-600 transition-colors duration-300">
                          {uploadFile.file.name}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="bg-muted/50 px-2 py-1 rounded-full">
                            {formatFileSize(uploadFile.file.size)}
                          </span>
                          {uploadFile.status === 'uploading' && (
                            <span className="text-blue-600 animate-pulse">Uploading...</span>
                          )}
                          {uploadFile.status === 'success' && (
                            <span className="text-emerald-600 font-medium">Completed</span>
                          )}
                          {uploadFile.status === 'error' && (
                            <span className="text-red-600 font-medium">Failed</span>
                          )}
                        </div>
                        
                        {uploadFile.status === 'uploading' && (
                          <div className="space-y-1">
                            <Progress 
                              value={uploadFile.progress} 
                              className="h-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20"
                            />
                            <div className="text-xs text-muted-foreground">
                              {uploadFile.progress}%
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="relative flex-shrink-0 flex items-center space-x-3">
                        {uploadFile.status === 'success' && (
                          <div className="relative group/success">
                            <CheckCircle className="h-6 w-6 text-emerald-500 group-hover/success:scale-110 transition-transform duration-300" />
                            <div className="absolute -inset-1 bg-emerald-500/20 rounded-full blur opacity-0 group-hover/success:opacity-50 transition-opacity duration-300"></div>
                          </div>
                        )}
                        {uploadFile.status === 'error' && (
                          <div className="relative group/error">
                            <AlertCircle className="h-6 w-6 text-red-500 group-hover/error:scale-110 transition-transform duration-300" />
                            <div className="absolute -inset-1 bg-red-500/20 rounded-full blur opacity-0 group-hover/error:opacity-50 transition-opacity duration-300"></div>
                          </div>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(uploadFile.id)}
                          className="group/remove transition-all duration-300 hover:bg-red-500/10 hover:text-red-600"
                        >
                          <X className="h-4 w-4 group-hover/remove:scale-110 group-hover/remove:rotate-90 transition-transform duration-300" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Guidelines Card */}
        <Card className="group sticky top-4 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/10 border-border/50 hover:border-purple-500/20">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg"></div>
          <CardHeader className="relative bg-gradient-to-r from-purple-500/5 to-indigo-500/10 border-b border-border/30">
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-purple-600 group-hover:scale-110 transition-transform duration-300" />
              Pedoman Pengunggahan
            </CardTitle>
          </CardHeader>
          <CardContent className="relative space-y-6 p-6">
            {/* Supported Formats */}
            <div className="group/section transition-all duration-300 hover:bg-gradient-to-r hover:from-emerald-500/5 hover:to-emerald-500/10 p-3 rounded-lg hover:shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 bg-emerald-500/10 rounded-lg group-hover/section:bg-emerald-500/20 transition-colors duration-300">
                  <FileText className="h-4 w-4 text-emerald-600" />
                </div>
                <h4 className="font-semibold group-hover/section:text-emerald-700 transition-colors duration-300">
                Format yang Didukung
                </h4>
              </div>
              <ul className="text-sm space-y-2 text-muted-foreground pl-1">
                <li className="flex items-center gap-2 hover:text-foreground transition-colors duration-200">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                  Images: PNG, JPG, JPEG, GIF, WebP
                </li>
                <li className="flex items-center gap-2 hover:text-foreground transition-colors duration-200">
                  <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                  Documents: PDF, DOC, DOCX
                </li>
                <li className="flex items-center gap-2 hover:text-foreground transition-colors duration-200">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                  Spreadsheets: XLS, XLSX
                </li>
                <li className="flex items-center gap-2 hover:text-foreground transition-colors duration-200">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                  Text files: TXT
                </li>
              </ul>
            </div>
            
            {/* File Limits */}
            <div className="group/section transition-all duration-300 hover:bg-gradient-to-r hover:from-amber-500/5 hover:to-amber-500/10 p-3 rounded-lg hover:shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 bg-amber-500/10 rounded-lg group-hover/section:bg-amber-500/20 transition-colors duration-300">
                  <Zap className="h-4 w-4 text-amber-600" />
                </div>
                <h4 className="font-semibold group-hover/section:text-amber-700 transition-colors duration-300">
                  File Limits
                </h4>
              </div>
              <ul className="text-sm space-y-2 text-muted-foreground pl-1">
                <li className="flex items-center gap-2 hover:text-foreground transition-colors duration-200">
                  <div className="w-1.5 h-1.5 bg-amber-500 rounded-full"></div>
                  Ukuran file maksimum: 10MB
                </li>
                <li className="flex items-center gap-2 hover:text-foreground transition-colors duration-200">
                  <div className="w-1.5 h-1.5 bg-amber-500 rounded-full"></div>
                  Dukungan file berlebihan
                </li>
                <li className="flex items-center gap-2 hover:text-foreground transition-colors duration-200">
                  <div className="w-1.5 h-1.5 bg-amber-500 rounded-full"></div>
                  Deteksi tipe file otomatis
                </li>
              </ul>
            </div>
            
            {/* Security */}
            <div className="group/section transition-all duration-300 hover:bg-gradient-to-r hover:from-blue-500/5 hover:to-blue-500/10 p-3 rounded-lg hover:shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 bg-blue-500/10 rounded-lg group-hover/section:bg-blue-500/20 transition-colors duration-300">
                  <Shield className="h-4 w-4 text-blue-600" />
                </div>
                <h4 className="font-semibold group-hover/section:text-blue-700 transition-colors duration-300">
                  Keamanan
                </h4>
              </div>
              <ul className="text-sm space-y-2 text-muted-foreground pl-1">
                <li className="flex items-center gap-2 hover:text-foreground transition-colors duration-200">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                  File dipindai untuk keamanan
                </li>
                <li className="flex items-center gap-2 hover:text-foreground transition-colors duration-200">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                  Akses dikendalikan oleh Roles
                </li>
                <li className="flex items-center gap-2 hover:text-foreground transition-colors duration-200">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                  Log aktivitas diaktifkan
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}