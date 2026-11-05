import { createClient } from '@supabase/supabase-js'
import { getTodayString, addDays } from './utils/dateUtils'

// Storage keys
const SUPABASE_CONFIG_KEY = 'bloom_task_supabase_config'
const LOCAL_TASKS_KEY = 'bloom_task_local_items'
const LOCAL_SUBJECTS_KEY = 'bloom_task_local_subjects'
const LOCAL_COMPLETIONS_KEY = 'bloom_task_local_completions'
const DEMO_USER_KEY = 'bloom_task_demo_user'

export const DEFAULT_SUBJECTS = []

export function getDefaultDemoTasks() {
  return []
}

// Client initialization
let supabaseClient = null

export function getStoredSupabaseConfig() {
  const envUrl = import.meta.env.VITE_SUPABASE_URL
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY

  if (envUrl && envKey) {
    return { url: envUrl, anonKey: envKey, fromEnv: true }
  }

  try {
    const raw = localStorage.getItem(SUPABASE_CONFIG_KEY)
    if (raw) return JSON.parse(raw)
  } catch (e) {
    console.error('Failed to parse stored Supabase config', e)
  }

  return { url: '', anonKey: '', fromEnv: false }
}

export function formatSupabaseUrl(rawUrl) {
  if (!rawUrl) return ''
  let url = rawUrl.trim()
  if (url.startsWith('postgres://') || url.startsWith('postgresql://')) {
    throw new Error('You entered a PostgreSQL database string (postgres://...). The frontend requires your Supabase Project URL (https://xyz.supabase.co), found in Supabase Dashboard > Project Settings > API.')
  }
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url
  }
  return url.replace(/\/+$/, '')
}

export function saveSupabaseConfig(url, anonKey) {
  if (!url || !anonKey) {
    localStorage.removeItem(SUPABASE_CONFIG_KEY)
    supabaseClient = null
    return false
  }
  const cleanUrl = formatSupabaseUrl(url)
  const cleanKey = anonKey.trim()
  localStorage.setItem(SUPABASE_CONFIG_KEY, JSON.stringify({ url: cleanUrl, anonKey: cleanKey, fromEnv: false }))
  initSupabase()
  return true
}

export function initSupabase() {
  const config = getStoredSupabaseConfig()
  if (config.url && config.anonKey) {
    try {
      const cleanUrl = formatSupabaseUrl(config.url)
      supabaseClient = createClient(cleanUrl, config.anonKey.trim())
      return supabaseClient
    } catch (err) {
      console.warn('Could not initialize Supabase client:', err)
      supabaseClient = null
    }
  }
  supabaseClient = null
  return null
}

// Initialize on module load
initSupabase()

export function isSupabaseConnected() {
  return !!supabaseClient
}

// =================== AUTH HELPERS ===================

export async function getCurrentUser() {
  if (supabaseClient) {
    try {
      const { data: { user } } = await supabaseClient.auth.getUser()
      return user
    } catch (e) {
      console.error('Error fetching Supabase user:', e)
    }
  }

  // Demo user in local storage
  const storedDemo = localStorage.getItem(DEMO_USER_KEY)
  if (storedDemo) {
    try {
      return JSON.parse(storedDemo)
    } catch {
      return null
    }
  }
  return null
}

export async function signUpUser(email, password) {
  if (supabaseClient) {
    const redirectUrl = typeof window !== 'undefined' ? window.location.origin : undefined
    const { data, error } = await supabaseClient.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl
      }
    })
    if (error) throw error

    // In Supabase, if email is already taken, identities array is empty
    if (data?.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
      throw new Error('An account with this email is already registered. Please switch to Sign In.')
    }

    const needsEmailConfirmation = !data?.session
    return {
      user: data?.user,
      session: data?.session,
      needsEmailConfirmation
    }
  }

  // Fallback demo auth
  const demoUser = {
    id: 'demo-user-' + Date.now(),
    email,
    created_at: new Date().toISOString(),
    isDemo: true
  }
  localStorage.setItem(DEMO_USER_KEY, JSON.stringify(demoUser))
  return { user: demoUser, session: null, needsEmailConfirmation: false }
}

export async function signInUser(email, password) {
  if (supabaseClient) {
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email,
      password,
    })
    if (error) {
      if (error.message && error.message.toLowerCase().includes('email not confirmed')) {
        throw new Error('Email not confirmed yet! Please click the confirmation link in your email inbox, or turn off "Confirm email" in Supabase Authentication settings.')
      }
      if (error.message && error.message.toLowerCase().includes('invalid login credentials')) {
        throw new Error('Invalid email or password. Please verify your credentials or create a new account.')
      }
      throw error
    }
    return { user: data.user, session: data.session }
  }

  // Fallback demo auth
  const demoUser = {
    id: 'demo-user-1',
    email,
    created_at: new Date().toISOString(),
    isDemo: true
  }
  localStorage.setItem(DEMO_USER_KEY, JSON.stringify(demoUser))
  return { user: demoUser, session: null }
}

