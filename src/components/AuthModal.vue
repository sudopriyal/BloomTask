<script setup>
import { ref, computed } from 'vue'
import {
  X,
  Lock,
  Mail,
  Database,
  Check,
  Copy,
  LogOut,
  AlertCircle,
  Sparkles,
  ShieldCheck
} from 'lucide-vue-next'
import {
  SUPABASE_SQL_SCHEMA,
  getStoredSupabaseConfig,
  saveSupabaseConfig,
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
  },
  initialTab: {
    type: String,
    default: 'auth' // 'auth' or 'supabase'
  }
})

const emit = defineEmits(['close', 'auth-success', 'config-updated'])

const activeTab = ref(props.initialTab)
const authMode = ref('login') // 'login' or 'signup'
const email = ref('')
const password = ref('')
const isLoading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

// Supabase Connection Settings
const currentConfig = getStoredSupabaseConfig()
const supabaseUrl = ref(currentConfig.url || '')
const supabaseAnonKey = ref(currentConfig.anonKey || '')
const copiedSchema = ref(false)

async function handleAuth() {
  errorMessage.value = ''
  successMessage.value = ''

  if (!email.value || !password.value) {
    errorMessage.value = 'Please fill in both email and password.'
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
      successMessage.value = 'Account created successfully! Welcome to Bloom Task.'
    } else {
      loggedUser = await signInUser(email.value.trim(), password.value)
      successMessage.value = 'Signed in successfully! Loading your study tracker...'
    }

    emit('auth-success', loggedUser)
    setTimeout(() => {
      emit('close')
    }, 900)
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

function handleSaveSupabaseConfig() {
  errorMessage.value = ''
  successMessage.value = ''

  if (!supabaseUrl.value || !supabaseAnonKey.value) {
    // If cleared, revert to local demo
    saveSupabaseConfig('', '')
    emit('config-updated')
    successMessage.value = 'Cleared credentials — Bloom Task is running in Demo Mode.'
    return
  }

  if (!supabaseUrl.value.startsWith('http')) {
    errorMessage.value = 'Supabase Project URL must start with https://'
    return
  }

  saveSupabaseConfig(supabaseUrl.value, supabaseAnonKey.value)
  emit('config-updated')
  successMessage.value = 'Supabase credentials saved successfully!'
  setTimeout(() => {
    emit('close')
  }, 1000)
}

function copySchemaToClipboard() {
  navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA)
  copiedSchema.value = true
  setTimeout(() => {
    copiedSchema.value = false
  }, 2500)
}
</script>

