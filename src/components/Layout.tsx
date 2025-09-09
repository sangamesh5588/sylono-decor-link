import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  LayoutDashboard, 
  Palette, 
  Users, 
  CheckSquare, 
  AlertTriangle, 
  BarChart3, 
  LogOut,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';

const Layout = () => {
  const { user, profile, signOut, loading, isAdmin } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const menuItems = [
    {
      title: 'Dashboard',
      url: '/dashboard',
      icon: LayoutDashboard,
    },
    {
      title: 'Decorations',
      url: '/dashboard/decorations',
      icon: Palette,
    },
    {
      title: 'Vendors',
      url: '/dashboard/vendors',
      icon: Users,
    },
    {
      title: 'Capabilities',
      url: '/dashboard/capabilities',
      icon: CheckSquare,
    },
    {
      title: 'Emergency Assignment',
      url: '/dashboard/emergency',
      icon: AlertTriangle,
    },
  ];

  const adminMenuItems = [
    {
      title: 'Analytics',
      url: '/dashboard/analytics',
      icon: BarChart3,
    },
  ];

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        <Sidebar className="border-r border-border">
          <SidebarHeader className="p-6 border-b border-border">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <Palette className="h-6 w-6 text-primary" />
                <Sparkles className="h-4 w-4 text-accent" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Sylonow</h2>
                <p className="text-sm text-muted-foreground">Vendor System</p>
              </div>
            </div>
          </SidebarHeader>
          
          <SidebarContent className="flex-1">
            <SidebarGroup>
              <SidebarGroupLabel>Main Menu</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {menuItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <a 
                          href={item.url}
                          className={cn(
                            "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
                            location.pathname === item.url 
                              ? "bg-primary text-primary-foreground" 
                              : "hover:bg-accent"
                          )}
                        >
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </a>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            {isAdmin && (
              <SidebarGroup>
                <SidebarGroupLabel>Admin</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {adminMenuItems.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild>
                          <a 
                            href={item.url}
                            className={cn(
                              "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
                              location.pathname === item.url 
                                ? "bg-primary text-primary-foreground" 
                                : "hover:bg-accent"
                            )}
                          >
                            <item.icon className="h-4 w-4" />
                            <span>{item.title}</span>
                          </a>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            )}
          </SidebarContent>

          <div className="p-4 border-t border-border">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-sm font-medium text-primary">
                    {profile?.full_name?.[0]?.toUpperCase() || 'U'}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium">{profile?.full_name || 'User'}</p>
                  <Badge variant="secondary" className="text-xs">
                    {profile?.role}
                  </Badge>
                </div>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </Sidebar>

        <div className="flex-1 flex flex-col">
          <header className="h-16 border-b border-border flex items-center px-6">
            <SidebarTrigger />
            <div className="ml-4">
              <h1 className="text-xl font-semibold">
                {location.pathname === '/dashboard' && 'Dashboard'}
                {location.pathname === '/dashboard/decorations' && 'Decorations Management'}
                {location.pathname === '/dashboard/vendors' && 'Vendors Management'}
                {location.pathname === '/dashboard/capabilities' && 'Vendor Capabilities'}
                {location.pathname === '/dashboard/emergency' && 'Emergency Assignment'}
                {location.pathname === '/dashboard/analytics' && 'Analytics'}
              </h1>
            </div>
          </header>
          
          <main className="flex-1 overflow-auto p-6 bg-muted/30">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Layout;