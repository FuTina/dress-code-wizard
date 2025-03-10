<template>
  <div class="max-w-lg mx-auto p-6 bg-white shadow-lg rounded-lg text-center">
    <h1 class="text-xl font-bold text-purple-700">👤 Your Profile</h1>

    <div v-if="user" class="mt-4">
      <!-- 🖼 Profile Image (Random Animal SVG as Default) -->
      <img
        :src="user.image_url || randomAnimalSVG"
        alt="Profile"
        class="w-24 h-24 rounded-full mx-auto object-cover border border-gray-300 shadow-md"
      />

      <!-- 📂 File Input -->
      <input type="file" @change="handleFileUpload" class="mt-2 w-full p-2 border rounded" />

      <!-- 🗑 Delete Profile Image -->
      <button
        v-if="user.image_url"
        @click="deleteProfileImage"
        class="mt-2 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-700 transition"
      >
        ❌ Delete Image
      </button>

      <p class="mt-2"><strong>Email:</strong> {{ user.email }}</p>
      <p><strong>User ID:</strong> {{ user.id }}</p>

      <button
        @click="logout"
        class="mt-4 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-700 transition"
      >
        Logout
      </button>
    </div>

    <p v-else class="text-red-500 mt-4">Not logged in.</p>
  </div>
</template>

<script>
import { supabase } from '@/lib/supabase'
import { uploadProfileImage } from '@/api/userService'
import { deleteImage } from '@/api/storageService'

export default {
  data() {
    return {
      user: null,
      randomAnimalSVG: null,
    }
  },
  async mounted() {
    const { data } = await supabase.auth.getUser()
    this.user = data.user

    // Falls der Benutzer kein eigenes Bild hat → Zufälliges Tier-Icon setzen
    if (!this.user?.image_url) {
      this.randomAnimalSVG = this.getRandomAnimalSVG()
    }
  },
  methods: {
    async handleFileUpload(event) {
      const file = event.target.files[0]
      if (!file) return

      const { url, error } = await uploadProfileImage(file)
      if (error) {
        alert('❌ Error uploading profile image: ' + error.message)
        return
      }

      // 🖼 Update user metadata in Supabase
      await supabase.auth.updateUser({ data: { image_url: url } })
      this.user.image_url = url
    },

    async deleteProfileImage() {
      if (!this.user.image_url) return

      const imagePath = this.user.image_url.split('/').pop()
      const { error } = await deleteImage('profile-images', imagePath)

      if (error) {
        alert('❌ Error deleting image: ' + error.message)
        return
      }

      alert('✅ Image deleted!')
      this.user.image_url = null

      // 🔹 Entferne Bild-Referenz in Supabase
      await supabase.auth.updateUser({ data: { image_url: null } })
    },

    async logout() {
      await supabase.auth.signOut()
      this.user = null
      this.$router.push('/login')
    },

    getRandomAnimalSVG() {
      const animalIcons = [
        '/icons/cat.svg',
        '/icons/dog.svg',
        '/icons/rabbit.svg',
        '/icons/squirrel.svg',
        '/icons/rat.svg',
        '/icons/turtle.svg',
      ]
      return animalIcons[Math.floor(Math.random() * animalIcons.length)]
    },
  },
}
</script>
