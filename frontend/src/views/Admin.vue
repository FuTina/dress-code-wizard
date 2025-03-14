<template>
  <div class="max-w-4xl mx-auto p-6">
    <h1 class="text-2xl font-bold text-center mb-4">👤 User Approval</h1>

    <table class="min-w-full bg-white shadow-md rounded-xl">
      <thead class="bg-gray-200 text-left">
        <tr>
          <th class="py-2 px-4">📧 Email</th>
          <th class="py-2 px-4">📅 Registered At</th>
          <th class="py-2 px-4 text-center">✅ Action</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="user in users" :key="user.id" class="border-t">
          <td class="py-2 px-4">{{ user.email }}</td>
          <td class="py-2 px-4">{{ new Date(user.created_at).toLocaleDateString('en-US') }}</td>
          <td class="py-2 px-4 text-center">
            <button
              @click="approveUser(user.id)"
              class="bg-green-400 hover:bg-green-500 px-3 py-1 rounded-lg text-white transition"
            >
              Approve
            </button>
          </td>
        </tr>
      </tbody>
    </table>

    <p v-if="users.length === 0" class="text-center mt-4 text-gray-500">✅ All users approved.</p>
  </div>
</template>

<script>
import { supabase } from '@/lib/supabase'

export default {
  data() {
    return {
      users: [],
    }
  },

  async mounted() {
    await this.loadUnapprovedUsers()
  },

  methods: {
    async loadUnapprovedUsers() {
      const { data, error } = await supabase
        .from('users')
        .select('id, email, created_at')
        .eq('is_approved', false)

      if (error) {
        console.error('Error:', error)
      } else {
        this.users = data
      }
    },

    async approveUser(userId) {
      const { error } = await supabase.from('users').update({ is_approved: true }).eq('id', userId)

      if (error) {
        alert('❌ Error approving user')
      } else {
        this.users = this.users.filter((user) => user.id !== userId)
        alert('✅ User approved')
      }
    },
  },
}
</script>
