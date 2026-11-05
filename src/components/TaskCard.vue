<script setup>
import { ref, computed } from 'vue'
import {
  GripVertical,
  Check,
  Calendar,
  Repeat,
  MoreVertical,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronUp
} from 'lucide-vue-next'
import { getCountdownBadge, formatShortDate } from '../utils/dateUtils'

const props = defineProps({
  task: {
    type: Object,
    required: true
  },
  isDragEnabled: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['toggle-complete', 'edit-task', 'delete-task'])

const showDescription = ref(false)
const showMenu = ref(false)

const countdown = computed(() => {
  return getCountdownBadge(props.task.due_date, props.task.is_completed)
})

const formattedDueDate = computed(() => {
  return formatShortDate(props.task.due_date)
})

// Color chips for various study subjects in charming pink pastel shades
const subjectStyle = computed(() => {
  const theme = props.task.subjects?.color_theme || ''
  if (theme === 'rose') return 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border-rose-300 dark:border-rose-800'
  if (theme === 'fuchsia') return 'bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-950/80 dark:text-fuchsia-300 border-fuchsia-300 dark:border-fuchsia-800'
  if (theme === 'purple') return 'bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300 border-purple-300 dark:border-purple-800'
  if (theme === 'plum') return 'bg-bloom-plum/20 text-bloom-900 dark:bg-bloom-plum/80 dark:text-bloom-200 border-bloom-300 dark:border-bloom-700'
  if (theme === 'champagne') return 'bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-300 border-amber-300 dark:border-amber-800'
  if (theme === 'pink') return 'bg-pink-100 text-pink-800 dark:bg-pink-950/80 dark:text-pink-300 border-pink-300 dark:border-pink-800'

  return 'bg-bloom-100 text-bloom-800 dark:bg-bloom-950 dark:text-bloom-300 border-bloom-200 dark:border-bloom-800'
})

const priorityBadge = computed(() => {
  const p = props.task.priority || 'medium'
  if (p === 'high') {
    return {
      label: 'High Priority',
      icon: '🔥',
      classes: 'bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
    }
  }
  if (p === 'low') {
    return {
      label: 'Low',
      icon: '🌱',
      classes: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
    }
  }
  return null
})
</script>

<template>
  <div
    class="group relative rounded-2xl p-4 transition-all duration-300 border"
    :class="[
      task.is_completed
        ? 'bg-white/40 dark:bg-bloom-cardNight/40 border-zinc-200/80 dark:border-zinc-800/80 opacity-60'
        : 'bg-white/90 dark:bg-bloom-cardNight border-bloom-200/90 dark:border-bloom-borderNight shadow-sm hover:shadow-pink-glow hover:border-bloom-300 dark:hover:border-bloom-700'
    ]"
  >
    <div class="flex items-start gap-3">
      <!-- Drag Handle -->
      <div
        v-if="isDragEnabled && !task.is_completed"
        class="drag-handle pt-1 cursor-grab active:cursor-grabbing text-bloom-400 hover:text-bloom-600 dark:text-bloom-600 dark:hover:text-bloom-400 touch-none"
        title="Drag to reorder"
      >
        <GripVertical class="w-5 h-5" />
      </div>

      <!-- Completion Checkbox Button -->
      <button
        type="button"
        @click.stop="emit('toggle-complete', task)"
        class="mt-0.5 flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 active:scale-90"
        :class="[
          task.is_completed
            ? 'bg-bloom-500 border-bloom-500 text-white shadow-pink-glow'
            : 'border-bloom-300 dark:border-bloom-700 hover:border-bloom-500 dark:hover:border-bloom-500 hover:bg-bloom-50 dark:hover:bg-bloom-plum/30'
        ]"
        :title="task.is_completed ? 'Mark incomplete' : 'Mark completed'"
      >
        <Check v-if="task.is_completed" class="w-3.5 h-3.5 stroke-[3]" />
      </button>

      <!-- Main Content -->
      <div class="flex-grow min-w-0">
        <!-- Title and Badges Row -->
        <div class="flex flex-wrap items-center gap-2 mb-1">
          <!-- Subject Tag (Optional) -->
          <span
            v-if="task.subject && task.subject !== 'General'"
            class="text-[11px] font-semibold px-2.5 py-0.5 rounded-full border shadow-2xs font-soft"
            :class="subjectStyle"
          >
            {{ task.subject }}
          </span>

          <!-- Countdown Badge -->
          <span
            class="text-[11px] px-2.5 py-0.5 rounded-full font-soft transition-all duration-300"
            :class="countdown.classes"
          >
            {{ countdown.label }}
          </span>

          <!-- Priority Indicator -->
          <span
            v-if="priorityBadge"
            class="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full font-soft"
            :class="priorityBadge.classes"
          >
            <span>{{ priorityBadge.icon }}</span>
            <span>{{ priorityBadge.label }}</span>
          </span>

          <!-- Recurring Daily Indicator -->
          <span
            v-if="task.is_recurring"
            class="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-bloom-100 text-bloom-800 dark:bg-bloom-plum/70 dark:text-bloom-300 border border-bloom-200 dark:border-bloom-800"
            title="Daily recurring task"
          >
            <Repeat class="w-3 h-3 text-bloom-500" />
            Daily
          </span>
        </div>

        <!-- Task Title -->
        <h3
          class="text-sm sm:text-base font-semibold leading-snug break-words transition-all duration-200 font-sans"
          :class="[
            task.is_completed
              ? 'line-through text-zinc-400 dark:text-zinc-500'
              : 'text-bloom-900 dark:text-bloom-50 group-hover:text-bloom-700 dark:group-hover:text-bloom-300'
          ]"
        >
          {{ task.title }}
        </h3>

        <!-- Due Date Info and Description toggle -->
        <div class="flex items-center gap-3 mt-2 text-xs text-bloom-700 dark:text-bloom-300/80">
          <span class="flex items-center gap-1 font-medium font-soft">
            <Calendar class="w-3.5 h-3.5 text-bloom-500" />
            Due: {{ formattedDueDate }}
          </span>

          <button
            v-if="task.description"
            @click="showDescription = !showDescription"
            class="flex items-center gap-0.5 text-bloom-600 dark:text-bloom-400 hover:underline font-soft"
          >
            <span>Notes</span>
            <ChevronUp v-if="showDescription" class="w-3 h-3" />
            <ChevronDown v-else class="w-3 h-3" />
          </button>
        </div>

        <!-- Collapsible Description -->
        <div
          v-if="showDescription && task.description"
          class="mt-2.5 p-2.5 rounded-xl bg-bloom-50/80 dark:bg-bloom-plum/40 border border-bloom-200/70 dark:border-bloom-borderNight text-xs text-bloom-800 dark:text-bloom-200 whitespace-pre-wrap leading-relaxed font-sans"
        >
          {{ task.description }}
        </div>
      </div>

      <!-- Quick Actions (Edit / Delete) -->
      <div class="flex items-center gap-1 flex-shrink-0">
        <button
          @click="emit('edit-task', task)"
          class="p-1.5 rounded-lg text-bloom-500 hover:text-bloom-700 hover:bg-bloom-100 dark:hover:bg-bloom-plum/60 transition-colors"
          title="Edit Task"
        >
          <Pencil class="w-4 h-4" />
        </button>

        <button
          @click="emit('delete-task', task.id)"
          class="p-1.5 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
          title="Delete Task"
        >
          <Trash2 class="w-4 h-4" />
        </button>
      </div>
    </div>
  </div>
</template>
