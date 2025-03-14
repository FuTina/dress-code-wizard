// router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import { supabase } from '@/lib/supabase'

import Home from '../views/Home.vue'
import CreateEvent from '../views/CreateEvent.vue'
import Dashboard from '../views/Dashboard.vue'
import EditEvent from '../views/EditEvent.vue'
import Login from '../views/Login.vue'
import Register from '../views/Register.vue'
import Profile from '../views/Profile.vue'
import Admin from '../views/Admin.vue'

const ADMIN_EMAILS = [import.meta.env.VITE_ADMIN_EMAIL]

const routes = [
  { path: '/', component: Home },
  { path: '/create-event', component: CreateEvent, meta: { requiresAuth: true } },
  { path: '/dashboard', component: Dashboard, meta: { requiresAuth: true } },
  { path: '/edit-event/:id', component: EditEvent, meta: { requiresAuth: true } },
  { path: '/profile', component: Profile, meta: { requiresAuth: true } },
  { path: '/login', component: Login },
  { path: '/register', component: Register },
  { path: '/admin', component: Admin, meta: { requiresAuth: true, requiresAdmin: true } },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach(async (to, from, next) => {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (to.meta.requiresAuth) {
    if (!user) {
      return next(`/login?redirect=${to.fullPath}`)
    }

    const { data: userData, error } = await supabase
      .from('users')
      .select('is_approved')
      .eq('id', user.id)
      .single()

    if (error || !userData?.is_approved) {
      await supabase.auth.signOut()
      alert('⏳ Your account is awaiting approval.')
      return next('/login')
    }
  }

  if (to.meta.requiresAdmin) {
    if (!user || !ADMIN_EMAILS.includes(user.email)) {
      alert('❌ You do not have permission to access this page.')
      return next('/dashboard')
    }
  }

  next()
})

export default router
