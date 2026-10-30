<script setup>
import { ref, computed } from 'vue'
import {
  X,
  Lock,
  Mail,
  Check,
  LogOut,
  AlertCircle,
  Sparkles,
  UserCheck,
  Database,
  ChevronDown,
  ChevronUp,
  ExternalLink
} from 'lucide-vue-next'
import {
  signUpUser,
  signInUser,
  signOutUser,
  getStoredSupabaseConfig,
  saveSupabaseConfig,
  isSupabaseConnected
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
const showEmailConfirmNotice = ref(false)

// Optional Developer Database Connection (Expandable)
const showDevSettings = ref(false)
const storedConfig = getStoredSupabaseConfig()
const devUrl = ref(storedConfig.url || '')
const devKey = ref(storedConfig.anonKey || '')
const isConnected = computed(() => isSupabaseConnected())

async function handleAuth() {
  errorMessage.value = ''
  successMessage.value = ''
  showEmailConfirmNotice.value = false

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
      const result = await signUpUser(email.value.trim(), password.value)

      if (result.needsEmailConfirmation) {
        showEmailConfirmNotice.value = true
        successMessage.value = `Account created for ${email.value.trim()}! Please confirm your email before signing in.`
        isLoading.value = false
        return
      }

      loggedUser = result.user
      successMessage.value = 'Account created successfully! Welcome to Bloom Task 🌸'
    } else {
      const result = await signInUser(email.value.trim(), password.value)
      loggedUser = result.user
      successMessage.value = 'Signed in successfully! Loading your study tracker...'
    }

    emit('auth-success', loggedUser)
    setTimeout(() => {
      emit('close')
    }, 700)
  } catch (err) {
    if (err.message && err.message.toLowerCase().includes('failed to fetch')) {
      showDevSettings.value = true
      errorMessage.value = `Unable to connect to Supabase ('Failed to fetch').

Common causes:
1. Wrong URL format: It must be the Project API URL (e.g. 'https://your-ref.supabase.co'), NOT a 'postgres://...' connection string.
2. Typos: Note that Supabase URLs end in '.co', not '.com'.
3. Paused project: Free projects pause after 1 week. Check your Supabase dashboard.
4. Ad-blockers: Try pausing ad-blockers for localhost.

You can inspect or correct your keys below, or click 'Reset to Local Mode'.`
    } else {
      errorMessage.value = err.message || 'Authentication error. Please check your credentials.'
    }
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

function handleSaveDevSettings() {
  errorMessage.value = ''
  successMessage.value = ''

  try {
    if (!devUrl.value.trim() && !devKey.value.trim()) {
      handleResetToDemo()
      return
    }

    saveSupabaseConfig(devUrl.value, devKey.value)
    const cfg = getStoredSupabaseConfig()
    devUrl.value = cfg.url
    devKey.value = cfg.anonKey
    successMessage.value = 'Supabase credentials saved successfully! 🌸'
  } catch (e) {
    errorMessage.value = e.message
  }
}

function handleResetToDemo() {
  saveSupabaseConfig('', '')
  devUrl.value = ''
  devKey.value = ''
  errorMessage.value = ''
  successMessage.value = 'Reset to local Demo Mode. You can now sign up/in instantly!'
}
</script>

<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bloom-950/60 backdrop-blur-sm transition-opacity duration-300"
    @click.self="emit('close')"
  >
    <div
      class="w-full max-w-sm rounded-3xl bg-white dark:bg-bloom-cardNight border border-bloom-200 dark:border-bloom-borderNight shadow-2xl p-6 transition-all duration-300 overflow-hidden flex flex-col max-h-[92vh]"
    >
      <!-- Header -->
      <div class="flex items-center justify-between pb-3 border-b border-bloom-100 dark:border-bloom-borderNight">
        <div class="flex items-center gap-2">
          <span class="text-xl">🌸</span>
          <div>
            <h2 class="text-lg font-bold font-decorative text-bloom-900 dark:text-bloom-100 tracking-wide leading-tight">
              {{ user ? 'My Profile' : (authMode === 'login' ? 'Sign In' : 'Create Account') }}
            </h2>
            <div class="flex items-center gap-1.5 mt-0.5">
              <span
                class="w-1.5 h-1.5 rounded-full"
                :class="isConnected ? 'bg-emerald-500' : 'bg-amber-400'"
              ></span>
              <span class="text-[10px] text-bloom-600 dark:text-bloom-400 font-soft">
                {{ isConnected ? 'Supabase Connected' : 'Local Demo Mode' }}
              </span>
            </div>
          </div>
        </div>
        <button
          @click="emit('close')"
          class="p-2 rounded-full text-bloom-400 hover:text-bloom-700 hover:bg-bloom-100 dark:hover:bg-bloom-plum/50 transition-colors"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Error Alert -->
      <div
        v-if="errorMessage"
        class="mt-3 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/70 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2"
      >
        <AlertCircle class="w-4 h-4 flex-shrink-0 mt-0.5" />
        <span class="leading-relaxed">{{ errorMessage }}</span>
      </div>

      <!-- Success Alert -->
      <div
        v-if="successMessage"
        class="mt-3 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs flex items-start gap-2"
      >
        <Check class="w-4 h-4 flex-shrink-0 mt-0.5" />
        <span class="leading-relaxed">{{ successMessage }}</span>
      </div>

      <!-- Email Confirmation Instructions Notice -->
      <div
        v-if="showEmailConfirmNotice"
        class="mt-3 p-3.5 rounded-2xl bg-bloom-100/80 dark:bg-bloom-plum/60 border border-bloom-300 dark:border-bloom-borderNight text-xs space-y-2 text-bloom-900 dark:text-bloom-100"
      >
        <p class="font-bold font-soft flex items-center gap-1.5 text-bloom-800 dark:text-bloom-200">
          <span>📧</span> Action Required: Check Your Email
        </p>
        <p class="text-[11px] leading-relaxed text-bloom-700 dark:text-bloom-300">
          Supabase requires email confirmation before you can log in. Click the link in your inbox, then come back here and click <strong>Sign In</strong>.
        </p>
        <div class="pt-1.5 border-t border-bloom-200 dark:border-bloom-borderNight text-[10px] text-bloom-600 dark:text-bloom-400">
          💡 <em>Pro-tip:</em> In your Supabase Dashboard, go to <strong>Authentication &gt; Providers &gt; Email</strong> and turn off <strong>"Confirm email"</strong> if you want users to log in immediately without waiting for confirmation emails.
        </div>
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
      <div v-else class="mt-4 overflow-y-auto flex-grow pr-0.5">
        <!-- Sign In / Sign Up Mode Switch -->
        <div class="flex justify-center mb-4">
          <div class="inline-flex rounded-xl p-0.5 bg-bloom-100 dark:bg-bloom-plum/50 border border-bloom-200 dark:border-bloom-borderNight text-xs font-soft">
            <button
              type="button"
              @click="authMode = 'login'; errorMessage = ''; successMessage = ''"
              class="px-4 py-1.5 rounded-lg font-semibold transition-all"
              :class="authMode === 'login' ? 'bg-bloom-500 text-white shadow-xs' : 'text-bloom-700 dark:text-bloom-300 hover:text-bloom-900'"
            >
              Sign In
            </button>
            <button
              type="button"
              @click="authMode = 'signup'; errorMessage = ''; successMessage = ''"
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
                placeholder="At least 6 characters"
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
            <span>{{ isLoading ? 'Please wait...' : (authMode === 'login' ? 'Sign In' : 'Create Account') }}</span>
          </button>
        </form>

        <!-- Optional Developer / Admin Connection Accordion -->
        <div class="mt-5 pt-3 border-t border-dashed border-bloom-200 dark:border-bloom-borderNight">
          <button
            type="button"
            @click="showDevSettings = !showDevSettings"
            class="w-full flex items-center justify-between text-[11px] text-bloom-500 hover:text-bloom-700 dark:hover:text-bloom-300 font-soft transition-colors"
          >
            <span class="flex items-center gap-1">
              <Database class="w-3.5 h-3.5" />
              Database Connection Keys
            </span>
            <ChevronUp v-if="showDevSettings" class="w-3 h-3" />
            <ChevronDown v-else class="w-3 h-3" />
          </button>

          <div v-if="showDevSettings" class="mt-2.5 space-y-2.5 p-3 rounded-xl bg-bloom-50/70 dark:bg-bloom-plum/30 border border-bloom-200 dark:border-bloom-borderNight text-xs">
            <p class="text-[10px] text-bloom-600 dark:text-bloom-400">
              Paste your Supabase credentials here if you haven't created a <code class="bg-bloom-100 dark:bg-bloom-plum px-1 rounded">.env</code> file:
            </p>
            <input
              v-model="devUrl"
              type="text"
              placeholder="https://xyz.supabase.co"
              class="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-bloom-cardNight border border-bloom-200 dark:border-bloom-borderNight text-[11px] font-mono focus:ring-1 focus:ring-bloom-400 focus:outline-none"
            />
            <input
              v-model="devKey"
              type="password"
              placeholder="Anon Public API Key"
              class="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-bloom-cardNight border border-bloom-200 dark:border-bloom-borderNight text-[11px] font-mono focus:ring-1 focus:ring-bloom-400 focus:outline-none"
            />
            <div class="flex items-center gap-2">
              <button
                type="button"
                @click="handleSaveDevSettings"
                class="flex-1 py-1.5 rounded-lg bg-bloom-500 hover:bg-bloom-600 text-white text-[11px] font-bold font-soft transition-colors shadow-2xs"
              >
                Save Keys
              </button>
              <button
                type="button"
                @click="handleResetToDemo"
                class="px-2.5 py-1.5 rounded-lg border border-bloom-300 dark:border-bloom-borderNight text-bloom-700 dark:text-bloom-300 hover:bg-bloom-100 text-[11px] font-medium font-soft transition-colors"
                title="Clear credentials and use local storage demo"
              >
                Reset to Local
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
