CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    startdate DATE NOT NULL,
    enddate DATE NOT NULL,
    startTime TIME NOT NULL,
    endTime TIME NOT NULL,
    dress_code TEXT,
    category TEXT CHECK (category IN ('party', 'business', 'date')) DEFAULT 'party',
    outfit_suggestions JSONB DEFAULT '[]',
    description TEXT,
    image_url TEXT,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_events_startdate ON events (startdate);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_timestamp ON events;

CREATE TRIGGER set_timestamp
BEFORE UPDATE ON events
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

INSERT INTO storage.buckets (id, name, public)
VALUES ('event-images', 'event-images', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-images', 'profile-images', true)
ON CONFLICT (id) DO NOTHING;

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

CREATE POLICY "Users can upload event images"
ON storage.objects
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete their event images"
ON storage.objects
FOR DELETE
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Public Read Access for Event Images"
ON storage.objects
FOR SELECT
USING (true);

CREATE POLICY "Users can insert profile images"
ON storage.objects
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete their profile images"
ON storage.objects
FOR DELETE
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Public Read Access for Profile Images"
ON storage.objects
FOR SELECT
USING (true);

CREATE TABLE public.users (
  id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  is_approved boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

INSERT INTO events (user_id, name, startdate, enddate, startTime, endTime, dress_code, category, outfit_suggestions, description, image_url)
VALUES
    ('00000000-0000-0000-0000-000000000000', 'Company Meeting', '2025-04-11', '2025-04-11', '09:00:00', '10:30:00', 'Business Casual', 'business', '["Suit", "Blazer", "Dress Pants"]', 'Monthly corporate strategy meeting.', NULL),
    ('00000000-0000-0000-0000-000000000000', 'Beach Party', '2025-06-15', '2025-06-15', '18:00:00', '23:00:00', 'Summer Vibes', 'party', '["Swimwear", "Shorts", "Floral Shirt"]', 'Fun evening at the beach.', NULL),
    ('00000000-0000-0000-0000-000000000000', 'Romantic Dinner', '2025-07-02', '2025-07-02', '19:30:00', '22:00:00', 'Elegant', 'date', '["Cocktail Dress", "Suit", "Heels"]', 'Dinner at a fancy restaurant.', NULL)
ON CONFLICT DO NOTHING;

SELECT '✅ Database initialized successfully' AS status;
