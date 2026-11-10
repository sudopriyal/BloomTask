<script setup>
import { ref, computed, onUnmounted, watch } from 'vue'
import { ArrowLeft, Play, Pause, RotateCcw, Plus, CheckCircle2, Timer } from 'lucide-vue-next'
import confetti from 'canvas-confetti'

const props = defineProps({
  task: {
    type: Object,
    required: true
  },
  isDark: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['back', 'mark-complete'])

// =================== TIMER SETUP STATE ===================
const isSetup = ref(true)   // show time-picker or timer
const hours = ref(0)
const minutes = ref(25)

// =================== TIMER STATE ===================
const totalSeconds = ref(0)
const remainingSeconds = ref(0)
const isRunning = ref(false)
const isFinished = ref(false)
let intervalId = null

// =================== COMPUTED ===================
const displayHours = computed(() => Math.floor(remainingSeconds.value / 3600))
const displayMinutes = computed(() => Math.floor((remainingSeconds.value % 3600) / 60))
const displaySeconds = computed(() => remainingSeconds.value % 60)

const pad = (n) => String(n).padStart(2, '0')

const timeDisplay = computed(() =>
  displayHours.value > 0
    ? `${pad(displayHours.value)}:${pad(displayMinutes.value)}:${pad(displaySeconds.value)}`
    : `${pad(displayMinutes.value)}:${pad(displaySeconds.value)}`
)

const progressPercent = computed(() => {
  if (totalSeconds.value === 0) return 0
  return ((totalSeconds.value - remainingSeconds.value) / totalSeconds.value) * 100
})

const circumference = 2 * Math.PI * 120  // radius=120

// =================== ACTIONS ===================
function startTimer() {
  const secs = hours.value * 3600 + minutes.value * 60
  if (secs <= 0) return
  totalSeconds.value = secs
  remainingSeconds.value = secs
  isSetup.value = false
  isRunning.value = true
  tick()
}

function tick() {
  intervalId = setInterval(() => {
    if (remainingSeconds.value <= 0) {
      clearInterval(intervalId)
      isRunning.value = false
      isFinished.value = true
      return
    }
    remainingSeconds.value--
  }, 1000)
}

function togglePause() {
  if (isRunning.value) {
    clearInterval(intervalId)
    isRunning.value = false
  } else {
    isRunning.value = true
    tick()
  }
}

function resetTimer() {
  clearInterval(intervalId)
  isRunning.value = false
  isFinished.value = false
  remainingSeconds.value = totalSeconds.value
}

function addMinutes(mins) {
  remainingSeconds.value += mins * 60
  totalSeconds.value += mins * 60
}

function goBackToSetup() {
  clearInterval(intervalId)
  isRunning.value = false
  isFinished.value = false
  isSetup.value = true
}

function markDone() {
  clearInterval(intervalId)
  isRunning.value = false
  // Big colorful confetti burst
  confetti({
    particleCount: 150,
    spread: 90,
    origin: { y: 0.5 },
    colors: ['#F472B6', '#EC4899', '#DB2777', '#FBCFE8', '#FFF1F6', '#a855f7', '#f9a8d4']
  })
  setTimeout(() => {
    confetti({
      particleCount: 80,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.6 },
      colors: ['#F472B6', '#EC4899', '#DB2777']
    })
    confetti({
      particleCount: 80,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.6 },
      colors: ['#FBCFE8', '#FFF1F6', '#a855f7']
    })
  }, 250)
  emit('mark-complete', props.task)
}

onUnmounted(() => {
  clearInterval(intervalId)
})
</script>

