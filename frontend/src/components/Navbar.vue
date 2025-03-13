<template>
  <nav class="bg-gray-900 text-white p-4 flex justify-between items-center fixed top-0 left-0 w-full shadow-xl z-50">
    <!-- Left: Logo mit Magic Wand Icon -->
    <router-link to="/" class="font-bold flex items-center gap-2 hover:text-purple-400 transition whitespace-nowrap">
      <MagicWand class="w-8 h-8 text-white" />
      <span :class="{ 'hidden': isSmallScreen }">Dress-Code Wizard</span>
      <span :class="{ 'inline': isSmallScreen, 'hidden': !isSmallScreen }">Dress-Code</span>
    </router-link>

    <!-- Center: Desktop Navigation -->
    <div class="hidden md:flex gap-6">
      <router-link v-if="user" to="/dashboard" class="hover:text-purple-400 transition">Dashboard</router-link>
      <router-link v-if="user" to="/create-event" class="hover:text-purple-400 transition">Create Event</router-link>
    </div>

    <!-- Right: User Dropdown & Mobile Menu Button -->
    <div class="flex items-center gap-2">
      <div v-if="user" class="relative">
        <button @click="toggleDropdown"
          class="bg-gray-800 px-4 py-2 rounded hover:bg-gray-700 transition flex items-center gap-2">
          <ProfileIcon class="w-8 h-8 text-white" />
          <span class="hidden sm:inline">{{ user.email.split('@')[0] }}</span>
          <span class="transition-transform transform" :class="{ 'rotate-180': dropdownOpen }">▼</span>
        </button>

        <!-- Dropdown Menü -->
        <transition name="fade">
          <div v-if="dropdownOpen" class="absolute right-0 mt-2 w-48 bg-gray-800 rounded shadow-lg">
            <router-link to="/profile" class="block px-4 py-2 hover:bg-gray-700">Profile</router-link>
            <button @click="logout" class="block px-4 py-2 hover:bg-gray-700 w-full text-left">Logout</button>
          </div>
        </transition>
      </div>

      <!-- Mobile Menu Button -->
      <button @click="toggleMobileMenu"
        class="md:hidden text-3xl focus:outline-none transition-transform"
        :class="{ 'rotate-90': mobileMenuOpen }">
        ☰
      </button>
    </div>

    <!-- Mobile Dropdown -->
    <transition name="slide">
      <div v-if="mobileMenuOpen"
        class="absolute top-16 left-0 w-full bg-gray-900 text-white shadow-md md:hidden flex flex-col z-40">
        <router-link v-if="user" to="/dashboard" class="py-2 px-6 hover:bg-gray-800">Dashboard</router-link>
        <router-link v-if="user" to="/create-event" class="py-2 px-6 hover:bg-gray-800">Create Event</router-link>

        <div v-if="user">
          <router-link to="/profile" class="py-2 px-6 hover:bg-gray-800">Profile</router-link>
          <button @click="logout" class="py-2 px-6 hover:bg-gray-800 w-full text-left">
            Logout
          </button>
        </div>

        <div v-else>
          <router-link to="/login" class="py-2 px-6 hover:bg-gray-800">Login</router-link>
          <router-link to="/register" class="py-2 px-6 hover:bg-gray-800">Register</router-link>
        </div>
      </div>
    </transition>
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
      dropdownOpen: false,
      isSmallScreen: window.innerWidth <= 444,
    }
  },
  async created() {
    this.getUser()
    supabase.auth.onAuthStateChange((event, session) => {
      this.user = session?.user || null
    })
    window.addEventListener('resize', this.checkScreenSize)
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.checkScreenSize)
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
      this.dropdownOpen = false
    },
    toggleDropdown() {
      this.dropdownOpen = !this.dropdownOpen
      this.mobileMenuOpen = false
    },
    checkScreenSize() {
      this.isSmallScreen = window.innerWidth <= 444
    },
  },
}
</script>

<style>
/* 📌 Dropdown Animation */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}

.fade-enter,
.fade-leave-to {
  opacity: 0;
}

/* 📌 Mobile Menü Animation */
.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s ease-out;
}

.slide-enter {
  transform: translateY(-100%);
}

.slide-leave-to {
  transform: translateY(-100%);
}

/* 📌 Navbar Styling */
nav {
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
}
</style>
