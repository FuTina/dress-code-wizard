import { supabase } from '@/lib/supabase'
import { DateTime } from 'luxon'
import { getFallbackImage, getFallbackDescription } from '@/api/aiService'

// Get current user
const getCurrentUser = async () => {
  const { data } = await supabase.auth.getUser()
  return data?.user || null
}

export const createEvent = async (eventData, imageFile) => {
  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  let imageUrl = eventData.image_url || ''

  if (imageFile) {
    const uploadResult = await uploadEventImage(imageFile)
    if (uploadResult.error) return { error: uploadResult.error }
    imageUrl = uploadResult.url
  }

  if (!imageUrl.startsWith('http')) {
    console.warn('⚠️ Invalid event image - using fallback')
    imageUrl = getFallbackImage(eventData.dress_code)
  }

  console.log('Final image URL:', imageUrl)

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

  return { data, error }
}

export const getEvents = async () => {
  const now = DateTime.now().setZone('Europe/Berlin').startOf('day').toISODate()

  await supabase.from('events').delete().lt('enddate', now)

  const { data, error } = await supabase
    .from('events')
    .select('id, name, startdate, enddate, startTime, endTime, dress_code, description, image_url')
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

  const publicUrl = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/event-images/${fileName}`

  return { url: publicUrl.startsWith('http') ? publicUrl : '/fallback/default0.jpg' }
}

export const getEventById = async (eventId) => {
  const { data, error } = await supabase.from('events').select('*').eq('id', eventId).single()
  if (error) {
    console.error('Error retrieving event:', error.message)
  }
  return { data, error }
}

export const deleteEvent = async (eventId) => {
  const { error } = await supabase.from('events').delete().eq('id', eventId)
  if (error) {
    console.error('Error deleting event:', error.message)
  }
  return { error }
}

export const subscribeToEvents = (callback) => {
  return supabase
    .channel('events')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, callback)
    .subscribe()
}
