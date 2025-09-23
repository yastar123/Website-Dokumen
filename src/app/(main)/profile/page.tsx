"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";

// This needs to be a client component to use the hook

export default function ProfilePage() {
  const { user } = useAuth();
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Your Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="font-medium">Name</p>
              <p className="text-muted-foreground">{user?.name}</p>
            </div>
             <div>
              <p className="font-medium">Email</p>
              <p className="text-muted-foreground">{user?.email}</p>
            </div>
             <div>
              <p className="font-medium">Role</p>
              <p className="text-muted-foreground">{user?.role}</p>
            </div>
            <p className="text-center text-muted-foreground pt-8">More profile settings coming soon.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
