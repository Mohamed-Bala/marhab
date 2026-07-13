
-- Create private schema not exposed via PostgREST
CREATE SCHEMA IF NOT EXISTS private;

-- Recreate has_role in private schema
CREATE OR REPLACE FUNCTION private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

REVOKE ALL ON FUNCTION private.has_role(uuid, public.app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO authenticated;

-- Drop and recreate policies to use private.has_role
DROP POLICY IF EXISTS "Admins can insert categories" ON public.categories;
DROP POLICY IF EXISTS "Admins can update categories" ON public.categories;
DROP POLICY IF EXISTS "Admins can delete categories" ON public.categories;
DROP POLICY IF EXISTS "Admins can insert menu items" ON public.menu_items;
DROP POLICY IF EXISTS "Admins can update menu items" ON public.menu_items;
DROP POLICY IF EXISTS "Admins can delete menu items" ON public.menu_items;
DROP POLICY IF EXISTS "Admins can upload menu images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update menu images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete menu images" ON storage.objects;

CREATE POLICY "Admins can insert categories" ON public.categories
  FOR INSERT TO authenticated WITH CHECK (private.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update categories" ON public.categories
  FOR UPDATE TO authenticated USING (private.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete categories" ON public.categories
  FOR DELETE TO authenticated USING (private.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert menu items" ON public.menu_items
  FOR INSERT TO authenticated WITH CHECK (private.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update menu items" ON public.menu_items
  FOR UPDATE TO authenticated USING (private.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete menu items" ON public.menu_items
  FOR DELETE TO authenticated USING (private.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can upload menu images" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'menu-images' AND private.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update menu images" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'menu-images' AND private.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete menu images" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'menu-images' AND private.has_role(auth.uid(), 'admin'));

-- Drop the old public functions (claim_admin_if_none moves to server function; public.has_role no longer needed)
DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role);
DROP FUNCTION IF EXISTS public.claim_admin_if_none();
