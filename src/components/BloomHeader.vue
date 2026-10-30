<script setup>
import { computed } from 'vue'
import { Sun, Moon, Sparkles, User, CheckCircle2 } from 'lucide-vue-next'
import { formatFullDate } from '../utils/dateUtils'

const props = defineProps({
  isDark: {
    type: Boolean,
    required: true
  },
  user: {
    type: Object,
    default: null
  },
  isSupabaseConnected: {
    type: Boolean,
    default: false
  },
  todayCompletedCount: {
    type: Number,
    default: 0
  },
  todayTotalCount: {
    type: Number,
    default: 0
  }
})

const emit = defineEmits(['toggle-theme', 'open-auth'])

const currentDateFormatted = computed(() => {
  return formatFullDate(new Date())
})

const completionPercentage = computed(() => {
  if (props.todayTotalCount === 0) return 0
  return Math.round((props.todayCompletedCount / props.todayTotalCount) * 100)
})

const bloomMoodText = computed(() => {
  if (props.todayTotalCount === 0) return 'Add your study tasks to start blooming!'
  if (completionPercentage.value === 100) return '🌸 Full Bloom! You crushed all your study goals today!'
  if (completionPercentage.value >= 50) return '🌿 Sprouting great momentum! Keep growing!'
  return '🌱 Planted your daily study goals — let’s blossom!'
})
</script>

<template>
  <header class="w-full pt-4 pb-6 px-4 sm:px-6 transition-all duration-300">
    <div class="max-w-4xl mx-auto">
      <!-- Top Bar: Date, Theme & Account -->
      <div class="flex items-center justify-between gap-3 mb-4">
        <!-- Date Badge with Floral Icon -->
        <div class="flex items-center gap-2 bg-bloom-100/90 dark:bg-bloom-cardNight px-3.5 py-1.5 rounded-full border border-bloom-200 dark:border-bloom-borderNight shadow-sm transition-all duration-300">
          <span class="text-bloom-600 dark:text-bloom-400 text-sm">🌸</span>
          <span class="text-xs sm:text-sm font-medium tracking-wide text-bloom-900 dark:text-bloom-200 capitalize font-soft">
            {{ currentDateFormatted }}
          </span>
        </div>

        <!-- Right Quick Controls -->
        <div class="flex items-center gap-2">
          <!-- Theme Toggle Switch -->
          <button
            @click="emit('toggle-theme')"
            class="relative p-2.5 rounded-full bg-bloom-100 dark:bg-bloom-cardNight border border-bloom-200 dark:border-bloom-borderNight text-bloom-700 dark:text-bloom-300 hover:bg-bloom-200 dark:hover:bg-bloom-plum/70 transition-all duration-300 shadow-sm active:scale-95"
            :title="isDark ? 'Switch to Light Pink' : 'Switch to Dark Plum'"
            aria-label="Toggle Theme"
          >
            <Moon v-if="isDark" class="w-4 h-4 text-bloom-400" />
            <Sun v-else class="w-4 h-4 text-bloom-600" />
          </button>

          <!-- Supabase Status & Account -->
          <button
            @click="emit('open-auth')"
            class="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-300 active:scale-95"
            :class="[
              user
                ? 'bg-bloom-100 dark:bg-bloom-cardNight text-bloom-900 dark:text-bloom-200 border-bloom-300 dark:border-bloom-borderNight'
                : 'bg-gradient-to-r from-bloom-500 to-bloom-600 text-white border-transparent shadow-pink-glow hover:opacity-90'
            ]"
          >
            <span
              class="w-2 h-2 rounded-full"
              :class="isSupabaseConnected ? 'bg-emerald-400 animate-pulse' : 'bg-bloom-400'"
            ></span>
            <User class="w-3.5 h-3.5" />
            <span class="hidden sm:inline">
              {{ user ? (user.email ? user.email.split('@')[0] : 'My Account') : 'Sign In / Sign Up' }}
            </span>
          </button>
        </div>
      </div>

      <!-- App Title Hero with Decorative Headings -->
      <div class="text-center py-3 sm:py-5">
        <div class="inline-flex items-center justify-center gap-2 mb-1">
          <span class="text-2xl sm:text-3xl animate-petal">🌸</span>
          <h1 class="text-3xl sm:text-4xl md:text-5xl font-decorative font-bold tracking-wider text-bloom-900 dark:text-bloom-100 drop-shadow-sm">
            Bloom Task
          </h1>
          <span class="text-2xl sm:text-3xl animate-petal" style="animation-delay: 2s;">🌺</span>
        </div>
        <p class="font-display italic text-sm sm:text-base text-bloom-700 dark:text-bloom-300/90 font-medium">
          Personalized Study & Task Tracker
        </p>
      </div>

      <!-- Daily Progress Banner (Gamified Bloom Tracker) -->
      <div class="mt-2 p-4 rounded-2xl bg-white/70 dark:bg-bloom-cardNight/80 backdrop-blur-md border border-bloom-200/80 dark:border-bloom-borderNight shadow-petal transition-all duration-300">
        <div class="flex items-center justify-between text-xs sm:text-sm font-medium mb-2">
          <span class="text-bloom-800 dark:text-bloom-200 flex items-center gap-1.5 font-soft">
            <Sparkles class="w-4 h-4 text-bloom-500" />
            Today's Progress:
            <span class="font-bold text-bloom-600 dark:text-bloom-400">
              {{ todayCompletedCount }} / {{ todayTotalCount }} Tasks
            </span>
          </span>
          <span class="font-bold text-bloom-700 dark:text-bloom-300 font-soft">
            {{ completionPercentage }}%
          </span>
        </div>

        <!-- Progress Bar with Pink Gradient -->
        <div class="w-full h-3 bg-bloom-100 dark:bg-bloom-plum/60 rounded-full overflow-hidden p-0.5 border border-bloom-200 dark:border-bloom-borderNight">
          <div
            class="h-full rounded-full bg-gradient-to-r from-bloom-400 via-bloom-500 to-bloom-700 transition-all duration-700 ease-out shadow-pink-glow"
            :style="{ width: `${completionPercentage}%` }"
          ></div>
        </div>

        <p class="mt-2 text-xs text-bloom-700 dark:text-bloom-300/80 font-soft italic text-center">
          {{ bloomMoodText }}
        </p>
      </div>
    </div>
  </header>
</template>
