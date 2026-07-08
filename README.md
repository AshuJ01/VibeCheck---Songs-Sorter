# VibeCheck - Songs Sorter

An interactive, high-performance web application designed to help audio producers and music collectors sort, categorize, and archive their audio collections entirely in a secure client-side sandbox.

---

## 🎵 Application Summary

**VibeCheck - Songs Sorter** solves the tedious task of sorting hundreds of audio tracks, loops, and song files. It provides an intuitive workflow where users can upload or use seeded tracks, quickly preview key 10-second middle segments of songs automatically, allocate custom tags/folder labels to each track, and export their organized categories into a clean, custom-directory structures packaged as a single **ZIP archive**—all processed with blazing-fast client-side technology.

---

## 🛠️ Technologies & Features Used

This application leverages a state-of-the-art web stack to provide a fast, secure, and delightful experience:

### 1. **React 19 & TypeScript**
- **Purpose**: Powering the modern declarative user interface and reactive application state.
- **Why it matters**: Ensures the interface updates instantly on user actions (e.g., sorting, categorized count increases) with robust, type-safe development patterns.

### 2. **Tailwind CSS v4**
- **Purpose**: Provides highly optimized utility classes for structural layouts, custom scrollbars, and modern aesthetics.
- **Why it matters**: Enables a responsive, desktop-first design with fine-grained layouts and custom off-white/dark color styling.

### 3. **Motion API (`motion/react`)**
- **Purpose**: Drives layout-aware page transitions, interactive hover effects, and spring-based modal entries.
- **Why it matters**: Creates an organic and "soulful" user experience with hardware-accelerated animations (such as the developer profile overlay).

### 4. **Web Audio API**
- **Purpose**: Implements custom client-side audio decoding, real-time waveform calculations, custom track offset jumping (skipping to the middle 20%), and automatic track sequence playbacks.
- **Why it matters**: Ensures no user audio data is ever uploaded to a remote server, keeping the workflow completely secure, private, and local.

### 5. **JSZip Engine**
- **Purpose**: Compiles multiple user-defined folders containing audio files directly inside the browser memory.
- **Why it matters**: Allows instant ZIP archives of fully sorted audio directories to be created and downloaded in one click.

### 6. **Lucide Icons**
- **Purpose**: Delivers modern, crisp, and high-performance SVG vector iconography.
- **Why it matters**: Visually enhances navigation, track status, player controllers, and detail drawers.

---

## 📁 Key File Structure

- `/src/App.tsx`: Main entry layout containing core categorization states and header/footer structures.
- `/src/components/SongList.tsx`: Manage active music queues, upload states, and current selection pointers.
- `/src/components/AudioPreviewController.tsx`: Custom sound wave displays, playback bounds, volume widgets, and skipping mechanics.
- `/src/components/CategoryManager.tsx`: Interactive grid representing active target folders and assigning hotkeys.
- `/src/components/ExportPanel.tsx`: Dynamic folder allocations breakdown and final JSZip generation.
- `/src/utils/audioGenerator.ts`: Handles procedural seeding of placeholder ambient tracks for demonstration.

---

## 💻 Developer Profile
- **Developer Name**: Ashutosh Jangale
- **Instagram Handle**: [@ashu_jangale_07](https://instagram.com/ashu_jangale_07)
- **Release Date**: July 2026
