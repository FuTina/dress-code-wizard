<template>
  <div class="max-w-4xl mx-auto p-6 min-h-screen">
    <h1 class="text-3xl font-bold text-center text-purple-600 mb-6">📅 Your Events</h1>

    <ul v-if="events.length > 0" class="mt-4 space-y-4">
      <li
        v-for="event in sortedEvents"
        :key="event.id"
        class="p-4 bg-white rounded-lg shadow-md hover:shadow-lg transition-transform transform hover:scale-[1.02] border border-gray-200"
      >
        <div class="flex flex-col sm:flex-row sm:items-center gap-4">
          <img
            :src="event.image_url || getFallbackImage(event.dress_code)"
            alt="Event Image"
            class="w-36 h-36 sm:w-48 sm:h-48 rounded-lg shadow object-cover border border-gray-300 mx-auto sm:mx-0"
          />

          <div class="flex-1 text-center sm:text-left">
            <strong class="text-xl sm:text-2xl text-gray-900">{{ event.name }}</strong>
            <div class="text-sm text-gray-600">
              📅 {{ formatDateRange(event.startdate, event.enddate) }}<br />
              ⏰ {{ event.startTime || '19:00' }} - {{ event.endTime || '20:00' }}
            </div>

            <div v-if="event.description" class="description-box mx-auto sm:mx-0">
              <p :class="{ 'line-clamp': expandedEventId !== event.id }">
                {{ event.description }}
              </p>
              <button
                @click="toggleExpand(event.id)"
                class="text-purple-500 hover:underline text-xs font-semibold"
              >
                {{ expandedEventId === event.id ? 'Weniger anzeigen' : 'Mehr anzeigen' }}
              </button>
            </div>

            <span class="text-gray-500 italic block mt-2"
              >👗 {{ event.dress_code || 'Casual' }}</span
            >
          </div>

          <!-- Buttons (Kalender & Bearbeiten/Löschen nebeneinander) -->
          <div class="grid grid-cols-2 gap-2 w-[140px] mx-auto sm:mx-0 sm:ml-auto mt-4 sm:mt-0">
            <!-- Erste Reihe: Kalender-Buttons -->
            <div class="col-span-2 flex gap-2">
              <button
                @click="downloadICS(event)"
                class="bg-blue-400 text-white flex-1 h-10 rounded-lg hover:bg-blue-500 transition shadow"
                title="Download iCal"
              >
                📅
              </button>
              <button
                @click="openGoogleCalendar(event)"
                class="bg-teal-400 text-white flex-1 h-10 rounded-lg hover:bg-teal-500 transition shadow"
                title="Google Kalender"
              >
                📆
              </button>
            </div>

            <!-- Zweite Reihe: Edit/Delete -->
            <div class="col-span-2 flex gap-2">
              <router-link
                :to="'/edit-event/' + event.id"
                class="bg-amber-400 text-white flex-1 h-10 rounded-lg hover:bg-amber-500 transition shadow flex items-center justify-center"
                title="Bearbeiten"
              >
                ✏️
              </router-link>
              <button
                @click="deleteEvent(event.id, event.image_url)"
                class="bg-rose-400 text-white flex-1 h-10 rounded-lg hover:bg-rose-500 transition shadow"
                title="Löschen"
              >
                ❌
              </button>
            </div>
          </div>
        </div>
      </li>
    </ul>

    <p v-else class="text-center text-gray-500 mt-6 text-lg">No events found. Create one now!</p>
  </div>
</template>

<style>
@media (max-width: 640px) {
  .max-w-4xl {
    max-width: 100%;
    padding: 16px;
  }
  .w-36.h-36 {
    width: 100px;
    height: 100px;
  }
  .description-box {
    max-width: 100%;
  }
}

body {
  background-color: #f7f8fc;
}

.description-box {
  background: #f8f9fc;
  padding: 8px;
  border-radius: 8px;
  margin-top: 8px;
  font-size: 14px;
  line-height: 1.4;
  max-width: 250px;
}

.line-clamp {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  max-height: 40px;
}
</style>

<script>
import { getEvents, deleteEvent } from '@/api/eventService'
import { generateICS } from '@/utils/calendarService'
import { deleteImage } from '@/api/storageService'
import { DateTime } from 'luxon'

export default {
  data() {
    return {
      events: [],
      expandedEventId: null, // Speichert die ID des ausgeklappten Events
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
  computed: {
    sortedEvents() {
      const now = DateTime.now().setZone('Europe/Berlin').startOf('day')

      return [...this.events]
        .filter((event) => {
          const eventDate = DateTime.fromISO(event.startdate, { zone: 'Europe/Berlin' }).startOf(
            'day',
          )
          return eventDate >= now
        })
        .sort((a, b) => {
          const dateTimeA = DateTime.fromISO(`${a.startdate}T${a.startTime}`, {
            zone: 'Europe/Berlin',
          })
          const dateTimeB = DateTime.fromISO(`${b.startdate}T${b.startTime}`, {
            zone: 'Europe/Berlin',
          })
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
    // formatDate(dateString) {
    //   if (!dateString) return 'Kein Datum'
    //   return new Date(dateString).toLocaleDateString('de-DE', {
    //     weekday: 'long',
    //     day: '2-digit',
    //     month: 'long',
    //     year: 'numeric',
    //   })
    // },
    formatDateRange(startdate, enddate) {
      if (!startdate || !enddate) return 'Kein Datum'
      const start = new Date(startdate).toLocaleDateString('de-DE', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
      const end = new Date(enddate).toLocaleDateString('de-DE', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })

      return start === end ? start : `${start} - ${end}`
    },
    truncateText(text, maxLength) {
      return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
    },
    toggleExpand(eventId) {
      this.expandedEventId = this.expandedEventId === eventId ? null : eventId
    },

    downloadICS(event) {
      const icsFile = generateICS(event)
      if (icsFile) {
        const link = document.createElement('a')
        link.href = icsFile
        link.download = `${event.name}.ics`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }
    },
    openGoogleCalendar(event) {
      console.log('🕑 Debug: Event Zeitdaten', event)

      const startUTC = DateTime.fromISO(`${event.startdate}T${event.startTime}`)
        .setZone('Europe/Berlin')
        .toUTC()
        .toFormat("yyyyMMdd'T'HHmmss'Z'")

      const endUTC = DateTime.fromISO(`${event.enddate}T${event.endTime}`)
        .setZone('Europe/Berlin')
        .toUTC()
        .toFormat("yyyyMMdd'T'HHmmss'Z'")

      console.log('📅 Debug: Google Calendar Zeiten:', startUTC, endUTC)

      const url = `https://calendar.google.com/calendar/r/eventedit?text=${encodeURIComponent(event.name)}&dates=${startUTC}/${endUTC}&details=${encodeURIComponent('Dress Code: ' + event.dress_code)}&location=${encodeURIComponent(event.location || 'Online')}&sf=true&output=xml`

      window.open(url, '_blank')
    },
  },
}
</script>
