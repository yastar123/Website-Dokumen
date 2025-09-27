"use client";

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
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
      <Sidebar className="border-r border-border/40 backdrop-blur-md bg-background/95 supports-[backdrop-filter]:bg-background/60">
        <SidebarHeader className="border-b border-border/40 bg-gradient-to-r from-primary/5 to-primary/10">
          <div className="flex items-center gap-3 p-3 md:p-4">
            <div className="relative group">
                <Image src="/logo.png" alt="Logo" width={160} height={160} priority className="w-16 h-auto sm:w-24 md:w-32" />
              <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-primary/40 rounded-lg blur opacity-0 group-hover:opacity-30 transition-opacity duration-300"></div>
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold tracking-tight text-sidebar-foreground bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
                SEIIKI
              </span>
              <span className="text-xs text-muted-foreground/80">
              PT. SOLUSI ENERGI KELISTRIKAN INDONESIA
              </span>
            </div>
          </div>
        </SidebarHeader>
        
        <SidebarContent className="px-2 py-4">
          <SidebarMenu className="space-y-1">
            <SidebarMenuItem>
              <SidebarMenuButton 
                asChild 
                tooltip="Dashboard"
                className="group relative overflow-hidden transition-all duration-300 hover:bg-gradient-to-r hover:from-primary/10 hover:to-primary/5 hover:shadow-sm hover:border-primary/20 active:scale-95"
              >
                <Link href="/dashboard" className="flex items-center gap-3">
                  <Home className="transition-all duration-300 group-hover:scale-110 group-hover:text-primary" />
                  <span className="transition-all duration-300 group-hover:translate-x-1 group-hover:font-medium">Dashboard</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            
            <SidebarMenuItem>
              <SidebarMenuButton 
                asChild 
                tooltip="Unggah"
                className="group relative overflow-hidden transition-all duration-300 hover:bg-gradient-to-r hover:from-accent/10 hover:to-accent/5 hover:shadow-sm hover:border-accent/20 active:scale-95"
              >
                <Link href="/upload" className="flex items-center gap-3">
                  <Upload className="transition-all duration-300 group-hover:scale-110 group-hover:text-accent group-hover:-translate-y-0.5" />
                  <span className="transition-all duration-300 group-hover:translate-x-1 group-hover:font-medium">Unggah</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            
            <SidebarMenuItem>
              <SidebarMenuButton 
                asChild 
                tooltip="Dokumen"
                className="group relative overflow-hidden transition-all duration-300 hover:bg-gradient-to-r hover:from-accent/10 hover:to-accent/5 hover:shadow-sm hover:border-accent/20 active:scale-95"
              >
                <Link href="/documents" className="flex items-center gap-3">
                  <File className="transition-all duration-300 group-hover:scale-110 group-hover:text-accent" />
                  <span className="transition-all duration-300 group-hover:translate-x-1 group-hover:font-medium">Dokumen</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            
            <SidebarMenuItem>
              <SidebarMenuButton 
                asChild 
                tooltip="Folder"
                className="group relative overflow-hidden transition-all duration-300 hover:bg-gradient-to-r hover:from-secondary/10 hover:to-secondary/5 hover:shadow-sm hover:border-secondary/20 active:scale-95"
              >
                <Link href="/folders" className="flex items-center gap-3">
                  <Folder className="transition-all duration-300 group-hover:scale-110 group-hover:text-secondary" />
                  <span className="transition-all duration-300 group-hover:translate-x-1 group-hover:font-medium">Folder</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-secondary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton 
                asChild 
                tooltip="Bantuan"
                className="group relative overflow-hidden transition-all duration-300 hover:bg-gradient-to-r hover:from-secondary/10 hover:to-secondary/5 hover:shadow-sm hover:border-secondary/20 active:scale-95"
              >
                <Link href="/help" className="flex items-center gap-3">
                  <File className="transition-all duration-300 group-hover:scale-110 group-hover:text-secondary" />
                  <span className="transition-all duration-300 group-hover:translate-x-1 group-hover:font-medium">Bantuan</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-secondary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            {user?.role === 'SUPER_ADMIN' && (
              <>
                <div className="my-4 px-3">
                  <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent"></div>
                  <span className="text-xs text-muted-foreground/60 font-medium mt-2 block">Admin Tools</span>
                </div>
                
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    asChild 
                    tooltip="Kelola Pengguna"
                    className="group relative overflow-hidden transition-all duration-300 hover:bg-gradient-to-r hover:from-primary/10 hover:to-primary/5 hover:shadow-sm hover:border-primary/20 active:scale-95"
                  >
                    <Link href="/users" className="flex items-center gap-3">
                      <Users className="transition-all duration-300 group-hover:scale-110 group-hover:text-primary" />
                      <span className="transition-all duration-300 group-hover:translate-x-1 group-hover:font-medium">Pengguna</span>
                      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    asChild 
                    tooltip="Pemantauan"
                    className="group relative overflow-hidden transition-all duration-300 hover:bg-gradient-to-r hover:from-accent/10 hover:to-accent/5 hover:shadow-sm hover:border-accent/20 active:scale-95"
                  >
                    <Link href="/monitoring" className="flex items-center gap-3">
                      <BarChart className="transition-all duration-300 group-hover:scale-110 group-hover:text-accent" />
                      <span className="transition-all duration-300 group-hover:translate-x-1 group-hover:font-medium">Pemantauan</span>
                      <div className="absolute inset-0 bg-gradient-to-r from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </>
            )}
          </SidebarMenu>
        </SidebarContent>
        
        <SidebarFooter className="border-t border-border/40 bg-gradient-to-r from-muted/20 to-muted/10 p-2">
            <UserMenu />
        </SidebarFooter>
      </Sidebar>
      
      <SidebarInset>
        <header className="flex h-14 items-center gap-2 sm:gap-4 border-b border-border/40 bg-gradient-to-r from-background/95 to-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60 px-2 sm:px-4 lg:h-[60px] lg:px-6 sticky top-0 z-30 shadow-sm">
            <SidebarTrigger className="md:hidden transition-all duration-200 hover:bg-muted/80 hover:scale-105"/>
            <div className="flex flex-1 items-center gap-2 sm:gap-4 min-w-0">
                <Breadcrumbs pathname={pathname} />
                <div className="ml-auto flex items-center gap-2 sm:gap-4">
                    <form 
                        onSubmit={(e) => {
                            e.preventDefault();
                            if (searchQuery.trim()) {
                                router.push(`/documents?q=${encodeURIComponent(searchQuery.trim())}`);
                            } else {
                                router.push('/documents');
                            }
                        }}
                        className="relative group"
                    >
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none transition-all duration-300 group-focus-within:text-primary group-focus-within:scale-110" />
                        <Input
                            type="search"
                            placeholder="Cari dokumen..."
                            className="pl-10 w-[140px] sm:w-[200px] lg:w-[300px] bg-muted/30 border-0 focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:bg-background/80 transition-all duration-300 hover:bg-muted/50 focus-visible:shadow-lg focus-visible:shadow-primary/10"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <div className="absolute inset-0 rounded-md bg-gradient-to-r from-primary/10 to-primary/5 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
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
            'upload': 'Unggah',
            'folders': 'Folder',
            'users': 'Pengguna',
            'monitoring': 'Pemantauan',
            'profile': 'Profil',
            'documents': 'Dokumen',
            'help': 'Bantuan'
        };
        return names[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
    };

    if (segments.length === 0) return null;

    return (
        <nav className="flex items-center space-x-1 text-sm text-muted-foreground overflow-x-auto whitespace-nowrap min-w-0 pr-2 [&::-webkit-scrollbar]:hidden scrollbar-hide">
            <Link 
                href="/dashboard" 
                className="hover:text-foreground transition-all duration-200 hover:font-medium relative group px-1 py-0.5 rounded"
            >
                Beranda
                <div className="absolute inset-0 bg-primary/10 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
            </Link>
            {segments.map((segment, index) => {
                const href = '/' + segments.slice(0, index + 1).join('/');
                const isLast = index === segments.length - 1;
                
                return (
                    <React.Fragment key={segment}>
                        <ChevronRight className="h-4 w-4 transition-transform duration-200 hover:scale-110" />
                        {isLast ? (
                            <span className="text-foreground font-medium bg-primary/10 px-2 py-1 rounded-md border border-primary/20">
                                {getBreadcrumbName(segment)}
                            </span>
                        ) : (
                            <Link 
                                href={href} 
                                className="hover:text-foreground transition-all duration-200 hover:font-medium relative group px-1 py-0.5 rounded"
                            >
                                {getBreadcrumbName(segment)}
                                <div className="absolute inset-0 bg-primary/10 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
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
                <Button 
                    variant="ghost" 
                    className="w-full justify-start gap-3 h-14 group relative overflow-hidden transition-all duration-300 hover:bg-gradient-to-r hover:from-muted/50 hover:to-muted/30 hover:shadow-md hover:border-border/60 active:scale-95"
                >
                    <div className="relative">
                        <Avatar className="h-10 w-10 transition-all duration-300 group-hover:scale-110 group-hover:shadow-md group-hover:shadow-primary/20">
                            <AvatarImage src={user.avatarUrl || `https://avatar.vercel.sh/${user.email}.png`} alt={user.name} />
                            <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-semibold">
                                {getInitials(user.name)}
                            </AvatarFallback>
                        </Avatar>
                        <div className="absolute -inset-1 bg-gradient-to-r from-primary/30 to-primary/10 rounded-full blur opacity-0 group-hover:opacity-50 transition-opacity duration-300"></div>
                    </div>
                    <div className="flex flex-col items-start text-left min-w-0 flex-1">
                        <p className="text-sm font-medium transition-all duration-300 group-hover:text-primary truncate w-full">
                            {user.name}
                        </p>
                        <p className="text-xs text-muted-foreground transition-all duration-300 group-hover:text-muted-foreground/80 truncate w-full">
                            {user.email}
                        </p>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64 shadow-xl border-border/60 bg-background/95 backdrop-blur-md" align="end" forceMount>
                <DropdownMenuLabel className="font-normal p-3 bg-gradient-to-r from-muted/30 to-muted/10">
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm font-semibold leading-none">{user.name}</p>
                        <p className="text-xs leading-none text-muted-foreground">
                            {user.email}
                        </p>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-gradient-to-r from-transparent via-border to-transparent" />
                <DropdownMenuItem asChild className="group transition-all duration-200 hover:bg-gradient-to-r hover:from-primary/10 hover:to-primary/5">
                    <Link href="/profile" className="flex items-center gap-3 p-3">
                        <Settings className="mr-2 h-4 w-4 transition-all duration-200 group-hover:rotate-90 group-hover:text-primary"/>
                        <span className="transition-all duration-200 group-hover:translate-x-1">Profile</span>
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-gradient-to-r from-transparent via-border to-transparent" />
                <DropdownMenuItem 
                    onClick={handleLogout} 
                    className="text-destructive focus:text-destructive focus:bg-gradient-to-r focus:from-destructive/10 focus:to-destructive/5 group transition-all duration-200 p-3"
                >
                    <LogOut className="mr-2 h-4 w-4 transition-all duration-200 group-hover:scale-110" />
                    <span className="transition-all duration-200 group-hover:translate-x-1">Log out</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}