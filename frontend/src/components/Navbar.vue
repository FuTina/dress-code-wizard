<template>
  <nav
    class="bg-gray-900 text-white p-4 flex justify-between items-center fixed top-0 left-0 w-full shadow-xl z-50"
  >
    <!-- Left: Logo with Magic Wand Icon -->
    <router-link
      to="/"
      class="text-2xl font-bold flex items-center gap-2 hover:text-purple-400 transition"
    >
      <MagicWand class="w-8 h-8 text-white" />
      Dress-Code Wizard
    </router-link>

    <!-- Center: Navigation Links (Only visible if logged in) -->
    <div class="hidden md:flex gap-6">
      <router-link v-if="user" to="/dashboard" class="hover:text-purple-400 transition"
        >Dashboard</router-link
      >
      <router-link v-if="user" to="/create-event" class="hover:text-purple-400 transition"
        >Create Event</router-link
      >
    </div>

    <!-- Right: User Dropdown -->
    <div v-if="user" class="relative group">
      <button
        class="bg-gray-800 px-4 py-2 rounded hover:bg-gray-700 transition flex items-center gap-2"
      >
        <ProfileIcon class="w-8 h-8 text-white" />
        {{ user.email.split('@')[0] }}
        <span class="transition-transform transform group-hover:rotate-180">▼</span>
      </button>

      <!-- Dropdown (Shows on Hover) -->
      <div
        class="absolute right-0 mt-2 w-48 bg-gray-800 rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300"
      >
        <router-link to="/profile" class="block px-4 py-2 hover:bg-gray-700">Profile</router-link>
        <button @click="logout" class="block px-4 py-2 hover:bg-gray-700 w-full text-left">
          Logout
        </button>
      </div>
    </div>

    <!-- Show Login/Register when not logged in -->
    <div v-else class="flex gap-4">
      <router-link to="/login" class="bg-blue-500 px-4 py-2 rounded hover:bg-blue-700 transition"
        >Login</router-link
      >
      <router-link
        to="/register"
        class="bg-green-500 px-4 py-2 rounded hover:bg-green-700 transition"
        >Register</router-link
      >
    </div>

    <!-- Mobile Menu Button -->
    <button @click="toggleMobileMenu" class="md:hidden text-xl focus:outline-none">☰</button>

    <!-- Mobile Dropdown -->
    <div
      v-if="mobileMenuOpen"
      class="absolute top-16 left-0 w-full bg-gray-900 text-white shadow-md md:hidden flex flex-col"
    >
      <router-link v-if="user" to="/dashboard" class="py-2 px-6 hover:bg-gray-800"
        >Dashboard</router-link
      >
      <router-link v-if="user" to="/create-event" class="py-2 px-6 hover:bg-gray-800"
        >Create Event</router-link
      >

      <div v-if="user">
        <router-link to="/profile" class="py-2 px-6 hover:bg-gray-800">Profile</router-link>
        <button @click="logout" class="py-2 px-6 hover:bg-gray-800 w-full text-left">Logout</button>
      </div>

      <div v-else>
        <router-link to="/login" class="py-2 px-6 hover:bg-gray-800">Login</router-link>
        <router-link to="/register" class="py-2 px-6 hover:bg-gray-800">Register</router-link>
      </div>
    </div>
  </nav>
</template>

<script>
import { supabase } from '@/lib/supabase'
import MagicWand from '@/components/icons/MagicWand.vue'
import ProfileIcon from '@/components/icons/ProfileIcon.vue'

export default {
  components: {
    MagicWand,
    ProfileIcon,
  },
  data() {
    return {
      user: null,
      mobileMenuOpen: false,
    }
  },
  async created() {
    this.getUser()
    supabase.auth.onAuthStateChange((event, session) => {
      this.user = session?.user || null
    })
  },
  methods: {
    async getUser() {
      const { data } = await supabase.auth.getUser()
      this.user = data.user
    },
    async logout() {
      await supabase.auth.signOut()
      this.user = null
      this.$router.push('/')
    },
    toggleMobileMenu() {
      this.mobileMenuOpen = !this.mobileMenuOpen
    },
  },
}
</script>

<style>
/* Navbar Styling */
nav {
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
}

/* Dropdown stays open on hover */
.group:hover .group-hover\:opacity-100 {
  opacity: 1;
}
.group:hover .group-hover\:visible {
  visibility: visible;
}

/* Smooth transition for dropdown */
.transition-all {
  transition: all 0.3s ease-in-out;
}

/* Rotate arrow when hovering */
.group:hover .group-hover\:rotate-180 {
  transform: rotate(180deg);
}
</style>
