import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function FoldersPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Folders</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Your Folders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-12">
            <p>Folder management is coming soon.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
