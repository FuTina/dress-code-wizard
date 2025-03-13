<template>
  <div class="max-w-4xl mx-auto p-6 min-h-screen">
    <h1 class="text-3xl font-bold text-center text-purple-600 mb-6">📅 Your Events</h1>

    <ul v-if="events.length > 0" class="mt-4 space-y-4">
      <li
        v-for="event in sortedEvents"
        :key="event.id"
        class="p-4 bg-white rounded-lg flex flex-col sm:flex-row items-center sm:justify-between shadow-md hover:shadow-lg transition-transform transform hover:scale-[1.02] border border-gray-200"
      >
        <!-- Event Bild & Details -->
        <div class="flex flex-col sm:flex-row items-center gap-4 w-full">
          <img
            :src="event.image_url || getFallbackImage(event.dress_code)"
            alt="Event Image"
            class="w-36 h-36 sm:w-48 sm:h-48 rounded-lg shadow-md object-cover border border-gray-300"
          />
          <div class="text-center sm:text-left flex-1">
            <strong class="text-xl sm:text-2xl text-gray-900">{{ event.name }}</strong> <br />
            <span class="text-sm text-gray-600">📅 {{ formatDate(event.date) }}</span><br />
            <span class="text-sm text-gray-600"
              >⏰ {{ event.startTime || '19:00' }} - {{ event.endTime || '20:00' }}</span
            ><br />
            <span v-if="event.description" class="text-sm text-gray-700"
              >📄 {{ event.description }}</span
            ><br />
            <span class="text-gray-500 italic">👗 {{ event.dress_code || 'Casual' }}</span>
          </div>
        </div>

        <!-- Buttons (Immer 2x2 Anordnung) -->
        <div class="grid grid-cols-2 gap-2 mt-4 sm:mt-0 w-full max-w-[140px]">
          <button
            @click="downloadICS(event)"
            class="bg-blue-400 text-white w-12 h-9 flex items-center justify-center rounded-lg hover:bg-blue-500 transition shadow-md"
            title="Download iCal Datei"
          >
            📅
          </button>

          <button
            @click="openGoogleCalendar(event)"
            class="bg-teal-400 text-white w-12 h-9 flex items-center justify-center rounded-lg hover:bg-teal-500 transition shadow-md"
            title="Zu Google Kalender hinzufügen"
          >
            📆
          </button>

          <router-link
            :to="'/edit-event/' + event.id"
            class="bg-amber-400 text-white w-12 h-9 flex items-center justify-center rounded-lg hover:bg-amber-500 transition shadow-md"
            title="Event bearbeiten"
          >
            ✏️
          </router-link>

          <button
            @click="deleteEvent(event.id, event.image_url)"
            class="bg-rose-400 text-white w-12 h-9 flex items-center justify-center rounded-lg hover:bg-rose-500 transition shadow-md"
            title="Event löschen"
          >
            ❌
          </button>
        </div>
      </li>
    </ul>

    <p v-else class="text-center text-gray-500 mt-6 text-lg">No events found. Create one now!</p>
  </div>
</template>

---

### **🌈 Farbverbesserungen**
- **Kalender-Download**: `bg-blue-400` → sanfteres Blau für **weniger grellen Look**
- **Google-Kalender**: `bg-teal-400` → angenehmes Türkis für eine **sanfte, moderne Wirkung**
- **Bearbeiten**: `bg-amber-400` → warmer, **goldener Ton statt knalligem Gelb**
- **Löschen**: `bg-rose-400` → sanftes **Rosa-Rot statt harter roter Block**

---

### **📌 Mobile Optimierungen**
```css
<style>
/* 📌 Mobile Verbesserungen */
@media (max-width: 640px) {
  .max-w-4xl {
    max-width: 100%;
    padding: 16px;
  }

  .p-4 {
    padding: 12px;
  }

  .text-2xl {
    font-size: 1.75rem;
  }

  /* 🟢 Größere Bilder für bessere Sichtbarkeit */
  .w-36.h-36 {
    width: 100px;
    height: 100px;
  }

  /* 🟢 Kleinere Buttons für bessere Platznutzung */
  .w-12.h-9 {
    width: 42px;
    height: 35px;
  }
}

/* 🔹 Hintergrund modernisieren */
body {
  background-color: #f7f8fc;
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
      const now = DateTime.now().setZone('Europe/Berlin').startOf('day') // Aktuelles Datum ohne Zeit

      return [...this.events]
        .filter((event) => {
          const eventDate = DateTime.fromISO(event.date, { zone: 'Europe/Berlin' }).startOf('day')
          return eventDate >= now // Nur heutige & zukünftige Events behalten
        })
        .sort((a, b) => {
          const dateTimeA = DateTime.fromISO(`${a.date}T${a.startTime}`, { zone: 'Europe/Berlin' })
          const dateTimeB = DateTime.fromISO(`${b.date}T${b.startTime}`, { zone: 'Europe/Berlin' })
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
    formatDate(dateString) {
      if (!dateString) return 'Kein Datum'
      return new Date(dateString).toLocaleDateString('de-DE', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
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

      const startUTC = DateTime.fromISO(event.date)
        .setZone('Europe/Berlin')
        .plus({
          hours: parseInt(event.startTime.split(':')[0]),
          minutes: parseInt(event.startTime.split(':')[1]),
        })
        .toUTC()
        .toFormat("yyyyMMdd'T'HHmmss'Z'")

      const endUTC = DateTime.fromISO(event.date)
        .setZone('Europe/Berlin')
        .plus({
          hours: parseInt(event.endTime.split(':')[0]),
          minutes: parseInt(event.endTime.split(':')[1]),
        })
        .toUTC()
        .toFormat("yyyyMMdd'T'HHmmss'Z'")

      console.log('📅 Debug: Google Calendar Zeiten:', startUTC, endUTC)

      const url = `https://calendar.google.com/calendar/r/eventedit?text=${encodeURIComponent(event.name)}&dates=${startUTC}/${endUTC}&details=${encodeURIComponent('Dress Code: ' + event.dress_code)}&location=${encodeURIComponent(event.location || 'Online')}&sf=true&output=xml`

      window.open(url, '_blank')
    },
  },
}
</script>
