import { supabase } from '@/lib/supabase';
import { DateTime } from 'luxon';

// 🔹 Fallback-Bilder aus /public/fallback/
const dressCodeImages = {
  elegant: '/fallback/elegant.jpg',
  neverland: '/fallback/neverland.jpg',
  anime: '/fallback/anime.jpg',
  hero: '/fallback/hero.jpg',
  pyjama: '/fallback/pyjama.jpg',
  default: '/fallback/default.jpg',
};

// 🔹 Benutzer abrufen
const getCurrentUser = async () => {
  const { data } = await supabase.auth.getUser();
  return data?.user || null;
};

// 🔹 Bild-Upload zu Supabase Storage
export const uploadEventImage = async (file) => {
  if (!file) return { error: 'No file selected' };

  const fileName = `${Date.now()}-${file.name}`;
  const { data, error } = await supabase.storage
    .from('event-images')
    .upload(fileName, file, { cacheControl: '3600', upsert: false });

  if (error) return { error };

  // Hole öffentliche URL
  const { publicUrl } = supabase.storage.from('event-images').getPublicUrl(fileName);
  return { url: publicUrl };
};

// 🔹 Event erstellen mit Fallback-Bild
export const createEvent = async (eventData, imageFile) => {
  const user = await getCurrentUser();
  if (!user) return { error: 'Not authenticated' };

  let imageUrl = '';

  if (imageFile) {
    const uploadResult = await uploadEventImage(imageFile);
    if (uploadResult.error) return { error: uploadResult.error };
    imageUrl = uploadResult.url;
  } else {
    // Dresscode normalisieren und passendes Fallback-Bild setzen
    const normalizedDressCode = eventData.dress_code?.toLowerCase().trim();
    imageUrl = Object.keys(dressCodeImages).find((key) =>
      normalizedDressCode.includes(key)
    )
      ? dressCodeImages[normalizedDressCode]
      : dressCodeImages.default;
  }

  const { data, error } = await supabase
    .from('events')
    .insert([{ ...eventData, user_id: user.id, image_url: imageUrl }]);

  return { data, error };
};

// 🔹 Events laden & nach Datum + Zeit sortieren
export const getEvents = async () => {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .order('date', { ascending: true })
    .order('startTime', { ascending: true });

  if (!data) return { data: [], error };

  // Fallback-Bilder für fehlende `image_url` setzen
  const updatedData = data.map((event) => ({
    ...event,
    image_url:
      event.image_url ||
      Object.keys(dressCodeImages).find((key) =>
        event.dress_code?.toLowerCase().includes(key)
      )
        ? dressCodeImages[event.dress_code?.toLowerCase()]
        : dressCodeImages.default,
  }));

  return { data: updatedData, error };
};

// 🔹 Event abrufen
export const getEventById = async (eventId) => {
  const { data, error } = await supabase.from('events').select('*').eq('id', eventId).single();
  return { data, error };
};

// 🔹 Event aktualisieren
export const updateEvent = async (eventId, updatedData, newImageFile) => {
  let imageUrl = updatedData.image_url;

  if (newImageFile) {
    const uploadResult = await uploadEventImage(newImageFile);
    if (uploadResult.error) return { error: uploadResult.error };
    imageUrl = uploadResult.url;
  }

  const { data, error } = await supabase
    .from('events')
    .update({ ...updatedData, image_url: imageUrl })
    .eq('id', eventId);

  return { data, error };
};

// 🔹 Event löschen
export const deleteEvent = async (eventId) => {
  const { error } = await supabase.from('events').delete().eq('id', eventId);
  return { error };
};

// 🔹 Live-Updates für Events abonnieren
export const subscribeToEvents = (callback) => {
  return supabase
    .channel('events')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, callback)
    .subscribe();
};
