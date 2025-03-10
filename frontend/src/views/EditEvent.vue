<template>
  <div class="max-w-md mx-auto p-6 bg-white shadow-lg rounded-lg">
    <h1 class="text-xl font-bold text-center text-purple-700">✏️ Edit Event</h1>

    <input v-model="eventName" class="w-full p-3 border rounded mb-2" placeholder="Event Name" />

    <label>Date:</label>
    <input v-model="eventDate" type="date" class="w-full p-3 border rounded mb-2" />

    <label>Start Time:</label>
    <input v-model="eventStartTime" type="time" class="w-full p-3 border rounded mb-2" />

    <label>End Time:</label>
    <input v-model="eventEndTime" type="time" class="w-full p-3 border rounded mb-2" />

    <label>Dress Code:</label>
    <input v-model="dressCode" class="w-full p-3 border rounded mt-2" placeholder="Dress Code" />

    <!-- 🖼 Current Event Image -->
    <div v-if="eventImage" class="mt-4">
      <p class="text-gray-600 text-sm">Current Image:</p>
      <img
        :src="eventImage || getFallbackImage(dressCode)"
        alt="Event Image"
        class="w-full h-40 object-cover rounded shadow-md"
      />

      <button
        @click="deleteCurrentImage"
        class="mt-2 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-700 transition"
      >
        ❌ Delete Image
      </button>
    </div>

    <!-- 📂 File Upload -->
    <label class="block mt-4">Upload New Image:</label>
    <input type="file" @change="handleFileUpload" class="w-full p-2 border rounded mb-2" />

    <button
      @click="updateEvent"
      class="mt-4 bg-green-600 text-white px-4 py-2 w-full rounded hover:bg-green-800"
    >
      ✅ Save Changes
    </button>
  </div>
</template>

<script>
import { supabase } from '@/lib/supabase'
import { uploadImage, deleteImage } from '@/api/storageService'

export default {
  data() {
    return {
      eventId: null,
      eventName: '',
      eventDate: '',
      eventStartTime: '19:00',
      eventEndTime: '20:00',
      dressCode: '',
      eventImage: null,
      newImageFile: null,
      fallbackImages: {
        elegant: '/fallback/elegant.jpg',
        neverland: '/fallback/neverland.jpg',
        anime: '/fallback/anime.jpg',
        hero: '/fallback/hero.jpg',
        pyjama: '/fallback/pyjama.jpg',
      },
    }
  },
  async mounted() {
    this.eventId = this.$route.params.id
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('id', this.eventId)
      .single()

    if (error || !data) {
      alert('❌ Event not found!')
      this.$router.push('/dashboard')
      return
    }

    // ✅ Datum richtig formatieren
    this.eventName = data.name
    this.eventDate = data.date.split('T')[0] // Nur `YYYY-MM-DD`
    this.eventStartTime = data.startTime.substring(0, 5) // `HH:MM`
    this.eventEndTime = data.endTime.substring(0, 5)
    this.dressCode = data.dress_code
    this.eventImage = data.image_url
  },
  methods: {
    handleFileUpload(event) {
      this.newImageFile = event.target.files[0]
    },

    getFallbackImage(dressCode) {
      return this.fallbackImages[dressCode.toLowerCase()] || '/fallback/default.jpg'
    },

    async deleteCurrentImage() {
      if (!this.eventImage) {
        alert('❌ No image to delete.')
        return
      }

      const imagePath = this.eventImage.split('/').pop() // Extract filename
      const { error } = await deleteImage('event-images', imagePath)

      if (error) {
        alert('❌ Error deleting image: ' + error.message)
      } else {
        alert('✅ Image deleted!')
        this.eventImage = null

        // 🔹 Entferne Bild-Referenz in der Datenbank
        await supabase.from('events').update({ image_url: null }).eq('id', this.eventId)
      }
    },

    async updateEvent() {
      let imageUrl = this.eventImage

      if (this.newImageFile) {
        const { url, error } = await uploadImage(this.newImageFile, 'event-images')
        if (error) {
          alert('❌ Error uploading event image: ' + error.message)
          return
        }
        imageUrl = url
      }

      const { error } = await supabase
        .from('events')
        .update({
          name: this.eventName,
          date: this.eventDate,
          startTime: this.eventStartTime,
          endTime: this.eventEndTime,
          dress_code: this.dressCode,
          image_url: imageUrl,
        })
        .eq('id', this.eventId)

      if (error) {
        alert('❌ Error updating event: ' + error.message)
      } else {
        alert('✅ Event updated!')
        this.$router.push('/dashboard')
      }
    },
  },
}
</script>
