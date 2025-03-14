<template>
  <div class="max-w-lg mx-auto p-6 bg-white shadow-xl rounded-xl">
    <h1 class="text-2xl font-bold text-center text-purple-700 mb-4">🎭 Create an Event</h1>

    <div class="space-y-4">
      <input v-model="event.name" class="input-field" placeholder="Event Name" />

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <input v-model="event.date" type="date" class="input-field" />
        <input v-model="event.startTime" type="time" class="input-field" />
        <input v-model="event.endTime" type="time" class="input-field" />
      </div>

      <div class="flex gap-2">
        <input v-model="event.dress_code" class="input-field w-full" placeholder="Dress Code" />
        <button @click="generateDressCode" class="highlighted-button">🪄 AI Suggestion</button>
      </div>

      <button
        v-if="USE_AI"
        @click="generateEventImage"
        class="highlighted-button w-full relative"
        :disabled="isGenerating"
      >
        🎨 Generate AI Image
        <span v-if="isGenerating" class="loader absolute right-4 top-2"></span>
      </button>

      <p v-else class="text-sm text-gray-500 text-center">⚠️ AI Image Generation is disabled.</p>

      <div v-if="isGenerating" class="flex flex-col items-center mt-2">
        <div class="loader-large"></div>
        <p class="text-gray-600 text-sm mt-2">Generating AI image, please wait...</p>
      </div>

      <!-- 🔹 Moderner Datei-Upload -->
      <label class="block text-gray-700">Upload Event Image:</label>
      <div class="file-upload-container">
        <button @click="triggerFileInput" class="file-upload-button">
          <i class="fas fa-folder-open"></i>
          {{ imageFile ? imageFile.name : 'Choose File' }}
        </button>
        <input type="file" ref="fileInput" @change="handleFileUpload" class="hidden" />
      </div>

      <div v-if="previewImage" class="mt-4 text-center">
        <p class="text-gray-500 text-sm">Image Preview:</p>
        <img
          :src="previewImage"
          alt="Event Image"
          class="w-full h-48 object-cover rounded-lg shadow-md transition hover:scale-105"
        />

        <!-- ✨ Editierbare Beschreibung -->
        <textarea
          v-model="outfitDescription"
          class="input-field mt-2 w-full resize-none"
          rows="3"
          placeholder="Describe the outfit suggestion..."
        ></textarea>

        <button
          v-if="isSupabaseImage(previewImage)"
          @click="openImageInNewTab(previewImage)"
          class="download-button"
        >
          ⬇️ View & Download Image
        </button>
      </div>

      <button @click="createEvent" class="submit-button w-full">✅ Save Event</button>
    </div>
  </div>
</template>

<script>
import { createEvent } from '@/api/eventService'
import {
  getDressCodeSuggestion,
  generateEventImage,
  generateOutfitDescription,
  getFallbackImage,
  getFallbackDescription,
  USE_AI,
} from '@/api/aiService'
import { uploadImage } from '@/api/storageService'

