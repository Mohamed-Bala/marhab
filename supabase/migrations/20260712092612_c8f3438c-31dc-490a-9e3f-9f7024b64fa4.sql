CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- First authenticated user to call this becomes admin (bootstrap)
CREATE OR REPLACE FUNCTION public.claim_admin_if_none()
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN false;
  END IF;
  IF EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    RETURN public.has_role(auth.uid(), 'admin');
  END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (auth.uid(), 'admin') ON CONFLICT DO NOTHING;
  RETURN true;
END $$;
GRANT EXECUTE ON FUNCTION public.claim_admin_if_none() TO authenticated;

CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ar text NOT NULL,
  name_en text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.categories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories TO authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Admins can insert categories" ON public.categories FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update categories" ON public.categories FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete categories" ON public.categories FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.menu_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  name_ar text NOT NULL,
  name_en text,
  description_ar text,
  description_en text,
  price numeric(10,2) NOT NULL DEFAULT 0,
  image_url text,
  is_available boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.menu_items TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.menu_items TO authenticated;
GRANT ALL ON public.menu_items TO service_role;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view menu items" ON public.menu_items FOR SELECT USING (true);
CREATE POLICY "Admins can insert menu items" ON public.menu_items FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update menu items" ON public.menu_items FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete menu items" ON public.menu_items FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Seed data
WITH cats AS (
  INSERT INTO public.categories (name_ar, name_en, sort_order) VALUES
    ('المقبلات', 'Appetizers', 1),
    ('الأطباق الرئيسية', 'Main Dishes', 2),
    ('المشروبات', 'Beverages', 3),
    ('الحلويات', 'Desserts', 4)
  RETURNING id, name_en
)
INSERT INTO public.menu_items (category_id, name_ar, name_en, description_ar, description_en, price, image_url, sort_order)
SELECT c.id, v.name_ar, v.name_en, v.desc_ar, v.desc_en, v.price, v.img, v.ord
FROM cats c
JOIN (VALUES
  ('Appetizers', 'حمص بالطحينة', 'Hummus', 'حمص كريمي مع زيت الزيتون والحمص الكامل والبابريكا، يقدم مع خبز عربي طازج', 'Creamy hummus with olive oil, whole chickpeas and paprika, served with fresh pita', 18.00, '/images/hummus.jpg', 1),
  ('Appetizers', 'فتوش', 'Fattoush', 'سلطة طازجة مع خبز محمص مقرمش ودبس الرمان', 'Fresh salad with crispy toasted pita and pomegranate molasses', 22.00, '/images/fattoush.jpg', 2),
  ('Main Dishes', 'مشاوي مشكلة', 'Mixed Grill', 'تشكيلة من الكباب والشيش طاووق وريش الغنم مع الخضار المشوية', 'Assortment of kebab, shish tawook and lamb chops with grilled vegetables', 85.00, '/images/mixed-grill.jpg', 1),
  ('Main Dishes', 'شاورما دجاج', 'Chicken Shawarma', 'شاورما دجاج مع صوص الثوم والمخللات، تقدم مع بطاطس مقلية', 'Chicken shawarma with garlic sauce and pickles, served with fries', 32.00, '/images/shawarma.jpg', 2),
  ('Beverages', 'ليموناضة بالنعناع', 'Mint Lemonade', 'عصير ليمون طازج مع النعناع والثلج', 'Fresh lemon juice with mint and ice', 14.00, '/images/mint-lemonade.jpg', 1),
  ('Beverages', 'قهوة عربية', 'Arabic Coffee', 'قهوة عربية أصيلة تقدم مع التمر', 'Authentic Arabic coffee served with dates', 12.00, '/images/arabic-coffee.jpg', 2),
  ('Desserts', 'كنافة نابلسية', 'Kunafa', 'كنافة ساخنة بالجبنة مع القطر والفستق الحلبي', 'Hot cheese kunafa with syrup and pistachios', 28.00, '/images/kunafa.jpg', 1),
  ('Desserts', 'بقلاوة', 'Baklava', 'بقلاوة مشكلة بالفستق والعسل', 'Assorted baklava with pistachios and honey', 24.00, '/images/baklava.jpg', 2)
) AS v(cat, name_ar, name_en, desc_ar, desc_en, price, img, ord)
ON v.cat = c.name_en;