-- Erstellen der Events-Tabelle mit korrekten Spalten
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    date DATE NOT NULL,
    startTime TIME NOT NULL,
    endTime TIME NOT NULL,
    dress_code TEXT,
    description TEXT,
    image_url TEXT,
    created_at TIMESTAMP DEFAULT now()
);

-- Berechtigungen setzen: Nur eingeloggte User können ihre Events verwalten
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can insert their own events"
    ON events FOR INSERT
    WITH CHECK (auth.uid() = user_id);
    
CREATE POLICY "Users can update their own events"
    ON events FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own events"
    ON events FOR DELETE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own events"
    ON events FOR SELECT
    USING (auth.uid() = user_id);
