import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function MonitoringPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Activity Monitoring</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Recent Activities</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-12">
            <p>The activity log dashboard will be displayed here.</p>
            <p className="text-sm mt-2">This feature is coming soon.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
