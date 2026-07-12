/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface SongFile {
  id: string;
  file: File;
  name: string;
  size: number;
  duration: number | null; // in seconds
  category: string | null; // ID of the Category, or null if uncategorized
}

export interface Category {
  id: string;
  name: string;
  color: string; // Tailwind color class or hex string for badge visual styling
}

export interface AppSettings {
  skipPercentage: number; // e.g., 20 for skipping the first 20%
  previewDuration: number; // e.g., 10 for playing 10 seconds
  autoplayNext: boolean; // whether to automatically load next song on categorization
  loopPreview: boolean; // whether to loop the 10-second segment
}
