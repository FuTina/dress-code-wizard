<template>
  <div class="max-w-md mx-auto p-6 bg-white shadow-lg rounded-lg">
    <h1 class="text-xl font-bold text-center text-purple-700">🎭 Create an Event</h1>

    <input v-model="event.name" class="w-full p-3 border rounded mb-2" placeholder="Event Name" />

    <label>Date:</label>
    <input v-model="event.date" type="date" class="w-full p-3 border rounded mb-2" />

    <label>Start Time:</label>
    <input v-model="event.startTime" type="time" class="w-full p-3 border rounded mb-2" />

    <label>End Time:</label>
    <input v-model="event.endTime" type="time" class="w-full p-3 border rounded mb-2" />

    <label>Dress Code:</label>
    <div class="flex gap-2">
      <input v-model="event.dress_code" class="w-full p-3 border rounded mt-2" placeholder="Dress Code" />
      <button @click="generateDressCode" class="bg-blue-500 text-white px-3 py-2 rounded hover:bg-blue-700 transition">
        🪄 AI Suggestion
      </button>
    </div>

    <!-- AI Image Generator -->
    <button @click="generateEventImage"
      class="mt-2 bg-indigo-500 text-white px-4 py-2 rounded hover:bg-indigo-700 transition">
      🎨 Generate AI Image
    </button>

    <!-- Image Upload -->
    <label class="block mt-4">Upload Event Image:</label>
    <input type="file" @change="handleFileUpload" class="w-full p-2 border rounded mb-2" />

    <div v-if="previewImage" class="mt-4">
      <p class="text-gray-600 text-sm">Image Preview:</p>
      <img :src="previewImage" alt="Event Image" class="w-full h-40 object-cover rounded shadow-md" />
    </div>

    <button @click="createEvent"
      class="mt-4 bg-purple-600 text-white px-4 py-2 w-full rounded hover:bg-purple-800 transition">
      ✅ Save Event
    </button>
  </div>
</template>

<script>
import { createEvent } from '@/api/eventService';
import { getDressCodeSuggestion, generateEventImage } from '@/api/aiService';
import { uploadImage } from '@/api/storageService';

export default {
  data() {
    return {
      event: { name: '', date: '', startTime: '19:00', endTime: '20:00', dress_code: '' },
      imageFile: null,
      previewImage: null,
      isGenerating: false,
      fallbackImages: {
        elegant: '/fallback/elegant.jpg',
        neverland: '/fallback/neverland.jpg',
        anime: '/fallback/anime.jpg',
        hero: '/fallback/hero.jpg',
        pyjama: '/fallback/pyjama.jpg',
        default: '/fallback/default.jpg',
      },
    };
  },
  methods: {
    async generateDressCode() {
      this.event.dress_code = await getDressCodeSuggestion();
      this.setFallbackImage();
    },
    async generateEventImage() {
      if (!this.event.dress_code) {
        alert("❌ Please enter a dress code first!");
        return;
      }
      this.isGenerating = true;
      try {
        const { imageUrl, error } = await generateEventImage(this.event.dress_code);
        this.isGenerating = false;
        if (error || !imageUrl) {
          console.warn("⚠️ AI Image generation failed. Using fallback image.");
          this.setFallbackImage();
        } else {
          this.previewImage = imageUrl;
        }
      } catch (error) {
        console.error("❌ AI Image Generation Error:", error);
        this.setFallbackImage();
      }
    },
    handleFileUpload(event) {
      this.imageFile = event.target.files[0];
      this.previewImage = URL.createObjectURL(this.imageFile);
    },
    setFallbackImage() {
      this.previewImage = this.getFallbackImage(this.event.dress_code);
    },
    getFallbackImage(dressCode) {
      if (!dressCode) return this.fallbackImages.default;
      const normalizedDressCode = dressCode.toLowerCase().trim();

      const fallbackMapping = {
        "elegant": this.fallbackImages.elegant,
        "neverland": this.fallbackImages.neverland,
        "anime": this.fallbackImages.anime,
        "hero": this.fallbackImages.hero,
        "pyjama": this.fallbackImages.pyjama,
      };

      return Object.entries(fallbackMapping).find(([key]) => normalizedDressCode.includes(key))?.[1] || this.fallbackImages.default;
    },
    async createEvent() {
      if (!this.event.name || !this.event.date || !this.event.startTime || !this.event.endTime || !this.event.dress_code) {
        alert('❌ Please fill out all fields before saving!');
        return;
      }

      let imageUrl = this.previewImage; 

      if (this.imageFile) {
        try {
          const { url, error } = await uploadImage(this.imageFile, 'event-images');
          if (error) throw new Error(error.message);
          imageUrl = url;
        } catch (error) {
          console.error('❌ Error uploading image:', error);
          imageUrl = this.getFallbackImage(this.event.dress_code);
        }
      }

      if (!imageUrl || imageUrl.startsWith('/fallback/')) {
        imageUrl = window.location.origin + imageUrl;
      }

      console.log('📸 Final Image URL:', imageUrl);

      try {
        const { error } = await createEvent({
          ...this.event,
          startTime: `${this.event.startTime}:00`, 
          endTime: `${this.event.endTime}:00`,
          image_url: imageUrl,
        });

        if (error) {
          console.error('❌ Error saving event:', error);
        } else {
          alert('✅ Event saved!');
          this.$router.push('/dashboard');
        }
      } catch (error) {
        console.error('❌ Error creating event:', error);
      }
    },
  },
};
</script>
