<template>
  <div class="max-w-4xl mx-auto p-6 bg-white shadow-lg rounded-lg min-h-screen">
    <h1 class="text-2xl font-bold text-center text-purple-700 mb-4">📅 Your Events</h1>

    <h2 class="text-lg font-bold text-gray-700 mt-6">📋 Event List</h2>

    <ul v-if="events.length > 0" class="mt-4 space-y-4">
      <li v-for="event in sortedEvents" :key="event.id"
        class="p-4 border rounded-lg flex items-center justify-between bg-gray-50 shadow-md">
        <div class="flex items-center gap-4">
          <img :src="event.image_url || getFallbackImage(event.dress_code)" alt="Event Image"
            class="w-20 h-20 rounded-lg shadow-md object-cover" />
          <div class="flex-1">
            <strong class="text-lg text-gray-900">{{ event.name }}</strong> <br />
            <span class="text-sm text-gray-600">📅 {{ formatDate(event.date) }}</span><br />
            <span class="text-sm text-gray-600">⏰ {{ event.startTime || '19:00' }} - {{ event.endTime || '20:00'
              }}</span><br />
            <span v-if="event.description" class="text-sm text-gray-700">📄 {{ event.description }}</span><br />
            <span class="text-gray-500 italic">👗 {{ event.dress_code || 'Casual' }}</span>
          </div>
        </div>

        <div class="flex gap-1">
          <button @click="downloadICS(event)"
            class="bg-blue-500 text-white w-12 h-10 flex items-center justify-center rounded hover:bg-blue-700 transition"
            title="Download iCal Datei">
            📅
          </button>

          <button @click="openGoogleCalendar(event)"
            class="bg-green-500 text-white w-12 h-10 flex items-center justify-center rounded hover:bg-green-700 transition"
            title="Zu Google Kalender hinzufügen">
            📆
          </button>

          <router-link :to="'/edit-event/' + event.id"
            class="bg-yellow-500 text-white w-12 h-10 flex items-center justify-center rounded hover:bg-yellow-700 transition"
            title="Event bearbeiten">
            ✏️
          </router-link>

          <button @click="deleteEvent(event.id, event.image_url)"
            class="bg-red-600 text-white w-12 h-10 flex items-center justify-center rounded hover:bg-red-800 transition"
            title="Event löschen">
            ❌
          </button>
        </div>
      </li>
    </ul>

    <p v-else class="text-center text-gray-500 mt-4">No events found. Create one now!</p>
  </div>
</template>

<script>
import { getEvents, deleteEvent } from '@/api/eventService';
import { generateICS } from '@/utils/calendarService';
import { deleteImage } from '@/api/storageService';
import { DateTime } from 'luxon';

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
        blackwhite: '/fallback/blackwhite.jpg',
        futuristic: '/fallback/futuristic.jpg',
        nineties: '/fallback/nineties.jpg',
        default: '/fallback/default.jpg',
      },
    };
  },
  computed: {
    sortedEvents() {
      const now = DateTime.now().setZone("Europe/Berlin").startOf("day"); // Aktuelles Datum ohne Zeit

      return [...this.events]
        .filter(event => {
          const eventDate = DateTime.fromISO(event.date, { zone: "Europe/Berlin" }).startOf("day");
          return eventDate >= now; // Nur heutige & zukünftige Events behalten
        })
        .sort((a, b) => {
          const dateTimeA = DateTime.fromISO(`${a.date}T${a.startTime}`, { zone: "Europe/Berlin" });
          const dateTimeB = DateTime.fromISO(`${b.date}T${b.startTime}`, { zone: "Europe/Berlin" });
          return dateTimeA - dateTimeB;
        });
    },
  },

  async mounted() {
    await this.loadEvents();
  },
  methods: {
    async loadEvents() {
      const { data, error } = await getEvents();
      if (error) {
        console.error('❌ Error loading events:', error.message);
      } else {
        console.log('📊 Events geladen:', data);
        this.events = Array.isArray(data) ? data : [];
      }
    },
    async deleteEvent(id, imageUrl) {
      if (!confirm('Are you sure you want to delete this event?')) return;

      if (imageUrl) {
        const imagePath = imageUrl.split('/').pop();
        await deleteImage('event-images', imagePath);
      }

      const { error } = await deleteEvent(id);
      if (!error) {
        this.events = this.events.filter((event) => event.id !== id);
      } else {
        alert('❌ Error deleting event: ' + error.message);
      }
    },
    formatDate(dateString) {
      if (!dateString) return "Kein Datum";
      return new Date(dateString).toLocaleDateString("de-DE", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
    },
    downloadICS(event) {
      const icsFile = generateICS(event);
      if (icsFile) {
        const link = document.createElement('a');
        link.href = icsFile;
        link.download = `${event.name}.ics`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    },
    openGoogleCalendar(event) {
      console.log("🕑 Debug: Event Zeitdaten", event);

      const startUTC = DateTime.fromISO(event.date)
        .setZone("Europe/Berlin")
        .plus({ hours: parseInt(event.startTime.split(":")[0]), minutes: parseInt(event.startTime.split(":")[1]) })
        .toUTC()
        .toFormat("yyyyMMdd'T'HHmmss'Z'");

      const endUTC = DateTime.fromISO(event.date)
        .setZone("Europe/Berlin")
        .plus({ hours: parseInt(event.endTime.split(":")[0]), minutes: parseInt(event.endTime.split(":")[1]) })
        .toUTC()
        .toFormat("yyyyMMdd'T'HHmmss'Z'");

      console.log("📅 Debug: Google Calendar Zeiten:", startUTC, endUTC);

      const url = `https://calendar.google.com/calendar/r/eventedit?text=${encodeURIComponent(event.name)}&dates=${startUTC}/${endUTC}&details=${encodeURIComponent("Dress Code: " + event.dress_code)}&location=${encodeURIComponent(event.location || "Online")}&sf=true&output=xml`;

      window.open(url, "_blank");
    },
  },
};
</script>
