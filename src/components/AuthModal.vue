<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  X,
  Lock,
  Mail,
  Check,
  LogOut,
  AlertCircle,
  Sparkles,
  UserCheck,
  ArrowLeft,
  KeyRound
} from 'lucide-vue-next'
import {
  signUpUser,
  signInUser,
  signOutUser,
  isSupabaseConnected,
  sendPasswordResetEmail,
  updateUserPassword
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

// 'login' | 'signup' | 'forgot' | 'reset'
const authMode = ref('login')
const email = ref('')
const password = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const isLoading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const showEmailConfirmNotice = ref(false)

const isConnected = computed(() => isSupabaseConnected())

// Check on open if we're in password-reset mode (came back from email link)
onMounted(() => {
  const params = new URLSearchParams(window.location.search)
  if (params.get('reset_password') === 'true') {
    authMode.value = 'reset'
  }
})

function switchMode(mode) {
  authMode.value = mode
  errorMessage.value = ''
  successMessage.value = ''
  showEmailConfirmNotice.value = false
}

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
    errorMessage.value = err.message || 'Authentication error. Please check your credentials.'
  } finally {
    isLoading.value = false
  }
}

async function handleForgotPassword() {
  errorMessage.value = ''
  successMessage.value = ''

  if (!email.value.trim()) {
    errorMessage.value = 'Please enter your email address.'
    return
  }

  isLoading.value = true
  try {
    await sendPasswordResetEmail(email.value.trim())
    successMessage.value = `Reset link sent to ${email.value.trim()}! Check your inbox and click the link to set a new password.`
  } catch (err) {
    errorMessage.value = err.message || 'Failed to send reset email. Please try again.'
  } finally {
    isLoading.value = false
  }
}

