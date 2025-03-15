<template>
  <div class="max-w-xl mx-auto p-8 bg-white shadow-2xl rounded-3xl">
    <h1 class="text-3xl font-bold text-center text-purple-700 mb-6">✏️ Edit Event</h1>

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

      <div v-if="errorMessage" class="text-red-500 font-semibold text-center">
        ⚠️ {{ errorMessage }}
      </div>

      <div class="flex gap-2">
        <input v-model="event.dress_code" class="input-field w-full" placeholder="👗 Dress Code" />
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

      <label class="input-label">🖼️ Upload New Image</label>
      <button @click="triggerFileInput" class="btn-upload">
        {{ imageFile ? imageFile.name : '📂 Choose Image' }}
      </button>
      <input type="file" ref="fileInput" @change="handleFileUpload" hidden />

      <div v-if="previewImage || event.image_url" class="mt-4 text-center">
        <img
          :src="previewImage || event.image_url"
          alt="Event Image"
          class="w-full h-52 object-cover rounded-xl shadow-lg"
        />

        <div class="flex justify-center gap-2 mt-2">
          <a
            v-if="event.image_url"
            :href="event.image_url"
            target="_blank"
            class="action-button download-button"
          >
            ⬇️ Download Image
          </a>
          <button
            v-if="event.image_url"
            @click="deleteCurrentImage"
            class="action-button delete-button"
          >
            ❌ Delete Image
          </button>
        </div>

        <textarea
          v-model="event.description"
          class="input-field resize-none mt-3"
          rows="3"
          placeholder="📝 Describe the outfit..."
        ></textarea>
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
import { uploadImage, deleteImage } from '@/api/storageService'
import {
  getDressCodeSuggestion,
  generateEventImage,
  generateOutfitDescription,
  getFallbackImage,
  getFallbackDescription,
  USE_AI,
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
        description: '',
        image_url: null,
      },
      imageFile: null,
      previewImage: null,
      outfitDescription: '',
      errorMessage: '',
      isGenerating: false,
      USE_AI,
    }
  },

  watch: {
    'event.startdate'(newDate) {
      this.event.enddate = newDate
    },
    'event.startTime'(newTime) {
      const [h, m] = newTime.split(':').map(Number)
      const endTime = new Date()
      endTime.setHours(h, m + 60)
      this.event.endTime = endTime.toTimeString().slice(0, 5)
    },
  },

  async mounted() {
    const { data } = await supabase
      .from('events')
      .select('*')
      .eq('id', this.$route.params.id)
      .single()

    if (!data) {
      alert('❌ Event not found!')
      this.$router.push('/dashboard')
      return
    }

    this.event = {
      ...data,
      startdate: data.startdate.split('T')[0],
      enddate: data.enddate.split('T')[0],
      startTime: data.startTime.slice(0, 5),
      endTime: data.endTime.slice(0, 5),
    }
    this.outfitDescription = data.description
    this.previewImage = data.image_url
  },

  methods: {
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

        // Hole Bild und lade es direkt hoch
        const imageBlob = await fetch(imageUrl).then((res) => res.blob())
        const { url: uploadedImageUrl } = await uploadImage(imageBlob, 'event-images')

        // Setze das Bild korrekt
        this.previewImage = uploadedImageUrl
        this.event.image_url = uploadedImageUrl

        // Generiere Beschreibung
        this.event.description = await generateOutfitDescription(this.event.dress_code)

        // Setze imageFile zurück, um Konflikte zu vermeiden
        this.imageFile = null
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
      this.event.description =
        getFallbackDescription(this.event.dress_code?.trim().toLowerCase()) ||
        getFallbackDescription('default')
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
      const start = new Date(`${this.event.startdate}T${this.event.startTime}`)
      const end = new Date(`${this.event.enddate}T${this.event.endTime}`)

      if (end < start) {
        this.errorMessage = '⚠️ End date/time cannot be before start date/time!'
        return
      }

      let imageUrl = this.event.image_url

      if (this.imageFile) {
        const { url } = await uploadImage(this.imageFile, 'event-images')
        imageUrl = url
      } else if (this.previewImage && this.previewImage.startsWith('blob:')) {
        const blob = await fetch(this.previewImage).then((r) => r.blob())
        const { url } = await uploadImage(blob, 'event-images')
        imageUrl = url
      }

      await supabase
        .from('events')
        .update({
          name: this.event.name,
          startdate: this.event.startdate,
          enddate: this.event.enddate,
          startTime: `${this.event.startTime}:00`,
          endTime: `${this.event.endTime}:00`,
          dress_code: this.event.dress_code,
          description: this.event.description,
          image_url: imageUrl,
        })
        .eq('id', this.event.id)

      alert('✅ Event updated!')
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
</style>
