import { supabase } from '@/lib/supabase'

/**
 * 🔹 Upload profile image to Supabase Storage
 * @param {File} file - The image file
 * @returns {Object} { url, error }
 */
export async function uploadProfileImage(file) {
  if (!file) return { error: 'No file selected' }

  const bucketName = 'profile-images'
  const filePath = `profiles/${Date.now()}-${file.name}`

  // 📤 Datei hochladen
  const { data, error: uploadError } = await supabase.storage
    .from(bucketName)
    .upload(filePath, file, { cacheControl: '3600', upsert: false })

  if (uploadError) {
    console.error('❌ Error uploading profile image:', uploadError.message)
    return { error: uploadError }
  }

  // 🔹 Public URL manuell korrekt generieren
  const publicUrl = `https://jtsrmmuvvmnmwhovfjlt.supabase.co/storage/v1/object/public/${bucketName}/${filePath}`

  console.log('✅ Profile Image Uploaded:', publicUrl)
  return { url: publicUrl, error: null }
}

/**
 * 🔹 Delete profile image from Supabase Storage
 * @param {string} imageUrl - The full image URL
 * @returns {Object} { error }
 */
export async function deleteProfileImage(imageUrl) {
  if (!imageUrl) return { error: 'No image URL provided' }

  const bucketName = 'profile-images'
  const filePath = imageUrl.split(`${bucketName}/`)[1] // 🔥 Extrahiert den korrekten Dateipfad

  if (!filePath) {
    console.error('❌ Invalid file path:', imageUrl)
    return { error: 'Invalid file path' }
  }

  // 📌 Datei aus Supabase Storage löschen
  const { error } = await supabase.storage.from(bucketName).remove([filePath])

  if (error) {
    console.error('❌ Error deleting profile image:', error.message)
    return { error }
  }

  console.log('✅ Profile Image Deleted:', filePath)
  return { error: null }
}
