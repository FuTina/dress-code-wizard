import { supabase } from '@/lib/supabase'

/**
 * 🔹 Upload image to Supabase Storage
 * @param {File} file - The image file
 * @param {String} bucket - The storage bucket name
 * @returns {Object} { url, error }
 */
export const uploadImage = async (file, bucket) => {
  if (!file) return { error: 'No file provided' }

  const filePath = `${Date.now()}-${file.name}`
  const { data, error } = await supabase.storage.from(bucket).upload(filePath, file)

  if (error) return { error }

  // Retrieve public URL
  const { data: publicURL } = supabase.storage.from(bucket).getPublicUrl(filePath)
  return { url: publicURL.publicUrl, error: null }
}

/**
 * 🔹 Delete image from Supabase Storage
 * @param {String} bucket - The storage bucket name
 * @param {String} filePath - The full path of the image file
 * @returns {Object} { error }
 */
export const deleteImage = async (bucket, filePath) => {
  if (!filePath) return { error: 'No file path provided' }

  const { error } = await supabase.storage.from(bucket).remove([filePath])

  if (error) {
    console.error('❌ Error deleting image:', error.message)
  }

  return { error }
}
