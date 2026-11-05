# 🌸 Bloom Task — Personalized Study & Task Tracker

> A responsive, mobile-first Study & Task Tracker web application crafted with a dual pink aesthetic, Vue 3, Vite, Tailwind CSS, Supabase (Auth + Database), and Drag-and-Drop study organization.

---

## Getting Started

### 1. Installation

```bash
cd C:\Users\priya\OneDrive\GitHub\BloomTask
npm install
```

### 2. Run Development Server

```bash
npm run dev
```

Open your browser at `http://localhost:5173`.

### 3. Build for Production

```bash
npm run build
npm run preview
```

---

## 🗄️ Supabase Database Schema

Run this SQL snippet in your [Supabase Dashboard](https://supabase.com) > **SQL Editor**:

```sql
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

-- Policy: Users can only manage their own tasks
create policy "Users can manage their own tasks"
  on tasks for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
```

### 4. Supabase Credentials (Optional)

You can either:
- Enter your Supabase Project URL and Anon Public Key directly in the **Database & Settings** modal inside the running app.
- Or create a `.env` file in the root of `BloomTask`:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```
