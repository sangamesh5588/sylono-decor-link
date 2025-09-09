import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { 
  Search, 
  AlertTriangle, 
  Users, 
  Phone, 
  Mail, 
  MapPin, 
  CheckCircle, 
  Clock,
  Zap
} from 'lucide-react';

interface Decoration {
  id: string;
  name: string;
  category: string;
  description: string | null;
  price_range: string | null;
}

interface Vendor {
  id: string;
  name: string;
  contact_number: string;
  email: string | null;
  service_areas: string[] | null;
  is_active: boolean;
}

interface DecorationWithVendors extends Decoration {
  vendors: Vendor[];
}

const Emergency = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [decorations, setDecorations] = useState<DecorationWithVendors[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDecoration, setSelectedDecoration] = useState<DecorationWithVendors | null>(null);
  const [assignmentHistory, setAssignmentHistory] = useState<any[]>([]);

  useEffect(() => {
    fetchDecorations();
  }, []);

  const fetchDecorations = async () => {
    try {
      // Fetch all decorations with their capable vendors
      const { data: decorationData, error: decorationError } = await supabase
        .from('decorations')
        .select('*')
        .order('name');

      if (decorationError) throw decorationError;

      // Fetch vendor capabilities
      const { data: capabilityData, error: capabilityError } = await supabase
        .from('vendor_capabilities')
        .select(`
          decoration_id,
          vendors!inner (
            id, name, contact_number, email, service_areas, is_active
          )
        `)
        .eq('vendors.is_active', true);

      if (capabilityError) throw capabilityError;

      // Combine decorations with their vendors
      const decorationsWithVendors: DecorationWithVendors[] = decorationData?.map(decoration => {
        const vendors = capabilityData
          ?.filter(cap => cap.decoration_id === decoration.id)
          .map(cap => cap.vendors)
          .filter(vendor => vendor && vendor.is_active) || [];
        
        return {
          ...decoration,
          vendors: vendors as Vendor[]
        };
      }) || [];

      setDecorations(decorationsWithVendors);
    } catch (error) {
      console.error('Error fetching decorations:', error);
      toast({
        title: "Error",
        description: "Failed to fetch decorations and vendors",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAssignVendor = async (decorationId: string, vendorId: string, vendorName: string) => {
    try {
      // In a real application, you would create an orders/assignments table
      // For now, we'll just show a success message and log the assignment
      
      const assignment = {
        decoration_id: decorationId,
        vendor_id: vendorId,
        assigned_at: new Date().toISOString(),
        assigned_by: profile?.id,
        status: 'assigned'
      };

      toast({
        title: "Assignment Successful",
        description: `Order assigned to ${vendorName}`,
      });

      // Add to local assignment history for demo purposes
      setAssignmentHistory(prev => [assignment, ...prev]);
      
    } catch (error) {
      console.error('Error assigning vendor:', error);
      toast({
        title: "Error",
        description: "Failed to assign vendor",
        variant: "destructive",
      });
    }
  };

  const filteredDecorations = decorations.filter(decoration =>
    decoration.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    decoration.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const urgentDecorations = decorations.filter(decoration => decoration.vendors.length <= 2);
  const wellCoveredDecorations = decorations.filter(decoration => decoration.vendors.length >= 5);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-muted rounded w-1/3 animate-pulse"></div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/2 mb-2"></div>
                <div className="h-20 bg-muted rounded"></div>
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
          <AlertTriangle className="h-6 w-6 text-warning" />
          <h2 className="text-2xl font-bold">Emergency Assignment</h2>
        </div>
        <p className="text-muted-foreground">
          Quickly find and assign alternative vendors when cancellations occur
        </p>
      </div>

      {/* Alert Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>{urgentDecorations.length}</strong> decorations have limited vendor coverage (≤2 vendors)
          </AlertDescription>
        </Alert>
        
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>{wellCoveredDecorations.length}</strong> decorations have excellent coverage (≥5 vendors)
          </AlertDescription>
        </Alert>

        <Alert>
          <Users className="h-4 w-4" />
          <AlertDescription>
            <strong>{decorations.length}</strong> total decorations available for assignment
          </AlertDescription>
        </Alert>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search for decorations to find alternative vendors..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Recent Assignments */}
      {assignmentHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Assignments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {assignmentHistory.slice(0, 3).map((assignment, index) => {
                const decoration = decorations.find(d => d.id === assignment.decoration_id);
                const vendor = decoration?.vendors.find(v => v.id === assignment.vendor_id);
                
                return (
                  <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                    <div className="text-sm">
                      <strong>{decoration?.name}</strong> assigned to <strong>{vendor?.name}</strong>
                    </div>
                    <Badge variant="secondary" className="bg-success text-success-foreground">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Assigned
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Decorations with Vendor Options */}
      <div className="space-y-4">
        {filteredDecorations.map((decoration) => (
          <Card key={decoration.id} className={`${decoration.vendors.length <= 2 ? 'border-warning/50' : ''}`}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {decoration.name}
                    {decoration.vendors.length <= 2 && (
                      <Badge variant="outline" className="text-warning border-warning">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Limited Coverage
                      </Badge>
                    )}
                  </CardTitle>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary">{decoration.category}</Badge>
                    <Badge variant="outline">
                      {decoration.vendors.length} vendor(s) available
                    </Badge>
                  </div>
                </div>
              </div>
              {decoration.description && (
                <p className="text-sm text-muted-foreground mt-2">
                  {decoration.description}
                </p>
              )}
              {decoration.price_range && (
                <p className="text-sm font-medium">
                  Price Range: {decoration.price_range}
                </p>
              )}
            </CardHeader>
            
            <CardContent>
              {decoration.vendors.length === 0 ? (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    No vendors available for this decoration. Please add vendor capabilities first.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {decoration.vendors.map((vendor) => (
                    <Card key={vendor.id} className="border hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold">{vendor.name}</h4>
                            <Badge variant="secondary" className="bg-success text-success-foreground text-xs">
                              Available
                            </Badge>
                          </div>
                          
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2">
                              <Phone className="h-3 w-3 text-muted-foreground" />
                              <span>{vendor.contact_number}</span>
                            </div>
                            
                            {vendor.email && (
                              <div className="flex items-center gap-2">
                                <Mail className="h-3 w-3 text-muted-foreground" />
                                <span className="text-muted-foreground">{vendor.email}</span>
                              </div>
                            )}
                            
                            {vendor.service_areas && vendor.service_areas.length > 0 && (
                              <div className="flex items-start gap-2">
                                <MapPin className="h-3 w-3 text-muted-foreground mt-0.5" />
                                <div className="flex flex-wrap gap-1">
                                  {vendor.service_areas.slice(0, 3).map((area, index) => (
                                    <Badge key={index} variant="outline" className="text-xs">
                                      {area}
                                    </Badge>
                                  ))}
                                  {vendor.service_areas.length > 3 && (
                                    <Badge variant="outline" className="text-xs">
                                      +{vendor.service_areas.length - 3} more
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                          
                          <Button 
                            size="sm" 
                            className="w-full"
                            onClick={() => handleAssignVendor(decoration.id, vendor.id, vendor.name)}
                          >
                            <Zap className="h-3 w-3 mr-2" />
                            Assign Order
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredDecorations.length === 0 && (
        <div className="text-center py-12">
          <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No decorations found matching your search.</p>
        </div>
      )}
    </div>
  );
};

export default Emergency;