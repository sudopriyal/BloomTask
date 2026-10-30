# 🌸 Bloom Task — Personalized Study & Task Tracker

> A responsive, mobile-first Study & Task Tracker web application crafted with a dual pink aesthetic, Vue 3, Vite, Tailwind CSS, Supabase (Auth + Database), and Drag-and-Drop study organization.

---

## 🎨 Visual & Theme Specifications

- **Fully Pink-Themed UI** with smooth transition toggles:
  - **🌸 Light Mode (`Bloom Day`)**: Soft, elegant pink accent palette (`#FDF2F8`, `#FBCFE8`, `#F472B6`, `#EC4899`) paired with clean light backgrounds, decorative typography, and dark warm plum text.
  - **🌙 Dark Mode (`Night Plum / Orchid`)**: Deep, rich dark plum palette (`#181016`, `#251522`, `#3B122D`, `#DB2777`) with glowing rose accents and light petal text.
- **Typography**: Decorative headings powered by Google Fonts:
  - **Headings & Titles**: *Cinzel Decorative* & *Playfair Display*
  - **Pills, Badges & Accents**: *Comfortaa*
  - **Body & Controls**: *Plus Jakarta Sans*
- **Responsiveness**: Mobile-first layout with thumb-friendly controls, Floating Action Button (FAB) on small screens, and elegant responsive card scaling on desktop.

---

## 🌟 Core Features

1. **Header & Dynamic Summary**:
   - Displays today's full date dynamically (e.g., `Friday, October 30, 2026`).
   - One-click Theme Switcher (`Light Pink` ↔ `Dark Plum`).
   - Bloom Daily Momentum Tracker: Shows progress percentage with animated pink gradient and celebratory floral confetti upon completion!
2. **Task Creation & Automation**:
   - **Manual Tasks**: Title, optional description/notes, subject/category tags (*Biology*, *Math*, *Chemistry*, *Literature*, *History*, *Personal*, or custom), and due date.
   - **Recurring Daily Tasks**: Toggle "Daily Recurring Task" with custom start and end dates. The system automatically creates and tracks tasks for every active day within that range.
3. **Visibility & Focus Window**:
   - **Next 7 Days (Focus Window)**: Displays tasks due today plus any tasks due within the next 7 days (`today <= due_date <= today + 7`).
   - Quick Tabs: *Next 7 Days*, *Today Only*, and *All Active*.
   - Filter by study subject (*Math*, *Biology*, *Chemistry*, etc.).
   - Dynamic Countdown Badges: `Due Today 🌸`, `Tomorrow ⏳`, `In X days`, and `X days overdue`.
4. **Sorting & Custom Ordering**:
   - **Sort by Priority / Due Date**: Automatically orders tasks by fewest remaining days.
   - **Manual Drag-and-Drop**: Toggle *Manual Drag* to arrange tasks by personal preference via touch-friendly drag handles (`vuedraggable` + `sortablejs`).
5. **Task Completion Behavior**:
   - Checking off a task immediately moves it to the **Completed Tasks** sub-section at the bottom.
   - Completed tasks become visually dulled/faded (`opacity-60`) with a strikethrough effect.
   - Includes full support for restoring tasks or bulk clearing.
6. **Authentication & Supabase Database**:
   - Supabase Auth (Sign Up and Login with Email & Password).
   - Single `tasks` database table with Row-Level Security (RLS).
   - Instant Demo Mode fallback: Preloaded with sample pink study tasks so the app works seamlessly even before connecting a Supabase project!

---

## 🚀 Getting Started

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
