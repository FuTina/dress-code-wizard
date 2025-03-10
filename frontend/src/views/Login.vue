<template>
  <div class="max-w-lg mx-auto p-6 bg-white shadow-lg rounded-lg">
    <h1 class="text-xl font-bold text-center text-purple-700">🔑 Login</h1>

    <input
      v-model="email"
      type="email"
      class="w-full p-3 border rounded mb-2"
      placeholder="Email"
    />
    <input
      v-model="password"
      type="password"
      class="w-full p-3 border rounded mb-2"
      placeholder="Password"
    />

    <button
      @click="login"
      class="mt-4 bg-blue-600 text-white px-4 py-2 w-full rounded hover:bg-blue-800"
    >
      ✅ Login
    </button>

    <p class="text-center mt-4">
      No account? <router-link to="/register" class="text-blue-600">Register here</router-link>
    </p>
  </div>
</template>

<script>
import { supabase } from '@/lib/supabase'

export default {
  data() {
    return { email: '', password: '' }
  },
  methods: {
    async login() {
      const { error } = await supabase.auth.signInWithPassword({
        email: this.email,
        password: this.password,
      })

      if (error) {
        alert('❌ Login failed: ' + error.message)
      } else {
        const redirectTo = this.$route.query.redirect || '/dashboard' // ✅ Redirect to intended page or dashboard
        this.$router.push(redirectTo)
      }
    },
  },
}
</script>
