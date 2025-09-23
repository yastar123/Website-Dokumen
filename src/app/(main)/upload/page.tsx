import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload } from "lucide-react";

export default function UploadPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Upload Documents</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>New Upload</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-24 border-2 border-dashed rounded-lg">
            <Upload className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-4">Upload functionality coming soon.</p>
            <p className="text-sm mt-2">Drag and drop files here.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
