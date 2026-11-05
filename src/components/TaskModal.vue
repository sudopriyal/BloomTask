<script setup>
import { ref, watch, computed } from 'vue'
import {
  X,
  Sparkles,
  Calendar,
  BookOpen,
  Repeat,
  AlertCircle,
  Flag,
  Plus
} from 'lucide-vue-next'
import { getTodayString, addDays } from '../utils/dateUtils'

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  taskToEdit: {
    type: Object,
    default: null
  },
  subjectsList: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['close', 'save', 'create-subject'])

const title = ref('')
const description = ref('')
const subject = ref('')
const subjectId = ref(null)
const priority = ref('medium') // 'low', 'medium', 'high'
const dueDate = ref(getTodayString())
const isRecurring = ref(false)
const recurringStartDate = ref(getTodayString())
const recurringEndDate = ref(addDays(getTodayString(), 7))
const errorMessage = ref('')

// In-modal quick new subject creation
const showAddSubject = ref(false)
const newSubjectName = ref('')
const newSubjectTheme = ref('rose')

const availableSubjectItems = computed(() => {
  return props.subjectsList || []
})

const isEditing = computed(() => !!props.taskToEdit)

watch(
  () => props.taskToEdit,
  (newTask) => {
    if (newTask) {
      title.value = newTask.title || ''
      description.value = newTask.description || ''
      subject.value = newTask.subject || ''
      subjectId.value = newTask.subject_id || null
      priority.value = newTask.priority || 'medium'
      dueDate.value = newTask.due_date || getTodayString()
      isRecurring.value = !!newTask.is_recurring
      recurringStartDate.value = newTask.recurring_start_date || getTodayString()
      recurringEndDate.value = newTask.recurring_end_date || addDays(getTodayString(), 7)
    } else {
      resetForm()
    }
  },
  { immediate: true }
)

watch(
  () => props.isOpen,
  (open) => {
    if (open && !props.taskToEdit) {
      resetForm()
    }
  }
)

function resetForm() {
  title.value = ''
  description.value = ''
  subject.value = ''
  subjectId.value = null
  priority.value = 'medium'
  dueDate.value = getTodayString()
  isRecurring.value = false
  recurringStartDate.value = getTodayString()
  recurringEndDate.value = addDays(getTodayString(), 7)
  errorMessage.value = ''
  showAddSubject.value = false
  newSubjectName.value = ''
}

function handleSubjectSelect(subItem) {
  if (subItem) {
    subject.value = subItem.name
    subjectId.value = subItem.id || null
  } else {
    subject.value = ''
    subjectId.value = null
  }
}

function handleCreateSubjectSubmit() {
  if (!newSubjectName.value.trim()) return
  emit('create-subject', {
    name: newSubjectName.value.trim(),
    color_theme: newSubjectTheme.value
  })
  subject.value = newSubjectName.value.trim()
  newSubjectName.value = ''
  showAddSubject.value = false
}

function handleSubmit() {
  if (!title.value.trim()) {
    errorMessage.value = 'Please provide a task title.'
    return
  }

  if (isRecurring.value && (!recurringStartDate.value || !recurringEndDate.value)) {
    errorMessage.value = 'Please provide both start and end dates for daily recurring tasks.'
    return
  }

  if (isRecurring.value && recurringStartDate.value > recurringEndDate.value) {
    errorMessage.value = 'Start date cannot be after end date.'
    return
  }

  const taskData = {
    ...(props.taskToEdit || {}),
    title: title.value.trim(),
    description: description.value.trim(),
    subject: subject.value ? subject.value.trim() : null,
    subject_id: subjectId.value || null,
    priority: priority.value,
    due_date: isRecurring.value ? recurringStartDate.value : dueDate.value,
    is_recurring: isRecurring.value,
    recurring_start_date: isRecurring.value ? recurringStartDate.value : null,
    recurring_end_date: isRecurring.value ? recurringEndDate.value : null,
  }

  emit('save', taskData)
  emit('close')
}
</script>

