import { supabase } from '@/lib/supabase'
import { DateTime } from 'luxon'
import { getFallbackImage, getFallbackDescription } from '@/api/aiService'

// Fallback images from /public/fallback/
// const dressCodeImages = {
//   elegant: '/fallback/elegant.png',
//   neverland: '/fallback/neverland.png',
//   anime: '/fallback/anime.png',
//   hero: '/fallback/hero.png',
//   pyjama: '/fallback/pyjama.png',
//   beach: '/fallback/beach.png',
//   black: '/fallback/black.png',
//   futuristic: '/fallback/futuristic.png',
//   nineties: '/fallback/nineties.png',
//   default: '/fallback/default0.jpg',
// }

// Get current user
const getCurrentUser = async () => {
  const { data } = await supabase.auth.getUser()
  return data?.user || null
}

// Create event
export const createEvent = async (eventData, imageFile) => {
  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  let imageUrl = eventData.image_url || ''

  if (imageFile) {
    const uploadResult = await uploadEventImage(imageFile)
    if (uploadResult.error) return { error: uploadResult.error }
    imageUrl = uploadResult.url
  }

  // Set a fallback image if no image was uploaded
  if (!imageUrl || !imageUrl.startsWith('http')) {
    console.warn('⚠️ Kein gültiges Eventbild - verwende Fallback')
    imageUrl = getFallbackImage(eventData.dress_code)
  }

  console.log('Final image URL:', imageUrl)

  // 🔹 Setze ebenfalls eine Fallback-Beschreibung, falls keine existiert
  const eventDescription =
    eventData.description?.trim() || getFallbackDescription(eventData.dress_code)

  console.log('Event description:', eventDescription)
  console.log('🖼️ Final event image:', imageUrl)

  const { data, error } = await supabase
    .from('events')
    .insert([
      {
        ...eventData,
        user_id: user.id,
        image_url: imageUrl,
        description: eventDescription,
      },
    ])
    .select()

  if (error) {
    console.error('Error saving event:', error.message)
    return { error }
  }

  console.log('Event saved successfully with image:', data)

  return { data, error }
}

// Get events with fallback images and filtering
export const getEvents = async () => {
  const now = DateTime.now().setZone('Europe/Berlin').startOf('day').toISODate()
  console.log('Delete expired events before:', now)

  // Delete events whose end date has already passed
  await supabase.from('events').delete().lt('enddate', now)

  const { data, error } = await supabase
    .from('events')
    .select('id, name, startdate, enddate, startTime, endTime, dress_code, description, image_url')
    // .select('*')
    .gte('startdate', now)
    .order('startdate', { ascending: true })
    .order('startTime', { ascending: true })

  if (error) {
    console.error('Error retrieving events:', error.message)
    return { data: [], error }
  }

  return {
    data: data.map((event) => ({
      ...event,
      image_url: event.image_url || getFallbackImage(event.dress_code),
    })),
    error,
  }
}

// Update event
export const updateEvent = async (eventId, updatedData, newImageFile) => {
  let imageUrl = updatedData.image_url

  if (newImageFile) {
    const uploadResult = await uploadEventImage(newImageFile)
    if (uploadResult.error) return { error: uploadResult.error }
    imageUrl = uploadResult.url
  }

  if (!imageUrl.startsWith('http')) {
    imageUrl = window.location.origin + imageUrl
  }

  console.log('Update event with image:', imageUrl)

  const { data, error } = await supabase
    .from('events')
    .update({ ...updatedData, image_url: imageUrl })
    .eq('id', eventId)
    .select()

  if (error) console.error('Error updating event:', error.message)

  return { data, error }
}

// Upload image to Supabase storage
export const uploadEventImage = async (file) => {
  if (!file) return { error: 'No file selected' }

  const fileName = `${Date.now()}-${file.name}`
  console.log('Uploading to Supabase:', fileName)

  const { data, error } = await supabase.storage
    .from('event-images')
    .upload(fileName, file, { cacheControl: '3600', upsert: false })

  if (error) {
    console.error('Error uploading to Supabase:', error.message)
    return { error }
  }

  // Get public URL
  const publicUrl = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/event-images/${fileName}`

  if (!publicUrl.startsWith('http')) {
    console.warn('Could not retrieve public URL - fallback will be used')
    return { url: '/fallback/default0.jpg' }
  }

  console.log('Image uploaded successfully:', publicUrl)
  return { url: publicUrl }
}

// Normalize dress code name and choose a fallback image
// const getFallbackImage = (dressCode) => {
//   if (!dressCode) return dressCodeImages.default
//   const normalizedDressCode = dressCode.toLowerCase().trim()

//   const match = Object.keys(dressCodeImages).find((key) => normalizedDressCode.includes(key))
//   return match ? dressCodeImages[match] : dressCodeImages.default
// }

// Get event by ID
export const getEventById = async (eventId) => {
  const { data, error } = await supabase.from('events').select('*').eq('id', eventId).single()
  if (error) {
    console.error('Error retrieving event:', error.message)
  }
  return { data, error }
}

// Delete event
export const deleteEvent = async (eventId) => {
  const { error } = await supabase.from('events').delete().eq('id', eventId)
  if (error) {
    console.error('Error deleting event:', error.message)
  }
  return { error }
}

// Subscribe to live updates for events
export const subscribeToEvents = (callback) => {
  return supabase
    .channel('events')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, callback)
    .subscribe()
}
