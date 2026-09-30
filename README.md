# Makeathon Attendance — Real-Time Multi-Admin Spreadsheet

A high-density, Excel-style attendance tracker built with **Next.js (App Router, TypeScript, Tailwind CSS)**, **Supabase PostgreSQL & Realtime**, and **Lucide React**.

---

## 🚀 Features

- **High-Density Spreadsheet UI**:
  - Linear/terminal-inspired dark aesthetics (`#09090b` / `#000000`).
  - Sticky index column (`SL#`) and sticky frozen team name (`TEAM NAME`).
  - 3 attendance columns for each candidate: **Oct 7**, **Oct 8**, and **Oct 9**.
  - Automatic handling for teams with 2, 3, or 4 members (empty member slots are clearly blanked and disabled).
  - Inline team remarks/comments input field.

- **Real-Time Multi-Admin Synchronization & Locking**:
  - Supports up to 4 concurrent admin roles: `Admin 1`, `Admin 2`, `Admin 3`, `Admin 4`.
  - **White outline**: Indicates your currently active cell / focused row.
  - **Remote Lock badge**: When another admin selects or edits a team row, that team is greyed out (`opacity 0.5`) with a lock indicator badge (`Locked by Admin X`), preventing edit collisions.
  - Seamless inter-tab local broadcast synchronization and Supabase Realtime channel integration.

- **Global Search & Focus**:
  - Persistent search bar accessible globally via <kbd>⌘K</kbd> or <kbd>/</kbd>.
  - Instant autocomplete by team name, member name, or team number (e.g. `#14` or `VIBE CREW`).
  - Automatically scrolls to bring target team into view and focuses it.

- **Desktop Keyboard Navigation**:
  - <kbd>↑</kbd> <kbd>↓</kbd> <kbd>→</kbd> <kbd>←</kbd>: Navigate through spreadsheet cells.
  - <kbd>P</kbd>: Mark cell as **Present** (Blue pill).
  - <kbd>A</kbd> or <kbd>X</kbd>: Mark cell as **Absent** (Grey pill).
  - <kbd>Space</kbd>: Toggle attendance state.
  - <kbd>Tab</kbd> / <kbd>Enter</kbd>: Step to next cell / row.

- **Team Roster Drawer / Modal**:
  - Click the Settings gear icon on any team to modify member names, reassign roles, or add members up to 4.

- **One-Click CSV Export**:
  - Exports a clean `attendance_oct_7_8_9.csv` file with headers: `Sl. No`, `Team Name`, `Member Role`, `Member Name`, `Oct 7 Attendance`, `Oct 8 Attendance`, `Oct 9 Attendance`, `Comments`.

---

## 🛠️ Setup & Running

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Variables
Create or update [.env.local](file:///.env.local) with your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```
*(Note: If left blank, the app will run seamlessly in offline/local mock mode with all 60 pre-seeded teams and inter-tab presence sync).*

### 3. Database Migration
Run the SQL script located in [supabase_schema.sql](file:///supabase_schema.sql) in your Supabase SQL Editor.

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.
