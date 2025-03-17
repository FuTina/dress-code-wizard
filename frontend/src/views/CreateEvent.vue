<template>
  <div class="max-w-xl mx-auto p-8 bg-white shadow-2xl rounded-3xl">
    <h1 class="text-3xl font-bold text-center text-purple-700 mb-6">🎭 Create an Event</h1>

    <div class="space-y-6">
      <input v-model="event.name" class="input-field" placeholder="✨ Event Name" />

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label class="input-label">📅 Start Date</label>
          <input v-model="event.startdate" type="date" class="input-field" />
        </div>
        <div>
          <label class="input-label">📅 End Date</label>
          <input v-model="event.enddate" type="date" class="input-field" />
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label class="input-label">⏰ Start Time</label>
          <input v-model="event.startTime" type="time" class="input-field" />
        </div>
        <div>
          <label class="input-label">⏰ End Time</label>
          <input v-model="event.endTime" type="time" class="input-field" />
        </div>
      </div>

      <div v-if="errorMessage" class="text-red-500 text-center font-semibold">
        ⚠️ {{ errorMessage }}
      </div>

      <div class="flex flex-col sm:flex-row gap-4">
        <input v-model="event.dress_code" class="input-field" placeholder="👗 Dress Code" />
        <button @click="generateDressCode" class="btn-ai">🪄 AI Suggestion</button>
      </div>

      <button
        v-if="USE_AI"
        @click="generateEventImage"
        class="btn-ai relative"
        :disabled="isGenerating"
      >
        🎨 Generate AI Image
        <span v-if="isGenerating" class="loader absolute right-4 top-2"></span>
      </button>

      <label class="input-label">🖼️ Upload Event Image</label>
      <button @click="triggerFileInput" class="btn-upload">
        {{ imageFile ? imageFile.name : '📂 Choose Image' }}
      </button>
      <input type="file" ref="fileInput" @change="handleFileUpload" hidden />

      <!-- Vorschau-Bereich mit "Preview:" -->
      <div v-if="previewImage" class="mt-4">
        <p class="preview-label">🔍 Preview:</p>
        <img
          :src="previewImage"
          alt="Event Image"
          class="w-full h-52 object-cover rounded-xl shadow-lg"
        />

        <textarea
          v-model="outfitDescription"
          class="input-field resize-none mt-3"
          rows="3"
          placeholder="📝 Describe the outfit..."
        ></textarea>

        <button
          v-if="isSupabaseImage(previewImage)"
          @click="openImageInNewTab(previewImage)"
          class="btn-download"
        >
          ⬇️ View & Download Image
        </button>
      </div>

      <button @click="createEvent" class="btn-save">✅ Save Event</button>
    </div>
  </div>
</template>

<style>
.input-field {
  padding: 12px;
  border: 2px solid #ddd;
  border-radius: 12px;
  outline: none;
  transition:
    border 0.2s,
    box-shadow 0.2s;
  width: 100%;
}
.input-field:focus {
  border-color: #9f7aea;
  box-shadow: 0 0 10px rgba(159, 122, 234, 0.4);
}
.input-label {
  font-weight: 600;
  color: #6b46c1;
  margin-bottom: 6px;
  display: block;
}
.btn-ai,
.btn-upload,
.btn-save,
.btn-download {
  width: 100%;
  padding: 12px;
  font-weight: 600;
  border-radius: 12px;
  transition: all 0.3s;
}
.btn-ai {
  background: #d6bcfa;
  color: #553c9a;
}
.btn-ai:hover {
  background: #b794f4;
}
.btn-upload {
  background: #b794f4;
  color: white;
}
.btn-upload:hover {
  background: #9f7aea;
}
.btn-save {
  background: #805ad5;
  color: white;
}
.btn-save:hover {
  background: #6b46c1;
}
.btn-download {
  background: #d6bcfa;
  color: #553c9a;
  margin-top: 8px;
}
.btn-download:hover {
  background: #b794f4;
}
.loader {
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top: 3px solid #805ad5;
  border-radius: 50%;
  width: 16px;
  height: 16px;
  animation: spin 1s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
.preview-label {
  font-weight: bold;
  font-size: 16px;
  color: #6b46c1;
  text-align: center;
  margin-bottom: 8px;
}
</style>

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
        startdate: this.getTodayDate(),
        enddate: this.getTodayDate(),
        startTime: this.getNextFullHour(),
        endTime: this.getNextFullHourPlusOne(),
        dress_code: '',
      },
      imageFile: null,
      previewImage: getFallbackImage('default'),
      isGenerating: false,
      USE_AI,
      outfitDescription: getFallbackDescription('default'),
      errorMessage: '',
    }
  },

  watch: {
    'event.startdate'(newDate) {
      this.event.enddate = newDate
    },
    'event.startTime'(newTime) {
      const [hours, minutes] = newTime.split(':').map(Number)
      const endTime = new Date()
      endTime.setHours(hours)
      endTime.setMinutes(minutes + 60) // Endzeit 1 Stunde später setzen
      this.event.endTime = endTime.toTimeString().substring(0, 5)
    },
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
    validateDates() {
      const start = new Date(`${this.event.startdate}T${this.event.startTime}`)
      const end = new Date(`${this.event.enddate}T${this.event.endTime}`)

      if (end < start) {
        this.errorMessage = '⚠️ End date/time cannot be before start date/time!'
        return false
      }
      if (this.event.endTime === '00:00' && this.event.startdate === this.event.enddate) {
        this.errorMessage = '⚠️ Events cannot end exactly at midnight!'
        return false
      }
      this.errorMessage = ''
      return true
    },
    async createEvent() {
      if (!this.validateDates()) return

      if (
        !this.event.name ||
        !this.event.startdate ||
        !this.event.enddate ||
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
        name: this.event.name,
        startdate: this.event.startdate,
        enddate: this.event.enddate,
        startTime: `${this.event.startTime}:00`,
        endTime: `${this.event.endTime}:00`,
        dress_code: this.event.dress_code,
        image_url: imageUrl,
        description: this.outfitDescription.trim(),
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
    async generateEventImage() {
      if (!this.event.dress_code) {
        alert('❌ Please enter a dress code first!')
        return
      }

      this.isGenerating = true

      try {
        if (USE_AI) {
          const { imageUrl } = await generateEventImage(this.event.dress_code, (loading) => {
            this.isGenerating = loading
          })

          this.previewImage = imageUrl || getFallbackImage(this.event.dress_code)
          this.outfitDescription = await generateOutfitDescription(this.event.dress_code)
        } else {
          this.setFallbackImageAndDescription()
        }
      } catch (error) {
        console.error('❌ AI Image Generation Error:', error)
        this.setFallbackImageAndDescription()
      } finally {
        this.isGenerating = false
      }
    },
    setFallbackImageAndDescription() {
      this.previewImage =
        getFallbackImage(this.event.dress_code?.trim().toLowerCase()) || getFallbackImage('default')
      this.outfitDescription =
        getFallbackDescription(this.event.dress_code?.trim().toLowerCase()) ||
        getFallbackDescription('default')
    },
    triggerFileInput() {
      this.$refs.fileInput.click()
    },
    handleFileUpload(event) {
      this.imageFile = event.target.files[0]
      this.previewImage =
        URL.createObjectURL(this.imageFile) || getFallbackImage(this.event.dress_code)
    },
    async generateOutfitDescription() {
      if (!this.event.dress_code) return
      this.outfitDescription = await generateOutfitDescription(this.event.dress_code)
    },
  },
}
</script>
