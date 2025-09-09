-- Create profiles table for user management
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT,
  role TEXT CHECK (role IN ('admin', 'sales')) DEFAULT 'sales',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create decorations table
CREATE TABLE public.decorations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  price_range TEXT,
  image_urls TEXT[],
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create vendors table
CREATE TABLE public.vendors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  contact_number TEXT NOT NULL,
  service_areas TEXT[],
  email TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create vendor_capabilities junction table
CREATE TABLE public.vendor_capabilities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID REFERENCES public.vendors(id) ON DELETE CASCADE NOT NULL,
  decoration_id UUID REFERENCES public.decorations(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(vendor_id, decoration_id)
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.decorations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_capabilities ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON public.profiles
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create policies for decorations (authenticated users can read, only admins can modify)
CREATE POLICY "Authenticated users can view decorations" ON public.decorations
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Only admins can insert decorations" ON public.decorations
FOR INSERT TO authenticated WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Only admins can update decorations" ON public.decorations
FOR UPDATE TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Only admins can delete decorations" ON public.decorations
FOR DELETE TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Create policies for vendors (authenticated users can read, only admins can modify)
CREATE POLICY "Authenticated users can view vendors" ON public.vendors
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Only admins can insert vendors" ON public.vendors
FOR INSERT TO authenticated WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Only admins can update vendors" ON public.vendors
FOR UPDATE TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Only admins can delete vendors" ON public.vendors
FOR DELETE TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Create policies for vendor_capabilities (authenticated users can read, sales and admin can modify)
CREATE POLICY "Authenticated users can view vendor capabilities" ON public.vendor_capabilities
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Sales and admin can insert vendor capabilities" ON public.vendor_capabilities
FOR INSERT TO authenticated WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role IN ('admin', 'sales')
  )
);

CREATE POLICY "Sales and admin can update vendor capabilities" ON public.vendor_capabilities
FOR UPDATE TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role IN ('admin', 'sales')
  )
);

CREATE POLICY "Sales and admin can delete vendor capabilities" ON public.vendor_capabilities
FOR DELETE TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role IN ('admin', 'sales')
  )
);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_decorations_updated_at
  BEFORE UPDATE ON public.decorations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_vendors_updated_at
  BEFORE UPDATE ON public.vendors
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, role)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'sales')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for automatic profile creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert some sample data
INSERT INTO public.decorations (name, category, description, price_range, tags) VALUES
('Wedding Mandap', 'Wedding', 'Traditional Indian wedding mandap with floral decorations', '₹50,000 - ₹2,00,000', ARRAY['wedding', 'mandap', 'traditional']),
('Birthday Party Setup', 'Birthday', 'Complete birthday party decoration with balloons and banners', '₹5,000 - ₹25,000', ARRAY['birthday', 'party', 'balloons']),
('Corporate Event Backdrop', 'Corporate', 'Professional backdrop for corporate events and conferences', '₹15,000 - ₹75,000', ARRAY['corporate', 'backdrop', 'professional']),
('Baby Shower Decoration', 'Baby Shower', 'Cute and colorful decorations for baby shower celebrations', '₹8,000 - ₹30,000', ARRAY['baby shower', 'celebration', 'colorful']);

INSERT INTO public.vendors (name, contact_number, service_areas, email) VALUES
('Dream Decorators', '+91-9876543210', ARRAY['Mumbai', 'Pune', 'Nashik'], 'contact@dreamdecorators.com'),
('Elite Events', '+91-8765432109', ARRAY['Delhi', 'Gurgaon', 'Noida'], 'info@eliteevents.com'),
('Royal Celebrations', '+91-7654321098', ARRAY['Bangalore', 'Mysore', 'Mangalore'], 'hello@royalcelebrations.com'),
('Perfect Parties', '+91-6543210987', ARRAY['Chennai', 'Coimbatore', 'Madurai'], 'contact@perfectparties.com');