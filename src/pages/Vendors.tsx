import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Search, Phone, Mail, MapPin, Users } from 'lucide-react';

interface Vendor {
  id: string;
  name: string;
  contact_number: string;
  service_areas: string[] | null;
  email: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const Vendors = () => {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    contact_number: '',
    email: '',
    service_areas: '',
    is_active: true
  });

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    try {
      const { data, error } = await supabase
        .from('vendors')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVendors(data || []);
    } catch (error) {
      console.error('Error fetching vendors:', error);
      toast({
        title: "Error",
        description: "Failed to fetch vendors",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      toast({
        title: "Access Denied",
        description: "Only admins can manage vendors",
        variant: "destructive",
      });
      return;
    }

    const vendorData = {
      ...formData,
      service_areas: formData.service_areas 
        ? formData.service_areas.split(',').map(area => area.trim())
        : []
    };

    try {
      let error;
      if (editingVendor) {
        const { error: updateError } = await supabase
          .from('vendors')
          .update(vendorData)
          .eq('id', editingVendor.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from('vendors')
          .insert([vendorData]);
        error = insertError;
      }

      if (error) throw error;

      toast({
        title: "Success",
        description: `Vendor ${editingVendor ? 'updated' : 'created'} successfully`,
      });

      setIsDialogOpen(false);
      setEditingVendor(null);
      setFormData({
        name: '',
        contact_number: '',
        email: '',
        service_areas: '',
        is_active: true
      });
      fetchVendors();
    } catch (error) {
      console.error('Error saving vendor:', error);
      toast({
        title: "Error",
        description: "Failed to save vendor",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (vendor: Vendor) => {
    setEditingVendor(vendor);
    setFormData({
      name: vendor.name,
      contact_number: vendor.contact_number,
      email: vendor.email || '',
      service_areas: vendor.service_areas?.join(', ') || '',
      is_active: vendor.is_active
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (vendorId: string) => {
    if (!isAdmin) {
      toast({
        title: "Access Denied",
        description: "Only admins can delete vendors",
        variant: "destructive",
      });
      return;
    }

    if (confirm('Are you sure you want to delete this vendor?')) {
      try {
        const { error } = await supabase
          .from('vendors')
          .delete()
          .eq('id', vendorId);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Vendor deleted successfully",
        });
        fetchVendors();
      } catch (error) {
        console.error('Error deleting vendor:', error);
        toast({
          title: "Error",
          description: "Failed to delete vendor",
          variant: "destructive",
        });
      }
    }
  };

  const toggleVendorStatus = async (vendorId: string, currentStatus: boolean) => {
    if (!isAdmin) {
      toast({
        title: "Access Denied",
        description: "Only admins can modify vendor status",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('vendors')
        .update({ is_active: !currentStatus })
        .eq('id', vendorId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Vendor ${!currentStatus ? 'activated' : 'deactivated'} successfully`,
      });
      fetchVendors();
    } catch (error) {
      console.error('Error updating vendor status:', error);
      toast({
        title: "Error",
        description: "Failed to update vendor status",
        variant: "destructive",
      });
    }
  };

  const filteredVendors = vendors.filter(vendor => 
    vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vendor.contact_number.includes(searchTerm) ||
    vendor.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vendor.service_areas?.some(area => area.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const activeVendors = vendors.filter(v => v.is_active).length;
  const totalVendors = vendors.length;

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Vendors Management</h2>
        </div>
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
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h2 className="text-2xl font-bold">Vendors Management</h2>
          <p className="text-muted-foreground">
            {activeVendors} of {totalVendors} vendors active
          </p>
        </div>
        {isAdmin && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Vendor
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingVendor ? 'Edit Vendor' : 'Add New Vendor'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Vendor Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact_number">Contact Number</Label>
                  <Input
                    id="contact_number"
                    type="tel"
                    value={formData.contact_number}
                    onChange={(e) => setFormData({ ...formData, contact_number: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email (optional)</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="service_areas">Service Areas (comma separated)</Label>
                  <Input
                    id="service_areas"
                    placeholder="e.g., Mumbai, Pune, Nashik"
                    value={formData.service_areas}
                    onChange={(e) => setFormData({ ...formData, service_areas: e.target.value })}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label htmlFor="is_active">Active Vendor</Label>
                </div>
                <Button type="submit" className="w-full">
                  {editingVendor ? 'Update' : 'Create'} Vendor
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search vendors..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Vendors Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredVendors.map((vendor) => (
          <Card key={vendor.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-lg">{vendor.name}</CardTitle>
                  <Badge 
                    variant={vendor.is_active ? "secondary" : "outline"}
                    className={vendor.is_active ? "bg-success text-success-foreground" : ""}
                  >
                    {vendor.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                {isAdmin && (
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(vendor)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(vendor.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{vendor.contact_number}</span>
              </div>
              
              {vendor.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{vendor.email}</span>
                </div>
              )}

              {vendor.service_areas && vendor.service_areas.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Service Areas:</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {vendor.service_areas.map((area, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {area}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {isAdmin && (
                <div className="pt-2 border-t">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Status:</span>
                    <Switch
                      checked={vendor.is_active}
                      onCheckedChange={() => toggleVendorStatus(vendor.id, vendor.is_active)}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredVendors.length === 0 && (
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No vendors found matching your search.</p>
        </div>
      )}
    </div>
  );
};

export default Vendors;