<template>
  <div class="min-h-screen bg-bloom-50 dark:bg-bloom-night transition-colors duration-300 flex flex-col">

    <!-- Top Bar -->
    <div class="w-full px-4 sm:px-6 pt-4 pb-2 flex items-center gap-3 max-w-2xl mx-auto">
      <button
        @click="emit('back')"
        class="p-2 rounded-full bg-white/80 dark:bg-bloom-cardNight border border-bloom-200 dark:border-bloom-borderNight text-bloom-700 dark:text-bloom-300 hover:bg-bloom-100 dark:hover:bg-bloom-plum/60 transition-all shadow-sm active:scale-90"
        title="Back to tasks"
      >
        <ArrowLeft class="w-5 h-5" />
      </button>
      <span class="text-xs text-bloom-500 dark:text-bloom-400 font-soft">Focus Session</span>
    </div>

    <!-- Task Name Heading -->
    <div class="text-center px-6 pt-2 pb-1 max-w-2xl mx-auto w-full">
      <p class="text-xs font-medium text-bloom-500 dark:text-bloom-400 uppercase tracking-widest font-soft mb-1">Now Working On</p>
      <h2 class="text-xl sm:text-2xl font-bold text-bloom-900 dark:text-bloom-100 font-display leading-snug">
        {{ task.title }}
      </h2>
      <span v-if="task.subject && task.subject !== 'General'"
        class="inline-block mt-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-bloom-100 dark:bg-bloom-plum/70 text-bloom-700 dark:text-bloom-300 border border-bloom-200 dark:border-bloom-700 font-soft">
        {{ task.subject }}
      </span>
    </div>

    <!-- Main Area -->
    <div class="flex-1 flex flex-col items-center justify-center px-6 pb-10 gap-8">

      <!-- ===== SETUP: Time Picker ===== -->
      <div v-if="isSetup" class="w-full max-w-sm flex flex-col items-center gap-6">
        <div class="text-center">
          <div class="inline-flex p-4 rounded-full bg-bloom-100 dark:bg-bloom-plum/50 text-3xl mb-3">
            <Timer class="w-10 h-10 text-bloom-500" />
          </div>
          <p class="text-sm text-bloom-700 dark:text-bloom-300 font-soft">How long do you want to focus?</p>
        </div>

        <!-- Time Inputs -->
        <div class="flex items-center gap-4">
          <!-- Hours -->
          <div class="flex flex-col items-center gap-1.5">
            <label class="text-xs text-bloom-500 dark:text-bloom-400 font-soft uppercase tracking-wider">Hours</label>
            <div class="flex flex-col items-center bg-white dark:bg-bloom-cardNight border border-bloom-200 dark:border-bloom-borderNight rounded-2xl overflow-hidden shadow-sm">
              <button @click="hours = Math.min(hours + 1, 23)"
                class="px-5 py-2 text-bloom-500 hover:bg-bloom-50 dark:hover:bg-bloom-plum/40 transition-colors text-lg font-bold">+</button>
              <span class="text-4xl font-bold font-display text-bloom-900 dark:text-bloom-100 px-4 py-1 min-w-[4rem] text-center">{{ pad(hours) }}</span>
              <button @click="hours = Math.max(hours - 1, 0)"
                class="px-5 py-2 text-bloom-500 hover:bg-bloom-50 dark:hover:bg-bloom-plum/40 transition-colors text-lg font-bold">−</button>
            </div>
          </div>

          <span class="text-3xl font-bold text-bloom-300 dark:text-bloom-600 pb-2">:</span>

          <!-- Minutes -->
          <div class="flex flex-col items-center gap-1.5">
            <label class="text-xs text-bloom-500 dark:text-bloom-400 font-soft uppercase tracking-wider">Minutes</label>
            <div class="flex flex-col items-center bg-white dark:bg-bloom-cardNight border border-bloom-200 dark:border-bloom-borderNight rounded-2xl overflow-hidden shadow-sm">
              <button @click="minutes = Math.min(minutes + 5, 59)"
                class="px-5 py-2 text-bloom-500 hover:bg-bloom-50 dark:hover:bg-bloom-plum/40 transition-colors text-lg font-bold">+</button>
              <span class="text-4xl font-bold font-display text-bloom-900 dark:text-bloom-100 px-4 py-1 min-w-[4rem] text-center">{{ pad(minutes) }}</span>
              <button @click="minutes = Math.max(minutes - 5, 0)"
                class="px-5 py-2 text-bloom-500 hover:bg-bloom-50 dark:hover:bg-bloom-plum/40 transition-colors text-lg font-bold">−</button>
            </div>
          </div>
        </div>

        <!-- Quick Presets -->
        <div class="flex flex-wrap justify-center gap-2">
          <button v-for="preset in [{h:0,m:5},{h:0,m:15},{h:0,m:25},{h:0,m:45},{h:1,m:0}]"
            :key="preset.m + preset.h*60"
            @click="hours = preset.h; minutes = preset.m"
            class="px-3 py-1.5 rounded-xl text-xs font-semibold border font-soft transition-all"
            :class="hours === preset.h && minutes === preset.m
              ? 'bg-bloom-500 text-white border-bloom-500 shadow-pink-glow'
              : 'bg-white dark:bg-bloom-cardNight border-bloom-200 dark:border-bloom-borderNight text-bloom-700 dark:text-bloom-300 hover:bg-bloom-50'"
          >
            {{ preset.h > 0 ? preset.h + 'h' : '' }}{{ preset.m > 0 ? preset.m + 'm' : '' }}
          </button>
        </div>

        <!-- Start Button -->
        <button
          @click="startTimer"
          :disabled="hours === 0 && minutes === 0"
          class="w-full max-w-xs py-4 rounded-2xl bg-gradient-to-r from-bloom-500 to-bloom-700 text-white font-bold text-base shadow-pink-glow hover:opacity-90 active:scale-95 disabled:opacity-40 transition-all flex items-center justify-center gap-2 font-soft"
        >
          <Play class="w-5 h-5" />
          Start Focus Session
        </button>
      </div>

      <!-- ===== ACTIVE TIMER ===== -->
      <div v-else class="w-full max-w-sm flex flex-col items-center gap-6">

        <!-- Circular Progress Timer -->
        <div class="relative flex items-center justify-center">
          <svg class="w-72 h-72 sm:w-80 sm:h-80 -rotate-90" viewBox="0 0 280 280">
            <!-- Track -->
            <circle
              cx="140" cy="140" r="120"
              fill="none"
              stroke-width="10"
              class="stroke-bloom-100 dark:stroke-bloom-plum/60"
            />
            <!-- Progress arc -->
            <circle
              cx="140" cy="140" r="120"
              fill="none"
              stroke-width="10"
              stroke-linecap="round"
              :stroke-dasharray="circumference"
              :stroke-dashoffset="circumference - (progressPercent / 100) * circumference"
              class="stroke-bloom-500 transition-all duration-1000"
            />
          </svg>

          <!-- Center Content -->
          <div class="absolute inset-0 flex flex-col items-center justify-center gap-1">
            <span class="text-5xl sm:text-6xl font-bold font-display text-bloom-900 dark:text-bloom-100 tabular-nums tracking-tight">
              {{ timeDisplay }}
            </span>
            <span class="text-xs text-bloom-500 dark:text-bloom-400 font-soft">
              {{ isFinished ? '🎉 Time's up!' : isRunning ? 'Focus in progress...' : 'Paused' }}
            </span>
          </div>
        </div>

        <!-- Timer Controls -->
        <div class="flex items-center gap-3">
          <!-- Reset -->
          <button
            @click="resetTimer"
            class="p-3 rounded-full bg-white dark:bg-bloom-cardNight border border-bloom-200 dark:border-bloom-borderNight text-bloom-500 hover:bg-bloom-50 dark:hover:bg-bloom-plum/50 transition-all shadow-sm active:scale-90"
            title="Reset timer"
          >
            <RotateCcw class="w-5 h-5" />
          </button>

          <!-- Play/Pause -->
          <button
            @click="isFinished ? resetTimer() : togglePause()"
            class="px-8 py-4 rounded-2xl bg-gradient-to-r from-bloom-500 to-bloom-700 text-white font-bold shadow-pink-glow hover:opacity-90 active:scale-95 transition-all flex items-center gap-2 font-soft"
          >
            <component :is="isRunning ? Pause : Play" class="w-5 h-5" />
            <span>{{ isRunning ? 'Pause' : isFinished ? 'Restart' : 'Resume' }}</span>
          </button>

          <!-- Reconfigure -->
          <button
            @click="goBackToSetup"
            class="p-3 rounded-full bg-white dark:bg-bloom-cardNight border border-bloom-200 dark:border-bloom-borderNight text-bloom-500 hover:bg-bloom-50 dark:hover:bg-bloom-plum/50 transition-all shadow-sm active:scale-90"
            title="Change duration"
          >
            <Timer class="w-5 h-5" />
          </button>
        </div>

        <!-- Add Time Buttons -->
        <div class="flex items-center gap-2">
          <span class="text-xs text-bloom-500 dark:text-bloom-400 font-soft mr-1">Add time:</span>
          <button
            @click="addMinutes(5)"
            class="flex items-center gap-1 px-3.5 py-2 rounded-xl bg-white dark:bg-bloom-cardNight border border-bloom-200 dark:border-bloom-borderNight text-bloom-700 dark:text-bloom-300 text-xs font-semibold hover:bg-bloom-50 dark:hover:bg-bloom-plum/50 transition-all shadow-sm font-soft active:scale-95"
          >
            <Plus class="w-3.5 h-3.5 text-bloom-500" />
            5 min
          </button>
          <button
            @click="addMinutes(10)"
            class="flex items-center gap-1 px-3.5 py-2 rounded-xl bg-white dark:bg-bloom-cardNight border border-bloom-200 dark:border-bloom-borderNight text-bloom-700 dark:text-bloom-300 text-xs font-semibold hover:bg-bloom-50 dark:hover:bg-bloom-plum/50 transition-all shadow-sm font-soft active:scale-95"
          >
            <Plus class="w-3.5 h-3.5 text-bloom-500" />
            10 min
          </button>
        </div>

        <!-- Mark Task Done -->
        <button
          @click="markDone"
          class="w-full max-w-xs py-3.5 rounded-2xl border-2 border-emerald-400 dark:border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold text-sm hover:bg-emerald-100 dark:hover:bg-emerald-950/60 active:scale-95 transition-all flex items-center justify-center gap-2 font-soft shadow-sm"
        >
          <CheckCircle2 class="w-5 h-5" />
          Mark Task as Done 🎉
        </button>
      </div>
    </div>
  </div>
</template>