async function handleResetPassword() {
  errorMessage.value = ''
  successMessage.value = ''

  if (!newPassword.value || !confirmPassword.value) {
    errorMessage.value = 'Please fill in both password fields.'
    return
  }
  if (newPassword.value.length < 6) {
    errorMessage.value = 'Password must be at least 6 characters.'
    return
  }
  if (newPassword.value !== confirmPassword.value) {
    errorMessage.value = 'Passwords do not match.'
    return
  }

  isLoading.value = true
  try {
    await updateUserPassword(newPassword.value)
    successMessage.value = 'Password updated! You can now sign in with your new password. 🌸'
    // Clean up URL param and redirect to login
    setTimeout(() => {
      const url = new URL(window.location.href)
      url.searchParams.delete('reset_password')
      window.history.replaceState({}, '', url.toString())
      authMode.value = 'login'
      newPassword.value = ''
      confirmPassword.value = ''
    }, 2000)
  } catch (err) {
    errorMessage.value = err.message || 'Failed to update password. The reset link may have expired.'
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

const modalTitle = computed(() => {
  if (props.user) return 'My Profile'
  if (authMode.value === 'signup') return 'Create Account'
  if (authMode.value === 'forgot') return 'Reset Password'
  if (authMode.value === 'reset') return 'Set New Password'
  return 'Sign In'
})
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
              {{ modalTitle }}
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
        <span class="leading-relaxed whitespace-pre-line">{{ errorMessage }}</span>
      </div>

      <!-- Success Alert -->
      <div
        v-if="successMessage"
        class="mt-3 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs flex items-start gap-2"
      >
        <Check class="w-4 h-4 flex-shrink-0 mt-0.5" />
        <span class="leading-relaxed">{{ successMessage }}</span>
      </div>

      <!-- Email Confirmation Notice -->
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
      </div>

      <!-- ═══ LOGGED IN: Profile View ═══ -->
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

      <!-- ═══ LOGGED OUT ═══ -->
      <div v-else class="mt-4 overflow-y-auto flex-grow pr-0.5">

        <!-- ── Sign In / Sign Up tabs (only for login & signup modes) ── -->
        <div v-if="authMode === 'login' || authMode === 'signup'" class="flex justify-center mb-4">
          <div class="inline-flex rounded-xl p-0.5 bg-bloom-100 dark:bg-bloom-plum/50 border border-bloom-200 dark:border-bloom-borderNight text-xs font-soft">
            <button
              type="button"
              @click="switchMode('login')"
              class="px-4 py-1.5 rounded-lg font-semibold transition-all"
              :class="authMode === 'login' ? 'bg-bloom-500 text-white shadow-xs' : 'text-bloom-700 dark:text-bloom-300 hover:text-bloom-900'"
            >
              Sign In
            </button>
            <button
              type="button"
              @click="switchMode('signup')"
              class="px-4 py-1.5 rounded-lg font-semibold transition-all"
              :class="authMode === 'signup' ? 'bg-bloom-500 text-white shadow-xs' : 'text-bloom-700 dark:text-bloom-300 hover:text-bloom-900'"
            >
              Sign Up
            </button>
          </div>
        </div>

        <!-- ── Back button for forgot / reset views ── -->
        <button
          v-if="authMode === 'forgot'"
          type="button"
          @click="switchMode('login')"
          class="flex items-center gap-1.5 text-xs text-bloom-600 dark:text-bloom-400 hover:text-bloom-800 dark:hover:text-bloom-200 font-soft mb-4 transition-colors"
        >
          <ArrowLeft class="w-3.5 h-3.5" />
          Back to Sign In
        </button>

        <!-- ════════════ SIGN IN FORM ════════════ -->
        <form v-if="authMode === 'login'" @submit.prevent="handleAuth" class="space-y-3.5">
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
            <div class="flex items-center justify-between mb-1">
              <label class="block text-xs font-semibold text-bloom-800 dark:text-bloom-200 font-soft">
                Password
              </label>
              <button
                type="button"
                @click="switchMode('forgot')"
                class="text-[11px] text-bloom-500 hover:text-bloom-700 dark:hover:text-bloom-300 font-soft transition-colors"
              >
                Forgot password?
              </button>
            </div>
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
            <span>{{ isLoading ? 'Signing in...' : 'Sign In' }}</span>
          </button>

          <p class="text-center text-[11px] text-bloom-600 dark:text-bloom-400 font-soft">
            No account?
            <button type="button" @click="switchMode('signup')" class="text-bloom-500 font-semibold hover:underline">
              Sign Up
            </button>
          </p>
        </form>

        <!-- ════════════ SIGN UP FORM ════════════ -->
        <form v-if="authMode === 'signup'" @submit.prevent="handleAuth" class="space-y-3.5">
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
            <span>{{ isLoading ? 'Creating account...' : 'Create Account' }}</span>
          </button>

          <p class="text-center text-[11px] text-bloom-600 dark:text-bloom-400 font-soft">
            Already have an account?
            <button type="button" @click="switchMode('login')" class="text-bloom-500 font-semibold hover:underline">
              Sign In
            </button>
          </p>
        </form>

        <!-- ════════════ FORGOT PASSWORD FORM ════════════ -->
        <div v-if="authMode === 'forgot'" class="space-y-4">
          <div class="p-3.5 rounded-2xl bg-bloom-50 dark:bg-bloom-plum/30 border border-bloom-200 dark:border-bloom-borderNight text-xs text-bloom-700 dark:text-bloom-300 leading-relaxed font-soft">
            <p class="flex items-center gap-1.5 font-semibold text-bloom-800 dark:text-bloom-200 mb-1">
              <KeyRound class="w-3.5 h-3.5 text-bloom-500" />
              Forgot your password?
            </p>
            Enter the email address you signed up with and we'll send you a reset link. 🌸
          </div>

          <form @submit.prevent="handleForgotPassword" class="space-y-3.5">
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

            <button
              type="submit"
              :disabled="isLoading"
              class="w-full py-2.5 rounded-xl bg-gradient-to-r from-bloom-500 to-bloom-600 text-white text-xs font-bold shadow-pink-glow hover:opacity-95 active:scale-95 transition-all font-soft flex items-center justify-center gap-1.5"
            >
              <Mail class="w-3.5 h-3.5" />
              <span>{{ isLoading ? 'Sending...' : 'Send Reset Link' }}</span>
            </button>
          </form>
        </div>

        <!-- ════════════ SET NEW PASSWORD FORM ════════════ -->
        <div v-if="authMode === 'reset'" class="space-y-4">
          <div class="p-3.5 rounded-2xl bg-bloom-50 dark:bg-bloom-plum/30 border border-bloom-200 dark:border-bloom-borderNight text-xs text-bloom-700 dark:text-bloom-300 leading-relaxed font-soft">
            <p class="flex items-center gap-1.5 font-semibold text-bloom-800 dark:text-bloom-200 mb-1">
              <KeyRound class="w-3.5 h-3.5 text-bloom-500" />
              Set a new password
            </p>
            Choose a new password for your Bloom Task account.
          </div>

          <form @submit.prevent="handleResetPassword" class="space-y-3.5">
            <div>
              <label class="block text-xs font-semibold text-bloom-800 dark:text-bloom-200 mb-1 font-soft">
                New Password
              </label>
              <div class="relative">
                <Lock class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-bloom-400" />
                <input
                  v-model="newPassword"
                  type="password"
                  placeholder="At least 6 characters"
                  required
                  class="w-full pl-9 pr-3 py-2 rounded-xl bg-bloom-50/70 dark:bg-bloom-plum/40 border border-bloom-200 dark:border-bloom-borderNight text-bloom-900 dark:text-bloom-100 placeholder-bloom-300 dark:placeholder-bloom-600 text-xs focus:ring-2 focus:ring-bloom-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label class="block text-xs font-semibold text-bloom-800 dark:text-bloom-200 mb-1 font-soft">
                Confirm New Password
              </label>
              <div class="relative">
                <Lock class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-bloom-400" />
                <input
                  v-model="confirmPassword"
                  type="password"
                  placeholder="Repeat your new password"
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
              <KeyRound class="w-3.5 h-3.5" />
              <span>{{ isLoading ? 'Updating...' : 'Update Password' }}</span>
            </button>
          </form>
        </div>

      </div>
    </div>
  </div>
</template>
