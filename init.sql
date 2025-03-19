-- 📌 Events table with images and categories
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    startdate DATE NOT NULL,
    enddate DATE NOT NULL,
    "startTime" TIME NOT NULL,
    "endTime" TIME NOT NULL,
    category TEXT CHECK (category IN ('party', 'business', 'date')) DEFAULT 'party',
    dress_code TEXT,
    description TEXT,
    outfit_suggestion TEXT,  -- New field for AI-generated outfit suggestions
    image_url TEXT,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
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

-- 📌 Optimize sorting by event start
CREATE INDEX IF NOT EXISTS idx_events_start ON events(startdate, "startTime");

-- 📌 Optimize filtering past events
CREATE INDEX IF NOT EXISTS idx_events_end ON events(enddate, "endTime");

-- 📌 Storage bucket for event images
INSERT INTO storage.buckets (id, name, public)
VALUES ('event-images', 'event-images', true)
ON CONFLICT (id) DO NOTHING;

-- 📌 Storage bucket for profile images
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-images', 'profile-images', true)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- 📌 Users can insert their own events
CREATE POLICY "Users can insert their own events"
ON events
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 📌 Users can update their own events
CREATE POLICY "Users can update their own events"
ON events
FOR UPDATE
USING (auth.uid() = user_id);

-- 📌 Users can delete their own events
CREATE POLICY "Users can delete their own events"
ON events
FOR DELETE
USING (auth.uid() = user_id);

-- 📌 Users can view only their own events
CREATE POLICY "Users can view their own events"
ON events
FOR SELECT
USING (auth.uid() = user_id);

-- 📌 Users can upload event images
CREATE POLICY "Users can upload event images"
ON storage.objects
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- 📌 Users can delete their event images
CREATE POLICY "Users can delete their event images"
ON storage.objects
FOR DELETE
USING (auth.uid() IS NOT NULL);

-- 📌 Public read access for event images
CREATE POLICY "Public Read Access for Event Images"
ON storage.objects
FOR SELECT
USING (true);

-- 📌 Users can insert profile images
CREATE POLICY "Users can insert profile images"
ON storage.objects
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- 📌 Users can delete their profile images
CREATE POLICY "Users can delete their profile images"
ON storage.objects
FOR DELETE
USING (auth.uid() IS NOT NULL);

-- 📌 Public Read Access for Profile Images
CREATE POLICY "Public Read Access for Profile Images"
ON storage.objects
FOR SELECT
USING (true);

-- 📌 Allow authenticated users to insert event images
CREATE POLICY "Allow image upload for authenticated users"
ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'event-images');

-- 📌 Users can insert their own events with valid dates
CREATE POLICY "Users can insert their own events"
ON events
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id AND startdate <= enddate);

-- 📌 Users can update their own events with valid dates
CREATE POLICY "Users can update their own events"
ON events
USING (auth.uid() = user_id AND startdate <= enddate);

-- 📌 Users table
CREATE TABLE public.users (
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
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 📌 Trigger for new users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
