<template>
  <nav
    class="bg-gray-900 text-white p-4 flex justify-between items-center fixed top-0 left-0 w-full shadow-xl z-50"
  >
    <!-- Left: Logo with Magic Wand Icon -->
    <router-link
      to="/"
      class="font-bold flex items-center gap-2 hover:text-purple-400 transition whitespace-nowrap"
    >
      <MagicWand class="w-8 h-8 text-white" />
      <span v-if="!isSmallScreen">Dress-Code Wizard</span>
      <span v-else>DCW</span>
    </router-link>

    <!-- Center: Desktop Navigation -->
    <div class="hidden md:flex gap-6">
      <router-link v-if="user" to="/dashboard" class="nav-link">
        <i class="fas fa-home"></i> Dashboard
      </router-link>
      <router-link v-if="user" to="/create-event" class="nav-link">
        <i class="fas fa-calendar-plus"></i> Create Event
      </router-link>
    </div>

    <!-- Right: Profile + Mobile Menu Button -->
    <div class="flex items-center gap-4">
      <!-- Profile Dropdown (Visible only on large screens) -->
      <div v-if="user && !isSmallScreen" class="relative">
        <button
          @click="toggleDropdown"
          class="bg-gray-800 px-4 py-2 rounded hover:bg-gray-700 transition flex items-center gap-2"
        >
          <!-- Profile picture or fallback icon -->
          <img
            v-if="user.user_metadata?.image_url"
            :src="user.user_metadata.image_url"
            alt="Profile Picture"
            class="w-8 h-8 rounded-full border border-gray-500 object-cover shadow"
          />
          <ProfileIcon v-else class="w-8 h-8 text-white" />

          <span class="hidden sm:inline">{{ user.email.split('@')[0] }}</span>
          <span class="transition-transform transform" :class="{ 'rotate-180': dropdownOpen }"
            >▼</span
          >
        </button>

        <!-- Dropdown Menu -->
        <transition name="fade">
          <div v-if="dropdownOpen" class="absolute right-0 mt-2 w-48 bg-gray-800 rounded shadow-lg">
            <router-link to="/profile" class="menu-item">
              <i class="fas fa-user"></i> Profile
            </router-link>
            <button @click="logout" class="menu-item text-left w-full">
              <i class="fas fa-sign-out-alt"></i> Logout
            </button>
          </div>
        </transition>
      </div>

      <!-- Mobile Menu Button -->
      <button
        @click="toggleMobileMenu"
        class="md:hidden text-3xl focus:outline-none transition-transform"
      >
        ☰
      </button>
    </div>

    <!-- Mobile Dropdown -->
    <transition name="slide">
      <div
        v-if="mobileMenuOpen"
        class="absolute top-16 left-0 w-full bg-gray-900 text-white shadow-md md:hidden flex flex-col z-40"
      >
        <router-link v-if="user" to="/dashboard" class="menu-item">
          <i class="fas fa-home"></i> Dashboard
        </router-link>
        <router-link v-if="user" to="/create-event" class="menu-item">
          <i class="fas fa-calendar-plus"></i> Create Event
        </router-link>

        <!-- Profile & Logout only on mobile screens -->
        <div v-if="user">
          <router-link to="/profile" class="menu-item">
            <i class="fas fa-user"></i> Profile
          </router-link>
          <button @click="logout" class="menu-item text-left w-full">
            <i class="fas fa-sign-out-alt"></i> Logout
          </button>
        </div>

        <!-- Login/Register for unauthenticated users -->
        <div v-else>
          <router-link to="/login" class="menu-item">
            <i class="fas fa-sign-in-alt"></i> Login
          </router-link>
          <router-link to="/register" class="menu-item">
            <i class="fas fa-user-plus"></i> Register
          </router-link>
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
  components: { MagicWand, ProfileIcon },
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
      if (data.user) {
        this.user = {
          ...data.user,
          user_metadata: data.user.user_metadata || {}, // Ensure user_metadata exists
        }
      }
    },
    async logout() {
      await supabase.auth.signOut()
      this.user = null
      this.$router.push('/login')
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
/* 🌙 Mobile Menu */
.menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  transition: background 0.3s ease-in-out;
}

.menu-item:hover {
  background-color: #2d3748;
}

/* 🌟 Desktop Navigation */
.nav-link {
  display: flex;
  align-items: center;
  gap: 6px;
  transition: color 0.3s ease-in-out;
}

.nav-link:hover {
  color: #b794f4;
}

/* 📌 Mobile Menu Animation */
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

/* 📌 Dropdown Animation */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}

.fade-enter,
.fade-leave-to {
  opacity: 0;
}

/* 📌 Navbar Styling */
nav {
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
}
</style>
