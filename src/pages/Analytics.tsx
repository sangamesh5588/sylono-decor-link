import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Navigate } from 'react-router-dom';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Palette, 
  CheckSquare, 
  AlertTriangle,
  Star,
  Activity
} from 'lucide-react';

interface DecorationAnalytics {
  id: string;
  name: string;
  category: string;
  vendor_count: number;
}

interface CategoryStats {
  category: string;
  decoration_count: number;
  total_vendors: number;
  avg_vendors_per_decoration: number;
}

const Analytics = () => {
  const { isAdmin } = useAuth();
  const [decorationAnalytics, setDecorationAnalytics] = useState<DecorationAnalytics[]>([]);
  const [categoryStats, setCategoryStats] = useState<CategoryStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalStats, setTotalStats] = useState({
    totalDecorations: 0,
    totalVendors: 0,
    totalCapabilities: 0,
    activeVendors: 0,
    avgCapabilitiesPerDecoration: 0,
    decorationsWithNoVendors: 0
  });

  // Redirect non-admin users
  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      // Fetch decoration analytics with vendor counts
      const { data: decorationData, error: decorationError } = await supabase
        .from('decorations')
        .select(`
          id,
          name,
          category,
          vendor_capabilities(count)
        `);

      if (decorationError) throw decorationError;

      // Process decoration analytics
      const decorationAnalytics: DecorationAnalytics[] = decorationData?.map(decoration => ({
        id: decoration.id,
        name: decoration.name,
        category: decoration.category,
        vendor_count: decoration.vendor_capabilities?.[0]?.count || 0
      })) || [];

      // Calculate category statistics
      const categoryMap = new Map<string, { decorations: DecorationAnalytics[], totalVendors: number }>();
      
      decorationAnalytics.forEach(decoration => {
        if (!categoryMap.has(decoration.category)) {
          categoryMap.set(decoration.category, { decorations: [], totalVendors: 0 });
        }
        const categoryData = categoryMap.get(decoration.category)!;
        categoryData.decorations.push(decoration);
        categoryData.totalVendors += decoration.vendor_count;
      });

      const categoryStats: CategoryStats[] = Array.from(categoryMap.entries()).map(([category, data]) => ({
        category,
        decoration_count: data.decorations.length,
        total_vendors: data.totalVendors,
        avg_vendors_per_decoration: data.decorations.length > 0 
          ? Math.round((data.totalVendors / data.decorations.length) * 10) / 10 
          : 0
      }));

      // Fetch overall statistics
      const [vendorsResult, capabilitiesResult, activeVendorsResult] = await Promise.all([
        supabase.from('vendors').select('id', { count: 'exact', head: true }),
        supabase.from('vendor_capabilities').select('id', { count: 'exact', head: true }),
        supabase.from('vendors').select('id', { count: 'exact', head: true }).eq('is_active', true)
      ]);

      const totalCapabilities = capabilitiesResult.count || 0;
      const totalDecorations = decorationAnalytics.length;
      const decorationsWithNoVendors = decorationAnalytics.filter(d => d.vendor_count === 0).length;

      setDecorationAnalytics(decorationAnalytics);
      setCategoryStats(categoryStats.sort((a, b) => b.avg_vendors_per_decoration - a.avg_vendors_per_decoration));
      setTotalStats({
        totalDecorations,
        totalVendors: vendorsResult.count || 0,
        totalCapabilities,
        activeVendors: activeVendorsResult.count || 0,
        avgCapabilitiesPerDecoration: totalDecorations > 0 
          ? Math.round((totalCapabilities / totalDecorations) * 10) / 10 
          : 0,
        decorationsWithNoVendors
      });

    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getVendorCoverageColor = (count: number) => {
    if (count === 0) return 'text-destructive';
    if (count <= 2) return 'text-warning';
    if (count <= 4) return 'text-info';
    return 'text-success';
  };

  const getVendorCoverageLabel = (count: number) => {
    if (count === 0) return 'No Coverage';
    if (count <= 2) return 'Low Coverage';
    if (count <= 4) return 'Medium Coverage';
    return 'High Coverage';
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
        </div>
        <p className="text-muted-foreground">
          Comprehensive insights into your vendor backup system performance
        </p>
      </div>

      {/* Overall Statistics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Decorations</p>
                <p className="text-2xl font-bold">{totalStats.totalDecorations}</p>
              </div>
              <Palette className="h-8 w-8 text-primary/20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Vendors</p>
                <p className="text-2xl font-bold">{totalStats.activeVendors}</p>
              </div>
              <Users className="h-8 w-8 text-success/20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Mappings</p>
                <p className="text-2xl font-bold">{totalStats.totalCapabilities}</p>
              </div>
              <CheckSquare className="h-8 w-8 text-info/20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Vendors/Decoration</p>
                <p className="text-2xl font-bold">{totalStats.avgCapabilitiesPerDecoration}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-warning/20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Risk Assessment */}
      {totalStats.decorationsWithNoVendors > 0 && (
        <Card className="border-warning/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-warning">
              <AlertTriangle className="h-5 w-5" />
              Risk Assessment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-2">
              <strong>{totalStats.decorationsWithNoVendors}</strong> decoration(s) have no vendor coverage.
              This creates a high risk for order fulfillment failures.
            </p>
            <Badge variant="outline" className="text-warning border-warning">
              Immediate Action Required
            </Badge>
          </CardContent>
        </Card>
      )}

      {/* Category Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Category Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {categoryStats.map((category, index) => (
              <div key={category.category} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{category.category}</span>
                    <Badge variant="secondary">
                      {category.decoration_count} decoration(s)
                    </Badge>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      Avg: {category.avg_vendors_per_decoration} vendors
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Total: {category.total_vendors} mappings
                    </p>
                  </div>
                </div>
                <Progress 
                  value={Math.min((category.avg_vendors_per_decoration / 5) * 100, 100)} 
                  className="h-2"
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top and Bottom Performers */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Best Coverage */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-success" />
              Best Vendor Coverage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {decorationAnalytics
                .sort((a, b) => b.vendor_count - a.vendor_count)
                .slice(0, 5)
                .map((decoration) => (
                <div key={decoration.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{decoration.name}</p>
                    <Badge variant="outline" className="text-xs">
                      {decoration.category}
                    </Badge>
                  </div>
                  <Badge 
                    variant="secondary" 
                    className={`${getVendorCoverageColor(decoration.vendor_count)} text-xs`}
                  >
                    {decoration.vendor_count} vendors
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Needs Attention */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Needs Attention
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {decorationAnalytics
                .sort((a, b) => a.vendor_count - b.vendor_count)
                .slice(0, 5)
                .map((decoration) => (
                <div key={decoration.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{decoration.name}</p>
                    <Badge variant="outline" className="text-xs">
                      {decoration.category}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <Badge 
                      variant="outline" 
                      className={`${getVendorCoverageColor(decoration.vendor_count)} text-xs`}
                    >
                      {getVendorCoverageLabel(decoration.vendor_count)}
                    </Badge>
                    <p className="text-xs text-muted-foreground">
                      {decoration.vendor_count} vendors
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Health */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            System Health Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Vendor Coverage</span>
                <span className="text-sm font-medium">
                  {Math.round(((totalStats.totalDecorations - totalStats.decorationsWithNoVendors) / totalStats.totalDecorations) * 100)}%
                </span>
              </div>
              <Progress 
                value={((totalStats.totalDecorations - totalStats.decorationsWithNoVendors) / totalStats.totalDecorations) * 100} 
                className="h-2"
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Vendor Utilization</span>
                <span className="text-sm font-medium">
                  {totalStats.activeVendors > 0 ? Math.round((totalStats.totalCapabilities / totalStats.activeVendors) * 10) / 10 : 0}
                </span>
              </div>
              <Progress 
                value={totalStats.activeVendors > 0 ? Math.min(((totalStats.totalCapabilities / totalStats.activeVendors) / 5) * 100, 100) : 0} 
                className="h-2"
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Redundancy Score</span>
                <span className="text-sm font-medium">
                  {Math.round((totalStats.avgCapabilitiesPerDecoration / 3) * 100)}%
                </span>
              </div>
              <Progress 
                value={Math.min((totalStats.avgCapabilitiesPerDecoration / 3) * 100, 100)} 
                className="h-2"
              />
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>Recommendations:</strong> Maintain at least 3 vendors per decoration for optimal redundancy. 
              Focus on categories with low coverage to reduce business risk.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Analytics;