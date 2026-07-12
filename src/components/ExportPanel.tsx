/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { SongFile, Category } from "../types";
import { Download, Archive, Info, Loader2, Sparkles, CheckCircle2 } from "lucide-react";
import JSZip from "jszip";

interface ExportPanelProps {
  songs: SongFile[];
  categories: Category[];
}

export default function ExportPanel({ songs, categories }: ExportPanelProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  const totalSongs = songs.length;
  const sortedSongs = songs.filter((s) => s.category !== null);
  const sortedCount = sortedSongs.length;
  const unsortedCount = totalSongs - sortedCount;
  
  const percentage = totalSongs > 0 ? Math.round((sortedCount / totalSongs) * 100) : 0;

  // Group songs by Category
  const getCategoryCounts = () => {
    const counts: Record<string, number> = {};
    categories.forEach((c) => {
      counts[c.id] = songs.filter((s) => s.category === c.id).length;
    });
    return counts;
  };

  const categoryCounts = getCategoryCounts();

  // Export fully sorted folders into JSZip
  const handleExportZip = async () => {
    if (songs.length === 0) return;
    setIsExporting(true);
    setExportProgress(10);

    try {
      const zip = new JSZip();
      
      // Keep track of added file paths to avoid duplicates colliding
      const addedPaths = new Set<string>();

      songs.forEach((song, idx) => {
        // Resolve subfolder directory name
        let folderName = "Unsorted";
        if (song.category) {
          const cat = categories.find((c) => c.id === song.category);
          if (cat) {
            folderName = cat.name.replace(/[\/\\?%*:|"<>]/g, "-"); // sanitize folder name
          }
        }

        // Sanitize file name
        let fileName = song.file.name;
        let finalPath = `${folderName}/${fileName}`;

        // De-duplicate if needed
        let counter = 1;
        while (addedPaths.has(finalPath)) {
          const lastDot = fileName.lastIndexOf(".");
          if (lastDot !== -1) {
            const base = fileName.substring(0, lastDot);
            const ext = fileName.substring(lastDot);
            finalPath = `${folderName}/${base}_${counter}${ext}`;
          } else {
            finalPath = `${folderName}/${fileName}_${counter}`;
          }
          counter++;
        }

        addedPaths.add(finalPath);
        zip.file(finalPath, song.file);
        
        // update progress bar increment
        const currentProg = Math.round(10 + (idx / songs.length) * 40);
        setExportProgress(currentProg);
      });

      setExportProgress(60);

      // Generate the zip in memory
      const zipBlob = await zip.generateAsync(
        { type: "blob" },
        (metadata) => {
          const zipGenProg = Math.round(60 + (metadata.percent / 100) * 35);
          setExportProgress(zipGenProg);
        }
      );

      setExportProgress(95);

      // Download the zip blob
      const dateStr = new Date().toISOString().slice(0, 10);
      const downloadUrl = URL.createObjectURL(zipBlob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `Organized_Music_Collection_${dateStr}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);

      setExportProgress(100);
      setTimeout(() => {
        setIsExporting(false);
        setExportProgress(0);
      }, 1000);

    } catch (err) {
      console.error("Failed to generate zip file: ", err);
      alert("Error generating your ZIP archive. Please verify browser capabilities.");
      setIsExporting(false);
      setExportProgress(0);
    }
  };

  return (
    <div id="export-panel-container" className="bg-[#1A1D24] rounded-xl border border-white/5 shadow-xl p-6 flex flex-col justify-between h-full space-y-5 text-white">
      {/* Visual Stats */}
      <div className="space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-widest text-white/60 flex items-center gap-2">
          <Archive className="w-3.5 h-3.5 text-indigo-400" />
          Sorting Progress & Stats
        </h2>

        {totalSongs === 0 ? (
          <div className="text-center py-6 bg-[#15181E]/40 rounded-xl border border-dashed border-white/10 text-white/30 text-xs">
            Import some music tracks first to view detailed sorting statistics here.
          </div>
        ) : (
          <div className="space-y-4">
            {/* Progress Bar */}
            <div className="space-y-1">
              <div className="flex justify-between items-baseline text-xs">
                <span className="text-white/60 font-semibold">Overall Processed</span>
                <span className="text-indigo-400 font-extrabold font-mono">{percentage}% ({sortedCount}/{totalSongs})</span>
              </div>
              <div className="w-full bg-[#15181E] h-2 rounded-full overflow-hidden border border-white/5">
                <div 
                  className="bg-indigo-500 h-full rounded-full transition-all duration-300 shadow-sm shadow-indigo-500/50"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>

            {/* Folder Allocation Details */}
            <div className="space-y-1.5 max-h-[190px] overflow-y-auto custom-scrollbar pr-1">
              <span className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1.5 font-mono">
                Folder Allocations
              </span>

              {categories.map((cat) => {
                const count = categoryCounts[cat.id] || 0;
                const percent = totalSongs > 0 ? Math.round((count / totalSongs) * 100) : 0;

                return (
                  <div key={cat.id} className="flex items-center justify-between text-xs py-1 border-b border-white/5 last:border-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                      <span className="text-white/80 font-semibold truncate max-w-[150px]">{cat.name}/</span>
                    </div>
                    <div className="flex items-center gap-2 text-white/40">
                      <span className="font-mono text-[10px]">{percent}%</span>
                      <span className="bg-[#15181E] border border-white/5 text-white font-bold px-1.5 py-0.5 rounded text-[10px] min-w-[20px] text-center font-mono">
                        {count}
                      </span>
                    </div>
                  </div>
                );
              })}

              {/* Unsorted Category */}
              <div className="flex items-center justify-between text-xs py-1 border-t border-white/5 mt-1">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-white/20" />
                  <span className="text-white/50 italic">Remaining Unsorted/</span>
                </div>
                <div className="flex items-center gap-2 text-white/40">
                  <span className="font-mono text-[10px]">{totalSongs > 0 ? Math.round((unsortedCount / totalSongs) * 100) : 0}%</span>
                  <span className="bg-[#15181E] border border-white/5 text-white/70 font-bold px-1.5 py-0.5 rounded text-[10px] min-w-[20px] text-center font-mono">
                    {unsortedCount}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Export Controls */}
      <div className="space-y-3 pt-4 border-t border-white/5">
        <div className="flex gap-2 p-3 bg-[#15181E]/40 rounded-xl border border-white/5">
          <Info className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
          <p className="text-[10px] text-white/60 leading-relaxed">
            <strong>Offline Safe Compression:</strong> File bundling runs entirely client-side. Your private audio files are never uploaded to any remote servers.
          </p>
        </div>

        <button
          id="btn-export-zip"
          onClick={handleExportZip}
          disabled={totalSongs === 0 || isExporting}
          className="w-full py-3 bg-indigo-500 hover:bg-indigo-400 disabled:bg-white/5 disabled:text-white/20 text-white font-bold uppercase tracking-wider text-xs rounded-xl shadow-md shadow-indigo-500/10 transition duration-150 flex items-center justify-center gap-2 cursor-pointer focus:outline-none"
        >
          {isExporting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Compiling Files ({exportProgress}%) ...
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              Download Sorted ZIP Archive
            </>
          )}
        </button>

        {percentage === 100 && totalSongs > 0 && (
          <div className="text-[10px] text-indigo-400 font-bold text-center flex items-center justify-center gap-1 animate-pulse">
            <Sparkles className="w-3.5 h-3.5" />
            Fantastic! All songs are categorized. Ready to export!
          </div>
        )}
      </div>
    </div>
  );
}
