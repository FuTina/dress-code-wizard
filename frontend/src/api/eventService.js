import { supabase } from '@/lib/supabase'
import { DateTime } from 'luxon'

// 🔹 Fallback-Bilder aus /public/fallback/
const dressCodeImages = {
  elegant: '/fallback/elegant.jpg',
  neverland: '/fallback/neverland.jpg',
  anime: '/fallback/anime.jpg',
  hero: '/fallback/hero.jpg',
  pyjama: '/fallback/pyjama.jpg',
  beach: '/fallback/beach.jpg',
  black: '/fallback/black.jpg',
  futuristic: '/fallback/futuristic.jpg',
  nineties: '/fallback/nineties.jpg',
  default: '/fallback/default.jpg',
}

// 🔹 Benutzer abrufen
const getCurrentUser = async () => {
  const { data } = await supabase.auth.getUser()
  return data?.user || null
}

// 🔹 Bild-Upload zu Supabase Storage
export const uploadEventImage = async (file) => {
  if (!file) return { error: 'No file selected' }

  const fileName = `${Date.now()}-${file.name}`
  console.log('📤 Hochladen zu Supabase:', fileName)

  const { data, error } = await supabase.storage
    .from('event-images')
    .upload(fileName, file, { cacheControl: '3600', upsert: false })

  if (error) {
    console.error('❌ Fehler beim Hochladen in Supabase:', error.message)
    return { error }
  }

  // Öffentliche URL abrufen
  const publicUrl = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/event-images/${fileName}`

  if (!publicUrl.startsWith('http')) {
    console.warn('⚠️ Konnte keine öffentliche URL abrufen – Fallback wird verwendet')
    return { url: '/fallback/default.jpg' }
  }

  console.log('✅ Bild erfolgreich hochgeladen:', publicUrl)
  return { url: publicUrl }
}

// 🔹 Dresscode-Name normalisieren & passendes Fallback-Bild wählen
const getFallbackImage = (dressCode) => {
  if (!dressCode) return dressCodeImages.default
  const normalizedDressCode = dressCode.toLowerCase().trim()

  const match = Object.keys(dressCodeImages).find((key) => normalizedDressCode.includes(key))
  return match ? dressCodeImages[match] : dressCodeImages.default
}

// 🔹 Event erstellen mit Korrektur für `image_url`
export const createEvent = async (eventData, imageFile) => {
  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  let imageUrl = eventData.image_url || ''

  console.log('📸 Ursprüngliche Bild-URL vor dem Upload:', imageUrl)

  if (imageFile) {
    const uploadResult = await uploadEventImage(imageFile)
    if (uploadResult.error) {
      console.error('❌ Bild-Upload fehlgeschlagen:', uploadResult.error)
      return { error: uploadResult.error }
    }
    imageUrl = uploadResult.url
  }

  if (!imageUrl || !imageUrl.startsWith('http')) {
    imageUrl = getFallbackImage(eventData.dress_code)
  }

  console.log('📸 Finale Bild-URL nach Upload:', imageUrl)

  const { data, error } = await supabase
    .from('events')
    .insert([{ ...eventData, user_id: user.id, image_url: imageUrl }])
    .select()

  if (error) {
    console.error('❌ Fehler beim Speichern des Events:', error.message)
    return { error }
  }

  console.log('✅ Event erfolgreich gespeichert mit Bild:', data)
  return { data, error }
}

// 🔹 Events abrufen
export const getEvents = async () => {
  const now = DateTime.now().setZone('Europe/Berlin').startOf('day').toISODate()
  console.log('🗑️ Lösche abgelaufene Events vor:', now)

  await supabase.from('events').delete().lt('date', now)

  const { data, error } = await supabase
    .from('events')
    .select('*')
    .gte('date', now)
    .order('date', { ascending: true })
    .order('startTime', { ascending: true })

  if (error) {
    console.error('❌ Fehler beim Abrufen der Events:', error.message)
    return { data: [], error }
  }

  const updatedData = data.map((event) => ({
    ...event,
    image_url: event.image_url || getFallbackImage(event.dress_code),
  }))

  return { data: updatedData, error }
}

// 🔹 Event abrufen
export const getEventById = async (eventId) => {
  const { data, error } = await supabase.from('events').select('*').eq('id', eventId).single()
  if (error) {
    console.error('❌ Fehler beim Abrufen des Events:', error.message)
  }
  return { data, error }
}

// 🔹 Event aktualisieren
export const updateEvent = async (eventId, updatedData, newImageFile) => {
  let imageUrl = updatedData.image_url

  if (newImageFile) {
    const uploadResult = await uploadEventImage(newImageFile)
    if (uploadResult.error) {
      console.error('❌ Fehler beim Hochladen des neuen Bildes:', uploadResult.error)
      return { error: uploadResult.error }
    }
    imageUrl = uploadResult.url
  }

  if (!imageUrl.startsWith('http')) {
    imageUrl = window.location.origin + imageUrl
  }

  console.log('🔄 Aktualisiere Event mit Bild:', imageUrl)

  const { data, error } = await supabase
    .from('events')
    .update({ ...updatedData, image_url: imageUrl })
    .eq('id', eventId)
    .select()

  if (error) {
    console.error('❌ Fehler beim Aktualisieren des Events:', error.message)
  }

  return { data, error }
}

// 🔹 Event löschen
export const deleteEvent = async (eventId) => {
  const { error } = await supabase.from('events').delete().eq('id', eventId)
  if (error) {
    console.error('❌ Fehler beim Löschen des Events:', error.message)
  }
  return { error }
}

// 🔹 Live-Updates für Events abonnieren
export const subscribeToEvents = (callback) => {
  return supabase
    .channel('events')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, callback)
    .subscribe()
}
