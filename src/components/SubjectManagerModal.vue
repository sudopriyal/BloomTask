<script setup>
import { ref } from 'vue'
import { X, Plus, Trash2, BookOpen, Sparkles, Tag } from 'lucide-vue-next'

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  subjects: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['close', 'create-subject', 'delete-subject'])

const newName = ref('')
const selectedTheme = ref('rose')

const themeOptions = [
  { id: 'rose', label: 'Rose Pink', class: 'bg-rose-100 text-rose-800 border-rose-300' },
  { id: 'pink', label: 'Blush Pink', class: 'bg-pink-100 text-pink-800 border-pink-300' },
  { id: 'fuchsia', label: 'Fuchsia', class: 'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-300' },
  { id: 'plum', label: 'Plum', class: 'bg-bloom-plum/20 text-bloom-900 border-bloom-300' },
  { id: 'purple', label: 'Lilac', class: 'bg-purple-100 text-purple-800 border-purple-300' },
  { id: 'champagne', label: 'Peach', class: 'bg-amber-100 text-amber-900 border-amber-300' }
]

function handleAdd() {
  if (!newName.value.trim()) return
  emit('create-subject', {
    name: newName.value.trim(),
    color_theme: selectedTheme.value
  })
  newName.value = ''
}
</script>

<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bloom-950/60 backdrop-blur-sm transition-opacity duration-300"
    @click.self="emit('close')"
  >
    <div
      class="w-full max-w-md rounded-3xl bg-white dark:bg-bloom-cardNight border border-bloom-200 dark:border-bloom-borderNight shadow-2xl p-6 transition-all duration-300 overflow-hidden flex flex-col max-h-[85vh]"
    >
      <!-- Header -->
      <div class="flex items-center justify-between pb-3 border-b border-bloom-100 dark:border-bloom-borderNight">
        <div class="flex items-center gap-2">
          <span class="text-xl">🌸</span>
          <div>
            <h2 class="text-lg font-bold font-decorative text-bloom-900 dark:text-bloom-100 tracking-wide">
              Manage Subjects & Topics
            </h2>
            <p class="text-[11px] text-bloom-600 dark:text-bloom-400 font-soft">
              Define your own topics to organize and group tasks
            </p>
          </div>
        </div>
        <button
          @click="emit('close')"
          class="p-2 rounded-full text-bloom-400 hover:text-bloom-700 hover:bg-bloom-100 dark:hover:bg-bloom-plum/50 transition-colors"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Add New Subject Form -->
      <form @submit.prevent="handleAdd" class="mt-4 p-3.5 rounded-2xl bg-bloom-50 dark:bg-bloom-plum/30 border border-bloom-200 dark:border-bloom-borderNight space-y-3">
        <span class="text-xs font-semibold text-bloom-800 dark:text-bloom-200 font-soft flex items-center gap-1.5">
          <Plus class="w-3.5 h-3.5 text-bloom-500" />
          Create New Topic
        </span>

        <input
          v-model="newName"
          type="text"
          placeholder="e.g. Calculus, Physics, World War II..."
          class="w-full px-3 py-2 rounded-xl bg-white dark:bg-bloom-cardNight border border-bloom-200 dark:border-bloom-borderNight text-bloom-900 dark:text-bloom-100 text-xs focus:ring-2 focus:ring-bloom-400 focus:outline-none"
          required
        />

        <!-- Color Theme Pills -->
        <div>
          <label class="block text-[11px] font-medium text-bloom-700 dark:text-bloom-300 mb-1.5 font-soft">
            Select Color Tone:
          </label>
          <div class="flex flex-wrap gap-1.5">
            <button
              v-for="opt in themeOptions"
              :key="opt.id"
              type="button"
              @click="selectedTheme = opt.id"
              class="px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all font-soft"
              :class="[
                opt.class,
                selectedTheme === opt.id ? 'ring-2 ring-bloom-500 shadow-petal font-bold scale-105' : 'opacity-70 hover:opacity-100'
              ]"
            >
              {{ opt.label }}
            </button>
          </div>
        </div>

        <button
          type="submit"
          class="w-full py-2 rounded-xl bg-gradient-to-r from-bloom-500 to-bloom-600 text-white text-xs font-bold font-soft shadow-pink-glow hover:opacity-95 active:scale-95 transition-all flex items-center justify-center gap-1"
        >
          <Sparkles class="w-3.5 h-3.5" />
          <span>Save Subject</span>
        </button>
      </form>

      <!-- Existing Subjects List -->
      <div class="mt-4 flex-grow overflow-y-auto pr-0.5 space-y-2">
        <div class="flex items-center justify-between text-xs font-semibold text-bloom-800 dark:text-bloom-200 font-soft mb-1">
          <span>Your Defined Subjects ({{ subjects.length }})</span>
          <span class="text-[10px] text-bloom-500 font-normal">Subject is optional for tasks</span>
        </div>

        <div v-if="subjects.length === 0" class="py-8 text-center text-xs text-bloom-500 dark:text-bloom-400 font-soft">
          <BookOpen class="w-8 h-8 mx-auto text-bloom-300 mb-2 opacity-80" />
          No subjects created yet. Add your study subjects above to start grouping tasks!
        </div>

        <div
          v-for="sub in subjects"
          :key="sub.id"
          class="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-bloom-cardNight border border-bloom-200 dark:border-bloom-borderNight shadow-2xs group"
        >
          <div class="flex items-center gap-2">
            <Tag class="w-3.5 h-3.5 text-bloom-500" />
            <span class="text-xs font-semibold text-bloom-900 dark:text-bloom-100 font-soft">
              {{ sub.name }}
            </span>
            <span class="text-[10px] px-2 py-0.5 rounded-full capitalize bg-bloom-100 text-bloom-700 dark:bg-bloom-plum dark:text-bloom-300">
              {{ sub.color_theme || 'pink' }}
            </span>
          </div>

          <button
            type="button"
            @click="emit('delete-subject', sub.id)"
            class="p-1 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
            title="Delete this subject"
          >
            <Trash2 class="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
