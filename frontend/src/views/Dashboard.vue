<template>
  <div class="max-w-4xl mx-auto p-6 bg-white shadow-lg rounded-lg min-h-screen">
    <h1 class="text-2xl font-bold text-center text-purple-700 mb-4">📅 Your Events</h1>

    <h2 class="text-lg font-bold text-gray-700 mt-6">📋 Event List</h2>

    <ul v-if="events.length > 0" class="mt-4 space-y-4">
      <li
        v-for="event in sortedEvents"
        :key="event.id"
        class="p-4 border rounded-lg flex items-center justify-between bg-gray-50 shadow-md"
      >
        <div class="flex items-center gap-4">
          <!-- Event Image (User-Upload oder AI/Fallback-Bild) -->
          <img
            :src="event.image_url || getFallbackImage(event.dress_code)"
            alt="Event Image"
            class="w-24 h-24 rounded-lg shadow-md object-cover"
          />
          <div>
            <strong class="text-lg text-gray-900">{{ event.name }}</strong> <br />
            <span class="text-sm text-gray-600">
              📅 {{ formatDate(event.date) }} | ⏰ {{ event.startTime || '19:00' }} -
              {{ event.endTime || '20:00' }} </span
            ><br />
            <span v-if="event.description" class="text-sm text-gray-700"
              >📄 {{ event.description }}</span
            ><br />
            <span class="text-gray-500 italic">👗 {{ event.dress_code || 'Casual' }}</span>
          </div>
        </div>

        <div class="flex gap-2">
          <button
            @click="downloadICS(event)"
            class="bg-blue-500 text-white px-3 py-2 rounded hover:bg-blue-700 transition"
          >
            📅 Export iCal
          </button>
          <router-link
            :to="'/edit-event/' + event.id"
            class="bg-yellow-500 text-white px-3 py-2 rounded hover:bg-yellow-700 transition"
          >
            ✏️ Edit
          </router-link>
          <button
            @click="deleteEvent(event.id, event.image_url)"
            class="bg-red-500 text-white px-3 py-2 rounded hover:bg-red-700 transition"
          >
            ❌ Delete
          </button>
        </div>
      </li>
    </ul>

    <p v-else class="text-center text-gray-500 mt-4">No events found. Create one now!</p>
  </div>
</template>

<script>
import { getEvents, deleteEvent } from '@/api/eventService'
import { downloadICS } from '@/utils/ical'
import { deleteImage } from '@/api/storageService'

export default {
  data() {
    return {
      events: [],
      fallbackImages: {
        elegant: '/fallback/elegant.jpg',
        neverland: '/fallback/neverland.jpg',
        anime: '/fallback/anime.jpg',
        hero: '/fallback/hero.jpg',
        pyjama: '/fallback/pyjama.jpg',
        default: '/fallback/default.jpg',
      },
    }
  },
  computed: {
    // 📌 Events nach Datum & Startzeit sortieren
    sortedEvents() {
      return [...this.events].sort((a, b) => {
        const dateTimeA = new Date(`${a.date}T${a.startTime}`)
        const dateTimeB = new Date(`${b.date}T${b.startTime}`)
        return dateTimeA - dateTimeB
      })
    },
  },
  async mounted() {
    await this.loadEvents()
  },
  methods: {
    async loadEvents() {
      const { data, error } = await getEvents()
      if (error) {
        console.error('❌ Error loading events:', error.message)
      } else {
        console.log('📊 Events geladen:', data)
        this.events = Array.isArray(data) ? data : []
      }
    },
    async deleteEvent(id, imageUrl) {
      if (!confirm('Are you sure you want to delete this event?')) return

      if (imageUrl) {
        const imagePath = imageUrl.split('/').pop()
        await deleteImage('event-images', imagePath)
      }

      const { error } = await deleteEvent(id)
      if (!error) {
        this.events = this.events.filter((event) => event.id !== id)
      } else {
        alert('❌ Error deleting event: ' + error.message)
      }
    },
    getFallbackImage(dressCode) {
      if (!dressCode) return this.fallbackImages.default
      const normalizedDressCode = dressCode.toLowerCase().trim()

      // Überprüfe, ob ein passendes Fallback-Image existiert
      for (const key in this.fallbackImages) {
        if (normalizedDressCode.includes(key)) {
          return this.fallbackImages[key]
        }
      }

      return this.fallbackImages.default
    },
    formatDate(dateString) {
      return new Date(dateString).toLocaleDateString('de-DE', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
      })
    },
    downloadICS(event) {
      downloadICS(event)
    },
  },
}
</script>