export default {
  data() {
    return {
      event: {
        name: '',
        date: this.getTodayDate(),
        startTime: this.getNextFullHour(),
        endTime: this.getNextFullHourPlusOne(),
        dress_code: '',
      },
      imageFile: null,
      previewImage: getFallbackImage('default'),
      isGenerating: false,
      USE_AI,
      outfitDescription: '',
    }
  },
  methods: {
    getTodayDate() {
      return new Date().toISOString().split('T')[0]
    },
    getNextFullHour() {
      const date = new Date()
      date.setMinutes(0, 0, 0)
      date.setHours(date.getHours() + 1)
      return date.toTimeString().substring(0, 5)
    },
    getNextFullHourPlusOne() {
      const date = new Date()
      date.setMinutes(0, 0, 0)
      date.setHours(date.getHours() + 2)
      return date.toTimeString().substring(0, 5)
    },
    async generateDressCode() {
      this.event.dress_code = await getDressCodeSuggestion()
    },

    async generateEventImage() {
      if (!this.event.dress_code) {
        alert('❌ Please enter a dress code first!')
        return
      }

      this.isGenerating = true

      try {
        if (USE_AI) {
          const { imageUrl, error } = await generateEventImage(this.event.dress_code, (loading) => {
            this.isGenerating = loading
          })

          this.previewImage = imageUrl || getFallbackImage(this.event.dress_code)
          this.outfitDescription = await generateOutfitDescription(this.event.dress_code)
        } else {
          console.warn('⚠️ AI disabled - using fallback')

          // **Sicherstellen, dass Fallback-Bild und -Text korrekt gesetzt werden**
          if (!this.previewImage || this.previewImage === getFallbackImage('default')) {
            this.previewImage = getFallbackImage(
              this.event.dress_code?.trim().toLowerCase() || 'default',
            )
            console.log('🖼️ Fallback Image:', this.previewImage)
          }

          if (!this.outfitDescription) {
            this.outfitDescription = getFallbackDescription(this.event.dress_code || 'default')
          }
        }
      } catch (error) {
        console.error('❌ AI Image Generation Error:', error)

        if (!this.previewImage || this.previewImage === getFallbackImage('default')) {
          this.previewImage = getFallbackImage(
            this.event.dress_code?.trim().toLowerCase() || 'default',
          )
          console.log('🖼️ Fallback Image (Error Handling):', this.previewImage)
        }

        if (!this.outfitDescription) {
          this.outfitDescription = getFallbackDescription(this.event.dress_code || 'default')
        }
      } finally {
        this.isGenerating = false
      }
    },
    triggerFileInput() {
      this.$refs.fileInput.click()
    },
    handleFileUpload(event) {
      this.imageFile = event.target.files[0]
      this.previewImage = URL.createObjectURL(this.imageFile)
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
        const { url } = await uploadImage(this.imageFile, 'event-images')
        imageUrl = url
      }
      await createEvent({
        ...this.event,
        startTime: `${this.event.startTime}:00`,
        endTime: `${this.event.endTime}:00`,
        image_url: imageUrl,
        description: this.outfitDescription.trim(), // Speichert die bearbeitete Beschreibung
      })
      alert('✅ Event saved!')
      this.$router.push('/dashboard')
    },
    isSupabaseImage(url) {
      return url.includes('supabase.co/storage')
    },
    openImageInNewTab(url) {
      window.open(url, '_blank')
    },
    async generateOutfitDescription() {
      if (!this.event.dress_code) return
      this.outfitDescription = await generateOutfitDescription(this.event.dress_code)
    },
  },
}
</script>

<style>
.input-field {
  padding: 12px;
  border: 2px solid #ddd;
  border-radius: 10px;
  outline: none;
  transition:
    border 0.2s ease-in-out,
    box-shadow 0.2s ease-in-out;
}

.input-field:focus {
  border-color: #7e57c2;
  box-shadow: 0 0 5px rgba(126, 87, 194, 0.4);
}

/* 🔹 AI-Buttons (Helllila Hintergrund) */
.highlighted-button {
  background-color: #e0c3fc;
  color: #4a148c;
  padding: 12px;
  border-radius: 10px;
  font-size: 16px;
  font-weight: bold;
  text-align: center;
  transition: background 0.3s ease-in-out;
  cursor: pointer;
}

.highlighted-button:hover {
  background-color: #d1b3f4;
}

/* 🔹 Moderner Datei-Upload */
.file-upload-container {
  width: 100%;
  display: flex;
  justify-content: center;
}

.file-upload-button {
  width: 100%;
  background-color: #7e57c2;
  color: white;
  padding: 12px;
  border-radius: 10px;
  font-size: 16px;
  text-align: center;
  transition: background 0.3s ease-in-out;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.file-upload-button:hover {
  background-color: #6a4fb3;
}

.submit-button:hover {
  transform: scale(1.05);
}

.download-button {
  background-color: #c3b1e1;
  /* Dezentes Lila */
  color: white;
  padding: 8px;
  border-radius: 8px;
  font-size: 14px;
  margin-top: 10px;
  cursor: pointer;
  transition: background 0.3s;
}

.download-button:hover {
  background-color: #a38cc6;
  /* Etwas dunkler bei Hover */
}
</style>
