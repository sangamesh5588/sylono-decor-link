import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Palette, 
  Users, 
  CheckSquare, 
  AlertTriangle,
  Plus,
  TrendingUp,
  Activity
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface DashboardStats {
  totalDecorations: number;
  totalVendors: number;
  totalCapabilities: number;
  activeVendors: number;
}

const Dashboard = () => {
  const { profile, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalDecorations: 0,
    totalVendors: 0,
    totalCapabilities: 0,
    activeVendors: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const [decorationsResult, vendorsResult, capabilitiesResult, activeVendorsResult] = await Promise.all([
        supabase.from('decorations').select('id', { count: 'exact', head: true }),
        supabase.from('vendors').select('id', { count: 'exact', head: true }),
        supabase.from('vendor_capabilities').select('id', { count: 'exact', head: true }),
        supabase.from('vendors').select('id', { count: 'exact', head: true }).eq('is_active', true)
      ]);

      setStats({
        totalDecorations: decorationsResult.count || 0,
        totalVendors: vendorsResult.count || 0,
        totalCapabilities: capabilitiesResult.count || 0,
        activeVendors: activeVendorsResult.count || 0
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-muted rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Decorations',
      value: stats.totalDecorations,
      icon: Palette,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      href: '/dashboard/decorations'
    },
    {
      title: 'Total Vendors',
      value: stats.totalVendors,
      icon: Users,
      color: 'text-success',
      bgColor: 'bg-success/10',
      href: '/dashboard/vendors'
    },
    {
      title: 'Capabilities Mapped',
      value: stats.totalCapabilities,
      icon: CheckSquare,
      color: 'text-info',
      bgColor: 'bg-info/10',
      href: '/dashboard/capabilities'
    },
    {
      title: 'Active Vendors',
      value: stats.activeVendors,
      icon: Activity,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
      href: '/dashboard/vendors'
    }
  ];

  const quickActions = [
    {
      title: 'Add New Decoration',
      description: 'Create a new decoration listing',
      icon: Palette,
      href: '/dashboard/decorations',
      adminOnly: true
    },
    {
      title: 'Add New Vendor',
      description: 'Register a new vendor',
      icon: Users,
      href: '/dashboard/vendors',
      adminOnly: true
    },
    {
      title: 'Map Capabilities',
      description: 'Assign decorations to vendors',
      icon: CheckSquare,
      href: '/dashboard/capabilities',
      adminOnly: false
    },
    {
      title: 'Emergency Assignment',
      description: 'Handle vendor cancellations',
      icon: AlertTriangle,
      href: '/dashboard/emergency',
      adminOnly: false
    }
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary/10 via-accent/5 to-primary/10 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">
              Welcome back, {profile?.full_name || 'User'}!
            </h2>
            <p className="text-muted-foreground">
              Here's an overview of your vendor management system.
            </p>
            <Badge variant="secondary" className="mt-2">
              {profile?.role === 'admin' ? 'Administrator' : 'Sales Team'}
            </Badge>
          </div>
          <div className="hidden md:block">
            <TrendingUp className="h-16 w-16 text-primary/20" />
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => (
          <Card 
            key={index} 
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => navigate(stat.href)}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
                <div className={`p-2 rounded-full ${stat.bgColor}`}>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {quickActions
          .filter(action => !action.adminOnly || isAdmin)
          .map((action, index) => (
          <Card key={index} className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <action.icon className="h-5 w-5 text-primary" />
                <CardTitle className="text-base">{action.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm text-muted-foreground mb-3">
                {action.description}
              </p>
              <Button 
                size="sm" 
                className="w-full"
                onClick={() => navigate(action.href)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Go to {action.title.split(' ')[action.title.split(' ').length - 1]}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity - Placeholder for future implementation */}
      <Card>
        <CardHeader>
          <CardTitle>System Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Database Connection</span>
              <Badge variant="secondary" className="bg-success text-success-foreground">Active</Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>User Authentication</span>
              <Badge variant="secondary" className="bg-success text-success-foreground">Active</Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>System Status</span>
              <Badge variant="secondary" className="bg-success text-success-foreground">Operational</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;