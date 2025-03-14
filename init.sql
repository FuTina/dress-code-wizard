-- 📌 Events-Tabelle mit Bildern
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    startdate DATE NOT NULL,
    enddate DATE NOT NULL,
    startTime TIME NOT NULL,
    endTime TIME NOT NULL,
    dress_code TEXT,
    description TEXT,
    image_url TEXT, -- 🌟 Event-Bild-URL
    created_at TIMESTAMP DEFAULT now()
);

-- 📌 Storage-Bucket für Event-Bilder
INSERT INTO storage.buckets (id, name, public)
VALUES ('event-images', 'event-images', true)
ON CONFLICT (id) DO NOTHING;

-- 📌 Storage-Bucket für Profilbilder
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-images', 'profile-images', true)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- 📌 Nutzer können nur eigene Events erstellen
CREATE POLICY "Users can insert their own events"
ON events
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 📌 Nutzer können nur eigene Events aktualisieren
CREATE POLICY "Users can update their own events"
ON events
FOR UPDATE
USING (auth.uid() = user_id);

-- 📌 Nutzer können nur eigene Events löschen
CREATE POLICY "Users can delete their own events"
ON events
FOR DELETE
USING (auth.uid() = user_id);

-- 📌 Nutzer können nur ihre eigenen Events sehen
CREATE POLICY "Users can view their own events"
ON events
FOR SELECT
USING (auth.uid() = user_id);


-- 📌 Nutzer können eigene Event-Bilder hochladen
CREATE POLICY "Users can upload event images"
ON storage.objects
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- 📌 Nutzer können ihre eigenen Event-Bilder löschen
CREATE POLICY "Users can delete their event images"
ON storage.objects
FOR DELETE
USING (auth.uid() IS NOT NULL);

-- 📌 Alle Nutzer können Event-Bilder sehen
CREATE POLICY "Public Read Access for Event Images"
ON storage.objects
FOR SELECT
USING (true);


-- 📌 Nutzer können nur ihre eigenen Profilbilder hochladen
CREATE POLICY "Users can insert profile images"
ON storage.objects
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- 📌 Nutzer können nur ihre eigenen Profilbilder löschen
CREATE POLICY "Users can delete their profile images"
ON storage.objects
FOR DELETE
USING (auth.uid() IS NOT NULL);

-- 📌 Alle Nutzer können Profilbilder sehen (falls öffentlich benötigt)
CREATE POLICY "Public Read Access for Profile Images"
ON storage.objects
FOR SELECT
USING (true);

-- Erlaubt allen authentifizierten Benutzern, Bilder in `event-images` hochzuladen
CREATE POLICY "Allow image upload for authenticated users"
ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'event-images');

CREATE POLICY "Allow authenticated users to insert" ON storage.objects
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);


CREATE POLICY "Users can insert their own events" ON events
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id AND startdate <= enddate);

CREATE POLICY "Users can update their own events" ON events
USING (auth.uid() = user_id AND startdate <= enddate);


CREATE TABLE public.users (
  id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  is_approved boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Trigger-Funktion anlegen
CREATE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger für neue Nutzer aktivieren
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
