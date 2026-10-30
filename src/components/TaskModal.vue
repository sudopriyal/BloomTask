<script setup>
import { ref, watch, computed } from 'vue'
import { X, Sparkles, Calendar, BookOpen, Repeat, AlertCircle } from 'lucide-vue-next'
import { getTodayString, addDays } from '../utils/dateUtils'

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  taskToEdit: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['close', 'save'])

const title = ref('')
const description = ref('')
const subject = ref('Biology')
const customSubject = ref('')
const dueDate = ref(getTodayString())
const isRecurring = ref(false)
const recurringStartDate = ref(getTodayString())
const recurringEndDate = ref(addDays(getTodayString(), 7))
const errorMessage = ref('')

const presetSubjects = [
  'Biology',
  'Math',
  'Chemistry',
  'Literature',
  'History',
  'Languages',
  'Coding',
  'Personal',
  '+ Custom'
]

const isEditing = computed(() => !!props.taskToEdit)

// Synchronize inputs when modal opens or taskToEdit changes
watch(
  () => props.taskToEdit,
  (newTask) => {
    if (newTask) {
      title.value = newTask.title || ''
      description.value = newTask.description || ''
      if (presetSubjects.includes(newTask.subject)) {
        subject.value = newTask.subject
        customSubject.value = ''
      } else {
        subject.value = '+ Custom'
        customSubject.value = newTask.subject || ''
      }
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
  subject.value = 'Biology'
  customSubject.value = ''
  dueDate.value = getTodayString()
  isRecurring.value = false
  recurringStartDate.value = getTodayString()
  recurringEndDate.value = addDays(getTodayString(), 7)
  errorMessage.value = ''
}

function handleSubjectSelect(sub) {
  subject.value = sub
}

function handleSubmit() {
  if (!title.value.trim()) {
    errorMessage.value = 'Please provide a task title.'
    return
  }

  const finalSubject = subject.value === '+ Custom'
    ? (customSubject.value.trim() || 'General')
    : subject.value

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
    subject: finalSubject,
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

        <!-- Subject Picker -->
        <div>
          <label class="block text-xs font-semibold text-bloom-800 dark:text-bloom-200 uppercase tracking-wider mb-1.5 font-soft flex items-center gap-1">
            <BookOpen class="w-3.5 h-3.5 text-bloom-500" />
            Subject / Category
          </label>
          <div class="flex flex-wrap gap-1.5">
            <button
              v-for="sub in presetSubjects"
              :key="sub"
              type="button"
              @click="handleSubjectSelect(sub)"
              class="text-xs font-medium px-3 py-1 rounded-full border transition-all duration-200 font-soft"
              :class="[
                subject === sub
                  ? 'bg-bloom-500 text-white border-bloom-500 shadow-petal'
                  : 'bg-bloom-50/60 dark:bg-bloom-plum/30 text-bloom-700 dark:text-bloom-300 border-bloom-200 dark:border-bloom-borderNight hover:bg-bloom-100'
              ]"
            >
              {{ sub }}
            </button>
          </div>

          <!-- Custom Subject Input if selected -->
          <div v-if="subject === '+ Custom'" class="mt-2">
            <input
              v-model="customSubject"
              type="text"
              placeholder="Enter custom subject name..."
              class="w-full px-3 py-1.5 rounded-lg bg-bloom-50 dark:bg-bloom-plum/30 border border-bloom-200 dark:border-bloom-borderNight text-bloom-900 dark:text-bloom-100 text-xs focus:ring-2 focus:ring-bloom-400 focus:outline-none"
            />
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
                  Automatically populates this habit for each day in range
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
