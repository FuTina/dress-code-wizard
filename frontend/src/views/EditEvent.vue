<template>
  <div class="max-w-lg mx-auto p-6 bg-white shadow-xl rounded-xl">
    <h1 class="text-2xl font-bold text-center text-purple-700 mb-4">✏️ Edit Event</h1>

    <div class="space-y-4">
      <input v-model="event.name" class="input-field" placeholder="Event Name" />

      <!-- 📅 Startdatum + Enddatum -->
      <div class="grid grid-cols-2 gap-2">
        <div>
          <label class="block text-gray-700 text-sm">Start Date</label>
          <input v-model="event.startdate" type="date" class="input-field" />
        </div>
        <div>
          <label class="block text-gray-700 text-sm">End Date</label>
          <input v-model="event.enddate" type="date" class="input-field" />
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <input v-model="event.startTime" type="time" class="input-field" />
        <input v-model="event.endTime" type="time" class="input-field" />
      </div>

      <div class="flex gap-2">
        <input v-model="event.dress_code" class="input-field w-full" placeholder="Dress Code" />
      </div>

      <!-- 📝 Bearbeitbare Beschreibung -->
      <textarea v-model="event.description" class="input-field mt-2 w-full resize-none" rows="3"
        placeholder="Describe the outfit suggestion..."></textarea>

      <!-- 🔹 Moderner Datei-Upload -->
      <label class="block text-gray-700">Upload New Image:</label>
      <div class="file-upload-container">
        <button @click="triggerFileInput" class="file-upload-button">
          <i class="fas fa-folder-open"></i>
          {{ imageFile ? imageFile.name : 'Choose File' }}
        </button>
        <input type="file" ref="fileInput" @change="handleFileUpload" class="hidden" />
      </div>

      <!-- 🖼 Current Event Image Preview -->
      <div v-if="previewImage || event.image_url" class="mt-4 text-center">
        <p class="text-gray-500 text-sm">Image Preview:</p>
        <img :src="previewImage || event.image_url" alt="Event Image"
          class="w-full h-48 object-cover rounded-lg shadow-md transition hover:scale-105" />
        <button v-if="event.image_url" @click="deleteCurrentImage" class="delete-image-button">
          ❌ Delete Image
        </button>
      </div>

      <button @click="updateEvent" class="submit-button w-full">✅ Save Changes</button>
      <p v-if="errorMessage" class="text-red-500 font-semibold text-sm mt-2 text-center">{{ errorMessage }}</p>
    </div>
  </div>
</template>

<script>
import { supabase } from '@/lib/supabase'
import { uploadImage, deleteImage } from '@/api/storageService'

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
      errorMessage: '', // <-- Hinzufügen
    }
  },
  async mounted() {
    this.event.id = this.$route.params.id
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('id', this.event.id)
      .single()

    if (error || !data) {
      alert('❌ Event not found!')
      this.$router.push('/dashboard')
      return
    }

    // ✅ Setze Event-Daten mit Korrektur
    this.event = { ...data }
    this.event.startdate = data.startdate.split('T')[0]
    this.event.enddate = data.enddate.split('T')[0]
    this.event.startTime = data.startTime.substring(0, 5)
    this.event.endTime = data.endTime.substring(0, 5)
  },
  methods: {
    validateDates() {
      const start = new Date(`${this.event.startdate}T${this.event.startTime}`)
      const end = new Date(`${this.event.enddate}T${this.event.endTime}`)

      if (end < start) {
        this.errorMessage = '❌ Enddatum und -zeit dürfen nicht vor dem Start liegen.'
        return false
      } else {
        this.errorMessage = ''
        return true
      }
    },
    // ... bestehende Methoden ...

    triggerFileInput() {
      this.$refs.fileInput.click()
    },
    handleFileUpload(event) {
      this.imageFile = event.target.files[0]
      this.previewImage = URL.createObjectURL(this.imageFile)
    },
    async deleteCurrentImage() {
      if (!this.event.image_url) return
      const imagePath = this.event.image_url.split('/').pop()
      await deleteImage('event-images', imagePath)
      await supabase.from('events').update({ image_url: null }).eq('id', this.event.id)
      this.event.image_url = null
      alert('✅ Image deleted!')
    },
    async updateEvent() {
      if (!this.validateDates()) return // <-- Validierung prüfen

      let imageUrl = this.event.image_url
      if (this.imageFile) {
        const { url, error } = await uploadImage(this.imageFile, 'event-images')
        if (error) {
          alert('❌ Error uploading image')
          return
        }
        imageUrl = url
      }

      await supabase
        .from('events')
        .update({
          name: this.event.name,
          startdate: this.event.startdate,
          enddate: this.event.enddate,
          startTime: this.event.startTime,
          endTime: this.event.endTime,
          dress_code: this.event.dress_code,
          description: this.event.description,
          image_url: imageUrl,
        })
        .eq('id', this.event.id)

      alert('✅ Event updated!')
      this.$router.push('/dashboard')
    },
  }
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

.delete-image-button {
  background-color: #e53e3e;
  color: white;
  padding: 8px;
  border-radius: 8px;
  font-size: 14px;
  margin-top: 10px;
  cursor: pointer;
  transition: background 0.3s;
}

.delete-image-button:hover {
  background-color: #c53030;
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
</style>
