/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Category } from "../types";
import { FolderPlus, Folder, Trash2, Edit2, Check, X, Tag } from "lucide-react";

interface CategoryManagerProps {
  categories: Category[];
  onAddCategory: (name: string, color: string) => void;
  onEditCategory: (id: string, newName: string, newColor: string) => void;
  onDeleteCategory: (id: string) => void;
}

const COLOR_PALETTE = [
  "#3B82F6", // Blue
  "#10B981", // Emerald
  "#6366F1", // Indigo
  "#8B5CF6", // Violet
  "#EC4899", // Pink
  "#F59E0B", // Amber
  "#EF4444", // Red
  "#14B8A6", // Teal
  "#F97316", // Orange
  "#64748B", // Slate
];

export default function CategoryManager({
  categories,
  onAddCategory,
  onEditCategory,
  onDeleteCategory
}: CategoryManagerProps) {
  const [newCategoryName, setNewCategoryName] = useState("");
  const [selectedColor, setSelectedColor] = useState(COLOR_PALETTE[0]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editingColor, setEditingColor] = useState("");

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    onAddCategory(newCategoryName.trim(), selectedColor);
    setNewCategoryName("");
    // Pick next color automatically
    const nextColorIndex = (COLOR_PALETTE.indexOf(selectedColor) + 1) % COLOR_PALETTE.length;
    setSelectedColor(COLOR_PALETTE[nextColorIndex]);
  };

  const startEditing = (category: Category) => {
    setEditingId(category.id);
    setEditingName(category.name);
    setEditingColor(category.color);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingName("");
  };

  const saveEditing = (id: string) => {
    if (!editingName.trim()) return;
    onEditCategory(id, editingName.trim(), editingColor);
    setEditingId(null);
    setEditingName("");
  };

  return (
    <div id="category-manager-container" className="bg-[#1A1D24] rounded-xl border border-white/5 shadow-xl p-5 flex flex-col h-full overflow-hidden text-white">
      <h2 className="text-xs font-bold uppercase tracking-widest text-white/60 mb-4 flex items-center gap-2">
        <Tag className="w-3.5 h-3.5 text-indigo-400" />
        Destination Subfolders
      </h2>

      {/* New Category Form */}
      <form onSubmit={handleCreate} className="space-y-3 mb-4">
        <div>
          <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1.5 font-mono">
            New Subfolder Name
          </label>
          <div className="flex gap-2">
            <input 
              id="input-new-category"
              type="text" 
              placeholder="e.g., Workout, Chill, Bass Heavy" 
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              className="flex-1 px-3 py-2 text-xs bg-[#15181E] border border-white/10 rounded-lg focus:bg-[#15181E] focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-white/90 placeholder-white/20 focus:outline-none"
            />
            <button 
              id="btn-create-category"
              type="submit" 
              disabled={!newCategoryName.trim()}
              className="px-3.5 py-2 bg-indigo-500 hover:bg-indigo-400 disabled:bg-white/5 disabled:text-white/20 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition duration-150 flex items-center gap-1.5 cursor-pointer shadow-md shadow-indigo-500/10"
            >
              <FolderPlus className="w-3.5 h-3.5" />
              Add
            </button>
          </div>
        </div>

        {/* Color Picker */}
        <div>
          <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1.5 font-mono">
            Folder Badge Color
          </label>
          <div className="flex flex-wrap gap-1.5">
            {COLOR_PALETTE.map((color) => (
              <button
                id={`btn-color-pick-${color.replace('#', '')}`}
                key={color}
                type="button"
                onClick={() => setSelectedColor(color)}
                className={`w-5.5 h-5.5 rounded-full transition duration-150 border relative flex items-center justify-center cursor-pointer`}
                style={{ 
                  backgroundColor: color, 
                  borderColor: selectedColor === color ? "#fff" : "transparent",
                  boxShadow: selectedColor === color ? "0 0 0 1px #15181E inset" : "none"
                }}
                title={color}
              >
                {selectedColor === color && (
                  <span className="w-1.5 h-1.5 rounded-full bg-white shadow-sm" />
                )}
              </button>
            ))}
          </div>
        </div>
      </form>

      {/* List of Categories */}
      <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar pr-1 min-h-0 bg-[#1A1D24]">
        <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1.5 font-mono">
          Active Folders ({categories.length})
        </label>
        {categories.length === 0 ? (
          <div className="text-center p-6 bg-[#15181E]/40 rounded-xl border border-dashed border-white/10 text-white/30 text-xs">
            <Folder className="w-7 h-7 mx-auto mb-1.5 text-white/20 stroke-[1.5]" />
            No custom subfolders. Use the form above to build your folder taxonomy.
          </div>
        ) : (
          categories.map((category) => {
            const isEditing = editingId === category.id;

            return (
              <div 
                key={category.id}
                id={`category-item-${category.id}`}
                className="flex items-center justify-between p-2.5 rounded-xl border border-white/5 bg-[#15181E]/30 hover:bg-[#15181E]/60 transition duration-150 gap-2"
              >
                {isEditing ? (
                  <div className="flex flex-1 items-center gap-1.5 min-w-0">
                    {/* Inline Color Select */}
                    <div className="flex gap-1">
                      {COLOR_PALETTE.slice(0, 5).map((color) => (
                        <button
                          id={`btn-edit-color-${category.id}-${color.replace('#', '')}`}
                          key={color}
                          type="button"
                          onClick={() => setEditingColor(color)}
                          className="w-3.5 h-3.5 rounded-full border border-[#15181E] cursor-pointer"
                          style={{ 
                            backgroundColor: color,
                            boxShadow: editingColor === color ? "0 0 0 1.5px #E2E8F0" : "none"
                          }}
                        />
                      ))}
                    </div>
                    <input 
                      id={`input-edit-category-${category.id}`}
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      className="flex-1 px-2 py-0.5 text-xs bg-[#15181E] border border-white/10 rounded text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    <button 
                      id={`btn-save-category-${category.id}`}
                      onClick={() => saveEditing(category.id)}
                      className="p-1 text-emerald-400 hover:bg-white/5 rounded transition cursor-pointer"
                      title="Save"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      id={`btn-cancel-category-${category.id}`}
                      onClick={cancelEditing}
                      className="p-1 text-white/40 hover:bg-white/5 rounded transition cursor-pointer"
                      title="Cancel"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div 
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: category.color }}
                      />
                      <span className="text-xs font-semibold text-white/90 truncate">
                        {category.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        id={`btn-edit-start-${category.id}`}
                        onClick={() => startEditing(category)}
                        className="p-1 hover:bg-white/10 rounded text-white/40 hover:text-white/85 transition duration-150 cursor-pointer"
                        title="Edit subfolder name"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        id={`btn-delete-category-${category.id}`}
                        onClick={() => onDeleteCategory(category.id)}
                        className="p-1 hover:bg-rose-950/20 rounded text-white/40 hover:text-rose-400 transition duration-150 cursor-pointer"
                        title="Delete subfolder"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
