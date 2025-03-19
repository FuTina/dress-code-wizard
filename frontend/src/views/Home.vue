<template>
  <div class="flex flex-col items-center justify-center min-h-screen">
    <h1 class="text-4xl font-bold text-purple-800 drop-shadow-glow animate-bounce">
      🎭 Welcome to Dress-Code Wizard!
    </h1>
    <p class="text-lg text-gray-700 mt-2">Plan your next outfit with fun & creativity! ✨</p>

    <router-link
      to="/create-event"
      class="mt-6 bg-gradient-to-r from-purple-600 to-purple-800 text-white px-6 py-3 rounded-full shadow-lg hover:from-purple-700 hover:to-purple-900 hover:scale-105 transform transition-all duration-300 ease-in-out flex items-center justify-center gap-2"
    >
      🪄 Create New Event
    </router-link>
  </div>
</template>

<style>
/* Animation for glowing text */
@keyframes glow {
  0% {
    text-shadow: 0 0 5px rgba(128, 0, 128, 0.6);
  }
  50% {
    text-shadow: 0 0 20px rgba(128, 0, 255, 0.8);
  }
  100% {
    text-shadow: 0 0 5px rgba(128, 0, 128, 0.6);
  }
}
.drop-shadow-glow {
  animation: glow 2s infinite alternate;
}
</style>
