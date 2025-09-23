"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

interface ActivityItem {
  id: string;
  action: string;
  details: string | null;
  createdAt: string;
  user: { name: string; email: string };
  document?: { originalName: string } | null;
}

export default function MonitoringPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [activities, setActivities] = useState<ActivityItem[]>([]);

  useEffect(() => {
    const run = async () => {
      setIsLoading(true);
      try {
        const res = await fetch('/api/dashboard');
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        setActivities((data.recentActivity || []) as ActivityItem[]);
      } catch (e) {
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to load activities' });
      } finally {
        setIsLoading(false);
      }
    };
    run();
  }, [toast]);

  if (user?.role !== 'SUPER_ADMIN') {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Activity Monitoring</h1>
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            You do not have permission to view this page.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Activity Monitoring</h1>
      <Card>
        <CardHeader>
          <CardTitle>Recent Activities</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : activities.length === 0 ? (
            <div className="text-center text-muted-foreground py-12">No activities yet.</div>
          ) : (
            <div className="space-y-3">
              {activities.map((a) => (
                <div key={a.id} className="p-3 border rounded-md">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <div className="font-medium truncate">{a.user.name}</div>
                    <div className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(a.createdAt), { addSuffix: true })}</div>
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {a.action.replace('_', ' ').toLowerCase()}
                    {a.document && ` - ${a.document.originalName}`}
                  </div>
                  {a.details && <div className="text-xs text-muted-foreground mt-1">{a.details}</div>}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
