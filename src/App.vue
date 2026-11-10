<script setup>
import { ref, computed, onMounted } from 'vue'
import draggable from 'vuedraggable'
import confetti from 'canvas-confetti'
import {
  Sparkles,
  Plus
} from 'lucide-vue-next'

import BloomHeader from './components/BloomHeader.vue'
import TaskCard from './components/TaskCard.vue'
import TaskControls from './components/TaskControls.vue'
import CompletedSection from './components/CompletedSection.vue'
import TaskModal from './components/TaskModal.vue'
import AuthModal from './components/AuthModal.vue'
import SubjectManagerModal from './components/SubjectManagerModal.vue'
import FocusTimer from './components/FocusTimer.vue'

import {
  getTodayString,
  addDays,
  getDaysDifference
} from './utils/dateUtils'

import {
  initSupabase,
  isSupabaseConnected,
  getCurrentUser,
  onAuthStateChange,
  loadProfile,
  updateProfile,
  loadSubjects,
  createSubject,
  deleteSubject,
  loadCompletions,
  setTaskCompletionDate,
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

async function toggleTheme() {
  const newTheme = !isDark.value
  applyTheme(newTheme)
  if (currentUser.value) {
    await updateProfile({ theme_preference: newTheme ? 'dark' : 'light' }, currentUser.value)
  }
}

// =================== AUTH & PROFILE STATE ===================
const currentUser = ref(null)
const userProfile = ref(null)
const isConnected = ref(false)
const showAuthModal = ref(false)
const showSubjectsModal = ref(false)
const focusTask = ref(null)

// =================== DATA STATE (MULTI-TABLE) ===================
const rawTasks = ref([])
const dbSubjects = ref([])
const dbCompletions = ref([])
const isLoading = ref(true)

// Controls & Filter state
const currentView = ref('next7') // 'next7', 'today', 'all'
const sortBy = ref('dueDate') // 'dueDate', 'custom'
const layoutMode = ref('list') // 'list', 'grouped'
const selectedSubject = ref('All')
const searchQuery = ref('')

// Modal state
const showTaskModal = ref(false)
const taskToEdit = ref(null)

// =================== LIFECYCLE ===================
onMounted(async () => {
  // 1. Purge any stale mock demo items and default subjects
  localStorage.removeItem('bloom_task_local_items')
  localStorage.removeItem('bloom_task_local_subjects')

  // 2. Initialize Theme from local cache
  const savedTheme = localStorage.getItem('bloom_theme')
  applyTheme(savedTheme ? savedTheme === 'dark' : false)

  // 3. Initialize Supabase Auth listener
  initSupabase()
  isConnected.value = isSupabaseConnected()

  try {
    currentUser.value = await getCurrentUser()
  } catch (e) {
    console.error('Error getting initial user', e)
  }

  onAuthStateChange((user) => {
    currentUser.value = user
    refreshAllData()
  })

  // 4. Load All Data (Profiles, Subjects, Completions, Tasks)
  await refreshAllData()
})

async function refreshAllData() {
  isLoading.value = true
  try {
    const [profile, subjects, completions, tasks] = await Promise.all([
      loadProfile(currentUser.value),
      loadSubjects(currentUser.value),
      loadCompletions(currentUser.value),
      loadTasks(currentUser.value)
    ])

    userProfile.value = profile
    if (profile?.theme_preference) {
      applyTheme(profile.theme_preference === 'dark')
    }

    // Load only real database topics (ignore legacy mock sub- IDs)
    dbSubjects.value = (subjects || []).filter((s) => !s.id?.startsWith('sub-'))
    dbCompletions.value = completions || []
    rawTasks.value = (tasks || []).filter((t) => !t.id?.startsWith('demo-'))
  } catch (e) {
    console.error('Failed to load multi-table database records', e)
  } finally {
    isLoading.value = false
  }
}

// =================== RECURRING TASK EXPANSION (ATOMIC DB COMPLETIONS) ===================
/**
 * Expands recurring tasks into day-specific virtual task instances
 * for active dates within the 7-day window.
 * Completed status is read atomically from the `task_completions` database table.
 */
const expandedTasks = computed(() => {
  const todayStr = getTodayString()
  const result = []

  rawTasks.value.forEach((task) => {
    if (!task.is_recurring) {
      result.push({ ...task, instanceId: task.id })
      return
    }

    const startStr = task.recurring_start_date || task.due_date || todayStr
    const endStr = task.recurring_end_date || addDays(todayStr, 7)

    for (let offset = 0; offset <= 7; offset++) {
      const dateForDay = addDays(todayStr, offset)
      if (dateForDay >= startStr && dateForDay <= endStr) {
        const isDoneForDay = dbCompletions.value.some(
          (c) => c.task_id === task.id && c.completed_date === dateForDay
        )
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
      const diff = getDaysDifference(task.due_date)
      const isDueTodayOrNext7 = diff >= 0 && diff <= 7
      const isOverdueAndIncomplete = diff < 0 && !task.is_completed
      if (!isDueTodayOrNext7 && !isOverdueAndIncomplete) return false
    }

    // 2. Subject Filtering
    if (selectedSubject.value !== 'All') {
      const taskSub = task.subject || 'General'
      if (taskSub.toLowerCase() !== selectedSubject.value.toLowerCase()) {
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
      return [...list].sort((a, b) => {
        const diffA = getDaysDifference(a.due_date)
        const diffB = getDaysDifference(b.due_date)
        return diffA - diffB
      })
    }

    return [...list].sort((a, b) => (a.position || 0) - (b.position || 0))
  },
  set(newOrder) {
    newOrder.forEach((task, index) => {
      task.position = index
      const realTask = rawTasks.value.find((t) => t.id === task.id)
      if (realTask) realTask.position = index
    })
    updateTaskPositions(rawTasks.value, currentUser.value)
  }
})

// Grouped by Subject / Topic
const groupedActiveTasks = computed(() => {
  const groups = new Map()

  // Defined subjects from user's table
  dbSubjects.value.forEach((s) => {
    groups.set(s.name, {
      id: s.id,
      name: s.name,
      colorTheme: s.color_theme,
      tasks: []
    })
  })

  // Group for tasks with no subject defined
  const noTopicGroup = {
    id: 'no-topic',
    name: 'General / No Subject',
    colorTheme: 'plum',
    tasks: []
  }

  activeTasks.value.forEach((task) => {
    const subName = task.subject && task.subject !== 'General' ? task.subject : null
    if (subName && groups.has(subName)) {
      groups.get(subName).tasks.push(task)
    } else if (subName) {
      if (!groups.has(subName)) {
        groups.set(subName, {
          id: 'custom-' + subName,
          name: subName,
          colorTheme: 'rose',
          tasks: []
        })
      }
      groups.get(subName).tasks.push(task)
    } else {
      noTopicGroup.tasks.push(task)
    }
  })

  // Filter out empty groups so only relevant subject headings show
  const list = Array.from(groups.values()).filter((g) => g.tasks.length > 0)
  if (noTopicGroup.tasks.length > 0) {
    list.push(noTopicGroup)
  }
  return list
})

const completedTasks = computed(() => {
  return filteredTasks.value.filter((t) => t.is_completed)
})

// Available subjects for filtering from the user's subjects table
const availableSubjects = computed(() => {
  const set = new Set(['All'])
  dbSubjects.value.forEach((s) => set.add(s.name))
  rawTasks.value.forEach((t) => {
    if (t.subject && t.subject !== 'General') set.add(t.subject)
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
    // Trigger celebratory pink floral confetti!
    confetti({
      particleCount: 45,
      spread: 60,
      origin: { y: 0.75 },
      colors: ['#F472B6', '#EC4899', '#DB2777', '#FBCFE8', '#FFF1F6']
    })
  }

  if (task.is_instance) {
    // Atomic completion record in task_completions table:
    await setTaskCompletionDate(task.id, task.due_date, willBeCompleted, currentUser.value)
    if (willBeCompleted) {
      dbCompletions.value.push({ task_id: task.id, completed_date: task.due_date })
    } else {
      dbCompletions.value = dbCompletions.value.filter(
        (c) => !(c.task_id === task.id && c.completed_date === task.due_date)
      )
    }
  } else {
    // Standard task completion in tasks table
    const realTask = rawTasks.value.find((t) => t.id === task.id)
    if (realTask) {
      realTask.is_completed = willBeCompleted
      realTask.completed_at = willBeCompleted ? new Date().toISOString() : null
      await saveTask(realTask, currentUser.value)
    }
  }
}

function handleOpenNewTask() {
  taskToEdit.value = null
  showTaskModal.value = true
}

function openTaskModalForSubject(subName, subId) {
  taskToEdit.value = {
    subject: subName.includes('No Subject') ? '' : subName,
    subject_id: subId.startsWith('custom-') || subId === 'no-topic' ? null : subId
  }
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
    dbCompletions.value = dbCompletions.value.filter((c) => c.task_id !== taskId)
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

  for (const inst of completedTasks.value.filter((t) => t.is_instance)) {
    await setTaskCompletionDate(inst.id, inst.due_date, false, currentUser.value)
  }

  dbCompletions.value = []
  rawTasks.value = rawTasks.value.filter((t) => !toRemoveIds.includes(t.id))
}

async function handleCreateSubject(subjectData) {
  try {
    const created = await createSubject(subjectData, currentUser.value)
    dbSubjects.value.push(created)
  } catch (err) {
    console.error('Failed to create subject in database', err)
  }
}

async function handleDeleteSubject(subjectId) {
  if (!confirm('Are you sure you want to delete this topic? Tasks under this topic will remain intact.')) return
  try {
    await deleteSubject(subjectId, currentUser.value)
    dbSubjects.value = dbSubjects.value.filter((s) => s.id !== subjectId)
  } catch (err) {
    console.error('Failed to delete subject', err)
  }
}

function handleDragEnd() {
  if (sortBy.value === 'custom') {
    updateTaskPositions(rawTasks.value, currentUser.value)
  }
}

// Quick Add Bar
const quickTaskTitle = ref('')

async function handleQuickAddTask() {
  if (!quickTaskTitle.value.trim()) return
  const title = quickTaskTitle.value.trim()
  quickTaskTitle.value = ''
  await handleSaveTask({
    title,
    due_date: getTodayString(),
    priority: 'medium',
    subject: selectedSubject.value !== 'All' ? selectedSubject.value : null
  })
}



function handleDoNowTask(task) {
  focusTask.value = task
}

function handleFocusBack() {
  focusTask.value = null
}

function handleFocusMarkComplete(task) {
  handleToggleComplete(task)
  focusTask.value = null
}
function handleAuthSuccess(user) {
  currentUser.value = user
  isConnected.value = isSupabaseConnected()
  refreshAllData()
}
</script>

<template>
  <FocusTimer
    v-if="focusTask"
    :task="focusTask"
    :is-dark="isDark"
    @back="handleFocusBack"
    @mark-complete="handleFocusMarkComplete"
  />
  <div v-if="!focusTask" class="min-h-screen bg-bloom-50 dark:bg-bloom-night transition-colors duration-300 pb-20">
    <!-- Header with Dynamic Date, Theme Switcher and Bloom Progress -->
    <BloomHeader
      :is-dark="isDark"
      :user="currentUser"
      :is-supabase-connected="isConnected"
      :today-completed-count="todayCompletedCount"
      :today-total-count="todayTotalCount"
      @toggle-theme="toggleTheme"
      @open-auth="showAuthModal = true"
    />

    <!-- Main Content Container -->
    <main class="max-w-4xl mx-auto px-4 sm:px-6">
      <!-- Controls Bar: Focus Window Tabs, Layout Switch (List vs By Subject), Search & Add Task -->
      <TaskControls
        v-model:current-view="currentView"
        v-model:sort-by="sortBy"
        v-model:layout-mode="layoutMode"
        v-model:selected-subject="selectedSubject"
        v-model:search-query="searchQuery"
        :available-subjects="availableSubjects"
        :active-count="activeTasks.length"
        @open-new-task="handleOpenNewTask"
        @open-subjects-modal="showSubjectsModal = true"
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
        <!-- Quick Add Input Bar -->
        <div class="mb-4 p-2 rounded-2xl bg-white/80 dark:bg-bloom-cardNight border border-bloom-200 dark:border-bloom-borderNight shadow-sm flex items-center gap-2">
          <span class="pl-2 text-base">🌸</span>
          <input
            v-model="quickTaskTitle"
            @keydown.enter.prevent="handleQuickAddTask"
            type="text"
            placeholder="Quick add a study task for today... (Press Enter)"
            class="flex-1 bg-transparent border-none text-xs sm:text-sm text-bloom-900 dark:text-bloom-100 placeholder-bloom-400 dark:placeholder-bloom-500 focus:outline-none font-sans"
          />
          <button
            type="button"
            @click="handleQuickAddTask"
            :disabled="!quickTaskTitle.trim()"
            class="px-3.5 py-1.5 rounded-xl bg-bloom-500 hover:bg-bloom-600 disabled:opacity-40 text-white text-xs font-semibold font-soft transition-all shadow-2xs flex items-center gap-1 active:scale-95"
          >
            <Plus class="w-3.5 h-3.5" />
            <span>Add</span>
          </button>
        </div>

        <!-- Empty State -->
        <div
          v-if="activeTasks.length === 0"
          class="py-12 px-6 text-center rounded-3xl bg-white/60 dark:bg-bloom-cardNight/50 border border-dashed border-bloom-300 dark:border-bloom-borderNight shadow-xs"
        >
          <div class="inline-flex p-3 rounded-full bg-bloom-100 dark:bg-bloom-plum text-2xl mb-2">
            🌸
          </div>
          <h3 class="text-base font-bold text-bloom-900 dark:text-bloom-100 font-display">
            Your study dashboard is ready!
          </h3>
          <p class="text-xs text-bloom-600 dark:text-bloom-400 mt-1 max-w-sm mx-auto font-soft">
            You have a fresh, clean slate. Plant a task above or define your topics to get started.
          </p>
          <div class="mt-4 flex flex-wrap items-center justify-center gap-2">
            <button
              @click="handleOpenNewTask"
              class="px-4 py-2 rounded-xl bg-gradient-to-r from-bloom-500 to-bloom-600 text-white text-xs font-bold shadow-pink-glow hover:opacity-90 transition-all font-soft inline-flex items-center gap-1.5"
            >
              <Plus class="w-3.5 h-3.5" />
              <span>Plant a Task</span>
            </button>
            <button
              @click="showSubjectsModal = true"
              class="px-4 py-2 rounded-xl border border-bloom-300 dark:border-bloom-borderNight text-bloom-800 dark:text-bloom-200 text-xs font-semibold hover:bg-bloom-100 font-soft transition-all"
            >
              Define Topics
            </button>
          </div>
        </div>

        <!-- Mode 1: Grouped by Subject / Topic Headings -->
        <div v-else-if="layoutMode === 'grouped'" class="space-y-6">
          <div
            v-for="group in groupedActiveTasks"
            :key="group.id"
            class="p-4 sm:p-5 rounded-3xl bg-white/75 dark:bg-bloom-cardNight/80 border border-bloom-200/80 dark:border-bloom-borderNight shadow-petal transition-all"
          >
            <!-- Topic Heading -->
            <div class="flex items-center justify-between pb-3 mb-3 border-b border-bloom-100 dark:border-bloom-borderNight">
              <div class="flex items-center gap-2">
                <span class="text-lg">🌸</span>
                <h3 class="font-display font-bold text-base sm:text-lg text-bloom-900 dark:text-bloom-100 tracking-wide">
                  {{ group.name }}
                </h3>
                <span class="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-bloom-100 text-bloom-800 dark:bg-bloom-plum dark:text-bloom-300 font-soft">
                  {{ group.tasks.length }} {{ group.tasks.length === 1 ? 'task' : 'tasks' }}
                </span>
              </div>

              <button
                type="button"
                @click="openTaskModalForSubject(group.name, group.id)"
                class="px-3 py-1 rounded-xl bg-bloom-100 hover:bg-bloom-200 dark:bg-bloom-plum/60 dark:hover:bg-bloom-plum text-bloom-800 dark:text-bloom-200 text-xs font-semibold font-soft flex items-center gap-1 transition-colors"
                title="Add a task to this topic"
              >
                <Plus class="w-3.5 h-3.5" />
                <span>Add Task</span>
              </button>
            </div>

            <!-- Tasks under this Topic -->
            <div class="space-y-2.5">
              <TaskCard
                v-for="task in group.tasks"
                :key="task.instanceId || task.id"
                :task="task"
                :is-drag-enabled="false"
                @toggle-complete="handleToggleComplete"
                @edit-task="handleEditTask"
                @delete-task="handleDeleteTask"
                @do-now-task="handleDoNowTask"
              />
            </div>
          </div>
        </div>

        <!-- Mode 2: Flat List (Chronological or Drag & Drop) -->
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
                @do-now-task="handleDoNowTask"
            />
          </template>
        </draggable>

        <!-- Completed Tasks Sub-section -->
        <CompletedSection
          :completed-tasks="completedTasks"
          @toggle-complete="handleToggleComplete"
          @edit-task="handleEditTask"
          @delete-task="handleDeleteTask"
                @do-now-task="handleDoNowTask"
          @clear-all="handleClearAllCompleted"
        />
      </div>
    </main>

    <!-- Modals -->
    <TaskModal
      :is-open="showTaskModal"
      :task-to-edit="taskToEdit"
      :subjects-list="dbSubjects"
      @close="showTaskModal = false"
      @save="handleSaveTask"
      @create-subject="handleCreateSubject"
    />

    <SubjectManagerModal
      :is-open="showSubjectsModal"
      :subjects="dbSubjects"
      @close="showSubjectsModal = false"
      @create-subject="handleCreateSubject"
      @delete-subject="handleDeleteSubject"
    />

    <AuthModal
      :is-open="showAuthModal"
      :user="currentUser"
      :is-supabase-connected="isConnected"
      @close="showAuthModal = false"
      @auth-success="handleAuthSuccess"
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
