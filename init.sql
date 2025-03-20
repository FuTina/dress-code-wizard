-- 📌 Events table with images and categories
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    startdate DATE NOT NULL,
    enddate DATE NOT NULL,
    "startTime" TIME NOT NULL,
    "endTime" TIME NOT NULL,
    event_type TEXT NOT NULL CHECK (event_type IN ('party', 'business', 'date')) DEFAULT 'party',
    dress_code TEXT,
    description TEXT,
    outfit_suggestion TEXT,  -- AI-generated outfit suggestions
    image_url TEXT,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now() NOT NULL
);

-- 📌 Add trigger to update `updated_at` on change
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_timestamp
BEFORE UPDATE ON events
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- 📌 Optimize sorting and filtering indexes
CREATE INDEX IF NOT EXISTS idx_events_start ON events(startdate, "startTime");
CREATE INDEX IF NOT EXISTS idx_events_end ON events(enddate, "endTime");
CREATE INDEX IF NOT EXISTS idx_events_event_type ON events(event_type);

-- 📌 Storage buckets
INSERT INTO storage.buckets (id, name, public)
VALUES ('event-images', 'event-images', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-images', 'profile-images', true)
ON CONFLICT (id) DO NOTHING;

-- 📌 Row-Level Security Policies
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own events"
ON events
FOR INSERT
WITH CHECK (auth.uid() = user_id AND startdate <= enddate);

CREATE POLICY "Users can update their own events"
ON events
FOR UPDATE
USING (auth.uid() = user_id AND startdate <= enddate);

CREATE POLICY "Users can delete their own events"
ON events
FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own events"
ON events
FOR SELECT
USING (auth.uid() = user_id);

-- 📌 Public Read Access for Event and Profile Images
CREATE POLICY "Public Read Access for Event Images"
ON storage.objects
FOR SELECT
USING (true);

CREATE POLICY "Public Read Access for Profile Images"
ON storage.objects
FOR SELECT
USING (true);

-- 📌 Users can upload and delete event images
CREATE POLICY "Users can upload event images"
ON storage.objects
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL AND bucket_id = 'event-images');

CREATE POLICY "Users can delete their event images"
ON storage.objects
FOR DELETE
USING (auth.uid() IS NOT NULL);

-- 📌 Users can upload and delete profile images
CREATE POLICY "Users can insert profile images"
ON storage.objects
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete their profile images"
ON storage.objects
FOR DELETE
USING (auth.uid() IS NOT NULL);

-- 📌 Users table
CREATE TABLE IF NOT EXISTS public.users (
  id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  is_approved boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- 📌 Trigger function to handle new users
CREATE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 📌 Trigger for new users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 📌 Dress codes table
-- Create table for dress codes
CREATE TABLE dress_codes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    event_type TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT now()
);

-- Enable Row-Level Security (RLS)
ALTER TABLE dress_codes ENABLE ROW LEVEL SECURITY;

-- ✅ Policy: Public Read Access (Anyone can read)
CREATE POLICY "Public Read Access"
ON dress_codes
FOR SELECT
TO public
USING (true);

-- ✅ Policy: Allow Authenticated Users to Insert Dress Codes
CREATE POLICY "Allow Authenticated Insert"
ON dress_codes
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

-- ✅ Policy: Allow Authenticated Users to Update Dress Codes (Optional)
CREATE POLICY "Allow Authenticated Update"
ON dress_codes
FOR UPDATE
TO authenticated
USING (auth.uid() IS NOT NULL);

-- ✅ Policy: Allow Authenticated Users to Delete Dress Codes (Optional)
CREATE POLICY "Allow Authenticated Delete"
ON dress_codes
FOR DELETE
TO authenticated
USING (auth.uid() IS NOT NULL);

-- ✅ Insert Initial Dress Codes (Defaults)
INSERT INTO dress_codes (name, event_type) VALUES 
('Neon Glow', 'party'),
('Great Gatsby', 'party'),
('Elegant Formal', 'business'),
('Corporate Chic', 'business'),
('Romantic Red', 'date'),
('Moonlight Dinner', 'date');
