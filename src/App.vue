<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import draggable from 'vuedraggable'
import confetti from 'canvas-confetti'
import {
  Sparkles,
  Plus,
  BookOpen,
  Calendar,
  Layers,
  Inbox
} from 'lucide-vue-next'

import BloomHeader from './components/BloomHeader.vue'
import TaskCard from './components/TaskCard.vue'
import TaskControls from './components/TaskControls.vue'
import CompletedSection from './components/CompletedSection.vue'
import TaskModal from './components/TaskModal.vue'
import AuthModal from './components/AuthModal.vue'

import {
  getTodayString,
  addDays,
  isWithinNext7Days,
  getDaysDifference
} from './utils/dateUtils'

import {
  initSupabase,
  isSupabaseConnected,
  getCurrentUser,
  onAuthStateChange,
  loadTasks,
  saveTask,
  deleteTask,
  updateTaskPositions
} from './supabase'

// =================== THEME STATE ===================
const isDark = ref(false)

function applyTheme(dark) {
  isDark.value = dark
  if (dark) {
    document.documentElement.classList.add('dark')
    localStorage.setItem('bloom_theme', 'dark')
  } else {
    document.documentElement.classList.remove('dark')
    localStorage.setItem('bloom_theme', 'light')
  }
}

function toggleTheme() {
  applyTheme(!isDark.value)
}

// =================== AUTH STATE ===================
const currentUser = ref(null)
const isConnected = ref(false)
const showAuthModal = ref(false)
const authModalTab = ref('auth')

// =================== TASK STATE ===================
const rawTasks = ref([])
const isLoading = ref(true)

// Controls & Filter state
const currentView = ref('next7') // 'next7', 'today', 'all'
const sortBy = ref('dueDate') // 'dueDate', 'custom'
const selectedSubject = ref('All')
const searchQuery = ref('')

// Modal state
const showTaskModal = ref(false)
const taskToEdit = ref(null)

// =================== LIFECYCLE ===================
onMounted(async () => {
  // 1. Initialize Theme
  const savedTheme = localStorage.getItem('bloom_theme')
  const systemPrefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
  applyTheme(savedTheme ? savedTheme === 'dark' : false) // default light pink

  // 2. Initialize Supabase Auth listener
  initSupabase()
  isConnected.value = isSupabaseConnected()

  try {
    currentUser.value = await getCurrentUser()
  } catch (e) {
    console.error('Error getting initial user', e)
  }

  onAuthStateChange((user) => {
    currentUser.value = user
    fetchTasks()
  })

  // 3. Load Tasks
  await fetchTasks()
})

async function fetchTasks() {
  isLoading.value = true
  try {
    rawTasks.value = await loadTasks(currentUser.value)
  } catch (e) {
    console.error('Failed to load tasks', e)
  } finally {
    isLoading.value = false
  }
}

// =================== RECURRING TASK EXPANSION ===================
/**
 * Expands recurring tasks into day-specific virtual task instances
 * for active dates within the 7-day window.
 */
const expandedTasks = computed(() => {
  const todayStr = getTodayString()
  const result = []

  rawTasks.value.forEach((task) => {
    if (!task.is_recurring) {
      // Normal single task
      result.push({ ...task, instanceId: task.id })
      return
    }

    // Daily Recurring Task:
    const startStr = task.recurring_start_date || task.due_date || todayStr
    const endStr = task.recurring_end_date || addDays(todayStr, 7)
    const completedDates = task.completed_recurring_dates || []

    // Expand for today through the next 7 days that fall within [start, end]
    for (let offset = 0; offset <= 7; offset++) {
      const dateForDay = addDays(todayStr, offset)
      if (dateForDay >= startStr && dateForDay <= endStr) {
        const isDoneForDay = completedDates.includes(dateForDay)
        result.push({
          ...task,
          instanceId: `${task.id}_${dateForDay}`,
          due_date: dateForDay,
          is_completed: isDoneForDay,
          is_instance: true
        })
      }
    }
  })

  return result
})

// =================== FILTERING & SEARCH ===================
const filteredTasks = computed(() => {
  const todayStr = getTodayString()

  return expandedTasks.value.filter((task) => {
    // 1. Window Filtering
    if (currentView.value === 'today') {
      if (task.due_date !== todayStr) return false
    } else if (currentView.value === 'next7') {
      // due today plus next 7 days (or overdue if not completed yet)
      const diff = getDaysDifference(task.due_date)
      const isDueTodayOrNext7 = diff >= 0 && diff <= 7
      const isOverdueAndIncomplete = diff < 0 && !task.is_completed
      if (!isDueTodayOrNext7 && !isOverdueAndIncomplete) return false
    }

    // 2. Subject Filtering
    if (selectedSubject.value !== 'All') {
      if ((task.subject || 'General').toLowerCase() !== selectedSubject.value.toLowerCase()) {
        return false
      }
    }

    // 3. Search Query
    if (searchQuery.value.trim()) {
      const q = searchQuery.value.toLowerCase()
      const titleMatch = (task.title || '').toLowerCase().includes(q)
      const descMatch = (task.description || '').toLowerCase().includes(q)
      const subMatch = (task.subject || '').toLowerCase().includes(q)
      if (!titleMatch && !descMatch && !subMatch) return false
    }

    return true
  })
})

