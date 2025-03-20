<template>
  <div
    class="min-h-screen flex flex-col items-center bg-cover bg-center bg-no-repeat"
    style="background-image: url('/background.jpg')"
  >
    <Navbar class="fixed top-0 left-0 w-full z-50" />

    <div class="absolute inset-0 pointer-events-none overflow-hidden">
      <div
        class="absolute top-10 left-10 w-16 h-16 bg-purple-400 opacity-50 rounded-full animate-float"
      ></div>
      <div
        class="absolute top-1/2 left-1/4 w-12 h-12 bg-yellow-400 opacity-50 rounded-full animate-float-slow"
      ></div>
      <div
        class="absolute bottom-10 right-10 w-20 h-20 bg-blue-400 opacity-50 rounded-full animate-float"
      ></div>
    </div>

    <div
      class="relative bg-white/50 backdrop-blur-lg shadow-2xl p-6 rounded-xl w-full max-w-3xl text-center border-2 border-purple-500 mt-16"
    >
      <router-view />
    </div>
  </div>
</template>

<script>
import Navbar from '@/components/Navbar.vue'

export default {
  components: {
    Navbar,
  },
}
</script>

<style>
body {
  font-family: 'Arial', sans-serif;
  background-color: #f3f4f6;
  margin: 0;
  padding: 0;
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-20px);
  }
}
.animate-float {
  animation: float 4s infinite ease-in-out;
}

@keyframes float-slow {
  0%,
  100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
}
.animate-float-slow {
  animation: float-slow 6s infinite ease-in-out;
}
</style>
