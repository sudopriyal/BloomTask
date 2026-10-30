<script setup>
import { ref } from 'vue'
import { ChevronDown, ChevronRight, CheckCircle2, Trash2 } from 'lucide-vue-next'
import TaskCard from './TaskCard.vue'

const props = defineProps({
  completedTasks: {
    type: Array,
    required: true
  }
})

const emit = defineEmits(['toggle-complete', 'edit-task', 'delete-task', 'clear-all'])

const isOpen = ref(true)
</script>

<template>
  <section v-if="completedTasks.length > 0" class="mt-8 pt-4 border-t border-dashed border-bloom-300 dark:border-bloom-borderNight">
    <!-- Header with Toggle and Count -->
    <div class="flex items-center justify-between mb-3">
      <button
        @click="isOpen = !isOpen"
        class="flex items-center gap-2 text-sm font-semibold text-bloom-800 dark:text-bloom-300 hover:text-bloom-950 dark:hover:text-bloom-100 transition-colors font-soft group"
      >
        <span class="p-1 rounded-md bg-bloom-100 dark:bg-bloom-cardNight group-hover:bg-bloom-200">
          <ChevronDown v-if="isOpen" class="w-4 h-4 text-bloom-600 dark:text-bloom-400" />
          <ChevronRight v-else class="w-4 h-4 text-bloom-600 dark:text-bloom-400" />
        </span>
        <span class="flex items-center gap-1.5 font-display text-base tracking-wide">
          <CheckCircle2 class="w-4 h-4 text-emerald-500" />
          Completed Tasks
        </span>
        <span class="px-2 py-0.5 text-xs font-bold rounded-full bg-bloom-200 dark:bg-bloom-plum text-bloom-800 dark:text-bloom-200">
          {{ completedTasks.length }}
        </span>
      </button>

      <button
        @click="emit('clear-all')"
        class="text-xs text-rose-500 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 flex items-center gap-1 hover:underline font-soft"
        title="Remove all completed tasks"
      >
        <Trash2 class="w-3.5 h-3.5" />
        Clear all
      </button>
    </div>

    <!-- Collapsible List -->
    <div v-show="isOpen" class="space-y-2.5 transition-all duration-300">
      <TaskCard
        v-for="task in completedTasks"
        :key="task.instanceId || task.id"
        :task="task"
        :is-drag-enabled="false"
        @toggle-complete="emit('toggle-complete', $event)"
        @edit-task="emit('edit-task', $event)"
        @delete-task="emit('delete-task', $event)"
      />
    </div>
  </section>
</template>