// Separate Active and Completed
const activeTasks = computed({
  get() {
    const list = filteredTasks.value.filter((t) => !t.is_completed)

    if (sortBy.value === 'dueDate') {
      // Sort automatically by fewest remaining days
      return [...list].sort((a, b) => {
        const diffA = getDaysDifference(a.due_date)
        const diffB = getDaysDifference(b.due_date)
        return diffA - diffB
      })
    }

    // Sort by custom position
    return [...list].sort((a, b) => (a.position || 0) - (b.position || 0))
  },
  set(newOrder) {
    // When manually dragged and reordered
    newOrder.forEach((task, index) => {
      task.position = index
      const realTask = rawTasks.value.find((t) => t.id === task.id)
      if (realTask) realTask.position = index
    })
    updateTaskPositions(rawTasks.value, currentUser.value)
  }
})

const completedTasks = computed(() => {
  return filteredTasks.value.filter((t) => t.is_completed)
})

// Available subjects for filtering
const availableSubjects = computed(() => {
  const set = new Set(['All'])
  rawTasks.value.forEach((t) => {
    if (t.subject) set.add(t.subject)
  })
  return Array.from(set)
})

// Today's summary stats
const todayTasks = computed(() => {
  const todayStr = getTodayString()
  return expandedTasks.value.filter((t) => t.due_date === todayStr)
})

const todayTotalCount = computed(() => todayTasks.value.length)
const todayCompletedCount = computed(() => todayTasks.value.filter((t) => t.is_completed).length)

// =================== ACTIONS ===================
async function handleToggleComplete(task) {
  const willBeCompleted = !task.is_completed

  if (willBeCompleted) {
    // Trigger celebratory pink confetti!
    confetti({
      particleCount: 40,
      spread: 60,
      origin: { y: 0.75 },
      colors: ['#F472B6', '#EC4899', '#DB2777', '#FBCFE8', '#FFF1F6']
    })
  }

  if (task.is_instance) {
    // Recurring instance: update completed_recurring_dates array on master task
    const master = rawTasks.value.find((t) => t.id === task.id)
    if (master) {
      const dates = new Set(master.completed_recurring_dates || [])
      if (willBeCompleted) {
        dates.add(task.due_date)
      } else {
        dates.delete(task.due_date)
      }
      master.completed_recurring_dates = Array.from(dates)
      await saveTask(master, currentUser.value)
    }
  } else {
    // Normal task
    const realTask = rawTasks.value.find((t) => t.id === task.id)
    if (realTask) {
      realTask.is_completed = willBeCompleted
      await saveTask(realTask, currentUser.value)
    }
  }
}

function handleOpenNewTask() {
  taskToEdit.value = null
  showTaskModal.value = true
}

function handleEditTask(task) {
  const master = rawTasks.value.find((t) => t.id === task.id) || task
  taskToEdit.value = { ...master }
  showTaskModal.value = true
}

async function handleSaveTask(taskData) {
  try {
    const saved = await saveTask(taskData, currentUser.value)
    const index = rawTasks.value.findIndex((t) => t.id === saved.id)
    if (index !== -1) {
      rawTasks.value[index] = saved
    } else {
      rawTasks.value.push(saved)
    }
  } catch (err) {
    console.error('Failed to save task', err)
    alert('Failed to save task: ' + err.message)
  }
}

async function handleDeleteTask(taskId) {
  if (!confirm('Are you sure you want to remove this study task?')) return
  try {
    await deleteTask(taskId, currentUser.value)
    rawTasks.value = rawTasks.value.filter((t) => t.id !== taskId)
  } catch (err) {
    console.error('Failed to delete task', err)
    alert('Failed to delete task: ' + err.message)
  }
}

async function handleClearAllCompleted() {
  if (!confirm('Remove all completed study tasks?')) return

  const toRemoveIds = completedTasks.value
    .filter((t) => !t.is_instance)
    .map((t) => t.id)

  for (const id of toRemoveIds) {
    await deleteTask(id, currentUser.value)
  }

  // Clear recurring instances
  rawTasks.value.forEach((t) => {
    if (t.is_recurring) {
      t.completed_recurring_dates = []
      saveTask(t, currentUser.value)
    }
  })

  rawTasks.value = rawTasks.value.filter((t) => !toRemoveIds.includes(t.id))
}

function handleDragEnd() {
  if (sortBy.value === 'custom') {
    updateTaskPositions(rawTasks.value, currentUser.value)
  }
}

function openAuthWithTab(tab = 'auth') {
  authModalTab.value = tab
  showAuthModal.value = true
}