export async function signOutUser() {
  if (supabaseClient) {
    await supabaseClient.auth.signOut()
  }
  localStorage.removeItem(DEMO_USER_KEY)
}

export async function sendPasswordResetEmail(email) {
  if (!supabaseClient) {
    throw new Error('Not connected to Supabase.')
  }
  const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/?reset_password=true`
  })
  if (error) throw error
}

export async function updateUserPassword(newPassword) {
  if (!supabaseClient) {
    throw new Error('Not connected to Supabase.')
  }
  const { error } = await supabaseClient.auth.updateUser({ password: newPassword })
  if (error) throw error
}

export function onAuthStateChange(callback) {
  if (supabaseClient) {
    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange((event, session) => {
      callback(session?.user || null)
    })
    return () => subscription.unsubscribe()
  }
  return () => {}
}

// =================== PROFILES TABLE ===================

export async function loadProfile(user) {
  if (supabaseClient && user && !user.isDemo) {
    try {
      const { data, error } = await supabaseClient
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (!error && data) return data

      // If missing row, insert profile
      const defaultName = user.email ? user.email.split('@')[0] : 'Bloom Student'
      const { data: newProfile } = await supabaseClient
        .from('profiles')
        .upsert({ id: user.id, display_name: defaultName, theme_preference: 'light', daily_task_goal: 5 })
        .select()
        .single()

      if (newProfile) return newProfile
    } catch (e) {
      console.warn('Profile fetch note:', e)
    }
  }

  return {
    display_name: user?.email ? user.email.split('@')[0] : 'Bloom Student',
    theme_preference: 'light',
    daily_task_goal: 5
  }
}

export async function updateProfile(updates, user) {
  if (supabaseClient && user && !user.isDemo) {
    const { data, error } = await supabaseClient
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', user.id)
      .select()
      .single()

    if (!error && data) return data
  }
  return updates
}

// =================== SUBJECTS TABLE ===================

export async function loadSubjects(user) {
  if (supabaseClient && user && !user.isDemo) {
    try {
      const { data, error } = await supabaseClient
        .from('subjects')
        .select('*')
        .order('position', { ascending: true })

      if (!error && data) {
        return data
      }
    } catch (e) {
      console.warn('Error fetching subjects from Supabase:', e)
    }
    return []
  }

  // Local storage fallback for guest/demo only
  try {
    const stored = localStorage.getItem(LOCAL_SUBJECTS_KEY)
    if (stored) return JSON.parse(stored)
  } catch {}

}


export async function createSubject(subject, user) {
  if (supabaseClient && user && !user.isDemo) {
    const { data, error } = await supabaseClient
      .from('subjects')
      .insert({
        user_id: user.id,
        name: subject.name.trim(),
        color_theme: subject.color_theme || 'pink',
        icon: subject.icon || 'BookOpen',
        position: subject.position || 0
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  const subjects = await loadSubjects(user)
  const newSub = {
    ...subject,
    id: 'sub-' + Date.now(),
    position: subjects.length
  }
  subjects.push(newSub)
  localStorage.setItem(LOCAL_SUBJECTS_KEY, JSON.stringify(subjects))
  return newSub
}

export async function deleteSubject(subjectId, user) {
  if (supabaseClient && user && !user.isDemo) {
    const { error } = await supabaseClient
      .from('subjects')
      .delete()
      .eq('id', subjectId)
    if (error) throw error
    return true
  }

  const subjects = await loadSubjects(user)
  const filtered = subjects.filter(s => s.id !== subjectId)
  localStorage.setItem(LOCAL_SUBJECTS_KEY, JSON.stringify(filtered))
  return true
}

// =================== TASK_COMPLETIONS TABLE ===================

export async function loadCompletions(user) {
  if (supabaseClient && user && !user.isDemo) {
    try {
      const { data, error } = await supabaseClient
        .from('task_completions')
        .select('*')

      if (!error && data) {
        return data
      }
    } catch (e) {
      console.warn('Error loading completions from Supabase:', e)
    }
  }

  try {
    const stored = localStorage.getItem(LOCAL_COMPLETIONS_KEY)
    if (stored) return JSON.parse(stored)
  } catch {}

  return []
}

export async function setTaskCompletionDate(taskId, completedDate, isCompleted, user) {
  if (supabaseClient && user && !user.isDemo) {
    if (isCompleted) {
      await supabaseClient
        .from('task_completions')
        .upsert(
          { task_id: taskId, user_id: user.id, completed_date: completedDate },
          { onConflict: 'task_id, completed_date' }
        )
    } else {
      await supabaseClient
        .from('task_completions')
        .delete()
        .eq('task_id', taskId)
        .eq('completed_date', completedDate)
    }
    return
  }

  // Local storage completions
  const completions = await loadCompletions(user)
  let updated
  if (isCompleted) {
    const exists = completions.some(c => c.task_id === taskId && c.completed_date === completedDate)
    if (!exists) {
      completions.push({
        id: 'comp-' + Date.now(),
        task_id: taskId,
        completed_date: completedDate,
        created_at: new Date().toISOString()
      })
    }
    updated = completions
  } else {
    updated = completions.filter(c => !(c.task_id === taskId && c.completed_date === completedDate))
  }
  localStorage.setItem(LOCAL_COMPLETIONS_KEY, JSON.stringify(updated))
}

// =================== TASKS TABLE ===================

export async function loadTasks(user) {
  if (supabaseClient && user && !user.isDemo) {
    const { data, error } = await supabaseClient
      .from('tasks')
      .select('*, subjects(*)')
      .order('position', { ascending: true })

    if (!error && data) {
      return data
    }
    if (error) {
      console.warn('Supabase tasks error:', error)
    }
    return []
  }

  // Local storage fallback
  try {
    const stored = localStorage.getItem(LOCAL_TASKS_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (e) {
    console.error('Error loading local tasks', e)
  }

  // Seed default demo tasks
  const defaults = getDefaultDemoTasks()
  localStorage.setItem(LOCAL_TASKS_KEY, JSON.stringify(defaults))
  return defaults
}

export async function saveTask(task, user) {
  const isSupabase = supabaseClient && user && !user.isDemo

  if (isSupabase) {
    const payload = {
      title: task.title,
      description: task.description || '',
      subject: task.subject || 'General',
      subject_id: task.subject_id || null,
      priority: task.priority || 'medium',
      due_date: task.due_date,
      is_completed: !!task.is_completed,
      is_recurring: !!task.is_recurring,
      recurring_start_date: task.recurring_start_date || null,
      recurring_end_date: task.recurring_end_date || null,
      position: task.position ?? 0,
      completed_at: task.is_completed ? (task.completed_at || new Date().toISOString()) : null,
      user_id: user.id
    }

    if (task.id && !task.id.startsWith('demo-') && !task.id.startsWith('local-')) {
      const { data, error } = await supabaseClient
        .from('tasks')
        .update(payload)
        .eq('id', task.id)
        .select('*, subjects(*)')
        .single()
      if (error) throw error
      return data
    } else {
      const { data, error } = await supabaseClient
        .from('tasks')
        .insert(payload)
        .select('*, subjects(*)')
        .single()
      if (error) throw error
      return data
    }
  }

  // Local Storage Save
  const tasks = await loadTasks(user)
  let updatedTask
  if (task.id) {
    const index = tasks.findIndex(t => t.id === task.id)
    if (index !== -1) {
      tasks[index] = { ...tasks[index], ...task }
      updatedTask = tasks[index]
    } else {
      updatedTask = { ...task, id: 'local-' + Date.now() }
      tasks.push(updatedTask)
    }
  } else {
    updatedTask = {
      ...task,
      id: 'local-' + Date.now(),
      created_at: new Date().toISOString()
    }
    tasks.push(updatedTask)
  }
  localStorage.setItem(LOCAL_TASKS_KEY, JSON.stringify(tasks))
  return updatedTask
}

export async function deleteTask(taskId, user) {
  if (supabaseClient && user && !user.isDemo) {
    const { error } = await supabaseClient
      .from('tasks')
      .delete()
      .eq('id', taskId)
    if (error) throw error
    return true
  }

  const tasks = await loadTasks(user)
  const filtered = tasks.filter(t => t.id !== taskId)
  localStorage.setItem(LOCAL_TASKS_KEY, JSON.stringify(filtered))
  return true
}

export async function updateTaskPositions(tasksList, user) {
  if (supabaseClient && user && !user.isDemo) {
    for (let i = 0; i < tasksList.length; i++) {
      await supabaseClient
        .from('tasks')
        .update({ position: i })
        .eq('id', tasksList[i].id)
    }
    return
  }

  const tasks = await loadTasks(user)
  const taskMap = new Map(tasks.map(t => [t.id, t]))
  tasksList.forEach((t, index) => {
    if (taskMap.has(t.id)) {
      taskMap.get(t.id).position = index
    }
  })
  localStorage.setItem(LOCAL_TASKS_KEY, JSON.stringify(Array.from(taskMap.values())))
}
