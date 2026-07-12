/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { SongFile, Category, AppSettings } from "../types";
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Volume2, 
  Settings2, 
  ChevronRight, 
  FolderPlus,
  Compass,
  Zap,
  Gauge,
  HelpCircle,
  Infinity
} from "lucide-react";

interface AudioPreviewControllerProps {
  currentSong: SongFile | null;
  categories: Category[];
  settings: AppSettings;
  autoPlay: boolean;
  onUpdateSettings: (settings: AppSettings) => void;
  onCategorize: (categoryId: string | null) => void;
  onDurationLoaded: (songId: string, duration: number) => void;
  onNextSong: () => void;
}

export default function AudioPreviewController({
  currentSong,
  categories,
  settings,
  autoPlay,
  onUpdateSettings,
  onCategorize,
  onDurationLoaded,
  onNextSong
}: AudioPreviewControllerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showSettings, setShowSettings] = useState(false);
  const [isManualPlay, setIsManualPlay] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const animationRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Derive start and end times for preview slice
  const skipPercent = settings.skipPercentage / 100;
  const segmentStartTime = duration * skipPercent;
  const segmentEndTime = Math.min(duration, segmentStartTime + settings.previewDuration);

  // Initialize and load the audio source when currentSong changes
  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setIsManualPlay(false);

    if (audioRef.current) {
      audioRef.current.pause();
    }

    if (objectUrl) {
      URL.revokeObjectURL(objectUrl);
      setObjectUrl(null);
    }

    if (!currentSong) return;

    try {
      const url = URL.createObjectURL(currentSong.file);
      setObjectUrl(url);

      if (audioRef.current) {
        audioRef.current.src = url;
        audioRef.current.volume = volume;
        audioRef.current.playbackRate = playbackSpeed;
        audioRef.current.load();
      }
    } catch (err) {
      console.error("Failed to load audio file: ", err);
    }

    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [currentSong?.id]); // depend on id rather than reference to avoid redundant re-triggers

  // Update audio controls (volume, speed)
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
      audioRef.current.playbackRate = playbackSpeed;
    }
  }, [volume, playbackSpeed]);

  // Handle Play/Pause
  const togglePlay = () => {
    if (!currentSong || !audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      // If we are outside the preview segment bounds, seek back to the segment start
      const curr = audioRef.current.currentTime;
      if (curr < segmentStartTime - 0.2 || curr >= segmentEndTime) {
        audioRef.current.currentTime = segmentStartTime;
      }
      
      audioRef.current.play()
        .then(() => setIsPlaying(true))
        .catch((err) => console.error("Audio playback error: ", err));
    }
  };

  // Reset audio to the 20% (start) of the slice
  const handleReset = () => {
    if (!audioRef.current) return;
    setIsManualPlay(false);
    audioRef.current.currentTime = segmentStartTime;
    setCurrentTime(segmentStartTime);
    if (!isPlaying) {
      audioRef.current.play()
        .then(() => setIsPlaying(true))
        .catch((err) => console.error("Audio playback error: ", err));
    }
  };

  // Audio Event Handlers
  const handleLoadedMetadata = () => {
    if (!audioRef.current || !currentSong) return;
    const audioDur = audioRef.current.duration;
    setDuration(audioDur);
    
    // Propagate loaded duration back to main state
    onDurationLoaded(currentSong.id, audioDur);

    // Seed the seek position to the skipped intro starting point (20%)
    const startPoint = audioDur * (settings.skipPercentage / 100);
    audioRef.current.currentTime = startPoint;
    setCurrentTime(startPoint);

    // Auto-play on loaded if a song is loaded and autoPlay is true
    if (autoPlay) {
      audioRef.current.play()
        .then(() => setIsPlaying(true))
        .catch((err) => {
          // Safe rejection for browser autoplay blockages
          setIsPlaying(false);
        });
    } else {
      setIsPlaying(false);
    }
  };

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    const current = audioRef.current.currentTime;
    setCurrentTime(current);

    if (isManualPlay) {
      return;
    }

    // Preview boundaries enforcement
    const currentSegmentStart = duration * (settings.skipPercentage / 100);
    const currentSegmentEnd = currentSegmentStart + settings.previewDuration;

    if (current >= currentSegmentEnd) {
      if (settings.loopPreview) {
        // Loop: Seek back to start
        audioRef.current.currentTime = currentSegmentStart;
        setCurrentTime(currentSegmentStart);
      } else {
        // Pause playback
        audioRef.current.pause();
        setIsPlaying(false);
        audioRef.current.currentTime = currentSegmentStart;
        setCurrentTime(currentSegmentStart);

        // Auto-advance to the next track if autoplayNext is checked
        if (settings.autoplayNext && onNextSong) {
          onNextSong();
        }
      }
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
    if (settings.loopPreview) {
      handleReset();
    } else {
      // Auto-advance to the next track if autoplayNext is checked
      if (settings.autoplayNext && onNextSong) {
        onNextSong();
      }
    }
  };

  // Seeking on manual slider drag
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!audioRef.current) return;
    const seekTarget = parseFloat(e.target.value);
    audioRef.current.currentTime = seekTarget;
    setCurrentTime(seekTarget);
    setIsManualPlay(true);
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !audioRef.current || duration <= 0) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickRatio = clickX / rect.width;
    const seekTarget = clickRatio * duration;

    audioRef.current.currentTime = seekTarget;
    setCurrentTime(seekTarget);
    setIsManualPlay(true);

    if (!isPlaying) {
      audioRef.current.play()
        .then(() => setIsPlaying(true))
        .catch((err) => console.error("Audio playback error: ", err));
    }
  };

  // Draw Waveform Visualizer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let localId: number;
    const barWidth = 4;
    const barGap = 3;
    const totalBars = Math.floor(canvas.width / (barWidth + barGap));
    
    // Seed randomized static/dynamic heights
    const baseHeights = Array.from({ length: totalBars }, () => Math.random() * 0.6 + 0.1);

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const segmentStart = duration * (settings.skipPercentage / 100);
      const segmentEnd = segmentStart + settings.previewDuration;

      for (let i = 0; i < totalBars; i++) {
        const x = i * (barWidth + barGap);
        
        // Calculate the relative play position for this bar in the timeline
        const barTime = (i / totalBars) * duration;
        const isInSegment = barTime >= segmentStart && barTime <= segmentEnd;

        // Dynamic height modulation when playing
        let multiplier = baseHeights[i];
        if (isPlaying) {
          // modulate with sine wave for motion
          multiplier += Math.sin(Date.now() * 0.005 + i * 0.2) * 0.15;
          multiplier = Math.max(0.08, Math.min(0.9, multiplier));
        }

        const height = canvas.height * multiplier;
        const y = (canvas.height - height) / 2;

        // Visual coloring representing whether this is inside the preview slice
        if (isInSegment) {
          // Highlight active slice
          if (currentTime >= barTime && isPlaying) {
            ctx.fillStyle = "#6366F1"; // Active & Played (Indigo-500)
          } else {
            ctx.fillStyle = "#818CF8"; // Active & Upcoming (Indigo-400)
          }
        } else {
          // Normal song body (Slate)
          ctx.fillStyle = "rgba(255, 255, 255, 0.15)"; 
        }

        // Draw rounded rects for modern looking equalizer bar
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, height, 2);
        ctx.fill();
      }

      // Draw a vertical needle indicator for currentTime
      if (duration > 0) {
        const needleX = (currentTime / duration) * canvas.width;
        ctx.strokeStyle = "rgba(255, 255, 255, 0.75)"; 
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(needleX, 0);
        ctx.lineTo(needleX, canvas.height);
        ctx.stroke();
      }

      localId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(localId);
    };
  }, [isPlaying, currentTime, duration, settings.skipPercentage, settings.previewDuration]);

  // Helpers for formatting time
  const formatTime = (time: number) => {
    if (isNaN(time) || time === null) return "0:00";
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${String(secs).padStart(2, "0")}`;
  };

  return (
    <div id="audio-preview-container" className="bg-[#1A1D24] rounded-xl border border-white/5 shadow-xl p-6 flex flex-col justify-between h-full space-y-6 text-white">
      {/* Hidden audio element */}
      <audio 
        ref={audioRef}
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleAudioEnded}
      />

      {/* Header Info */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full uppercase tracking-widest inline-flex items-center gap-1">
            <Zap className="w-3 h-3 fill-current text-indigo-400 animate-pulse" />
            Active Monitor Queue
          </span>
          <h1 id="active-song-title" className="text-base font-bold text-white mt-2 truncate leading-snug" title={currentSong?.name || "No song loaded"}>
            {currentSong ? currentSong.name : "Select an audio file to start"}
          </h1>
          <p className="text-xs text-white/40 mt-0.5">
            {currentSong 
              ? `Ready for categorization · ${(currentSong.size / (1024 * 1024)).toFixed(2)} MB` 
              : "Load some files from the left side panel to test play previews."
            }
          </p>
        </div>

        <button
          id="btn-toggle-settings"
          onClick={() => setShowSettings(!showSettings)}
          className={`p-2 rounded-lg border transition-all duration-150 cursor-pointer ${
            showSettings 
              ? "bg-indigo-500 text-white border-indigo-500 shadow-md shadow-indigo-500/10" 
              : "bg-[#15181E] text-white/60 hover:text-white border-white/5 hover:bg-[#15181E]/80"
          }`}
          title="Adjust preview settings"
        >
          <Settings2 className="w-4 h-4" />
        </button>
      </div>

      {/* Visualizer & Timeline */}
      <div className="space-y-3">
        {/* Waveform Canvas container */}
        <div className="relative h-24 bg-[#15181E] rounded-xl border border-white/5 overflow-hidden px-4 flex items-center justify-center">
          {currentSong ? (
            <canvas 
              ref={canvasRef} 
              width={500} 
              height={80} 
              onClick={handleCanvasClick}
              className="w-full h-20 cursor-pointer transition-all hover:brightness-110 active:scale-[0.995]"
            />
          ) : (
            <div className="text-center text-white/30 text-xs">
              <Compass className="w-8 h-8 mx-auto mb-1 text-white/10" />
              Waiting for audio file stream...
            </div>
          )}

          {/* Overlaid preview segment bounds label */}
          {duration > 0 && (
            <div className="absolute top-2 right-3 text-[9px] font-bold tracking-wider uppercase bg-[#1A1D24]/80 text-white/70 border border-white/5 px-2.5 py-0.5 rounded backdrop-blur-sm font-mono flex items-center gap-1.5">
              {isManualPlay ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                  <span className="text-indigo-400 font-extrabold">Manual Seek Mode</span>
                </>
              ) : (
                <>
                  <span>PREVIEW SLICE: {formatTime(segmentStartTime)} - {formatTime(segmentEndTime)} ({settings.previewDuration}s)</span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Custom Progress Slider */}
        <div className="flex items-center justify-between text-[11px] font-bold text-white/40 font-mono">
          <span>{formatTime(currentTime)}</span>
          <input 
            id="timeline-slider"
            type="range" 
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={handleSeek}
            disabled={!currentSong}
            className="flex-1 mx-3 h-1.5 bg-[#15181E] border border-white/5 hover:bg-white/5 rounded-lg appearance-none cursor-pointer accent-indigo-500 disabled:opacity-50"
          />
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Player Primary Controls */}
      <div className="flex items-center justify-between gap-4 bg-[#15181E]/40 p-3 rounded-xl border border-white/5">
        <div className="flex items-center gap-2">
          {/* Play/Pause */}
          <button
            id="btn-play-pause"
            onClick={togglePlay}
            disabled={!currentSong}
            className="w-12 h-12 bg-indigo-500 hover:bg-indigo-400 text-white disabled:bg-white/5 disabled:text-white/20 rounded-full flex items-center justify-center shadow-lg shadow-indigo-500/10 transition duration-150 transform hover:scale-[1.03] active:scale-[0.97] cursor-pointer"
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 fill-current" />
            ) : (
              <Play className="w-5 h-5 fill-current translate-x-0.5" />
            )}
          </button>

          {/* Restart segment */}
          <button
            id="btn-reset-segment"
            onClick={handleReset}
            disabled={!currentSong}
            className="w-10 h-10 bg-white/5 hover:bg-white/10 border border-white/5 text-white/80 disabled:opacity-50 rounded-full flex items-center justify-center transition duration-150 cursor-pointer"
            title="Replay preview slice"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Volume slider & playback details */}
        <div className="flex items-center gap-3 text-white/60 text-xs">
          <div className="flex items-center gap-1.5">
            <Volume2 className="w-4 h-4 text-white/40" />
            <input 
              id="volume-slider"
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-16 h-1 bg-[#15181E] rounded-lg appearance-none cursor-pointer accent-indigo-500"
              title="Volume"
            />
          </div>

          <div className="h-4 w-px bg-white/10" />

          {/* Speed picker */}
          <div className="flex items-center gap-1">
            <Gauge className="w-3.5 h-3.5 text-white/40" />
            <select
              id="speed-select"
              value={playbackSpeed}
              onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
              className="bg-transparent border-0 font-bold text-[11px] text-white/80 focus:ring-0 focus:outline-none p-0.5 cursor-pointer"
              title="Playback speed"
            >
              <option value="0.5" className="bg-[#1A1D24]">0.5x</option>
              <option value="0.75" className="bg-[#1A1D24]">0.75x</option>
              <option value="1" className="bg-[#1A1D24]">1.0x</option>
              <option value="1.25" className="bg-[#1A1D24]">1.25x</option>
              <option value="1.5" className="bg-[#1A1D24]">1.5x</option>
              <option value="2" className="bg-[#1A1D24]">2.0x</option>
            </select>
          </div>
        </div>
      </div>

      {/* Settings Panel (Collapsible) */}
      {showSettings && (
        <div id="settings-panel" className="bg-[#15181E] rounded-xl border border-white/5 p-4 space-y-4 animate-fade-in text-xs text-white/80">
          <h3 className="font-bold text-white flex items-center gap-1.5 text-xs">
            <Settings2 className="w-4 h-4 text-indigo-400" />
            Smart Audio Preview Settings
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Skip Percent */}
            <div className="space-y-1">
              <div className="flex justify-between font-semibold">
                <span className="flex items-center gap-1 text-white/70">
                  Skip Intro Duration
                  <HelpCircle className="w-3 h-3 text-white/30" title="Skip the introductory segment of each track automatically." />
                </span>
                <span className="text-indigo-400 font-bold">{settings.skipPercentage}%</span>
              </div>
              <input 
                id="setting-skip-percent"
                type="range"
                min={0}
                max={80}
                step={5}
                value={settings.skipPercentage}
                onChange={(e) => onUpdateSettings({ ...settings, skipPercentage: parseInt(e.target.value) })}
                className="w-full h-1 bg-[#1A1D24] rounded accent-indigo-500 cursor-pointer"
              />
              <span className="text-[10px] text-white/30 block">Calculates start position based on song length.</span>
            </div>

            {/* Preview Duration */}
            <div className="space-y-1">
              <div className="flex justify-between font-semibold">
                <span className="flex items-center gap-1 text-white/70">
                  Preview Segment Length
                  <HelpCircle className="w-3 h-3 text-white/30" title="The duration of the cue clip to play." />
                </span>
                <span className="text-indigo-400 font-bold">{settings.previewDuration}s</span>
              </div>
              <input 
                id="setting-preview-duration"
                type="range"
                min={3}
                max={30}
                step={1}
                value={settings.previewDuration}
                onChange={(e) => onUpdateSettings({ ...settings, previewDuration: parseInt(e.target.value) })}
                className="w-full h-1 bg-[#1A1D24] rounded accent-indigo-500 cursor-pointer"
              />
              <span className="text-[10px] text-white/30 block">Stops or loops immediately after this duration.</span>
            </div>
          </div>

          {/* Toggle Checklist */}
          <div className="flex flex-wrap items-center gap-4 pt-2.5 border-t border-white/5">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input 
                id="setting-autoplay-next"
                type="checkbox"
                checked={settings.autoplayNext}
                onChange={(e) => onUpdateSettings({ ...settings, autoplayNext: e.target.checked })}
                className="w-3.5 h-3.5 text-indigo-500 bg-[#1A1D24] border-white/10 rounded focus:ring-indigo-500 accent-indigo-500"
              />
              <span className="font-semibold text-white/70">Autoplay next track on categorization</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input 
                id="setting-loop-preview"
                type="checkbox"
                checked={settings.loopPreview}
                onChange={(e) => onUpdateSettings({ ...settings, loopPreview: e.target.checked })}
                className="w-3.5 h-3.5 text-indigo-500 bg-[#1A1D24] border-white/10 rounded focus:ring-indigo-500 accent-indigo-500"
              />
              <span className="font-semibold text-white/70 flex items-center gap-1">
                <Infinity className="w-3 h-3" />
                Loop preview segment
              </span>
            </label>
          </div>
        </div>
      )}

      {/* One-Click Sort Actions */}
      <div className="space-y-3 pt-4 border-t border-white/5">
        <div className="flex items-center justify-between">
          <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest font-mono">
            Quick Categorization Target
          </label>
          <span className="text-[10px] text-white/30 font-semibold italic">
            Tip: Click folder to instantly file & load next track
          </span>
        </div>

        {categories.length === 0 ? (
          <div className="text-center p-5 bg-[#15181E] border border-white/5 rounded-xl text-white/30 text-xs">
            Create some subfolders in the left-hand category manager to enable quick sorting tags!
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {categories.map((category) => (
              <button
                id={`btn-file-to-${category.id}`}
                key={category.id}
                onClick={() => onCategorize(category.id)}
                disabled={!currentSong}
                className="group relative flex flex-col justify-between items-start p-3 bg-[#15181E]/40 hover:bg-[#15181E]/90 disabled:opacity-50 disabled:hover:bg-[#15181E]/40 rounded-xl border border-white/5 hover:border-[#6366F1]/30 transition-all duration-150 cursor-pointer text-left focus:outline-none"
              >
                <div 
                  className="w-2.5 h-2.5 rounded-full mb-2 shadow-sm transition group-hover:scale-110"
                  style={{ backgroundColor: category.color }}
                />
                <span className="text-xs font-bold text-white/80 truncate w-full group-hover:text-white">
                  {category.name}
                </span>
                <span className="absolute bottom-2.5 right-2.5 opacity-0 group-hover:opacity-100 group-disabled:opacity-0 transition duration-150">
                  <ChevronRight className="w-3.5 h-3.5 text-white/40" />
                </span>
              </button>
            ))}

            {/* Skip / Unsorted / Clear Tag option */}
            <button
              id="btn-file-to-unsorted"
              onClick={() => onCategorize(null)}
              disabled={!currentSong}
              className="flex flex-col justify-between items-start p-3 bg-[#15181E]/20 hover:bg-rose-950/20 disabled:opacity-50 disabled:hover:bg-[#15181E]/20 rounded-xl border border-dashed border-white/10 hover:border-rose-500/30 transition-all duration-150 cursor-pointer text-left focus:outline-none"
              title="Remove categorization"
            >
              <RotateCcw className="w-4 h-4 text-rose-400 mb-1.5" />
              <span className="text-xs font-bold text-white/60">
                Reset Tag
              </span>
            </button>
          </div>
        )}

        {/* Skip to Next button */}
        <div className="flex justify-end pt-2">
          <button
            id="btn-skip-next"
            onClick={onNextSong}
            disabled={!currentSong}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 disabled:opacity-30 border border-white/5 text-white/90 text-xs font-bold uppercase tracking-wider rounded-xl transition duration-150 flex items-center gap-1.5 cursor-pointer"
          >
            Skip/Next Song
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
