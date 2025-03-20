<template>
  <div class="max-w-xl mx-auto p-8 bg-white shadow-2xl rounded-3xl">
    <h1 class="text-3xl font-bold text-center text-purple-700 mb-6">🎭 Create an Event</h1>

    <div class="space-y-6">
      <input v-model="event.name" class="input-field" placeholder="✨ Event Name" />

      <!-- Event Type Dropdown -->
      <label class="input-label">📌 Event Type</label>
      <select v-model="event.event_type" @change="updateDescription" class="input-dropdown">
        <option value="party">🎉 Party</option>
        <option value="business">💼 Business Meeting</option>
        <option value="date">💖 Date</option>
      </select>

      <!-- Display dynamic event description below the selection -->
      <p class="text-sm text-gray-600 italic mt-2">{{ event.description }}</p>

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
      <label class="input-label">👗 Choose or Enter Dress Code</label>
      <div class="relative">
        <input
          v-model="event.dress_code"
          class="input-field"
          placeholder="Choose or type a dress code..."
          @focus="showDropdown = true"
          @blur="hideDropdown"
        />
        <ul v-if="showDropdown" class="dropdown-list">
          <li
            v-for="dressCode in filteredDressCodes"
            :key="dressCode.name"
            @mousedown="selectDressCode(dressCode.name)"
            class="dropdown-item"
          >
            {{ dressCode.name }}
          </li>
        </ul>
      </div>

      <button @click="generateDressCode" class="btn-ai">🪄 AI Suggestion</button>

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
          v-model="event.outfit_suggestion"
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

/* .input-field.error {
  border-color: red;
  box-shadow: 0 0 10px rgba(255, 0, 0, 0.5);
} */

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

.input-dropdown {
  padding: 12px;
  border: 2px solid #ddd;
  border-radius: 12px;
  outline: none;
  transition:
    border 0.2s,
    box-shadow 0.2s;
  width: 100%;
  max-width: none;
  appearance: none;
  background-color: white;
  font-size: 16px;
}

.input-dropdown:focus {
  border-color: #9f7aea;
  box-shadow: 0 0 10px rgba(159, 122, 234, 0.4);
}

@media (max-width: 1024px) {
  .input-dropdown {
    width: 100%;
    font-size: 14px;
  }
}

@media (max-width: 640px) {
  .input-dropdown {
    font-size: 14px;
    padding: 10px;
  }
}

.relative {
  position: relative;
}

.dropdown-list {
  position: absolute;
  width: 100%;
  max-height: 200px;
  overflow-y: auto;
  background: white;
  border: 2px solid #ddd;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  z-index: 50;
}

.dropdown-item {
  padding: 10px;
  cursor: pointer;
  transition: background 0.2s;
}

.dropdown-item:hover {
  background: #f3e8ff;
}
</style>

<script>
import { createEvent } from '@/api/eventService'
import {
  getDressCodeSuggestion,
  generateEventImage,
  generateOutfitSuggestion,
  getFallbackImage,
  getFallbackOutfitSuggestion,
  USE_AI,
  fetchSavedDressCodes,
} from '@/api/aiService'
import { uploadImage } from '@/api/storageService'

