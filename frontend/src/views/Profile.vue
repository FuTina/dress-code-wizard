<template>
  <div class="max-w-lg mx-auto p-6 bg-white shadow-lg rounded-lg text-center">
    <h1 class="text-xl font-bold text-purple-700">👤 Your Profile</h1>

    <div v-if="user" class="mt-4">
      <!-- 🖼 Profile Image -->
      <img
        :src="previewImage || user.user_metadata?.image_url || '/icons/user.svg'"
        alt="Profile"
        class="w-24 h-24 rounded-full mx-auto object-cover border border-gray-300 shadow-md"
      />

      <!-- 📂 File Input -->
      <input type="file" @change="handleFileUpload" class="mt-2 w-full p-2 border rounded" />

      <!-- 💾 Save Button (nur sichtbar, wenn ein neues Bild hochgeladen wurde) -->
      <button
        v-if="imageFile"
        @click="saveProfileImage"
        class="mt-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
      >
        💾 Save Profile Image
      </button>

      <!-- 🗑 Delete Profile Image -->
      <button
        v-if="user.user_metadata?.image_url"
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
import { uploadProfileImage, deleteProfileImage } from '@/api/userService'

export default {
  data() {
    return {
      user: null,
      imageFile: null,
      previewImage: null,
    }
  },
  async mounted() {
    await this.fetchUserData()
  },
  methods: {
    async fetchUserData() {
      const { data, error } = await supabase.auth.getUser()
      if (error) {
        console.error('❌ Error fetching user data:', error.message)
      } else {
        this.user = data.user
        this.previewImage = null
      }
    },

    handleFileUpload(event) {
      this.imageFile = event.target.files[0]
      if (!this.imageFile) return
      this.previewImage = URL.createObjectURL(this.imageFile)
    },

    async saveProfileImage() {
      if (!this.imageFile) return

      const { url, error } = await uploadProfileImage(this.imageFile)
      if (error) {
        alert('❌ Error uploading profile image: ' + error.message)
        return
      }

      // 🖼 Bild-URL in Supabase speichern
      const { error: updateError } = await supabase.auth.updateUser({ data: { image_url: url } })

      if (updateError) {
        alert('❌ Error updating user profile: ' + updateError.message)
        return
      }

      // 🔄 Benutzer-Daten erneut abrufen
      await this.fetchUserData()
    },

    async deleteProfileImage() {
      if (!this.user.user_metadata?.image_url) return

      const imageUrl = this.user.user_metadata.image_url
      const { error } = await deleteProfileImage(imageUrl)

      if (error) {
        alert('❌ Error deleting image: ' + error.message)
        return
      }

      alert('✅ Image deleted!')

      // 🔹 Entferne Bild-Referenz in Supabase Auth
      await supabase.auth.updateUser({ data: { image_url: null } })
      await this.fetchUserData()
    },

    async logout() {
      await supabase.auth.signOut()
      this.user = null
      this.$router.push('/login')
    },
  },
}
</script>
