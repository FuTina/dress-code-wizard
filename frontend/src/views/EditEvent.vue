<template>
  <div class="max-w-xl mx-auto p-8 bg-white shadow-2xl rounded-3xl">
    <h1 class="text-3xl font-bold text-center text-purple-700 mb-6">✏️ Edit Event</h1>

    <div class="space-y-6">
      <input v-model="event.name" class="input-field" placeholder="✨ Event Name" />

      <label class="input-label">📌 Event Type</label>
      <select v-model="event.event_type" @change="updateDescription" class="input-dropdown">
        <option value="party">🎉 Party</option>
        <option value="business">💼 Business Meeting</option>
        <option value="date">💖 Date</option>
      </select>

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

      <div v-if="errorMessage" class="text-red-500 font-semibold text-center">
        ⚠️ {{ errorMessage }}
      </div>

      <div class="relative">
        <input v-model="event.dress_code" class="input-field" placeholder="Choose or type a dress code..."
          @focus="showDropdown = true" @blur="hideDropdown" />
        <ul v-if="showDropdown" class="dropdown-list">
          <li v-for="dressCode in filteredDressCodes" :key="dressCode.name" @mousedown="selectDressCode(dressCode.name)"
            class="dropdown-item">
            {{ dressCode.name }}
          </li>
        </ul>
      </div>

      <button @click="generateDressCode" class="btn-ai">🪄 AI Suggestion</button>

      <button v-if="USE_AI" @click="generateEventImage" class="btn-ai relative" :disabled="isGenerating">
        🎨 Generate AI Image
        <span v-if="isGenerating" class="loader absolute right-4 top-2"></span>
      </button>

      <label class="input-label">🖼️ Upload New Image</label>
      <button @click="triggerFileInput" class="btn-upload">
        {{ imageFile ? imageFile.name : '📂 Choose Image' }}
      </button>
      <input type="file" ref="fileInput" @change="handleFileUpload" hidden />

      <div v-if="previewImage || event.image_url" class="mt-4 text-center">
        <img :src="previewImage || event.image_url" alt="Event Image"
          class="w-full h-52 object-cover rounded-xl shadow-lg" />

        <div class="flex justify-center gap-2 mt-2">
          <a v-if="event.image_url" :href="event.image_url" target="_blank" class="action-button download-button">
            ⬇️ Download Image
          </a>
          <button v-if="event.image_url" @click="deleteCurrentImage" class="action-button delete-button">
            ❌ Delete Image
          </button>
        </div>

        <textarea v-model="event.outfit_suggestion" class="input-field resize-none mt-3" rows="3"
          placeholder="📝 Describe the outfit..."></textarea>
      </div>

      <button @click="updateEvent" class="btn-save">✅ Save Changes</button>
      <p v-if="errorMessage" class="text-red-500 font-semibold text-sm mt-2 text-center">
        {{ errorMessage }}
      </p>
    </div>
  </div>
</template>

<script>
import { supabase } from '@/lib/supabase'
import { DateTime } from 'luxon'
import { uploadImage, deleteImage } from '@/api/storageService'
import {
  getDressCodeSuggestion,
  generateEventImage,
  generateOutfitSuggestion,
  getFallbackImage,
  getFallbackOutfitSuggestion,
  USE_AI,
  fetchSavedDressCodes,
} from '@/api/aiService'

