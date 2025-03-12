-- 📌 Events-Tabelle mit Bildern
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    date DATE NOT NULL,
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


