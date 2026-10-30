/**
 * Date utility functions for Bloom Task
 * Safely handles local date formatting without timezone skew.
 */

export function getTodayString() {
  const d = new Date()
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function parseLocalDate(dateStr) {
  if (!dateStr) return new Date()
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function formatFullDate(date = new Date()) {
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
  return date.toLocaleDateString('en-US', options)
}

export function formatShortDate(dateStr) {
  if (!dateStr) return ''
  const d = parseLocalDate(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function addDays(dateStr, days) {
  const d = parseLocalDate(dateStr)
  d.setDate(d.getDate() + days)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Returns difference in calendar days: targetDate - today
 * 0 = Today, 1 = Tomorrow, negative = Overdue
 */
export function getDaysDifference(dateStr) {
  if (!dateStr) return 0
  const todayStr = getTodayString()
  const today = parseLocalDate(todayStr)
  const target = parseLocalDate(dateStr)
  
  const diffTime = target.getTime() - today.getTime()
  return Math.round(diffTime / (1000 * 60 * 60 * 24))
}

/**
 * Check if a due date is within today + next 7 days
 */
export function isWithinNext7Days(dateStr) {
  const diff = getDaysDifference(dateStr)
  return diff >= 0 && diff <= 7
}

/**
 * Generates countdown indicator styling and text
 */
export function getCountdownBadge(dateStr, isCompleted = false) {
  if (isCompleted) {
    return {
      label: 'Completed',
      status: 'completed',
      classes: 'bg-zinc-200/80 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 border border-zinc-300 dark:border-zinc-700'
    }
  }

  const diff = getDaysDifference(dateStr)

  if (diff < 0) {
    const daysAgo = Math.abs(diff)
    return {
      label: daysAgo === 1 ? '1 day overdue' : `${daysAgo} days overdue`,
      status: 'overdue',
      classes: 'bg-rose-100 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300 border border-rose-300 dark:border-rose-800 animate-pulse font-semibold'
    }
  }

  if (diff === 0) {
    return {
      label: 'Due Today 🌸',
      status: 'today',
      classes: 'bg-bloom-500 text-white dark:bg-bloom-600 shadow-petal font-semibold animate-pulse'
    }
  }

  if (diff === 1) {
    return {
      label: 'Tomorrow ⏳',
      status: 'tomorrow',
      classes: 'bg-bloom-200 text-bloom-900 dark:bg-bloom-900/80 dark:text-bloom-200 border border-bloom-300 dark:border-bloom-700 font-medium'
    }
  }

  return {
    label: `In ${diff} days`,
    status: 'upcoming',
    classes: 'bg-bloom-100 text-bloom-800 dark:bg-bloom-950 dark:text-bloom-300 border border-bloom-200 dark:border-bloom-800 font-medium'
  }
}
