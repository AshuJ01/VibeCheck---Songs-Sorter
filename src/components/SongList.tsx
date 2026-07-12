/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from "react";
import { SongFile, Category } from "../types";
import { 
  Music, 
  FolderOpen, 
  UploadCloud, 
  Search, 
  Trash2, 
  Play, 
  CheckCircle2, 
  Clock,
  FileAudio,
  ChevronRight,
  X,
  ChevronDown,
  ChevronUp
} from "lucide-react";

interface SongListProps {
  songs: SongFile[];
  categories: Category[];
  currentSongIndex: number;
  onSongSelect: (index: number) => void;
  onSongsUpload: (files: FileList | File[]) => void;
  onClearQueue: () => void;
  onRemoveSong: (id: string) => void;
  onLoadDemoTracks?: () => void;
}

export default function SongList({
  songs,
  categories,
  currentSongIndex,
  onSongSelect,
  onSongsUpload,
  onClearQueue,
  onRemoveSong,
  onLoadDemoTracks
}: SongListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<"all" | "pending" | "categorized">("all");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isMinimized, setIsMinimized] = useState(true);
  const queueContainerRef = useRef<HTMLDivElement>(null);
  const modalQueueContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll the active song into view
  React.useEffect(() => {
    if (currentSongIndex !== -1) {
      if (queueContainerRef.current) {
        const activeElement = queueContainerRef.current.querySelector("#song-item-active");
        if (activeElement) {
          activeElement.scrollIntoView({
            behavior: "smooth",
            block: "nearest",
          });
        }
      }
      if (modalQueueContainerRef.current) {
        const activeElement = modalQueueContainerRef.current.querySelector("#modal-song-item-active");
        if (activeElement) {
          activeElement.scrollIntoView({
            behavior: "smooth",
            block: "nearest",
          });
        }
      }
    }
  }, [currentSongIndex, isMinimized]);

  // Helper to format bytes
  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onSongsUpload(e.dataTransfer.files);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onSongsUpload(e.target.files);
    }
  };

  // Filter songs based on search and selected tab
  const filteredSongs = songs.filter((song) => {
    const matchesSearch = song.name.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;

    if (filter === "pending") return song.category === null;
    if (filter === "categorized") return song.category !== null;
    return true;
  });

  const pendingCount = songs.filter(s => s.category === null).length;
  const sortedCount = songs.length - pendingCount;

  return (
    <div id="song-list-container" className="flex flex-col h-full bg-[#1A1D24] rounded-xl border border-white/5 shadow-xl overflow-hidden animate-in fade-in duration-300">
      {/* Upload Header Area */}
      <div className="p-5 border-b border-white/5 bg-[#1A1D24]">
        <h2 className="text-xs font-bold uppercase tracking-widest text-white/60 mb-3 flex items-center gap-2">
          <Music className="w-3.5 h-3.5 text-indigo-400" />
          Import Queue
        </h2>
        
        {/* Invisible file inputs */}
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          multiple 
          accept="audio/*" 
          className="hidden" 
        />
        <input 
          type="file" 
          ref={folderInputRef} 
          onChange={handleFileChange} 
          // @ts-ignore
          webkitdirectory="" 
          directory="" 
          multiple 
          className="hidden" 
        />

        {/* Drag & Drop Upload Zone */}
        <div 
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border border-dashed rounded-xl p-5 text-center transition-all duration-200 cursor-pointer ${
            isDragging 
              ? "border-indigo-500 bg-indigo-500/10" 
              : "border-white/10 hover:border-white/20 bg-[#15181E]/40"
          }`}
        >
          <UploadCloud className={`w-8 h-8 mx-auto mb-2 transition-all duration-200 ${isDragging ? "text-indigo-400 scale-105" : "text-white/30"}`} />
          <p className="text-xs text-white/80 font-semibold mb-1">
            Drag & drop audio files here
          </p>
          <p className="text-[10px] text-white/40 mb-3 font-mono">
            MP3, WAV, M4A, FLAC, AAC
          </p>
          
          <div className="flex flex-wrap items-center justify-center gap-2">
            <button 
              id="btn-upload-files"
              onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
              className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white/95 text-xs font-semibold rounded-lg transition-all duration-150 flex items-center gap-1.5"
            >
              <FileAudio className="w-3 h-3 text-white/60" />
              Select Files
            </button>
            <button 
              id="btn-upload-folder"
              onClick={(e) => { e.stopPropagation(); folderInputRef.current?.click(); }}
              className="px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-indigo-300 text-xs font-semibold rounded-lg transition-all duration-150 flex items-center gap-1.5"
            >
              <FolderOpen className="w-3 h-3 text-indigo-400" />
              Upload Folder
            </button>
          </div>
        </div>
      </div>

      {/* List Filter Actions */}
      {songs.length > 0 && (
        <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between gap-2 bg-[#15181E]/20">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-white/30" />
            <input 
              id="search-songs"
              type="text" 
              placeholder="Search queue..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 text-xs bg-[#15181E] rounded-lg border border-white/5 focus:border-indigo-500/50 placeholder-white/20 text-white/90 focus:outline-none font-sans"
            />
          </div>
          <button 
            id="btn-clear-queue"
            onClick={onClearQueue}
            className="text-[11px] font-bold text-rose-400 hover:text-rose-300 px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 hover:border-rose-500/40 rounded-lg transition-all duration-150 flex items-center gap-1.5 cursor-pointer active:scale-[0.98]"
            title="Clear all songs"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear
          </button>
        </div>
      )}

      {/* Tabs / Counters */}
      {songs.length > 0 && (
        <div className="px-4 py-2 border-b border-white/5 flex items-center justify-between bg-[#15181E]/40 text-xs">
          <div className="flex items-center gap-1">
            <button 
              id="tab-filter-all"
              onClick={() => setFilter("all")}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider transition-all duration-150 ${
                filter === "all" ? "bg-indigo-500 text-white shadow-md shadow-indigo-500/10" : "text-white/40 hover:bg-white/5"
              }`}
            >
              All ({songs.length})
            </button>
            <button 
              id="tab-filter-pending"
              onClick={() => setFilter("pending")}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider transition-all duration-150 ${
                filter === "pending" ? "bg-indigo-500 text-white shadow-md shadow-indigo-500/10" : "text-white/40 hover:bg-white/5"
              }`}
            >
              Pending ({pendingCount})
            </button>
            <button 
              id="tab-filter-categorized"
              onClick={() => setFilter("categorized")}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider transition-all duration-150 ${
                filter === "categorized" ? "bg-indigo-500 text-white shadow-md shadow-indigo-500/10" : "text-white/40 hover:bg-white/5"
              }`}
            >
              Sorted ({sortedCount})
            </button>
          </div>

          <button
            id="btn-toggle-minimize"
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1 px-2 hover:bg-[#232730] text-indigo-400 hover:text-indigo-300 rounded-lg transition-all duration-150 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider cursor-pointer border border-indigo-500/20 bg-indigo-500/5 shadow-sm"
            title={isMinimized ? "Open Popup" : "Popup Open"}
          >
            {isMinimized ? (
              <>
                <span>Maximize</span>
                <ChevronUp className="w-3.5 h-3.5 text-indigo-400 animate-bounce" style={{ animationDuration: '2s' }} />
              </>
            ) : (
              <>
                <span className="text-emerald-400 font-extrabold">Popup Active</span>
                <ChevronUp className="w-3.5 h-3.5 text-emerald-400" />
              </>
            )}
          </button>
        </div>
      )}

      {/* Queue Area */}
      <div 
        ref={queueContainerRef}
        className="overflow-y-auto p-3 space-y-1.5 custom-scrollbar bg-[#1A1D24] transition-all duration-300 h-[486px] max-h-[486px] flex-none"
      >
        {filteredSongs.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-6 text-white/30 text-center">
            <Music className="w-10 h-10 mb-2 stroke-[1.5] text-white/20" />
            <p className="text-xs font-semibold text-white/50 mb-0.5">
              {songs.length === 0 ? "Queue is empty" : "No matching songs"}
            </p>
            <p className="text-[11px] text-white/30 max-w-[200px] mb-4">
              {songs.length === 0 ? "Select files or folder above to get started sorting." : "Try adjusting your filters or search query."}
            </p>
            {songs.length === 0 && onLoadDemoTracks && (
              <button
                id="btn-load-demo-tracks"
                onClick={onLoadDemoTracks}
                className="px-3.5 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-indigo-300 hover:text-indigo-200 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all duration-150 flex items-center gap-1.5 cursor-pointer"
              >
                Or Load Demo Tracks
              </button>
            )}
          </div>
        ) : (
          filteredSongs.map((song) => {
            const indexInMain = songs.findIndex((s) => s.id === song.id);
            const isActive = indexInMain === currentSongIndex;
            const assignedCategory = categories.find(c => c.id === song.category);

            return (
              <div 
                key={song.id}
                id={isActive ? "song-item-active" : `song-item-${song.id}`}
                onClick={() => onSongSelect(indexInMain)}
                className={`group flex items-center justify-between p-2.5 h-[46px] rounded-xl transition-all duration-150 cursor-pointer text-left border ${
                  isActive 
                    ? "bg-indigo-500/10 text-white border-indigo-500/40 shadow-lg shadow-indigo-500/5" 
                    : "bg-[#15181E]/40 hover:bg-[#15181E] text-white/80 border-white/5 hover:border-white/10"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${
                    isActive 
                      ? "bg-indigo-500 text-white" 
                      : song.category 
                        ? "bg-indigo-500/20 text-indigo-300" 
                        : "bg-white/5 text-white/30 group-hover:bg-white/10"
                  }`}>
                    {song.category ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : isActive ? (
                      <Play className="w-3 h-3 fill-current" />
                    ) : (
                      <Music className="w-3.5 h-3.5" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className={`text-xs font-semibold truncate leading-tight ${isActive ? "text-indigo-300" : "text-white/90"}`}>
                      {song.name}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-[10px] font-mono ${isActive ? "text-white/60" : "text-white/30"}`}>
                        {formatSize(song.size)}
                      </span>
                      {song.duration !== null && (
                        <span className={`text-[10px] font-mono flex items-center gap-0.5 ${isActive ? "text-white/60" : "text-white/30"}`}>
                          <Clock className="w-2.5 h-2.5" />
                          {Math.floor(song.duration / 60)}:
                          {String(Math.floor(song.duration % 60)).padStart(2, "0")}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right side actions */}
                <div className="flex items-center gap-1.5 ml-2">
                  {assignedCategory && !isActive && (
                    <span 
                      className="px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider uppercase border text-ellipsis overflow-hidden max-w-[80px] whitespace-nowrap"
                      style={{ 
                        backgroundColor: `${assignedCategory.color}15`, 
                        borderColor: `${assignedCategory.color}40`,
                        color: assignedCategory.color 
                      }}
                    >
                      {assignedCategory.name}
                    </span>
                  )}
                  <button
                    id={`btn-remove-song-${song.id}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveSong(song.id);
                    }}
                    className={`p-1 rounded-md opacity-0 group-hover:opacity-100 transition-all duration-150 ${
                      isActive 
                        ? "hover:bg-white/10 text-white/40 hover:text-white" 
                        : "hover:bg-white/10 text-white/40 hover:text-rose-400"
                    }`}
                    title="Remove from queue"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                  <ChevronRight className={`w-3.5 h-3.5 flex-shrink-0 transition-all ${isActive ? "text-indigo-400" : "text-white/20"}`} />
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Maximized Pop Screen Modal */}
      {!isMinimized && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 md:p-6 animate-in fade-in duration-200"
          onClick={() => setIsMinimized(true)}
        >
          <div 
            onClick={(e) => e.stopPropagation()} 
            className="bg-[#1C1F26] rounded-2xl border border-white/10 shadow-2xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
          >
            {/* Modal Header */}
            <div className="p-5 border-b border-white/10 bg-[#1A1D24] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <Music className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    Import Queue Manager <span className="text-xs text-indigo-400 normal-case font-normal bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-500/20">{songs.length} Tracks</span>
                  </h2>
                  <p className="text-[10px] text-white/40 font-mono uppercase tracking-widest mt-0.5">
                    Spacious search, filters, drag-and-drop upload and select tracks to sort
                  </p>
                </div>
              </div>

              <button
                id="btn-close-modal"
                onClick={() => setIsMinimized(true)}
                className="px-3.5 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-indigo-300 hover:text-indigo-200 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all duration-150 flex items-center gap-1.5 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                title="Minimize queue manager"
              >
                <span>Minimize</span>
                <ChevronDown className="w-4 h-4 text-indigo-400" />
              </button>
            </div>

            {/* Split Grid */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-12 min-h-0 bg-[#1A1D24]/30">
              {/* Left sidebar inside popup: Upload zone & actions */}
              <div className="md:col-span-4 border-r border-white/5 p-6 flex flex-col gap-5 bg-[#15181E]/40 overflow-y-auto">
                <h3 className="text-[10px] font-bold uppercase tracking-wider text-white/40">
                  Add more tracks
                </h3>

                {/* Main upload dropzone inside popup */}
                <div 
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-5 text-center flex flex-col items-center justify-center cursor-pointer transition-all duration-150 group h-36 ${
                    isDragging 
                      ? "border-indigo-500 bg-indigo-500/5" 
                      : "border-white/5 bg-[#1A1D24]/40 hover:border-white/10 hover:bg-[#1A1D24]"
                  }`}
                >
                  <UploadCloud className="w-8 h-8 text-white/20 group-hover:text-indigo-400 mb-2 transition-colors duration-150" />
                  <p className="text-xs font-semibold text-white/75 group-hover:text-white mb-0.5">
                    Drag & Drop Files Here
                  </p>
                  <p className="text-[10px] text-white/40 font-mono">
                    or click to browse local files
                  </p>
                </div>

                {/* Folder upload inside popup */}
                <button
                  id="btn-modal-folder-upload"
                  onClick={() => folderInputRef.current?.click()}
                  className="w-full py-2.5 bg-[#1C1F26] hover:bg-[#232730] border border-white/5 hover:border-white/10 rounded-xl text-xs font-semibold text-white/80 hover:text-white transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <FolderOpen className="w-4 h-4 text-indigo-400" />
                  Upload Entire Folder
                </button>

                <div className="border-t border-white/5 my-2"></div>

                <h3 className="text-[10px] font-bold uppercase tracking-wider text-white/40">
                  Queue Actions
                </h3>

                {/* Clear queue button in modal */}
                <button 
                  id="btn-modal-clear-queue"
                  onClick={onClearQueue}
                  className="w-full py-2.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 hover:border-rose-500/40 rounded-xl text-xs font-bold text-rose-400 hover:text-rose-300 transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear Entire Queue
                </button>

                {songs.length === 0 && onLoadDemoTracks && (
                  <button
                    id="btn-modal-load-demo"
                    onClick={onLoadDemoTracks}
                    className="w-full py-2.5 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-indigo-300 hover:text-indigo-200 text-xs font-bold uppercase tracking-wider rounded-xl transition-all duration-150 flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.98]"
                  >
                    Load Demo Tracks
                  </button>
                )}

                {/* Informative Stats */}
                <div className="mt-auto bg-[#1A1D24]/40 border border-white/5 rounded-xl p-4 text-[11px] space-y-2 font-mono text-white/50">
                  <div className="flex justify-between">
                    <span>Total Tracks:</span>
                    <span className="text-white font-semibold">{songs.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Sorted Tracks:</span>
                    <span className="text-emerald-400 font-semibold">{sortedCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Remaining:</span>
                    <span className="text-amber-400 font-semibold">{pendingCount}</span>
                  </div>
                </div>
              </div>

              {/* Right column: Search + Filter + Big list */}
              <div className="md:col-span-8 p-6 flex flex-col h-full min-h-0 bg-[#1A1D24]/10">
                {/* Search Bar inside popup */}
                <div className="relative mb-4">
                  <Search className="absolute left-3.5 top-3 w-4 h-4 text-white/30" />
                  <input
                    type="text"
                    placeholder="Search tracks by file name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-[#15181E]/80 border border-white/5 focus:border-indigo-500/50 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white placeholder-white/30 focus:outline-none transition-all duration-150"
                  />
                  {searchTerm && (
                    <button 
                      onClick={() => setSearchTerm("")}
                      className="absolute right-3.5 top-3 text-white/30 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center gap-1 border-b border-white/5 pb-3 mb-4">
                  <button 
                    onClick={() => setFilter("all")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-150 ${
                      filter === "all" ? "bg-indigo-500 text-white shadow-md shadow-indigo-500/10" : "text-white/40 hover:bg-white/5"
                    }`}
                  >
                    All ({songs.length})
                  </button>
                  <button 
                    onClick={() => setFilter("pending")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-150 ${
                      filter === "pending" ? "bg-indigo-500 text-white shadow-md shadow-indigo-500/10" : "text-white/40 hover:bg-white/5"
                    }`}
                  >
                    Pending ({pendingCount})
                  </button>
                  <button 
                    onClick={() => setFilter("categorized")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-150 ${
                      filter === "categorized" ? "bg-indigo-500 text-white shadow-md shadow-indigo-500/10" : "text-white/40 hover:bg-white/5"
                    }`}
                  >
                    Sorted ({sortedCount})
                  </button>
                </div>

                {/* Large Queue Area */}
                <div 
                  ref={modalQueueContainerRef}
                  className="flex-1 overflow-y-auto space-y-1.5 custom-scrollbar min-h-0 bg-[#15181E]/20 p-2 rounded-xl border border-white/5"
                >
                  {filteredSongs.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center p-6 text-white/30 text-center">
                      <Music className="w-12 h-12 mb-3 stroke-[1.5] text-white/20" />
                      <p className="text-sm font-semibold text-white/50 mb-1">
                        No tracks match your selection
                      </p>
                      <p className="text-xs text-white/30 max-w-sm">
                        Try clearing your search term or adjusting filters.
                      </p>
                    </div>
                  ) : (
                    filteredSongs.map((song) => {
                      const indexInMain = songs.findIndex((s) => s.id === song.id);
                      const isActive = indexInMain === currentSongIndex;
                      const assignedCategory = categories.find(c => c.id === song.category);

                      return (
                        <div 
                          key={`modal-${song.id}`}
                          id={isActive ? "modal-song-item-active" : `modal-song-item-${song.id}`}
                          onClick={() => onSongSelect(indexInMain)}
                          className={`group flex items-center justify-between p-3 h-[52px] rounded-xl transition-all duration-150 cursor-pointer text-left border ${
                            isActive 
                              ? "bg-indigo-500/15 text-white border-indigo-500/50 shadow-lg shadow-indigo-500/5" 
                              : "bg-[#15181E]/60 hover:bg-[#15181E] text-white/80 border-white/5 hover:border-white/10"
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${
                              isActive 
                                ? "bg-indigo-500 text-white" 
                                : song.category 
                                  ? "bg-indigo-500/20 text-indigo-300" 
                                  : "bg-white/5 text-white/30 group-hover:bg-white/10"
                            }`}>
                              {song.category ? (
                                <CheckCircle2 className="w-4 h-4" />
                              ) : isActive ? (
                                <Play className="w-3.5 h-3.5 fill-current" />
                              ) : (
                                <Music className="w-4 h-4" />
                              )}
                            </div>

                            <div className="min-w-0 flex-1">
                              <p className={`text-xs font-semibold truncate leading-tight ${isActive ? "text-indigo-300" : "text-white/90"}`}>
                                {song.name}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className={`text-[10px] font-mono ${isActive ? "text-white/60" : "text-white/30"}`}>
                                  {formatSize(song.size)}
                                </span>
                                {song.duration !== null && (
                                  <span className={`text-[10px] font-mono flex items-center gap-0.5 ${isActive ? "text-white/60" : "text-white/30"}`}>
                                    <Clock className="w-2.5 h-2.5" />
                                    {Math.floor(song.duration / 60)}:
                                    {String(Math.floor(song.duration % 60)).padStart(2, "0")}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Right side actions */}
                          <div className="flex items-center gap-2 ml-2">
                            {assignedCategory && (
                              <span 
                                className="px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase border text-ellipsis overflow-hidden max-w-[120px] whitespace-nowrap"
                                style={{ 
                                  backgroundColor: `${assignedCategory.color}15`, 
                                  borderColor: `${assignedCategory.color}40`,
                                  color: assignedCategory.color 
                                }}
                              >
                                {assignedCategory.name}
                              </span>
                            )}
                            <button
                              id={`btn-modal-remove-song-${song.id}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                onRemoveSong(song.id);
                              }}
                              className={`p-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-all duration-150 ${
                                isActive 
                                  ? "hover:bg-white/10 text-white/40 hover:text-white" 
                                  : "hover:bg-white/10 text-white/40 hover:text-rose-400"
                              }`}
                              title="Remove from queue"
                            >
                              <X className="w-4 h-4" />
                            </button>
                            <ChevronRight className={`w-4 h-4 flex-shrink-0 transition-all ${isActive ? "text-indigo-400" : "text-white/20"}`} />
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
