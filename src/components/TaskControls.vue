<script setup>
import { computed } from 'vue'
import {
  CalendarDays,
  Clock,
  ArrowUpDown,
  Move,
  Plus,
  Filter,
  Search
} from 'lucide-vue-next'

const props = defineProps({
  currentView: {
    type: String,
    default: 'next7' // 'next7', 'today', 'all'
  },
  sortBy: {
    type: String,
    default: 'dueDate' // 'dueDate', 'custom'
  },
  selectedSubject: {
    type: String,
    default: 'All'
  },
  searchQuery: {
    type: String,
    default: ''
  },
  availableSubjects: {
    type: Array,
    default: () => ['All']
  },
  activeCount: {
    type: Number,
    default: 0
  }
})

const emit = defineEmits([
  'update:currentView',
  'update:sortBy',
  'update:selectedSubject',
  'update:searchQuery',
  'open-new-task'
])
</script>

<template>
  <div class="mb-5 space-y-3">
    <!-- Row 1: Focus Window Tabs & Action Button -->
    <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
      <!-- Focus Window Segmented Tabs -->
      <div class="flex items-center p-1 rounded-2xl bg-white/80 dark:bg-bloom-cardNight/90 border border-bloom-200 dark:border-bloom-borderNight shadow-sm overflow-x-auto scrollbar-none font-soft">
        <button
          type="button"
          @click="emit('update:currentView', 'next7')"
          class="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-300 whitespace-nowrap"
          :class="[
            currentView === 'next7'
              ? 'bg-gradient-to-r from-bloom-500 to-bloom-600 text-white shadow-pink-glow'
              : 'text-bloom-850 dark:text-bloom-300 hover:text-bloom-600 dark:hover:text-bloom-200 hover:bg-bloom-100/50 dark:hover:bg-bloom-plum/30'
          ]"
        >
          <CalendarDays class="w-3.5 h-3.5" />
          <span>Next 7 Days</span>
        </button>

        <button
          type="button"
          @click="emit('update:currentView', 'today')"
          class="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-300 whitespace-nowrap"
          :class="[
            currentView === 'today'
              ? 'bg-gradient-to-r from-bloom-500 to-bloom-600 text-white shadow-pink-glow'
              : 'text-bloom-850 dark:text-bloom-300 hover:text-bloom-600 dark:hover:text-bloom-200 hover:bg-bloom-100/50 dark:hover:bg-bloom-plum/30'
          ]"
        >
          <Clock class="w-3.5 h-3.5" />
          <span>Today</span>
        </button>

        <button
          type="button"
          @click="emit('update:currentView', 'all')"
          class="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-300 whitespace-nowrap"
          :class="[
            currentView === 'all'
              ? 'bg-gradient-to-r from-bloom-500 to-bloom-600 text-white shadow-pink-glow'
              : 'text-bloom-850 dark:text-bloom-300 hover:text-bloom-600 dark:hover:text-bloom-200 hover:bg-bloom-100/50 dark:hover:bg-bloom-plum/30'
          ]"
        >
          <span>All Active</span>
        </button>
      </div>

      <!-- Add New Task Button -->
      <button
        type="button"
        @click="emit('open-new-task')"
        class="flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-bloom-500 via-bloom-600 to-bloom-700 text-white font-semibold text-xs sm:text-sm shadow-pink-glow hover:shadow-plum-glow hover:opacity-95 active:scale-95 transition-all duration-300 font-soft"
      >
        <Plus class="w-4 h-4 stroke-[2.5]" />
        <span>Add Study Task</span>
      </button>
    </div>

    <!-- Row 2: Search, Sorting Toggle & Subject Filters -->
    <div class="flex flex-wrap items-center justify-between gap-2.5 text-xs">
      <!-- Search Input -->
      <div class="relative flex-grow sm:flex-grow-0 sm:w-56">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-bloom-400" />
        <input
          type="text"
          :value="searchQuery"
          @input="emit('update:searchQuery', $event.target.value)"
          placeholder="Search subjects or tasks..."
          class="w-full pl-8 pr-3 py-1.5 rounded-xl bg-white/70 dark:bg-bloom-cardNight border border-bloom-200 dark:border-bloom-borderNight text-bloom-900 dark:text-bloom-100 placeholder-bloom-400 dark:placeholder-bloom-600 focus:outline-none focus:ring-2 focus:ring-bloom-400 font-sans text-xs"
        />
      </div>

      <!-- Sorting Selector -->
      <div class="flex items-center gap-1.5 bg-white/80 dark:bg-bloom-cardNight p-1 rounded-xl border border-bloom-200 dark:border-bloom-borderNight font-soft">
        <button
          type="button"
          @click="emit('update:sortBy', 'dueDate')"
          class="flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all duration-200 font-medium"
          :class="[
            sortBy === 'dueDate'
              ? 'bg-bloom-100 dark:bg-bloom-plum text-bloom-800 dark:text-bloom-200 font-semibold'
              : 'text-bloom-600 dark:text-bloom-400 hover:text-bloom-800'
          ]"
          title="Auto-order tasks by fewest remaining days"
        >
          <ArrowUpDown class="w-3.5 h-3.5" />
          <span>Fewest Days</span>
        </button>

        <button
          type="button"
          @click="emit('update:sortBy', 'custom')"
          class="flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all duration-200 font-medium"
          :class="[
            sortBy === 'custom'
              ? 'bg-bloom-100 dark:bg-bloom-plum text-bloom-800 dark:text-bloom-200 font-semibold'
              : 'text-bloom-600 dark:text-bloom-400 hover:text-bloom-800'
          ]"
          title="Reorder manually with drag and drop"
        >
          <Move class="w-3.5 h-3.5" />
          <span>Manual Drag</span>
        </button>
      </div>
    </div>

    <!-- Row 3: Subject Badges Filter -->
    <div class="flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5 scrollbar-none font-soft">
      <span class="text-[11px] text-bloom-500 dark:text-bloom-400 font-medium flex items-center gap-1 flex-shrink-0">
        <Filter class="w-3 h-3" />
        Subject:
      </span>

      <button
        v-for="sub in availableSubjects"
        :key="sub"
        type="button"
        @click="emit('update:selectedSubject', sub)"
        class="text-[11px] font-medium px-2.5 py-0.5 rounded-full border transition-all duration-200 whitespace-nowrap"
        :class="[
          selectedSubject === sub
            ? 'bg-bloom-500 text-white border-bloom-500 shadow-petal'
            : 'bg-white/60 dark:bg-bloom-cardNight text-bloom-700 dark:text-bloom-300 border-bloom-200 dark:border-bloom-borderNight hover:bg-bloom-100 dark:hover:bg-bloom-plum/40'
        ]"
      >
        {{ sub }}
      </button>
    </div>
  </div>
</template>
