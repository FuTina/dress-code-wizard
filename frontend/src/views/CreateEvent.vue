<template>
  <div class="max-w-lg mx-auto p-6 bg-white shadow-lg rounded-lg">
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
        <button @click="generateDressCode" class="action-button">🪄 AI Suggestion</button>
      </div>

      <button v-if="USE_AI" @click="generateEventImage" class="action-button w-full relative" :disabled="isGenerating">
        🎨 Generate AI Image
        <span v-if="isGenerating" class="loader absolute right-4 top-2"></span>
      </button>

      <p v-else class="text-sm text-gray-500 text-center">⚠️ AI Image Generation is disabled.</p>

      <div v-if="isGenerating" class="flex flex-col items-center mt-2">
        <div class="loader-large"></div>
        <p class="text-gray-600 text-sm mt-2">Generating AI image, please wait...</p>
      </div>

      <label class="block text-gray-700">Upload Event Image:</label>
      <input type="file" @change="handleFileUpload" class="input-field" />

      <div v-if="previewImage" class="mt-4 text-center">
        <p class="text-gray-500 text-sm">Image Preview:</p>
        <img :src="previewImage" alt="Event Image"
          class="w-full h-48 object-cover rounded-lg shadow-md transition hover:scale-105" />
        <button v-if="isSupabaseImage(previewImage)" @click="openImageInNewTab(previewImage)" class="download-button">
          ⬇️ View & Download Image
        </button>
      </div>

      <button @click="createEvent" class="submit-button w-full">✅ Save Event</button>
    </div>
  </div>
</template>

<script>
import { createEvent } from '@/api/eventService'
import { getDressCodeSuggestion, generateEventImage, USE_AI } from '@/api/aiService'
import { uploadImage } from '@/api/storageService'

export default {
  data() {
    return {
      event: {
        name: '',
        date: this.getTodayDate(),
        startTime: this.getNextFullHour(),
        endTime: this.getNextFullHourPlusOne(),
        dress_code: ''
      },
      imageFile: null,
      previewImage: null,
      isGenerating: false,
      USE_AI
    }
  },
  methods: {
    getTodayDate() {
      return new Date().toISOString().split('T')[0]
    },
    getNextFullHour() {
      const date = new Date()
      date.setMinutes(0, 0, 0) // Setze Minuten auf 00
      date.setHours(date.getHours() + 1) // Nächste volle Stunde
      return date.toTimeString().substring(0, 5)
    },
    getNextFullHourPlusOne() {
      const date = new Date()
      date.setMinutes(0, 0, 0)
      date.setHours(date.getHours() + 2) // Nächste volle Stunde +1h für Endzeit
      return date.toTimeString().substring(0, 5)
    },
    async generateDressCode() {
      this.event.dress_code = await getDressCodeSuggestion()
    },
    async generateEventImage() {
      if (!this.event.dress_code) {
        alert('❌ Please enter a dress code first!');
        return;
      }

      this.isGenerating = true; // Ladeanzeige aktivieren

      try {
        const { imageUrl, error } = await generateEventImage(this.event.dress_code, (loading) => {
          this.isGenerating = loading; // Ladezustand synchronisieren
        });

        if (error || !imageUrl) {
          console.warn('⚠️ AI Image generation failed. Using fallback image.');
          this.previewImage = this.getFallbackImage(this.event.dress_code);
        } else {
          this.previewImage = imageUrl;
          console.log('✅ Image successfully loaded:', imageUrl);
        }
      } catch (error) {
        console.error('❌ AI Image Generation Error:', error);
        this.previewImage = this.getFallbackImage(this.event.dress_code);
      } finally {
        this.isGenerating = false; // Ladeanzeige beenden
      }
    }
    ,
    handleFileUpload(event) {
      this.imageFile = event.target.files[0]
      this.previewImage = URL.createObjectURL(this.imageFile)
    },
    async createEvent() {
      if (!this.event.name || !this.event.date || !this.event.startTime || !this.event.endTime || !this.event.dress_code) {
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
        image_url: imageUrl
      })
      alert('✅ Event saved!')
      this.$router.push('/dashboard')
    },
    isSupabaseImage(url) {
      return url.includes('supabase.co/storage')
    },
    openImageInNewTab(url) {
      window.open(url, '_blank')
    }
  }
}
</script>

<style>
.input-field {
  padding: 10px;
  border: 2px solid #ddd;
  border-radius: 8px;
  outline: none;
  transition: border 0.2s ease-in-out;
}

.input-field:focus {
  border-color: #8a4df4;
}

.action-button {
  background-color: #6b46c1;
  color: white;
  padding: 10px;
  border-radius: 8px;
  font-size: 14px;
  text-align: center;
  transition: background 0.3s ease-in-out;
  position: relative;
}

.action-button:hover {
  background-color: #553c9a;
}

.action-button:disabled {
  background-color: #9a7bd7;
  cursor: not-allowed;
}

.submit-button {
  background: linear-gradient(90deg, #6b46c1, #b794f4);
  color: white;
  padding: 12px;
  border-radius: 8px;
  font-weight: bold;
  transition: transform 0.2s ease-in-out;
}

.submit-button:hover {
  transform: scale(1.05);
}

.download-button {
  margin-top: 8px;
  background-color: #4a5568;
  color: white;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 14px;
  transition: background 0.3s ease-in-out;
}

.download-button:hover {
  background-color: #2d3748;
}

/* 🔄 Kleine Ladeanzeige für Button */
.loader {
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-top: 4px solid white;
  border-radius: 50%;
  width: 16px;
  height: 16px;
  animation: spin 0.8s linear infinite;
}

/* 🔄 Große Ladeanzeige */
.loader-large {
  border: 6px solid rgba(0, 0, 0, 0.1);
  border-left-color: #6b46c1;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