<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bloom-950/60 backdrop-blur-sm transition-opacity duration-300"
    @click.self="emit('close')"
  >
    <div
      class="w-full max-w-md rounded-3xl bg-white dark:bg-bloom-cardNight border border-bloom-200 dark:border-bloom-borderNight shadow-2xl p-6 transition-all duration-300 overflow-hidden max-h-[92vh] flex flex-col"
    >
      <!-- Header -->
      <div class="flex items-center justify-between pb-3 border-b border-bloom-100 dark:border-bloom-borderNight">
        <div class="flex items-center gap-2">
          <span class="text-xl">🌸</span>
          <h2 class="text-lg font-bold font-decorative text-bloom-900 dark:text-bloom-100 tracking-wide">
            {{ user ? 'Account & Database' : 'Supabase Auth' }}
          </h2>
        </div>
        <button
          @click="emit('close')"
          class="p-2 rounded-full text-bloom-400 hover:text-bloom-700 hover:bg-bloom-100 dark:hover:bg-bloom-plum/50 transition-colors"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Navigation Tabs -->
      <div class="flex mt-4 p-1 rounded-xl bg-bloom-100 dark:bg-bloom-plum/60 border border-bloom-200 dark:border-bloom-borderNight font-soft text-xs">
        <button
          type="button"
          @click="activeTab = 'auth'"
          class="flex-1 py-1.5 rounded-lg font-semibold transition-all duration-200"
          :class="[
            activeTab === 'auth'
              ? 'bg-white dark:bg-bloom-cardNight text-bloom-900 dark:text-bloom-100 shadow-sm'
              : 'text-bloom-600 dark:text-bloom-400 hover:text-bloom-900'
          ]"
        >
          {{ user ? 'My Profile' : 'Sign In / Up' }}
        </button>
        <button
          type="button"
          @click="activeTab = 'supabase'"
          class="flex-1 py-1.5 rounded-lg font-semibold transition-all duration-200"
          :class="[
            activeTab === 'supabase'
              ? 'bg-white dark:bg-bloom-cardNight text-bloom-900 dark:text-bloom-100 shadow-sm'
              : 'text-bloom-600 dark:text-bloom-400 hover:text-bloom-900'
          ]"
        >
          Supabase Setup
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

      <!-- TAB 1: AUTHENTICATION -->
      <div v-if="activeTab === 'auth'" class="mt-4 flex-grow overflow-y-auto">
        <!-- Logged In State -->
        <div v-if="user" class="space-y-4">
          <div class="p-4 rounded-2xl bg-bloom-50 dark:bg-bloom-plum/30 border border-bloom-200 dark:border-bloom-borderNight">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-full bg-gradient-to-tr from-bloom-400 to-bloom-600 text-white flex items-center justify-center font-bold text-base shadow-petal">
                {{ user.email ? user.email.charAt(0).toUpperCase() : 'B' }}
              </div>
              <div class="min-w-0 flex-grow">
                <p class="text-xs text-bloom-600 dark:text-bloom-400 font-soft">Signed in as:</p>
                <p class="text-sm font-bold text-bloom-900 dark:text-bloom-100 truncate">
                  {{ user.email || 'Demo Student' }}
                </p>
                <span
                  class="inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full font-medium"
                  :class="user.isDemo ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'"
                >
                  {{ user.isDemo ? '🌸 Local Demo Account' : '🟢 Supabase Cloud Synced' }}
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            @click="handleSignOut"
            :disabled="isLoading"
            class="w-full py-2.5 rounded-xl border border-rose-300 dark:border-rose-900 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-bold transition-all flex items-center justify-center gap-2 font-soft"
          >
            <LogOut class="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>

        <!-- Logged Out Auth Form -->
        <div v-else>
          <!-- Sign In / Sign Up Mode Switch -->
          <div class="flex justify-center mb-4">
            <div class="inline-flex rounded-lg p-0.5 bg-bloom-100 dark:bg-bloom-plum/50 border border-bloom-200 dark:border-bloom-borderNight text-xs">
              <button
                type="button"
                @click="authMode = 'login'"
                class="px-4 py-1 rounded-md font-semibold transition-all"
                :class="authMode === 'login' ? 'bg-bloom-500 text-white shadow-xs' : 'text-bloom-700 dark:text-bloom-300'"
              >
                Sign In
              </button>
              <button
                type="button"
                @click="authMode = 'signup'"
                class="px-4 py-1 rounded-md font-semibold transition-all"
                :class="authMode === 'signup' ? 'bg-bloom-500 text-white shadow-xs' : 'text-bloom-700 dark:text-bloom-300'"
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
              <span>{{ isLoading ? 'Processing...' : (authMode === 'login' ? 'Sign In' : 'Create Account') }}</span>
            </button>
          </form>

          <p class="mt-4 text-center text-[11px] text-bloom-600 dark:text-bloom-400">
            {{ isSupabaseConnected ? 'Connected to live Supabase Auth.' : 'No Supabase URL set? Bloom Task functions smoothly in local mode!' }}
          </p>
        </div>
      </div>

      <!-- TAB 2: SUPABASE CONFIGURATION & SCHEMA -->
      <div v-if="activeTab === 'supabase'" class="mt-4 space-y-4 flex-grow overflow-y-auto">
        <div class="p-3 rounded-2xl bg-bloom-50/80 dark:bg-bloom-plum/30 border border-bloom-200 dark:border-bloom-borderNight text-xs space-y-1">
          <p class="font-bold text-bloom-900 dark:text-bloom-100 flex items-center gap-1 font-soft">
            <Database class="w-3.5 h-3.5 text-bloom-500" />
            Supabase Connection
          </p>
          <p class="text-bloom-700 dark:text-bloom-300 leading-relaxed text-[11px]">
            Connect your own Supabase project by providing the Project URL and Anon Public Key below.
          </p>
        </div>

        <div>
          <label class="block text-xs font-semibold text-bloom-800 dark:text-bloom-200 mb-1 font-soft">
            Supabase Project URL
          </label>
          <input
            v-model="supabaseUrl"
            type="text"
            placeholder="https://xyzcompany.supabase.co"
            class="w-full px-3 py-2 rounded-xl bg-bloom-50/70 dark:bg-bloom-plum/40 border border-bloom-200 dark:border-bloom-borderNight text-bloom-900 dark:text-bloom-100 text-xs font-mono focus:ring-2 focus:ring-bloom-500 focus:outline-none"
          />
        </div>

        <div>
          <label class="block text-xs font-semibold text-bloom-800 dark:text-bloom-200 mb-1 font-soft">
            Supabase Anon Public API Key
          </label>
          <input
            v-model="supabaseAnonKey"
            type="password"
            placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
            class="w-full px-3 py-2 rounded-xl bg-bloom-50/70 dark:bg-bloom-plum/40 border border-bloom-200 dark:border-bloom-borderNight text-bloom-900 dark:text-bloom-100 text-xs font-mono focus:ring-2 focus:ring-bloom-500 focus:outline-none"
          />
        </div>

        <button
          type="button"
          @click="handleSaveSupabaseConfig"
          class="w-full py-2.5 rounded-xl bg-gradient-to-r from-bloom-500 to-bloom-600 text-white text-xs font-bold shadow-pink-glow hover:opacity-95 active:scale-95 transition-all font-soft"
        >
          Save & Connect Supabase
        </button>

        <!-- Copy SQL Schema Card -->
        <div class="mt-3 p-3.5 rounded-2xl bg-white dark:bg-bloom-plum/40 border border-bloom-200 dark:border-bloom-borderNight">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-semibold text-bloom-900 dark:text-bloom-200 font-soft flex items-center gap-1.5">
              <ShieldCheck class="w-3.5 h-3.5 text-bloom-500" />
              SQL Schema for 'tasks' Table
            </span>
            <button
              type="button"
              @click="copySchemaToClipboard"
              class="text-[11px] font-bold text-bloom-600 dark:text-bloom-400 hover:text-bloom-800 flex items-center gap-1 font-soft"
            >
              <Check v-if="copiedSchema" class="w-3.5 h-3.5 text-emerald-500" />
              <Copy v-else class="w-3.5 h-3.5" />
              <span>{{ copiedSchema ? 'Copied!' : 'Copy SQL' }}</span>
            </button>
          </div>
          <p class="text-[11px] text-bloom-600 dark:text-bloom-400">
            Paste this SQL script into your Supabase Dashboard SQL Editor to initialize the single <code class="bg-bloom-100 dark:bg-bloom-plum px-1 rounded">tasks</code> table with Row Level Security.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
