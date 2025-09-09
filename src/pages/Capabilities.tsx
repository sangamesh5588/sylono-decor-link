import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Search, Users, Palette, CheckSquare, Save } from 'lucide-react';

interface Decoration {
  id: string;
  name: string;
  category: string;
}

interface Vendor {
  id: string;
  name: string;
  is_active: boolean;
}

interface VendorCapability {
  vendor_id: string;
  decoration_id: string;
}

const Capabilities = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [decorations, setDecorations] = useState<Decoration[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [capabilities, setCapabilities] = useState<VendorCapability[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [pendingChanges, setPendingChanges] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [decorationsResult, vendorsResult, capabilitiesResult] = await Promise.all([
        supabase.from('decorations').select('id, name, category').order('name'),
        supabase.from('vendors').select('id, name, is_active').eq('is_active', true).order('name'),
        supabase.from('vendor_capabilities').select('vendor_id, decoration_id')
      ]);

      if (decorationsResult.error) throw decorationsResult.error;
      if (vendorsResult.error) throw vendorsResult.error;
      if (capabilitiesResult.error) throw capabilitiesResult.error;

      setDecorations(decorationsResult.data || []);
      setVendors(vendorsResult.data || []);
      setCapabilities(capabilitiesResult.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const hasCapability = (vendorId: string, decorationId: string): boolean => {
    return capabilities.some(cap => 
      cap.vendor_id === vendorId && cap.decoration_id === decorationId
    );
  };

  const toggleCapability = async (vendorId: string, decorationId: string) => {
    if (!profile || !['admin', 'sales'].includes(profile.role)) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to modify capabilities",
        variant: "destructive",
      });
      return;
    }

    const key = `${vendorId}-${decorationId}`;
    const currentHasCapability = hasCapability(vendorId, decorationId);

    try {
      if (currentHasCapability) {
        // Remove capability
        const { error } = await supabase
          .from('vendor_capabilities')
          .delete()
          .eq('vendor_id', vendorId)
          .eq('decoration_id', decorationId);

        if (error) throw error;

        setCapabilities(prev => 
          prev.filter(cap => 
            !(cap.vendor_id === vendorId && cap.decoration_id === decorationId)
          )
        );
      } else {
        // Add capability
        const { error } = await supabase
          .from('vendor_capabilities')
          .insert([{ vendor_id: vendorId, decoration_id: decorationId }]);

        if (error) throw error;

        setCapabilities(prev => [...prev, { vendor_id: vendorId, decoration_id: decorationId }]);
      }

      // Add to pending changes for visual feedback
      setPendingChanges(prev => new Set(prev).add(key));
      setTimeout(() => {
        setPendingChanges(prev => {
          const newSet = new Set(prev);
          newSet.delete(key);
          return newSet;
        });
      }, 1000);

      toast({
        title: "Success",
        description: `Capability ${currentHasCapability ? 'removed' : 'added'} successfully`,
      });
    } catch (error) {
      console.error('Error updating capability:', error);
      toast({
        title: "Error",
        description: "Failed to update capability",
        variant: "destructive",
      });
    }
  };

  const getVendorCount = (decorationId: string): number => {
    return capabilities.filter(cap => cap.decoration_id === decorationId).length;
  };

  const categories = [...new Set(decorations.map(d => d.category))];
  const filteredDecorations = decorations.filter(decoration => {
    const matchesSearch = decoration.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || decoration.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-muted rounded w-1/3 animate-pulse"></div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-6 bg-muted rounded w-1/2 mb-4"></div>
                <div className="grid grid-cols-4 gap-2">
                  {[...Array(8)].map((_, j) => (
                    <div key={j} className="h-8 bg-muted rounded"></div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const canModify = profile && ['admin', 'sales'].includes(profile.role);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Vendor Capabilities Mapping</h2>
        <p className="text-muted-foreground">
          {canModify 
            ? "Assign decorations to vendors by checking the boxes below" 
            : "View which vendors can perform each decoration"
          }
        </p>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search decorations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-3 py-2 border border-input rounded-md bg-background"
        >
          <option value="all">All Categories</option>
          {categories.map(category => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Total Decorations</p>
                <p className="text-2xl font-bold">{decorations.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-success" />
              <div>
                <p className="text-sm text-muted-foreground">Active Vendors</p>
                <p className="text-2xl font-bold">{vendors.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckSquare className="h-5 w-5 text-info" />
              <div>
                <p className="text-sm text-muted-foreground">Total Mappings</p>
                <p className="text-2xl font-bold">{capabilities.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Capabilities Matrix */}
      <div className="space-y-4">
        {filteredDecorations.map((decoration) => (
          <Card key={decoration.id}>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">{decoration.name}</CardTitle>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary">{decoration.category}</Badge>
                    <Badge variant="outline">
                      {getVendorCount(decoration.id)} vendor(s) assigned
                    </Badge>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {vendors.map((vendor) => {
                  const key = `${vendor.id}-${decoration.id}`;
                  const isChecked = hasCapability(vendor.id, decoration.id);
                  const isPending = pendingChanges.has(key);
                  
                  return (
                    <div 
                      key={vendor.id}
                      className={`flex items-center space-x-2 p-3 rounded-md border transition-colors ${
                        isPending ? 'bg-primary/5 border-primary/20' : 'hover:bg-muted/50'
                      }`}
                    >
                      <Checkbox
                        id={key}
                        checked={isChecked}
                        onCheckedChange={() => toggleCapability(vendor.id, decoration.id)}
                        disabled={!canModify || isPending}
                      />
                      <label
                        htmlFor={key}
                        className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex-1 ${
                          canModify ? 'cursor-pointer' : 'cursor-default'
                        }`}
                      >
                        {vendor.name}
                        {isPending && (
                          <Save className="inline h-3 w-3 ml-1 text-primary animate-pulse" />
                        )}
                      </label>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredDecorations.length === 0 && (
        <div className="text-center py-12">
          <Palette className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No decorations found matching your criteria.</p>
        </div>
      )}

      {vendors.length === 0 && (
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            No active vendors found. Please add and activate vendors first.
          </p>
        </div>
      )}
    </div>
  );
};

export default Capabilities;