<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bloom-950/50 backdrop-blur-sm transition-opacity duration-300"
    @click.self="emit('close')"
  >
    <div
      class="w-full max-w-lg rounded-3xl bg-white dark:bg-bloom-cardNight border border-bloom-200 dark:border-bloom-borderNight shadow-2xl p-6 transition-all duration-300 overflow-hidden max-h-[90vh] flex flex-col"
    >
      <!-- Modal Header -->
      <div class="flex items-center justify-between pb-3 border-b border-bloom-100 dark:border-bloom-borderNight">
        <div class="flex items-center gap-2">
          <span class="text-xl">🌸</span>
          <h2 class="text-xl font-bold font-decorative text-bloom-900 dark:text-bloom-100 tracking-wide">
            {{ isEditing ? 'Edit Study Task' : 'Plant a New Task' }}
          </h2>
        </div>
        <button
          @click="emit('close')"
          class="p-2 rounded-full text-bloom-400 hover:text-bloom-700 hover:bg-bloom-100 dark:hover:bg-bloom-plum/50 transition-colors"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Error Message -->
      <div
        v-if="errorMessage"
        class="mt-3 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2"
      >
        <AlertCircle class="w-4 h-4 flex-shrink-0" />
        <span>{{ errorMessage }}</span>
      </div>

      <!-- Modal Body Form -->
      <form @submit.prevent="handleSubmit" class="mt-4 space-y-4 overflow-y-auto pr-1 flex-grow">
        <!-- Title Input -->
        <div>
          <label class="block text-xs font-semibold text-bloom-800 dark:text-bloom-200 uppercase tracking-wider mb-1 font-soft">
            Task Title <span class="text-rose-500">*</span>
          </label>
          <input
            v-model="title"
            type="text"
            placeholder="e.g. Calculus: Practice Integration by Parts"
            class="w-full px-4 py-2.5 rounded-xl bg-bloom-50/70 dark:bg-bloom-plum/40 border border-bloom-200 dark:border-bloom-borderNight text-bloom-900 dark:text-bloom-100 placeholder-bloom-300 dark:placeholder-bloom-600 focus:outline-none focus:ring-2 focus:ring-bloom-500 font-sans text-sm"
            required
            autofocus
          />
        </div>

        <!-- Subject Picker & Creator -->
        <div>
          <div class="flex items-center justify-between mb-1.5">
            <label class="text-xs font-semibold text-bloom-800 dark:text-bloom-200 uppercase tracking-wider font-soft flex items-center gap-1">
              <BookOpen class="w-3.5 h-3.5 text-bloom-500" />
              Subject / Topic <span class="text-[10px] text-bloom-500 font-normal lowercase">(optional)</span>
            </label>
            <button
              type="button"
              @click="showAddSubject = !showAddSubject"
              class="text-[11px] font-semibold text-bloom-600 dark:text-bloom-400 hover:underline flex items-center gap-1 font-soft"
            >
              <Plus class="w-3 h-3" />
              <span>New Topic</span>
            </button>
          </div>

          <!-- Quick Add Subject Input Row -->
          <div v-if="showAddSubject" class="mb-2 p-2.5 rounded-xl bg-bloom-100/60 dark:bg-bloom-plum/40 border border-bloom-200 dark:border-bloom-borderNight flex flex-wrap items-center gap-2">
            <input
              v-model="newSubjectName"
              type="text"
              placeholder="e.g. Organic Chemistry, French..."
              class="flex-1 px-3 py-1 text-xs rounded-lg bg-white dark:bg-bloom-cardNight border border-bloom-300 dark:border-bloom-borderNight text-bloom-900 dark:text-bloom-100 focus:outline-none"
            />
            <select
              v-model="newSubjectTheme"
              class="px-2 py-1 text-xs rounded-lg bg-white dark:bg-bloom-cardNight border border-bloom-300 dark:border-bloom-borderNight text-bloom-900 dark:text-bloom-100 font-soft"
            >
              <option value="rose">Rose Pink</option>
              <option value="pink">Blush Pink</option>
              <option value="fuchsia">Fuchsia</option>
              <option value="plum">Plum</option>
              <option value="purple">Lilac</option>
              <option value="champagne">Peach</option>
            </select>
            <button
              type="button"
              @click="handleCreateSubjectSubmit"
              class="px-3 py-1 rounded-lg bg-bloom-500 hover:bg-bloom-600 text-white text-xs font-bold font-soft"
            >
              Add
            </button>
          </div>

          <!-- Subject Badges List (With None option) -->
          <div class="flex flex-wrap gap-1.5 items-center">
            <!-- None / No Subject Option -->
            <button
              type="button"
              @click="handleSubjectSelect(null)"
              class="text-xs font-medium px-3 py-1 rounded-full border transition-all duration-200 font-soft"
              :class="[
                !subject
                  ? 'bg-bloom-500 text-white border-bloom-500 shadow-petal font-semibold'
                  : 'bg-bloom-50/60 dark:bg-bloom-plum/30 text-bloom-700 dark:text-bloom-300 border-bloom-200 dark:border-bloom-borderNight hover:bg-bloom-100'
              ]"
            >
              None
            </button>

            <!-- User Defined Subjects -->
            <button
              v-for="sub in availableSubjectItems"
              :key="sub.id || sub.name"
              type="button"
              @click="handleSubjectSelect(sub)"
              class="text-xs font-medium px-3 py-1 rounded-full border transition-all duration-200 font-soft"
              :class="[
                subject === sub.name
                  ? 'bg-bloom-500 text-white border-bloom-500 shadow-petal font-semibold'
                  : 'bg-bloom-50/60 dark:bg-bloom-plum/30 text-bloom-700 dark:text-bloom-300 border-bloom-200 dark:border-bloom-borderNight hover:bg-bloom-100'
              ]"
            >
              {{ sub.name }}
            </button>

            <span v-if="availableSubjectItems.length === 0" class="text-[11px] text-bloom-500 dark:text-bloom-400 italic">
              (No custom topics yet — click "+ New Topic" to add one)
            </span>
          </div>
        </div>

        <!-- Priority Selector -->
        <div>
          <label class="block text-xs font-semibold text-bloom-800 dark:text-bloom-200 uppercase tracking-wider mb-1.5 font-soft flex items-center gap-1">
            <Flag class="w-3.5 h-3.5 text-bloom-500" />
            Priority Level
          </label>
          <div class="grid grid-cols-3 gap-2">
            <button
              type="button"
              @click="priority = 'low'"
              class="py-1.5 px-3 rounded-xl border text-xs font-semibold font-soft flex items-center justify-center gap-1.5 transition-all"
              :class="[
                priority === 'low'
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-400 dark:border-emerald-700 shadow-2xs font-bold'
                  : 'bg-white/60 dark:bg-bloom-plum/30 text-bloom-700 dark:text-bloom-300 border-bloom-200 dark:border-bloom-borderNight'
              ]"
            >
              <span>🌱</span>
              <span>Low</span>
            </button>
            <button
              type="button"
              @click="priority = 'medium'"
              class="py-1.5 px-3 rounded-xl border text-xs font-semibold font-soft flex items-center justify-center gap-1.5 transition-all"
              :class="[
                priority === 'medium'
                  ? 'bg-bloom-200 text-bloom-900 dark:bg-bloom-plum/90 dark:text-bloom-100 border-bloom-400 dark:border-bloom-600 shadow-2xs font-bold'
                  : 'bg-white/60 dark:bg-bloom-plum/30 text-bloom-700 dark:text-bloom-300 border-bloom-200 dark:border-bloom-borderNight'
              ]"
            >
              <span>⭐</span>
              <span>Medium</span>
            </button>
            <button
              type="button"
              @click="priority = 'high'"
              class="py-1.5 px-3 rounded-xl border text-xs font-semibold font-soft flex items-center justify-center gap-1.5 transition-all"
              :class="[
                priority === 'high'
                  ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border-rose-400 dark:border-rose-700 shadow-2xs font-bold animate-pulse'
                  : 'bg-white/60 dark:bg-bloom-plum/30 text-bloom-700 dark:text-bloom-300 border-bloom-200 dark:border-bloom-borderNight'
              ]"
            >
              <span>🔥</span>
              <span>High</span>
            </button>
          </div>
        </div>

        <!-- Description Input -->
        <div>
          <label class="block text-xs font-semibold text-bloom-800 dark:text-bloom-200 uppercase tracking-wider mb-1 font-soft">
            Description / Study Notes (Optional)
          </label>
          <textarea
            v-model="description"
            rows="2"
            placeholder="Add formulas, chapters, or textbook references..."
            class="w-full px-4 py-2 rounded-xl bg-bloom-50/70 dark:bg-bloom-plum/40 border border-bloom-200 dark:border-bloom-borderNight text-bloom-900 dark:text-bloom-100 placeholder-bloom-300 dark:placeholder-bloom-600 focus:outline-none focus:ring-2 focus:ring-bloom-500 font-sans text-xs resize-none"
          ></textarea>
        </div>

        <!-- Daily Recurring Toggle -->
        <div class="p-3.5 rounded-2xl bg-bloom-100/70 dark:bg-bloom-plum/50 border border-bloom-200 dark:border-bloom-borderNight transition-all">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <Repeat class="w-4 h-4 text-bloom-600 dark:text-bloom-400" />
              <div>
                <p class="text-xs font-semibold text-bloom-900 dark:text-bloom-100 font-soft">
                  Daily Recurring Task
                </p>
                <p class="text-[11px] text-bloom-600 dark:text-bloom-400">
                  Tracked atomically in task_completions database table
                </p>
              </div>
            </div>

            <!-- Toggle Switch -->
            <label class="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" v-model="isRecurring" class="sr-only peer" />
              <div class="w-10 h-5 bg-zinc-300 peer-focus:outline-none rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-bloom-600"></div>
            </label>
          </div>

          <!-- Recurring Date Range Controls -->
          <div v-if="isRecurring" class="mt-3 pt-3 border-t border-bloom-200 dark:border-bloom-borderNight grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label class="block text-[11px] font-medium text-bloom-800 dark:text-bloom-200 mb-1 font-soft">
                Start Date
              </label>
              <input
                v-model="recurringStartDate"
                type="date"
                class="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-bloom-cardNight border border-bloom-300 dark:border-bloom-borderNight text-xs text-bloom-900 dark:text-bloom-100 focus:outline-none focus:ring-2 focus:ring-bloom-400 font-sans"
              />
            </div>
            <div>
              <label class="block text-[11px] font-medium text-bloom-800 dark:text-bloom-200 mb-1 font-soft">
                End Date
              </label>
              <input
                v-model="recurringEndDate"
                type="date"
                class="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-bloom-cardNight border border-bloom-300 dark:border-bloom-borderNight text-xs text-bloom-900 dark:text-bloom-100 focus:outline-none focus:ring-2 focus:ring-bloom-400 font-sans"
              />
            </div>
          </div>
        </div>

        <!-- Manual Single Due Date (if not recurring) -->
        <div v-if="!isRecurring">
          <label class="block text-xs font-semibold text-bloom-800 dark:text-bloom-200 uppercase tracking-wider mb-1 font-soft flex items-center gap-1">
            <Calendar class="w-3.5 h-3.5 text-bloom-500" />
            Due Date <span class="text-rose-500">*</span>
          </label>
          <input
            v-model="dueDate"
            type="date"
            class="w-full px-4 py-2 rounded-xl bg-bloom-50/70 dark:bg-bloom-plum/40 border border-bloom-200 dark:border-bloom-borderNight text-bloom-900 dark:text-bloom-100 focus:outline-none focus:ring-2 focus:ring-bloom-500 font-sans text-sm"
            required
          />
        </div>

        <!-- Form Actions -->
        <div class="flex items-center justify-end gap-3 pt-3 border-t border-bloom-100 dark:border-bloom-borderNight">
          <button
            type="button"
            @click="emit('close')"
            class="px-4 py-2 rounded-xl text-xs font-semibold text-bloom-700 dark:text-bloom-300 hover:bg-bloom-100 dark:hover:bg-bloom-plum/50 transition-colors font-soft"
          >
            Cancel
          </button>
          <button
            type="submit"
            class="px-6 py-2.5 rounded-xl bg-gradient-to-r from-bloom-500 via-bloom-600 to-bloom-700 text-white text-xs font-bold shadow-pink-glow hover:opacity-95 active:scale-95 transition-all font-soft flex items-center gap-1.5"
          >
            <Sparkles class="w-3.5 h-3.5" />
            <span>{{ isEditing ? 'Save Changes' : 'Bloom Task' }}</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
