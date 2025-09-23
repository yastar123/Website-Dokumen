"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileText, Image, File, X, CheckCircle, AlertCircle } from "lucide-react";
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Upload Documents</h1>
        <Badge variant="secondary">{user?.name}</Badge>
      </div>
      
      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Upload Files</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="folder">Select Folder (Optional)</Label>
                <Select value={selectedFolder} onValueChange={(value) => setSelectedFolder(value === "none" ? "" : value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a folder" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No folder</SelectItem>
                    {folders.map((folder) => (
                      <SelectItem key={folder.id} value={folder.id}>
                        {folder.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
                  isDragActive
                    ? 'border-primary bg-primary/5'
                    : 'border-gray-300 hover:border-primary/50'
                }`}
              >
                <input {...getInputProps()} />
                <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                {isDragActive ? (
                  <p className="text-lg">Drop the files here...</p>
                ) : (
                  <>
                    <p className="text-lg mb-2">Drag & drop files here, or click to select</p>
                    <p className="text-sm text-muted-foreground mb-4">
                      Supports: Images (PNG, JPG, GIF), Documents (PDF, DOC, DOCX, XLS, XLSX, TXT)
                    </p>
                    <Button variant="outline">Choose Files</Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {uploadFiles.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Upload Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {uploadFiles.map((uploadFile) => (
                    <div key={uploadFile.id} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between p-3 border rounded-lg">
                      <div className="flex-shrink-0">
                        {getFileIcon(uploadFile.file.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{uploadFile.file.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(uploadFile.file.size)}
                        </p>
                        {uploadFile.status === 'uploading' && (
                          <Progress value={uploadFile.progress} className="mt-1" />
                        )}
                      </div>
                      <div className="flex-shrink-0 flex items-center space-x-2 flex-wrap">
                        {uploadFile.status === 'success' && (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        )}
                        {uploadFile.status === 'error' && (
                          <AlertCircle className="h-5 w-5 text-red-500" />
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(uploadFile.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Upload Guidelines</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Supported Formats</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Images: PNG, JPG, JPEG, GIF, WebP</li>
                <li>• Documents: PDF, DOC, DOCX</li>
                <li>• Spreadsheets: XLS, XLSX</li>
                <li>• Text files: TXT</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">File Limits</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Maximum file size: 10MB</li>
                <li>• Multiple files supported</li>
                <li>• Automatic file type detection</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Security</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Files are scanned for security</li>
                <li>• Access controlled by roles</li>
                <li>• Activity logging enabled</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
