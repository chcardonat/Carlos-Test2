# Time Tracker

A local desktop time-tracking app built with **Electron + React + SQLite** (via sql.js).
Track time spent on tasks throughout your working day — no account, no cloud, no internet required.

## Features

- **Start / pause / resume / stop** tasks with one click
- **Project grouping** — assign tasks to optional projects
- **Daily summary** — totals by task, by project, and by task-per-project
- **Manage panel** — add, rename, and archive projects and tasks
- **Orphan detection** — if the app is force-closed mid-timer, it prompts on next launch
- **Persistent local storage** — data saved to your AppData folder via SQLite

## Prerequisites

- [Node.js](https://nodejs.org/) v18 or later (npm is included)

> No C++ compiler or Visual Studio Build Tools required — the app uses sql.js (pure WebAssembly SQLite).

## Getting Started

```bash
# 1. Clone the repository
https://github.com/chcardonat/Carlos-Test2.git
cd Carlos-Test2

# 2. Install dependencies
npm install

# 3. Start the app
npm start
```

The app window opens automatically.

## Data location

| OS | Path |
|----|------|
| Windows | `%APPDATA%\time-tracker\timetracker.db` |
| macOS | `~/Library/Application Support/time-tracker/timetracker.db` |

## Build a distributable

```bash
npm run make
```

Installers are written to the `out/` directory.

## Tech stack

| Layer | Technology |
|-------|------------|
| Desktop shell | Electron 42 |
| UI | React 19 + TypeScript |
| Bundler | Vite 5 + electron-forge |
| Database | sql.js (SQLite via WebAssembly) |
| Styling | Custom CSS — Inter font |

## Project structure

```
src/
  main.ts               # Electron main process
  preload.ts            # contextBridge IPC bridge
  db.ts                 # sql.js init, schema, persist
  queries.ts            # All SQL queries
  ipc.ts                # ipcMain handlers
  renderer.tsx          # React entry point
  App.tsx               # Root component + nav
  app.css               # Stylesheet
  types.ts              # Shared TypeScript interfaces
  components/
    TodayView.tsx        # Today layout
    ActiveTimer.tsx      # Running / paused / idle timer
    TaskList.tsx         # Grouped task list
    DailySummary.tsx     # Daily totals
    ManagePanel.tsx      # CRUD for projects & tasks
```
