<template>
  <div class="max-w-md mx-auto p-6 bg-white shadow-lg rounded-lg">
    <h1 class="text-xl font-bold text-center text-purple-700">🎭 Create an Event</h1>

    <input v-model="event.name" class="w-full p-3 border rounded mb-2" placeholder="Event Name" />

    <label>Date:</label>
    <input v-model="event.date" type="date" class="w-full p-3 border rounded mb-2" />

    <label>Start Time:</label>
    <input v-model="event.startTime" type="time" class="w-full p-3 border rounded mb-2" />

    <label>End Time:</label>
    <input v-model="event.endTime" type="time" class="w-full p-3 border rounded mb-2" />

    <label>Dress Code:</label>
    <div class="flex gap-2">
      <input
        v-model="event.dress_code"
        class="w-full p-3 border rounded mt-2"
        placeholder="Dress Code"
      />
      <button
        @click="generateDressCode"
        class="bg-blue-500 text-white px-3 py-2 rounded hover:bg-blue-700 transition"
      >
        🪄 AI Suggestion
      </button>
    </div>

    <!-- AI Image Generator (Nur aktiv, wenn AI genutzt wird) -->
    <button
      v-if="USE_AI"
      @click="generateEventImage"
      class="mt-2 bg-indigo-500 text-white px-4 py-2 rounded hover:bg-indigo-700 transition"
      :disabled="isGenerating"
    >
      🎨 Generate AI Image
    </button>

    <!-- Hinweis, wenn AI deaktiviert ist -->
    <p v-else class="mt-2 text-sm text-gray-600">⚠️ AI Image Generation is currently disabled.</p>

    <!-- 🔄 Loading Spinner (Wird nur bei AI-Aktivität angezeigt) -->
    <div v-if="isGenerating" class="mt-4 text-center">
      <div class="loader-container">
        <span class="loader"></span>
      </div>
      <p class="text-gray-600 text-sm mt-2">Generating image...</p>
    </div>

    <!-- Image Upload -->
    <label class="block mt-4">Upload Event Image:</label>
    <input type="file" @change="handleFileUpload" class="w-full p-2 border rounded mb-2" />

    <!-- Image Preview -->
    <div v-if="previewImage" class="mt-4">
      <p class="text-gray-600 text-sm">Image Preview:</p>
      <img
        :src="previewImage"
        alt="Event Image"
        class="w-full h-40 object-cover rounded shadow-md"
      />
    </div>

    <button
      @click="createEvent"
      class="mt-4 bg-purple-600 text-white px-4 py-2 w-full rounded hover:bg-purple-800 transition"
    >
      ✅ Save Event
    </button>
  </div>
</template>

<script>
import { createEvent } from '@/api/eventService'
import { getDressCodeSuggestion, generateEventImage, USE_AI } from '@/api/aiService' // 🔹 `USE_AI` importiert
import { uploadImage } from '@/api/storageService'

export default {
  data() {
    return {
      event: { name: '', date: '', startTime: '19:00', endTime: '20:00', dress_code: '' },
      imageFile: null,
      previewImage: null,
      isGenerating: false,
      USE_AI, // 🔹 AI-Nutzung in die Daten einfügen
      fallbackImages: {
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
      },
    }
  },
  methods: {
    async generateDressCode() {
      this.event.dress_code = await getDressCodeSuggestion()
      this.previewImage = this.getFallbackImage(this.event.dress_code) // 🔹 Fallback sofort setzen
    },
    async generateEventImage() {
      if (!this.event.dress_code) {
        alert('❌ Please enter a dress code first!')
        return
      }

      if (!this.USE_AI) {
        alert('⚠️ AI image generation is currently disabled.')
        this.previewImage = this.getFallbackImage(this.event.dress_code)
        return
      }

      this.isGenerating = true
      try {
        const { imageUrl, error } = await generateEventImage(this.event.dress_code, (loading) => {
          this.isGenerating = loading
        })

        console.log('🖼️ AI-Generiertes Bild:', imageUrl)

        if (error || !imageUrl) {
          console.warn('⚠️ AI Image generation failed. Using fallback image.')
          this.previewImage = this.getFallbackImage(this.event.dress_code)
        } else {
          this.previewImage = imageUrl
          console.log('✅ Image successfully loaded:', imageUrl)
        }
      } catch (error) {
        console.error('❌ AI Image Generation Error:', error)
        this.previewImage = this.getFallbackImage(this.event.dress_code)
      }
    },

    handleFileUpload(event) {
      this.imageFile = event.target.files[0]
      this.previewImage = URL.createObjectURL(this.imageFile)
    },

    getFallbackImage(dressCode) {
      if (!dressCode) return this.fallbackImages.default
      const normalizedDressCode = dressCode.toLowerCase().trim()
      return (
        Object.entries(this.fallbackImages).find(([key]) =>
          normalizedDressCode.includes(key),
        )?.[1] || this.fallbackImages.default
      )
    },

    async createEvent() {
      if (
        !this.event.name ||
        !this.event.date ||
        !this.event.startTime ||
        !this.event.endTime ||
        !this.event.dress_code
      ) {
        alert('❌ Please fill out all fields before saving!')
        return
      }

      let imageUrl = this.previewImage

      if (this.imageFile) {
        try {
          const { url, error } = await uploadImage(this.imageFile, 'event-images')
          if (error) throw new Error(error.message)
          imageUrl = url
        } catch (error) {
          console.error('❌ Error uploading image:', error)
          imageUrl = this.getFallbackImage(this.event.dress_code)
        }
      }

      // 🔹 Stelle sicher, dass ein Bild existiert
      if (!imageUrl || imageUrl.startsWith('/fallback/')) {
        imageUrl = this.getFallbackImage(this.event.dress_code)
      }

      console.log('📸 Final Image URL before saving:', imageUrl)

      try {
        const { data, error } = await createEvent({
          ...this.event,
          startTime: `${this.event.startTime}:00`,
          endTime: `${this.event.endTime}:00`,
          image_url: imageUrl,
        })

        if (error) {
          console.error('❌ Error saving event:', error)
        } else {
          alert('✅ Event saved!')
          console.log('📅 Event Data:', data)
          this.$router.push('/dashboard')
        }
      } catch (error) {
        console.error('❌ Error creating event:', error)
      }
    },
  },
}
</script>

<style>
/* 🔄 Enlarged CSS Loader */
.loader-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 50px;
}

.loader {
  border: 6px solid rgba(0, 0, 0, 0.1);
  border-left-color: #6366f1;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
