"use client";

import * as React from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  File,
  Home,
  LogOut,
  Settings,
  Users,
  Upload,
  Folder,
  BarChart,
  FileLock2,
  Search,
  ChevronRight
} from 'lucide-react';

import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  
  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="shrink-0 text-primary bg-primary-foreground hover:bg-primary-foreground">
                <FileLock2/>
            </Button>
            <div className="flex flex-col">
              <span className="text-lg font-semibold tracking-tight text-sidebar-foreground">
                SecureDocs
              </span>
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Dashboard">
                <Link href="/dashboard"><Home /><span>Dashboard</span></Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Upload">
                <Link href="/upload"><Upload /><span>Upload</span></Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Documents">
                <Link href="/documents"><File /><span>Documents</span></Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Folders">
                <Link href="/folders"><Folder /><span>Folders</span></Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            {user?.role === 'SUPER_ADMIN' && (
              <>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="User Management">
                    <Link href="/users"><Users /><span>Users</span></Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Monitoring">
                    <Link href="/monitoring"><BarChart /><span>Monitoring</span></Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </>
            )}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
            <UserMenu />
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-14 items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 lg:h-[60px] lg:px-6 sticky top-0 z-30">
            <SidebarTrigger className="md:hidden"/>
            <div className="flex flex-1 items-center gap-4">
                <Breadcrumbs pathname={pathname} />
                <div className="ml-auto flex items-center gap-4">
                    <form 
                        onSubmit={(e) => {
                            e.preventDefault();
                            if (searchQuery.trim()) {
                                router.push(`/documents?q=${encodeURIComponent(searchQuery.trim())}`);
                            } else {
                                router.push('/documents');
                            }
                        }}
                        className="relative"
                    >
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                        <Input
                            type="search"
                            placeholder="Search documents..."
                            className="pl-8 w-[200px] lg:w-[300px] bg-muted/50 border-0 focus-visible:ring-1"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </form>
                </div>
            </div>
        </header>
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}

function Breadcrumbs({ pathname }: { pathname: string }) {
    const segments = pathname.split('/').filter(Boolean);
    
    const getBreadcrumbName = (segment: string) => {
        const names: Record<string, string> = {
            'dashboard': 'Dashboard',
            'upload': 'Upload',
            'folders': 'Folders',
            'users': 'User Management',
            'monitoring': 'Monitoring',
            'profile': 'Profile'
        };
        return names[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
    };

    if (segments.length === 0) return null;

    return (
        <nav className="flex items-center space-x-1 text-sm text-muted-foreground">
            <Link href="/dashboard" className="hover:text-foreground transition-colors">
                Home
            </Link>
            {segments.map((segment, index) => {
                const href = '/' + segments.slice(0, index + 1).join('/');
                const isLast = index === segments.length - 1;
                
                return (
                    <React.Fragment key={segment}>
                        <ChevronRight className="h-4 w-4" />
                        {isLast ? (
                            <span className="text-foreground font-medium">
                                {getBreadcrumbName(segment)}
                            </span>
                        ) : (
                            <Link 
                                href={href} 
                                className="hover:text-foreground transition-colors"
                            >
                                {getBreadcrumbName(segment)}
                            </Link>
                        )}
                    </React.Fragment>
                );
            })}
        </nav>
    );
}

function UserMenu() {
    const { user, setUser } = useAuth();
    const router = useRouter();
    const { toast } = useToast();

    const handleLogout = async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
            setUser(null);
            router.push('/login');
            toast({ title: "Logged out", description: "You have been successfully logged out." });
        } catch (error) {
            toast({ variant: 'destructive', title: "Logout failed", description: "Could not log out. Please try again." });
        }
    };

    const getInitials = (name: string) => {
        const names = name.split(' ');
        if (names.length > 1) {
            return `${names[0][0]}${names[names.length - 1][0]}`;
        }
        return name.substring(0, 2);
    }
    
    if (!user) return null;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-full justify-start gap-2 h-12">
                     <Avatar className="h-8 w-8">
                        <AvatarImage src={`https://avatar.vercel.sh/${user.email}.png`} alt={user.name} />
                        <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col items-start text-left">
                        <p className="text-sm font-medium">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user.name}</p>
                        <p className="text-xs leading-none text-muted-foreground">
                            {user.email}
                        </p>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                    <Link href="/profile"><Settings className="mr-2 h-4 w-4"/><span>Profile</span></Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