export default {
  data() {
    return {
      event: {
        name: '',
        event_type: 'party', // Default selection
        description: 'A fun party with music and dance!', // Default description
        startdate: this.getTodayDate(),
        enddate: this.getTodayDate(),
        startTime: this.getNextFullHour(),
        endTime: this.getNextFullHourPlusOne(),
        dress_code: '',
      },
      availableDressCodes: [],
      imageFile: null,
      previewImage: getFallbackImage('default'),
      isGenerating: false,
      USE_AI,
      outfit_suggestion: getFallbackOutfitSuggestion('default'),
      showDropdown: false,
      errorMessage: '',
    }
  },
  computed: {
    filteredDressCodes() {
      return this.availableDressCodes.filter(
        (dressCode) => dressCode.event_type?.toLowerCase() === this.event.event_type.toLowerCase(),
      )
    },
  },

  async mounted() {
    await this.fetchFilteredDressCodes()
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
    'event.event_type': {
      handler: async function () {
        await this.fetchFilteredDressCodes()
      },
      immediate: true, // Führt es direkt beim Laden aus
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
    selectDressCode(dressCode) {
      this.event.dress_code = dressCode
      this.showDropdown = false
    },
    async fetchFilteredDressCodes() {
      try {
        this.availableDressCodes = await fetchSavedDressCodes(this.event.event_type)
      } catch (error) {
        console.error('❌ Error fetching dress codes:', error)
      }
    },

    hideDropdown() {
      setTimeout(() => {
        this.showDropdown = false
      }, 200) // Verhindert sofortiges Schließen, wenn ein Item angeklickt wird
    },
    async generateDressCode() {
      this.event.dress_code = await getDressCodeSuggestion(this.event.event_type)
      this.setFallbackImageAndOutfitSuggestion()
    },
    updateDescription() {
      const descriptions = {
        party: 'A fun party with music and dance!',
        business: 'A formal business meeting with professional attire.',
        date: 'A romantic date with stylish and elegant outfits.',
      }
      this.event.description = descriptions[this.event.event_type] || 'General event'
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
      setTimeout(() => {
        this.errorMessage = ''
      }, 4000)
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

      console.log('event type before validation:', this.event.event_type)

      if (!this.event.event_type || typeof this.event.event_type !== 'string') {
        alert('❌ Event type is missing or invalid!')
        return
      }

      const allowedEventTypes = ['party', 'business', 'date']
      this.event.event_type = this.event.event_type.trim().toLowerCase() // Bereinigen

      if (!allowedEventTypes.includes(this.event.event_type)) {
        alert('❌ Invalid event type! Please select a valid type.')
        return
      }

      console.log('event type after validation:', this.event.event_type)

      await createEvent({
        name: this.event.name,
        event_type: this.event.event_type,
        startdate: this.event.startdate,
        enddate: this.event.enddate,
        startTime: `${this.event.startTime}:00`,
        endTime: `${this.event.endTime}:00`,
        dress_code: this.event.dress_code,
        image_url: imageUrl,
        description: this.event.description?.trim() || '',
        outfit_suggestion: this.event.outfit_suggestion?.trim() || '',
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
          const { imageUrl } = await generateEventImage(
            this.event.dress_code,
            this.event.event_type,
            (loading) => {
              this.isGenerating = loading
            },
          )

          this.previewImage = imageUrl || getFallbackImage(this.event.dress_code)
          this.event.outfit_suggestion = await generateOutfitSuggestion(this.event.dress_code)
        } else {
          this.setFallbackImageAndOutfitSuggestion()
        }
      } catch (error) {
        console.error('❌ AI image generation failed:', error.response?.data || error.message)
        this.setFallbackImageAndOutfitSuggestion()
      } finally {
        this.isGenerating = false
      }
    },
    setFallbackImageAndOutfitSuggestion() {
      this.previewImage =
        getFallbackImage(this.event.dress_code?.trim().toLowerCase()) || getFallbackImage('default')
      this.event.outfit_suggestion =
        getFallbackOutfitSuggestion(this.event.dress_code?.trim().toLowerCase()) ||
        getFallbackOutfitSuggestion('default')

      console.warn(
        '⚠️ AI failed - fallback image & suggestion set:',
        this.previewImage,
        this.event.outfit_suggestion,
      )
    },
    triggerFileInput() {
      this.$refs.fileInput.click()
    },
    handleFileUpload(event) {
      this.imageFile = event.target.files[0]
      this.previewImage =
        URL.createObjectURL(this.imageFile) || getFallbackImage(this.event.dress_code)
    },
    async generateOutfitSuggestion() {
      if (!this.event.dress_code) {
        this.event.outfit_suggestion = 'No outfit suggestion available.'
        return
      }
      this.event.outfit_suggestion = this.event.dress_code
        ? await generateOutfitSuggestion(this.event.dress_code)
        : 'No outfit suggestion available.'
    },
  },
}
</script>
