<template>
  <div class="max-w-md mx-auto p-6 bg-white shadow-lg rounded-lg">
    <h1 class="text-xl font-bold text-center text-purple-700">📝 Register</h1>

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
      @click="signUp"
      class="mt-4 bg-purple-600 text-white px-4 py-2 w-full rounded hover:bg-purple-800"
    >
      ✅ Register
    </button>

    <p class="mt-4 text-center text-sm">
      Already have an account?
      <router-link to="/login" class="text-purple-600">Login here</router-link>
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
    async signUp() {
      const { error } = await supabase.auth.signUp({
        email: this.email,
        password: this.password,
      })

      if (error) {
        alert(error.message)
      } else {
        alert('✅ Registration successful! Please check your email.')
        this.$router.push('/login')
      }
    },
  },
}
</script>
