import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import CreateEvent from '../views/CreateEvent.vue'
import Dashboard from '../views/Dashboard.vue'
import EditEvent from '../views/EditEvent.vue'
import Login from '../views/Login.vue'
import Register from '../views/Register.vue'
import Profile from '../views/Profile.vue'
import { supabase } from '@/lib/supabase'

const routes = [
  { path: '/', component: Home },
  { path: '/create-event', component: CreateEvent, meta: { requiresAuth: true } },
  { path: '/dashboard', component: Dashboard, meta: { requiresAuth: true } },
  { path: '/edit-event/:id', component: EditEvent, meta: { requiresAuth: true } },
  { path: '/profile', component: Profile, meta: { requiresAuth: true } },
  { path: '/login', component: Login },
  { path: '/register', component: Register },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// 🔹 Redirect unauthenticated users to login page but back to original page after login
router.beforeEach(async (to, from, next) => {
  const { data: user } = await supabase.auth.getUser()

  if (to.meta.requiresAuth && !user?.user) {
    next(`/login?redirect=${to.fullPath}`) // ✅ Save intended destination
  } else {
    next()
  }
})

export default router
