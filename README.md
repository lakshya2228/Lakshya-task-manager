# FocusFlow — Dynamic Task Manager & Productivity Tracker

A responsive task management web app built with HTML, CSS and vanilla JavaScript. No backend or server dependencies are required.

## Features
- Complete CRUD: create, read, update and delete tasks
- Categories: Work, Personal and Study
- Optional due dates with today/tomorrow/overdue indicators
- Mark tasks complete or move them back to active
- Filters for All tasks, Active and Completed
- Quick category filtering, search, and sorting
- Dashboard statistics and completion progress ring
- Automatic persistence with browser `localStorage`
- Light/dark theme preference saved locally
- Responsive layout for desktop, tablet and mobile
- Keyboard: `Ctrl/Cmd + K` focuses search; `Esc` closes the task dialog
- No framework, backend or build step required

## Run locally
1. Download or clone this repository.
2. Open `index.html` in a modern browser.
3. Add a task; refresh the page to verify tasks persist.

## Deploy with GitHub Pages
1. Push all project files to a public GitHub repository. Keep `index.html`, `style.css`, and `script.js` in the repository root.
2. Open repository **Settings → Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**.
4. Choose branch `main` and folder `/ (root)`, then save.
5. Wait for the published URL shown on the Pages settings screen.

## How persistence works
Tasks are stored in the browser's local storage under `focusflow.tasks.v1`; theme choice is stored under `focusflow.theme.v1`. Data is browser/device-specific and is not synced to other devices.
