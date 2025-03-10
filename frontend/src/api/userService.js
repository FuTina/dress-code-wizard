import { supabase } from '@/lib/supabase'

/**
 * 🔹 Upload profile image to Supabase Storage
 * @param {File} file - The image file
 * @returns {Object} { url, error }
 */
export async function uploadProfileImage(file) {
  if (!file) return { error: 'No file selected' }

  const bucketName = 'profile-images' // 🔹 Bucket name
  const fileName = `profiles/${Date.now()}-${file.name}`

  // 🔹 Upload file to Supabase Storage
  const { data, error } = await supabase.storage
    .from(bucketName)
    .upload(fileName, file, { cacheControl: '3600', upsert: false })

  if (error) {
    console.error('❌ Error uploading profile image:', error.message)
    return { error }
  }

  // 🔹 Retrieve public URL
  const { data: publicURL } = supabase.storage.from(bucketName).getPublicUrl(fileName)
  return { url: publicURL.publicUrl, error: null }
}