function handleAuthSuccess(user) {
  currentUser.value = user
  isConnected.value = isSupabaseConnected()
  fetchTasks()
}

function handleConfigUpdated() {
  isConnected.value = isSupabaseConnected()
  fetchTasks()
}
</script>

<template>
  <div class="min-h-screen bg-bloom-50 dark:bg-bloom-night transition-colors duration-300 pb-20">
    <!-- Header with Dynamic Date, Theme Switcher and Bloom Progress -->
    <BloomHeader
      :is-dark="isDark"
      :user="currentUser"
      :is-supabase-connected="isConnected"
      :today-completed-count="todayCompletedCount"
      :today-total-count="todayTotalCount"
      @toggle-theme="toggleTheme"
      @open-auth="openAuthWithTab('auth')"
      @open-settings="openAuthWithTab('supabase')"
    />

    <!-- Main Content Container -->
    <main class="max-w-4xl mx-auto px-4 sm:px-6">
      <!-- Controls Bar: Focus Window Tabs, Search, Sorting & Add Task -->
      <TaskControls
        v-model:current-view="currentView"
        v-model:sort-by="sortBy"
        v-model:selected-subject="selectedSubject"
        v-model:search-query="searchQuery"
        :available-subjects="availableSubjects"
        :active-count="activeTasks.length"
        @open-new-task="handleOpenNewTask"
      />

      <!-- Loading State -->
      <div v-if="isLoading" class="py-16 text-center">
        <div class="inline-block p-4 rounded-full bg-bloom-100 dark:bg-bloom-cardNight animate-spin mb-3">
          🌸
        </div>
        <p class="text-sm text-bloom-700 dark:text-bloom-300 font-soft">
          Blooming your study dashboard...
        </p>
      </div>

      <!-- Active Tasks Section -->
      <div v-else>
        <!-- Empty State -->
        <div
          v-if="activeTasks.length === 0"
          class="py-12 px-6 text-center rounded-3xl bg-white/60 dark:bg-bloom-cardNight/50 border border-dashed border-bloom-300 dark:border-bloom-borderNight shadow-xs"
        >
          <div class="inline-flex p-3 rounded-full bg-bloom-100 dark:bg-bloom-plum text-2xl mb-2">
            🌸
          </div>
          <h3 class="text-base font-bold text-bloom-900 dark:text-bloom-100 font-display">
            No active study tasks in this view
          </h3>
          <p class="text-xs text-bloom-600 dark:text-bloom-400 mt-1 max-w-sm mx-auto font-soft">
            You're all caught up! Plant a new task or adjust your subject and date filters.
          </p>
          <button
            @click="handleOpenNewTask"
            class="mt-4 px-4 py-2 rounded-xl bg-gradient-to-r from-bloom-500 to-bloom-600 text-white text-xs font-bold shadow-pink-glow hover:opacity-90 transition-all font-soft inline-flex items-center gap-1.5"
          >
            <Plus class="w-3.5 h-3.5" />
            <span>Add Study Task</span>
          </button>
        </div>

        <!-- Draggable Tasks List -->
        <draggable
          v-else
          v-model="activeTasks"
          item-key="instanceId"
          :disabled="sortBy !== 'custom'"
          handle=".drag-handle"
          ghost-class="ghost-card"
          drag-class="drag-card"
          class="space-y-3"
          @end="handleDragEnd"
        >
          <template #item="{ element }">
            <TaskCard
              :task="element"
              :is-drag-enabled="sortBy === 'custom'"
              @toggle-complete="handleToggleComplete"
              @edit-task="handleEditTask"
              @delete-task="handleDeleteTask"
            />
          </template>
        </draggable>

        <!-- Completed Tasks Sub-section -->
        <CompletedSection
          :completed-tasks="completedTasks"
          @toggle-complete="handleToggleComplete"
          @edit-task="handleEditTask"
          @delete-task="handleDeleteTask"
          @clear-all="handleClearAllCompleted"
        />
      </div>
    </main>

    <!-- Modals -->
    <TaskModal
      :is-open="showTaskModal"
      :task-to-edit="taskToEdit"
      @close="showTaskModal = false"
      @save="handleSaveTask"
    />

    <AuthModal
      :is-open="showAuthModal"
      :initial-tab="authModalTab"
      :user="currentUser"
      :is-supabase-connected="isConnected"
      @close="showAuthModal = false"
      @auth-success="handleAuthSuccess"
      @config-updated="handleConfigUpdated"
    />

    <!-- Mobile Quick Add Floating Action Button (FAB) -->
    <button
      @click="handleOpenNewTask"
      class="sm:hidden fixed bottom-6 right-6 w-14 h-14 rounded-full bg-gradient-to-tr from-bloom-500 to-bloom-700 text-white shadow-plum-glow flex items-center justify-center active:scale-90 transition-all z-40"
      title="Add Task"
    >
      <Plus class="w-7 h-7 stroke-[2.5]" />
    </button>
  </div>
</template>
