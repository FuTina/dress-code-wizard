<template>
  <div class="max-w-lg mx-auto p-6 min-h-screen flex flex-col items-center">
    <div class="bg-white shadow-md rounded-lg p-6 w-full max-w-md transition">
      <h1 class="text-2xl font-semibold text-purple-700 mb-6">👤 Your Profile</h1>

      <div v-if="user">
        <div class="relative mx-auto w-32 h-32">
          <img
            :src="previewImage || user.user_metadata?.image_url || '/icons/user.svg'"
            alt="Profile"
            class="w-full h-full rounded-full border border-gray-300 object-cover shadow-md"
          />
        </div>

        <div class="mt-5 flex flex-col gap-3 w-full">
          <input type="file" @change="handleFileUpload" class="hidden" ref="fileInput" />

          <button
            @click="$refs.fileInput.click()"
            class="bg-gray-100 text-gray-700 px-4 py-2 rounded hover:bg-gray-200 transition w-full text-sm"
          >
            📸 Change Picture
          </button>

          <button
            v-if="imageFile"
            @click="saveProfileImage"
            class="bg-blue-400 text-white px-4 py-2 rounded hover:bg-blue-500 transition w-full text-sm"
          >
            💾 Save Image
          </button>

          <button
            v-if="user.user_metadata?.image_url"
            @click="deleteProfileImage"
            class="bg-red-400 text-white px-4 py-2 rounded hover:bg-red-500 transition w-full text-sm"
          >
            ❌ Remove Image
          </button>
        </div>

        <div class="mt-6">
          <h2 class="text-md font-semibold text-gray-700 mb-3">🔑 Change Password</h2>
          <input
            v-model="newPassword"
            type="password"
            placeholder="New Password"
            class="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:ring-purple-300"
          />
          <button
            @click="changePassword"
            class="mt-2 bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 transition w-full text-sm"
          >
            🔄 Update Password
          </button>
        </div>

        <div class="mt-6 text-gray-700 text-sm border-t pt-4">
          <p><strong>Email:</strong> {{ user.email }}</p>
          <p class="text-xs"><strong>User ID:</strong> {{ user.id }}</p>
        </div>

        <button
          @click="logout"
          class="mt-6 bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition w-full text-sm"
        >
          Logout
        </button>
      </div>

      <p v-else class="text-red-500 mt-4">Not logged in.</p>
    </div>
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
      newPassword: '',
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

      const { error: updateError } = await supabase.auth.updateUser({ data: { image_url: url } })

      if (updateError) {
        alert('❌ Error updating user profile: ' + updateError.message)
        return
      }

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

      await supabase.auth.updateUser({ data: { image_url: null } })
      await this.fetchUserData()
    },

    async changePassword() {
      if (!this.newPassword || this.newPassword.length < 6) {
        alert('⚠️ Password must be at least 6 characters long.')
        return
      }

      const { error } = await supabase.auth.updateUser({ password: this.newPassword })
      if (error) {
        alert('❌ Error updating password: ' + error.message)
      } else {
        alert('✅ Password updated successfully!')
        this.newPassword = ''
      }
    },

    async logout() {
      await supabase.auth.signOut()
      this.user = null
      this.$router.push('/login')
    },
  },
}
</script>

<style>
body {
  background-color: #f5f5f5;
}

.bg-white {
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}
</style>
