<script setup>
import { ref } from 'vue'
import {
  X,
  Lock,
  Mail,
  Check,
  LogOut,
  AlertCircle,
  Sparkles,
  UserCheck
} from 'lucide-vue-next'
import {
  signUpUser,
  signInUser,
  signOutUser
} from '../supabase'

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  user: {
    type: Object,
    default: null
  },
  isSupabaseConnected: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close', 'auth-success'])

const authMode = ref('login') // 'login' or 'signup'
const email = ref('')
const password = ref('')
const isLoading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

async function handleAuth() {
  errorMessage.value = ''
  successMessage.value = ''

  if (!email.value || !password.value) {
    errorMessage.value = 'Please enter both your email and password.'
    return
  }

  if (password.value.length < 6) {
    errorMessage.value = 'Password should be at least 6 characters.'
    return
  }

  isLoading.value = true
  try {
    let loggedUser
    if (authMode.value === 'signup') {
      loggedUser = await signUpUser(email.value.trim(), password.value)
      successMessage.value = 'Account created successfully! Welcome to Bloom Task 🌸'
    } else {
      loggedUser = await signInUser(email.value.trim(), password.value)
      successMessage.value = 'Signed in successfully! Loading your study tracker...'
    }

    emit('auth-success', loggedUser)
    setTimeout(() => {
      emit('close')
    }, 800)
  } catch (err) {
    errorMessage.value = err.message || 'Authentication error. Please check your credentials.'
  } finally {
    isLoading.value = false
  }
}

async function handleSignOut() {
  isLoading.value = true
  try {
    await signOutUser()
    emit('auth-success', null)
    emit('close')
  } catch (err) {
    errorMessage.value = err.message || 'Failed to sign out.'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bloom-950/60 backdrop-blur-sm transition-opacity duration-300"
    @click.self="emit('close')"
  >
    <div
      class="w-full max-w-sm rounded-3xl bg-white dark:bg-bloom-cardNight border border-bloom-200 dark:border-bloom-borderNight shadow-2xl p-6 transition-all duration-300 overflow-hidden flex flex-col"
    >
      <!-- Header -->
      <div class="flex items-center justify-between pb-3 border-b border-bloom-100 dark:border-bloom-borderNight">
        <div class="flex items-center gap-2">
          <span class="text-xl">🌸</span>
          <h2 class="text-lg font-bold font-decorative text-bloom-900 dark:text-bloom-100 tracking-wide">
            {{ user ? 'My Profile' : (authMode === 'login' ? 'Sign In' : 'Create Account') }}
          </h2>
        </div>
        <button
          @click="emit('close')"
          class="p-2 rounded-full text-bloom-400 hover:text-bloom-700 hover:bg-bloom-100 dark:hover:bg-bloom-plum/50 transition-colors"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Messages -->
      <div
        v-if="errorMessage"
        class="mt-3 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/70 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2"
      >
        <AlertCircle class="w-4 h-4 flex-shrink-0" />
        <span>{{ errorMessage }}</span>
      </div>

      <div
        v-if="successMessage"
        class="mt-3 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2"
      >
        <Check class="w-4 h-4 flex-shrink-0" />
        <span>{{ successMessage }}</span>
      </div>

      <!-- Logged In Profile View -->
      <div v-if="user" class="mt-4 space-y-4">
        <div class="p-4 rounded-2xl bg-bloom-50 dark:bg-bloom-plum/30 border border-bloom-200 dark:border-bloom-borderNight">
          <div class="flex items-center gap-3">
            <div class="w-11 h-11 rounded-full bg-gradient-to-tr from-bloom-400 to-bloom-600 text-white flex items-center justify-center font-bold text-base shadow-petal font-display">
              {{ user.email ? user.email.charAt(0).toUpperCase() : 'B' }}
            </div>
            <div class="min-w-0 flex-grow">
              <p class="text-xs text-bloom-600 dark:text-bloom-400 font-soft">Logged in as:</p>
              <p class="text-sm font-bold text-bloom-900 dark:text-bloom-100 truncate">
                {{ user.email }}
              </p>
              <span class="inline-flex items-center gap-1 mt-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-300">
                <UserCheck class="w-3.5 h-3.5" />
                Study Account Active
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          @click="handleSignOut"
          :disabled="isLoading"
          class="w-full py-2.5 rounded-xl border border-rose-300 dark:border-rose-900 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-bold transition-all flex items-center justify-center gap-2 font-soft active:scale-95"
        >
          <LogOut class="w-4 h-4" />
          <span>{{ isLoading ? 'Signing Out...' : 'Sign Out' }}</span>
        </button>
      </div>

      <!-- Logged Out Auth Form -->
      <div v-else class="mt-4">
        <!-- Sign In / Sign Up Mode Switch -->
        <div class="flex justify-center mb-4">
          <div class="inline-flex rounded-xl p-0.5 bg-bloom-100 dark:bg-bloom-plum/50 border border-bloom-200 dark:border-bloom-borderNight text-xs font-soft">
            <button
              type="button"
              @click="authMode = 'login'"
              class="px-4 py-1.5 rounded-lg font-semibold transition-all"
              :class="authMode === 'login' ? 'bg-bloom-500 text-white shadow-xs' : 'text-bloom-700 dark:text-bloom-300 hover:text-bloom-900'"
            >
              Sign In
            </button>
            <button
              type="button"
              @click="authMode = 'signup'"
              class="px-4 py-1.5 rounded-lg font-semibold transition-all"
              :class="authMode === 'signup' ? 'bg-bloom-500 text-white shadow-xs' : 'text-bloom-700 dark:text-bloom-300 hover:text-bloom-900'"
            >
              Sign Up
            </button>
          </div>
        </div>

        <form @submit.prevent="handleAuth" class="space-y-3.5">
          <div>
            <label class="block text-xs font-semibold text-bloom-800 dark:text-bloom-200 mb-1 font-soft">
              Email Address
            </label>
            <div class="relative">
              <Mail class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-bloom-400" />
              <input
                v-model="email"
                type="email"
                placeholder="student@example.com"
                required
                class="w-full pl-9 pr-3 py-2 rounded-xl bg-bloom-50/70 dark:bg-bloom-plum/40 border border-bloom-200 dark:border-bloom-borderNight text-bloom-900 dark:text-bloom-100 placeholder-bloom-300 dark:placeholder-bloom-600 text-xs focus:ring-2 focus:ring-bloom-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label class="block text-xs font-semibold text-bloom-800 dark:text-bloom-200 mb-1 font-soft">
              Password
            </label>
            <div class="relative">
              <Lock class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-bloom-400" />
              <input
                v-model="password"
                type="password"
                placeholder="••••••••"
                required
                class="w-full pl-9 pr-3 py-2 rounded-xl bg-bloom-50/70 dark:bg-bloom-plum/40 border border-bloom-200 dark:border-bloom-borderNight text-bloom-900 dark:text-bloom-100 placeholder-bloom-300 dark:placeholder-bloom-600 text-xs focus:ring-2 focus:ring-bloom-500 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            :disabled="isLoading"
            class="w-full py-2.5 rounded-xl bg-gradient-to-r from-bloom-500 to-bloom-600 text-white text-xs font-bold shadow-pink-glow hover:opacity-95 active:scale-95 transition-all font-soft flex items-center justify-center gap-1.5"
          >
            <Sparkles class="w-3.5 h-3.5" />
            <span>{{ isLoading ? 'Please wait...' : (authMode === 'login' ? 'Sign In to Bloom Task' : 'Create Free Account') }}</span>
          </button>
        </form>
      </div>
    </div>
  </div>
</template>
