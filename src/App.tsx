/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { SongFile, Category, AppSettings } from "./types";
import SongList from "./components/SongList";
import CategoryManager from "./components/CategoryManager";
import AudioPreviewController from "./components/AudioPreviewController";
import ExportPanel from "./components/ExportPanel";
import { Music, FolderHeart, ShieldCheck, CheckCircle, Info, Instagram, Calendar, Cpu, Layers, User, ExternalLink, X, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { getSeededTracks } from "./utils/audioGenerator";

const INITIAL_CATEGORIES: Category[] = [
  { id: "cat-1", name: "Old Hindi", color: "#F59E0B" },      // Amber
  { id: "cat-2", name: "New Hindi", color: "#EC4899" },      // Pink
  { id: "cat-3", name: "Old English", color: "#10B981" },    // Emerald
  { id: "cat-4", name: "New English", color: "#8B5CF6" },    // Violet
  { id: "cat-5", name: "Marathi", color: "#EF4444" },        // Red
  { id: "cat-6", name: "Musie", color: "#06B6D4" },          // Cyan
  { id: "cat-7", name: "Extra", color: "#6B7280" },          // Gray
];

export default function App() {
  const [songs, setSongs] = useState<SongFile[]>([]);
  const [categories, setCategories] = useState<Category[]>(INITIAL_CATEGORIES);
  const [currentSongIndex, setCurrentSongIndex] = useState<number>(0);
  const [autoPlay, setAutoPlay] = useState<boolean>(false);
  const [showDevInfo, setShowDevInfo] = useState<boolean>(false);
  const [settings, setSettings] = useState<AppSettings>({
    skipPercentage: 20,
    previewDuration: 10,
    autoplayNext: true,
    loopPreview: true,
  });

  // Load sample/demo tracks
  const handleLoadDemoTracks = () => {
    setSongs(getSeededTracks());
    setCurrentSongIndex(0);
    setAutoPlay(false);
  };

  // Handle uploaded audio files
  const handleSongsUpload = (uploadedFiles: FileList | File[]) => {
    const newSongsList: SongFile[] = [];

    Array.from(uploadedFiles).forEach((file) => {
      // Validate file is a supported audio type
      if (!file.type.startsWith("audio/") && !file.name.match(/\.(mp3|wav|m4a|flac|aac|ogg)$/i)) {
        return;
      }

      // Check if file with same name and size is already in list to avoid duplicates
      const isDuplicate = songs.some(s => s.name === file.name && s.size === file.size);
      if (isDuplicate) return;

      newSongsList.push({
        id: `song-${Math.random().toString(36).substring(2, 9)}`,
        file: file,
        name: file.name,
        size: file.size,
        duration: null, // will load when played
        category: null, // uncategorized initially
      });
    });

    if (newSongsList.length > 0) {
      setSongs((prev) => {
        const updated = [...prev, ...newSongsList];
        // If nothing was loaded, focus the first new song
        if (prev.length === 0) {
          setCurrentSongIndex(0);
          setAutoPlay(false);
        }
        return updated;
      });
    }
  };

  // Clear song list and reset cursor
  const handleClearQueue = () => {
    setSongs([]);
    setCurrentSongIndex(0);
    setAutoPlay(false);
  };

  // Remove individual song from list
  const handleRemoveSong = (id: string) => {
    setSongs((prev) => {
      const idxToRemove = prev.findIndex((s) => s.id === id);
      if (idxToRemove === -1) return prev;

      const updated = prev.filter((s) => s.id !== id);

      // Adjust cursor position
      if (currentSongIndex >= updated.length) {
        setCurrentSongIndex(Math.max(0, updated.length - 1));
      } else if (idxToRemove < currentSongIndex) {
        setCurrentSongIndex(currentSongIndex - 1);
      }

      setAutoPlay(false);
      return updated;
    });
  };

  const handleSongSelect = (index: number) => {
    if (index >= 0 && index < songs.length) {
      setCurrentSongIndex(index);
      setAutoPlay(true);
    }
  };

  // Callback to update settings
  const handleUpdateSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
  };

  // Receive parsed duration back from player
  const handleDurationLoaded = (songId: string, duration: number) => {
    setSongs((prev) =>
      prev.map((song) => (song.id === songId ? { ...song, duration } : song))
    );
  };

  // Categorize current active track
  const handleCategorize = (categoryId: string | null) => {
    if (songs.length === 0 || currentSongIndex >= songs.length) return;

    // Check if there are any other uncategorized songs left before categorizing this one
    const uncategorizedLeft = songs.filter((s, idx) => s.category === null && idx !== currentSongIndex).length;

    setSongs((prev) =>
      prev.map((song, idx) =>
        idx === currentSongIndex ? { ...song, category: categoryId } : song
      )
    );

    // If added to any folder (categoryId !== null), ALWAYS move forward immediately and keep playing
    if (categoryId !== null) {
      let nextIndex = -1;
      // Search for next uncategorized song after current
      for (let i = currentSongIndex + 1; i < songs.length; i++) {
        if (songs[i].category === null) {
          nextIndex = i;
          break;
        }
      }

      // If not found, wrap around to look from beginning
      if (nextIndex === -1) {
        for (let i = 0; i < currentSongIndex; i++) {
          if (songs[i].category === null) {
            nextIndex = i;
            break;
          }
        }
      }

      // Fallback: If no uncategorized songs remain, advance to absolute next song
      if (nextIndex === -1) {
        nextIndex = (currentSongIndex + 1) % songs.length;
      }

      setAutoPlay(true);
      setCurrentSongIndex(nextIndex);
    } else {
      // If removed from category (reset tag), check settings
      if (settings.autoplayNext) {
        if (uncategorizedLeft > 0) {
          handleNextSong();
        } else {
          setAutoPlay(false);
          handleNextSong();
        }
      }
    }
  };

  // Seek forward to the next uncategorized song, or loop back to index 0
  const handleNextSong = () => {
    if (songs.length === 0) return;

    // Search for next uncategorized song after current
    let nextIndex = -1;
    for (let i = currentSongIndex + 1; i < songs.length; i++) {
      if (songs[i].category === null) {
        nextIndex = i;
        break;
      }
    }

    // If not found, wrap around to look from beginning up to current
    if (nextIndex === -1) {
      for (let i = 0; i < currentSongIndex; i++) {
        if (songs[i].category === null) {
          nextIndex = i;
          break;
        }
      }
    }

    let shouldStopPlay = false;

    // Fallback: If no uncategorized songs remain, just advance to the absolute next song
    if (nextIndex === -1) {
      shouldStopPlay = true;
      nextIndex = (currentSongIndex + 1) % songs.length;
    }

    // Also, if we are playing sequentially and we wrap around from the end of the list back to the start
    if (currentSongIndex === songs.length - 1 && nextIndex === 0) {
      shouldStopPlay = true;
    }

    if (shouldStopPlay) {
      setAutoPlay(false);
    } else {
      setAutoPlay(true);
    }

    setCurrentSongIndex(nextIndex);
  };

  // Category CRUD
  const handleAddCategory = (name: string, color: string) => {
    const id = `cat-${Math.random().toString(36).substring(2, 9)}`;
    setCategories((prev) => [...prev, { id, name, color }]);
  };

  const handleEditCategory = (id: string, newName: string, newColor: string) => {
    setCategories((prev) =>
      prev.map((cat) => (cat.id === id ? { ...cat, name: newName, color: newColor } : cat))
    );
  };

  const handleDeleteCategory = (id: string) => {
    const category = categories.find((c) => c.id === id);
    if (!category) return;

    const assignedSongs = songs.filter((s) => s.category === id);
    if (assignedSongs.length > 0) {
      const confirmDelete = confirm(
        `Folder "${category.name}" contains ${assignedSongs.length} sorted track(s). Deleting it will mark these tracks as "Unsorted". Proceed?`
      );
      if (!confirmDelete) return;
    }

    // Delete category
    setCategories((prev) => prev.filter((cat) => cat.id !== id));

    // Reset songs with this category
    setSongs((prev) =>
      prev.map((song) => (song.category === id ? { ...song, category: null } : song))
    );
  };

  const currentSong = songs[currentSongIndex] || null;

  return (
    <div id="app-root" className="min-h-screen bg-[#0F1115] text-[#E2E8F0] flex flex-col font-sans selection:bg-indigo-500/25 antialiased">
      {/* Top Professional Navigation Bar */}
      <header className="bg-[#1A1D24] border-b border-white/5 px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-lg shadow-black/20">
        <div className="flex items-center gap-3">
          <div 
            className="h-10 px-3 bg-[#DCDAD5] rounded-xl border border-[#C5C3BF] flex items-center justify-center shadow-md shadow-black/20 overflow-hidden select-none hover:scale-105 transition-transform duration-200 cursor-pointer"
            onClick={() => setShowDevInfo(true)}
            title="View Developer Info"
          >
            {/* Custom SVG "Soul" Logo */}
            <svg 
              className="h-8 w-auto" 
              viewBox="0 0 115 55" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Musical Staff lines */}
              <path d="M 5 18 Q 30 3, 58 14 T 110 10" stroke="#1A1D24" strokeWidth="0.8" opacity="0.85" />
              <path d="M 5 21 Q 30 6, 58 17 T 110 13" stroke="#1A1D24" strokeWidth="0.8" opacity="0.85" />
              <path d="M 5 24 Q 30 9, 58 20 T 110 16" stroke="#1A1D24" strokeWidth="0.8" opacity="0.85" />
              <path d="M 5 27 Q 30 12, 58 23 T 110 19" stroke="#1A1D24" strokeWidth="0.8" opacity="0.85" />
              <path d="M 5 30 Q 30 15, 58 26 T 110 22" stroke="#1A1D24" strokeWidth="0.8" opacity="0.85" />

              {/* Musical Notes */}
              {/* Note 1 */}
              <ellipse cx="25" cy="15" rx="2.5" ry="1.8" transform="rotate(-15 25 15)" fill="#1A1D24" />
              <path d="M 27.2 15 L 27.2 6" stroke="#1A1D24" strokeWidth="1" />
              
              {/* Note 2 */}
              <ellipse cx="45" cy="11" rx="2.5" ry="1.8" transform="rotate(-15 45 11)" fill="#1A1D24" />
              <path d="M 47.2 11 L 47.2 2" stroke="#1A1D24" strokeWidth="1" />
              
              {/* Note 3 (Beamed notes) */}
              <ellipse cx="62" cy="18" rx="2.5" ry="1.8" transform="rotate(-15 62 18)" fill="#1A1D24" />
              <path d="M 64.2 18 L 64.2 8" stroke="#1A1D24" strokeWidth="1" />
              <ellipse cx="75" cy="16" rx="2.5" ry="1.8" transform="rotate(-15 75 16)" fill="#1A1D24" />
              <path d="M 77.2 16 L 77.2 6" stroke="#1A1D24" strokeWidth="1" />
              <path d="M 64.2 8 L 77.2 6" stroke="#1A1D24" strokeWidth="1.8" />

              {/* Note 4 */}
              <ellipse cx="92" cy="15" rx="2.5" ry="1.8" transform="rotate(-15 92 15)" fill="#1A1D24" />
              <path d="M 94.2 15 L 94.2 6" stroke="#1A1D24" strokeWidth="1" />

              {/* Bold stylized text 'Soul' */}
              {/* S */}
              <path 
                d="M 23 48 C 17.5 48 13.5 46 12 42.5 C 10.8 39.5 11.5 36.5 15.5 35 C 19 33.7 21 33 21 31.5 C 21 30.5 19.5 29.8 17.5 29.8 C 14.5 29.8 13 31.2 12.5 32 L 6 28.5 C 8 24.5 12 22 18 22 C 24.5 22 28.5 25.5 28.5 30.5 C 28.5 35.5 24.5 37 19.5 38.5 C 16.5 39.5 16 40.5 16 41.5 C 16 42.5 17.8 43.2 20.5 43.2 C 24 43.2 26 41.5 26.5 40 L 32.5 43.5 C 31 46.5 27.5 48 23 48 Z" 
                fill="#1A1D24" 
              />
              
              {/* o */}
              <path 
                d="M 47.5 48 C 39.5 48 35 42.5 35 35 C 35 27.5 39.5 22 47.5 22 C 55.5 22 60 27.5 60 35 C 60 42.5 55.5 48 47.5 48 Z M 47.5 29.5 C 44.5 29.5 42.5 31.5 42.5 35 C 42.5 38.5 44.5 40.5 47.5 40.5 C 50.5 40.5 52.5 38.5 52.5 35 C 52.5 31.5 50.5 29.5 47.5 29.5 Z" 
                fill="#1A1D24" 
              />
              
              {/* u */}
              <path 
                d="M 64.5 23 L 71.5 23 L 71.5 37 C 71.5 40 73 41 75 41 C 77 41 78.5 40 78.5 37 L 78.5 23 L 85.5 23 L 85.5 37.5 C 85.5 44 81 48 75 48 C 69 48 64.5 44 64.5 37.5 L 64.5 23 Z" 
                fill="#1A1D24" 
              />
              
              {/* l */}
              <path 
                d="M 91 22 L 98 22 L 98 42 C 98 45 100 46 102.5 46 L 105.5 46 L 105.5 52 L 101.5 52 C 95.5 52 91 48.5 91 41 L 91 22 Z" 
                fill="#1A1D24" 
              />
            </svg>
          </div>
          <div>
            <h1 
              className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 cursor-pointer hover:text-indigo-400 transition-colors"
              onClick={() => setShowDevInfo(true)}
              title="View Developer Info"
            >
              VibeCheck - Songs Sorter
            </h1>
            <p className="text-[10px] text-white/40 font-mono uppercase tracking-widest mt-0.5">
              Offline preview, tags & custom directory ZIP packaging
            </p>
          </div>
        </div>

      </header>

      {/* Main Workspace Layout */}
      <main className="flex-1 max-w-[1500px] w-full mx-auto px-6 pt-6 pb-12 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
        {/* Left column: Setup, Queue & Folders (Spans 5 of 12) */}
        <div className="lg:col-span-5 flex flex-col gap-6 h-full min-h-0">
          {/* Song selection queue */}
          <div className="flex-1 min-h-[300px]">
            <SongList
              songs={songs}
              categories={categories}
              currentSongIndex={currentSongIndex}
              onSongSelect={handleSongSelect}
              onSongsUpload={handleSongsUpload}
              onClearQueue={handleClearQueue}
              onRemoveSong={handleRemoveSong}
              onLoadDemoTracks={handleLoadDemoTracks}
            />
          </div>

          {/* Category management */}
          <div className="h-[400px]">
            <CategoryManager
              categories={categories}
              onAddCategory={handleAddCategory}
              onEditCategory={handleEditCategory}
              onDeleteCategory={handleDeleteCategory}
            />
          </div>
        </div>

        {/* Right column: Audio Workspace & Export Options (Spans 7 of 12) */}
        <div className="lg:col-span-7 flex flex-col gap-6 h-full min-h-0">
          {/* Primary previewer & category mapper */}
          <div className="flex-1">
            <AudioPreviewController
              currentSong={currentSong}
              categories={categories}
              settings={settings}
              autoPlay={autoPlay}
              onUpdateSettings={handleUpdateSettings}
              onCategorize={handleCategorize}
              onDurationLoaded={handleDurationLoaded}
              onNextSong={handleNextSong}
            />
          </div>

          {/* Statistics & Zipped export */}
          <div className="h-[400px]">
            <ExportPanel 
              songs={songs} 
              categories={categories} 
            />
          </div>
        </div>
      </main>

      {/* Help Banner Footer */}
      <footer className="bg-[#1A1D24] border-t border-white/5 py-3 text-center text-[10px] text-white/30 font-mono uppercase tracking-widest">
        Developed by <span className="text-indigo-400 font-bold">Ashuu</span> · Made for audio producers · Powered by secure client-side Web Audio & JSZip engines
      </footer>

      {/* Developer Info Modal */}
      <AnimatePresence>
        {showDevInfo && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDevInfo(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
              id="dev-modal-backdrop"
            />

            {/* Modal Content Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="relative w-full max-w-md bg-[#1A1D24] border border-white/10 rounded-2xl overflow-hidden shadow-2xl z-10"
              id="dev-info-modal"
            >
              {/* Card top banner */}
              <div className="h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

              {/* Close Button */}
              <button
                onClick={() => setShowDevInfo(false)}
                className="absolute top-4 right-4 p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="p-6">
                {/* Header */}
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                    <User className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white tracking-wide uppercase font-sans">
                      Developer Profile
                    </h2>
                    <p className="text-[10px] text-white/40 font-mono uppercase tracking-widest mt-0.5">
                      VibeCheck Application Details
                    </p>
                  </div>
                </div>

                {/* Main details */}
                <div className="space-y-4">
                  {/* Name field */}
                  <div className="bg-white/3 border border-white/5 rounded-xl p-3 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="block text-[9px] font-mono uppercase tracking-wider text-white/30">
                        Developer Name
                      </span>
                      <span className="block text-sm font-bold text-white">
                        Ashutosh Jangale
                      </span>
                    </div>
                  </div>

                  {/* Insta Id field with interactive link */}
                  <a
                    href="https://instagram.com/ashu_jangale_07"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-white/3 border border-white/5 hover:border-pink-500/30 hover:bg-pink-500/3 rounded-xl p-3 flex items-center justify-between gap-3 transition-all duration-200 group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-pink-500/10 border border-pink-500/20 group-hover:bg-pink-500/20 flex items-center justify-center text-pink-400 shrink-0 transition-colors">
                        <Instagram className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="block text-[9px] font-mono uppercase tracking-wider text-white/30">
                          Instagram Handle
                        </span>
                        <span className="block text-sm font-bold text-white group-hover:text-pink-400 transition-colors">
                          @ashu_jangale_07
                        </span>
                      </div>
                    </div>
                    <ExternalLink className="w-4 h-4 text-white/30 group-hover:text-pink-400 transition-colors mr-1" />
                  </a>

                  {/* App Development Date */}
                  <div className="bg-white/3 border border-white/5 rounded-xl p-3 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="block text-[9px] font-mono uppercase tracking-wider text-white/30">
                        Release Date
                      </span>
                      <span className="block text-sm font-bold text-white">
                        July 2026
                      </span>
                    </div>
                  </div>

                  {/* Stack and features used */}
                  <div className="bg-white/3 border border-white/5 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Cpu className="w-4 h-4 text-cyan-400" />
                      <span className="text-[10px] font-mono uppercase tracking-wider text-white/50">
                        Technology Stack
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <span className="text-[10px] px-2 py-1 rounded bg-[#252A34] text-white/80 border border-white/5 font-mono">
                        React 19 & TypeScript
                      </span>
                      <span className="text-[10px] px-2 py-1 rounded bg-[#252A34] text-white/80 border border-white/5 font-mono">
                        Tailwind CSS v4
                      </span>
                      <span className="text-[10px] px-2 py-1 rounded bg-[#252A34] text-white/80 border border-white/5 font-mono">
                        Motion API
                      </span>
                      <span className="text-[10px] px-2 py-1 rounded bg-[#252A34] text-white/80 border border-white/5 font-mono">
                        Web Audio API
                      </span>
                      <span className="text-[10px] px-2 py-1 rounded bg-[#252A34] text-white/80 border border-white/5 font-mono">
                        JSZip Engine
                      </span>
                      <span className="text-[10px] px-2 py-1 rounded bg-[#252A34] text-white/80 border border-white/5 font-mono">
                        Lucide Icons
                      </span>
                    </div>
                  </div>
                </div>

                {/* Ok Button */}
                <button
                  onClick={() => setShowDevInfo(false)}
                  className="w-full mt-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold text-xs uppercase tracking-wider transition-all duration-200 shadow-md shadow-indigo-500/10 cursor-pointer"
                >
                  Close Profile
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