export default {
  data() {
    return {
      event: {
        id: null,
        name: '',
        startdate: '',
        enddate: '',
        startTime: '',
        endTime: '',
        dress_code: '',
        event_type: '',
        description: '',
        image_url: null,
      },
      availableDressCodes: [],
      imageFile: null,
      previewImage: null,
      outfit_suggestion: '',
      errorMessage: '',
      isGenerating: false,
      USE_AI,
    }
  },
  computed: {
    filteredDressCodes() {
      return this.availableDressCodes.filter(
        (dressCode) => dressCode.event_type?.toLowerCase() === this.event.event_type.toLowerCase()
      )
    },
  },

  watch: {
    'event.startdate'(newDate) {
      if (!this.event.enddate) {
        this.event.enddate = newDate
      }
    },
    'event.startTime'(newTime) {
      if (!this.event.endTime) {
        this.event.endTime = newTime // Directly set endTime without modification
      }
    },
    'event.event_type': {
      handler: async function () {
        await this.fetchFilteredDressCodes()
      },
      immediate: true,
    },
  },
  async mounted() {
    this.availableDressCodes = await fetchSavedDressCodes()

    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('id', this.$route.params.id)
      .single()

    if (error || !data) {
      console.error('❌ Error loading event:', error?.message || 'No data found')
      alert('❌ Event not found!')
      this.$router.push('/dashboard')
      return
    }

    console.log('📅 Original event data from Supabase:', data)

    this.event = {
      ...data,
      startdate: data.startdate || '',
      enddate: data.enddate || '',
      startTime: data.startTime ? data.startTime.slice(0, 8) : '', // Use full HH:mm:ss format
      endTime: data.endTime ? data.endTime.slice(0, 8) : '',
    }

    console.log('✅ Loaded event data:', this.event)
  },

  methods: {
    updateDescription() {
      const descriptions = {
        party: 'A fun party with music and dance!',
        business: 'A formal business meeting with professional attire.',
        date: 'A romantic date with stylish and elegant outfits.',
      }
      this.event.description = descriptions[this.event.event_type] || 'General event'
    },
    async fetchFilteredDressCodes() {
      try {
        this.availableDressCodes = await fetchSavedDressCodes(this.event.event_type)
      } catch (error) {
        console.error('❌ Error fetching dress codes:', error)
      }
    },
    selectDressCode(dressCode) {
      this.event.dress_code = dressCode
      this.showDropdown = false
    },
    hideDropdown() {
      setTimeout(() => {
        this.showDropdown = false
      }, 200)
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
        const { imageUrl } = await generateEventImage(this.event.dress_code, (loading) => {
          this.isGenerating = loading
        })

        // Fetch the AI-generated image as a blob
        const imageBlob = await fetch(imageUrl).then((res) => res.blob())

        // Upload the image and get the new URL
        const { url: uploadedImageUrl } = await uploadImage(imageBlob, 'event-images')

        // ✅ Assign the new image URL to event.image_url to reflect the change
        this.event.image_url = uploadedImageUrl
        this.previewImage = uploadedImageUrl

        // Generate a new outfit Suggestion
        this.event.outfit_suggestion = await generateOutfitSuggestion(this.event.dress_code)

        // Clear the old image reference
        this.imageFile = null
      } catch (error) {
        console.error('❌ AI Image Generation Error:', error)
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
    },

    triggerFileInput() {
      this.$refs.fileInput.click()
    },

    handleFileUpload(e) {
      this.imageFile = e.target.files[0]
      this.previewImage = URL.createObjectURL(this.imageFile)
    },

    async deleteCurrentImage() {
      if (!this.event.image_url) return
      const imagePath = this.event.image_url.split('/').pop()
      await deleteImage('event-images', imagePath)
      await supabase.from('events').update({ image_url: null }).eq('id', this.event.id)
      this.event.image_url = null
      this.previewImage = null
      alert('✅ Image deleted!')
    },

    async updateEvent() {
      console.log('📝 Saving event:', this.event)

      if (!this.event.startdate || !this.event.startTime) {
        this.errorMessage = '⚠️ Please select a start date and time!'
        return
      }

      if (!this.event.enddate || !this.event.endTime) {
        this.errorMessage = '⚠️ Please select an end date and time!'
        return
      }

      const formattedStartTime =
        this.event.startTime.length === 5 ? `${this.event.startTime}:00` : this.event.startTime // Ensure HH:mm:ss format

      const formattedEndTime =
        this.event.endTime.length === 5 ? `${this.event.endTime}:00` : this.event.endTime // Ensure HH:mm:ss format

      let imageUrl = this.event.image_url

      if (this.imageFile) {
        const { url } = await uploadImage(this.imageFile, 'event-images')
        imageUrl = url
      } else if (this.previewImage && this.previewImage.startsWith('blob:')) {
        const blob = await fetch(this.previewImage).then((r) => r.blob())
        const { url } = await uploadImage(blob, 'event-images')
        imageUrl = url
      }

      const updateData = {
        name: this.event.name,
        event_type: this.event.event_type,
        startdate: this.event.startdate,
        enddate: this.event.enddate,
        startTime: formattedStartTime,
        endTime: formattedEndTime,
        dress_code: this.event.dress_code,
        outfit_suggestion: this.event.outfit_suggestion,
        description: this.event.description,
        image_url: imageUrl,
      }

      console.log('📦 Data being sent to Supabase:', updateData)

      await supabase.from('events').update(updateData).eq('id', this.event.id)

      alert('✅ Event successfully updated!')
      this.$router.push('/dashboard')
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
    border 0.2s,
    box-shadow 0.2s;
}

.input-field:focus {
  border-color: #7e57c2;
  box-shadow: 0 0 5px rgba(126, 87, 194, 0.4);
}

.file-upload-button {
  background-color: #7e57c2;
  color: white;
  padding: 12px;
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.3s;
}

.file-upload-button:hover {
  background-color: #6a4fb3;
}

.submit-button {
  background: linear-gradient(90deg, #6b46c1, #b794f4);
  color: white;
  padding: 12px;
  border-radius: 8px;
  transition: transform 0.2s;
}

.submit-button:hover {
  transform: scale(1.05);
}

.action-button {
  flex: 1;
  height: 42px;
  padding: 0 16px;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.3s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  color: white;
  white-space: nowrap;
}

.download-button {
  background-color: #c3a2f7;
}

.download-button:hover {
  background-color: #a38cc6;
}

.delete-button {
  background-color: #e17f7f;
}

.delete-button:hover {
  background-color: #a71414;
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
  max-width: 100%;
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
</style>
