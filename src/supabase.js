import { createClient } from '@supabase/supabase-js'
import { getTodayString, addDays } from './utils/dateUtils'

// Storage keys
const SUPABASE_CONFIG_KEY = 'bloom_task_supabase_config'
const LOCAL_TASKS_KEY = 'bloom_task_local_items'
const DEMO_USER_KEY = 'bloom_task_demo_user'

export const SUPABASE_SQL_SCHEMA = `-- Bloom Task SQL Table Definition
-- Run this in your Supabase SQL Editor:

create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  title text not null,
  description text,
  subject text default 'General',
  due_date date not null,
  is_completed boolean default false,
  is_recurring boolean default false,
  recurring_start_date date,
  recurring_end_date date,
  position integer default 0,
  created_at timestamptz default now()
);

-- Enable Row Level Security
alter table tasks enable row level security;

-- Policies for Authenticated Users
create policy "Users can manage their own tasks"
  on tasks for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
`

// Default demo tasks in various pink pastel subjects
export function getDefaultDemoTasks() {
  const today = getTodayString()
  return [
    {
      id: 'demo-1',
      title: '🌸 Biology: Cellular Respiration Diagram',
      description: 'Review Krebs cycle and draw the mitochondrial electron transport chain.',
      subject: 'Biology',
      due_date: today,
      is_completed: false,
      is_recurring: false,
      position: 0,
      created_at: new Date().toISOString()
    },
    {
      id: 'demo-2',
      title: '✨ Daily Math Problem Set (15 mins)',
      description: 'Solve 5 calculus differentiation problems for speed drill.',
      subject: 'Math',
      due_date: today,
      is_completed: false,
      is_recurring: true,
      recurring_start_date: today,
      recurring_end_date: addDays(today, 6),
      position: 1,
      created_at: new Date().toISOString()
    },
    {
      id: 'demo-3',
      title: '📖 Literature: Read Chapter 5-7 & Note Themes',
      description: 'Annotate floral and romantic motifs in the poetry collection.',
      subject: 'Literature',
      due_date: addDays(today, 1),
      is_completed: false,
      is_recurring: false,
      position: 2,
      created_at: new Date().toISOString()
    },
    {
      id: 'demo-4',
      title: '🧪 Chemistry: Acid-Base Titration Lab Prep',
      description: 'Calculate molarity and review safety protocols before lab.',
      subject: 'Chemistry',
      due_date: addDays(today, 3),
      is_completed: false,
      is_recurring: false,
      position: 3,
      created_at: new Date().toISOString()
    },
    {
      id: 'demo-5',
      title: '🏛️ History: Modern European Timeline Review',
      description: 'Consolidate flashcards for the midterm review session.',
      subject: 'History',
      due_date: addDays(today, 5),
      is_completed: false,
      is_recurring: false,
      position: 4,
      created_at: new Date().toISOString()
    },
    {
      id: 'demo-6',
      title: '🎀 Weekly Study Plan & Workspace Reset',
      description: 'Organize study desk, sharpen pencils, and color-code study notes.',
      subject: 'Personal',
      due_date: today,
      is_completed: true,
      is_recurring: false,
      position: 5,
      created_at: new Date().toISOString()
    }
  ]
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

export function saveSupabaseConfig(url, anonKey) {
  if (!url || !anonKey) {
    localStorage.removeItem(SUPABASE_CONFIG_KEY)
    supabaseClient = null
    return false
  }
  localStorage.setItem(SUPABASE_CONFIG_KEY, JSON.stringify({ url: url.trim(), anonKey: anonKey.trim(), fromEnv: false }))
  initSupabase()
  return true
}

export function initSupabase() {
  const config = getStoredSupabaseConfig()
  if (config.url && config.anonKey) {
    try {
      supabaseClient = createClient(config.url, config.anonKey)
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
    const { data, error } = await supabaseClient.auth.signUp({
      email,
      password,
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

export function onAuthStateChange(callback) {
  if (supabaseClient) {
    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange((event, session) => {
      callback(session?.user || null)
    })
    return () => subscription.unsubscribe()
  }
  return () => {}
}

// =================== TASK CRUD ===================

export async function loadTasks(user) {
  if (supabaseClient && user && !user.isDemo) {
    const { data, error } = await supabaseClient
      .from('tasks')
      .select('*')
      .order('position', { ascending: true })

    if (!error && data) {
      return data
    }
    console.warn('Falling back to local tasks due to Supabase error:', error)
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
      due_date: task.due_date,
      is_completed: !!task.is_completed,
      is_recurring: !!task.is_recurring,
      recurring_start_date: task.recurring_start_date || null,
      recurring_end_date: task.recurring_end_date || null,
      position: task.position ?? 0,
      user_id: user.id
    }

    if (task.id && !task.id.startsWith('demo-') && !task.id.startsWith('local-')) {
      const { data, error } = await supabaseClient
        .from('tasks')
        .update(payload)
        .eq('id', task.id)
        .select()
        .single()
      if (error) throw error
      return data
    } else {
      const { data, error } = await supabaseClient
        .from('tasks')
        .insert(payload)
        .select()
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
    // Upsert or sequential position updates
    for (let i = 0; i < tasksList.length; i++) {
      await supabaseClient
        .from('tasks')
        .update({ position: i })
        .eq('id', tasksList[i].id)
    }
    return
  }

  // Update in local tasks
  const tasks = await loadTasks(user)
  const taskMap = new Map(tasks.map(t => [t.id, t]))
  tasksList.forEach((t, index) => {
    if (taskMap.has(t.id)) {
      taskMap.get(t.id).position = index
    }
  })
  localStorage.setItem(LOCAL_TASKS_KEY, JSON.stringify(Array.from(taskMap.values())))
}
