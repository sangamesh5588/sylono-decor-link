import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Search, Image, Tag } from 'lucide-react';

interface Decoration {
  id: string;
  name: string;
  category: string;
  description: string | null;
  price_range: string | null;
  image_urls: string[] | null;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
}

const Decorations = () => {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const [decorations, setDecorations] = useState<Decoration[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDecoration, setEditingDecoration] = useState<Decoration | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    description: '',
    price_range: '',
    tags: '',
    image_urls: ''
  });

  useEffect(() => {
    fetchDecorations();
  }, []);

  const fetchDecorations = async () => {
    try {
      const { data, error } = await supabase
        .from('decorations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDecorations(data || []);
    } catch (error) {
      console.error('Error fetching decorations:', error);
      toast({
        title: "Error",
        description: "Failed to fetch decorations",
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
        description: "Only admins can manage decorations",
        variant: "destructive",
      });
      return;
    }

    const decorationData = {
      ...formData,
      tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()) : [],
      image_urls: formData.image_urls ? formData.image_urls.split(',').map(url => url.trim()) : []
    };

    try {
      let error;
      if (editingDecoration) {
        const { error: updateError } = await supabase
          .from('decorations')
          .update(decorationData)
          .eq('id', editingDecoration.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from('decorations')
          .insert([decorationData]);
        error = insertError;
      }

      if (error) throw error;

      toast({
        title: "Success",
        description: `Decoration ${editingDecoration ? 'updated' : 'created'} successfully`,
      });

      setIsDialogOpen(false);
      setEditingDecoration(null);
      setFormData({
        name: '',
        category: '',
        description: '',
        price_range: '',
        tags: '',
        image_urls: ''
      });
      fetchDecorations();
    } catch (error) {
      console.error('Error saving decoration:', error);
      toast({
        title: "Error",
        description: "Failed to save decoration",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (decoration: Decoration) => {
    setEditingDecoration(decoration);
    setFormData({
      name: decoration.name,
      category: decoration.category,
      description: decoration.description || '',
      price_range: decoration.price_range || '',
      tags: decoration.tags?.join(', ') || '',
      image_urls: decoration.image_urls?.join(', ') || ''
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (decorationId: string) => {
    if (!isAdmin) {
      toast({
        title: "Access Denied",
        description: "Only admins can delete decorations",
        variant: "destructive",
      });
      return;
    }

    if (confirm('Are you sure you want to delete this decoration?')) {
      try {
        const { error } = await supabase
          .from('decorations')
          .delete()
          .eq('id', decorationId);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Decoration deleted successfully",
        });
        fetchDecorations();
      } catch (error) {
        console.error('Error deleting decoration:', error);
        toast({
          title: "Error",
          description: "Failed to delete decoration",
          variant: "destructive",
        });
      }
    }
  };

  const categories = [...new Set(decorations.map(d => d.category))];
  const filteredDecorations = decorations.filter(decoration => {
    const matchesSearch = decoration.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         decoration.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         decoration.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || decoration.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Decorations Management</h2>
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
          <h2 className="text-2xl font-bold">Decorations Management</h2>
          <p className="text-muted-foreground">Manage all decoration listings</p>
        </div>
        {isAdmin && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Decoration
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingDecoration ? 'Edit Decoration' : 'Add New Decoration'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price_range">Price Range</Label>
                  <Input
                    id="price_range"
                    placeholder="e.g., ₹10,000 - ₹50,000"
                    value={formData.price_range}
                    onChange={(e) => setFormData({ ...formData, price_range: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tags">Tags (comma separated)</Label>
                  <Input
                    id="tags"
                    placeholder="e.g., wedding, mandap, traditional"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="image_urls">Image URLs (comma separated)</Label>
                  <Textarea
                    id="image_urls"
                    placeholder="Enter image URLs"
                    value={formData.image_urls}
                    onChange={(e) => setFormData({ ...formData, image_urls: e.target.value })}
                    rows={2}
                  />
                </div>
                <Button type="submit" className="w-full">
                  {editingDecoration ? 'Update' : 'Create'} Decoration
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
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

      {/* Decorations Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredDecorations.map((decoration) => (
          <Card key={decoration.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{decoration.name}</CardTitle>
                {isAdmin && (
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(decoration)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(decoration.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
              <Badge variant="secondary">{decoration.category}</Badge>
            </CardHeader>
            <CardContent>
              {decoration.description && (
                <p className="text-sm text-muted-foreground mb-3">
                  {decoration.description}
                </p>
              )}
              
              {decoration.price_range && (
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-medium">Price:</span>
                  <span className="text-sm text-muted-foreground">
                    {decoration.price_range}
                  </span>
                </div>
              )}

              {decoration.tags && decoration.tags.length > 0 && (
                <div className="flex items-center gap-2 mb-2">
                  <Tag className="h-3 w-3" />
                  <div className="flex flex-wrap gap-1">
                    {decoration.tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {decoration.image_urls && decoration.image_urls.length > 0 && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Image className="h-3 w-3" />
                  <span>{decoration.image_urls.length} image(s)</span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredDecorations.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No decorations found matching your criteria.</p>
        </div>
      )}
    </div>
  );
};

export default Decorations;