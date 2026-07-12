/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SongFile } from "../types";

/**
 * Helper to write an ASCII string into a DataView
 */
function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

/**
 * Generates a valid, playable, client-side synthetic WAV file
 * containing a soothing synthesised ambient pad sound.
 */
export function generateSyntheticAudio(name: string, durationSeconds: number): File {
  const sampleRate = 8000; // highly compatible & low memory footprint
  const numChannels = 1;
  const bytesPerSample = 2; // 16-bit PCM
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = durationSeconds * byteRate;
  const chunkSize = 36 + dataSize;

  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  // RIFF header
  writeString(view, 0, "RIFF");
  view.setUint32(4, chunkSize, true);
  writeString(view, 8, "WAVE");

  // fmt chunk
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true); // chunk size
  view.setUint16(20, 1, true); // sample format (PCM = 1)
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true); // bits per sample

  // data chunk
  writeString(view, 36, "data");
  view.setUint32(40, dataSize, true);

  // Generate a beautiful, warm ambient frequency sweep so the track actually plays sound
  // and looks lovely on the visualizer canvas!
  const numSamples = durationSeconds * sampleRate;
  const baseFreq = 120 + Math.random() * 80; // random fundamental frequency per track
  const modulatorFreq = 0.05 + Math.random() * 0.1; // slow modulation speed

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    
    // Slow LFO for ambient sweep
    const lfo = Math.sin(2 * Math.PI * modulatorFreq * t);
    const freq = baseFreq + 40 * lfo;
    
    // Smooth fundamental + harmonic
    let sample = Math.sin(2 * Math.PI * freq * t);
    sample += 0.4 * Math.sin(2 * Math.PI * (freq * 1.5) * t);
    sample += 0.2 * Math.sin(2 * Math.PI * (freq * 2.0) * t);
    
    // Soft low-pass filter simulator using a moving average window is overkill,
    // we can just apply a smooth amplitude envelope so it fades in/out gracefully
    let envelope = 1.0;
    if (t < 2.0) {
      envelope = t / 2.0; // 2 second fade-in
    } else if (t > durationSeconds - 2.0) {
      envelope = (durationSeconds - t) / 2.0; // 2 second fade-out
    }
    
    // Keep volume extremely safe, comfortable and non-intrusive
    const finalSample = Math.max(-1, Math.min(1, sample)) * envelope * 0.15;
    
    const offset = 44 + i * 2;
    view.setInt16(offset, finalSample * 32767, true);
  }

  const blob = new Blob([buffer], { type: "audio/wav" });
  return new File([blob], name, { type: "audio/wav", lastModified: Date.now() });
}

/**
 * Returns a list of 11 pre-seeded realistic audio files
 */
export function getSeededTracks(): SongFile[] {
  const seeds = [
    { name: "Astral Drift.wav", duration: 204 }, // 3:24
    { name: "Subterranean Bass.wav", duration: 165 }, // 2:45
    { name: "Neon Horizon.wav", duration: 252 }, // 4:12
    { name: "Echoes of You.wav", duration: 185 }, // 3:05
    { name: "Cyberpunk 2099.wav", duration: 170 }, // 2:50
    { name: "Cosmic Lullaby.wav", duration: 310 }, // 5:10
    { name: "Deep Submarine.wav", duration: 220 }, // 3:40
    { name: "Starlit Acoustic.wav", duration: 135 }, // 2:15
    { name: "Glitch in the Matrix.wav", duration: 198 }, // 3:18
    { name: "Velvet Sunset.wav", duration: 242 }, // 4:02
    { name: "Abyssal Rumble.wav", duration: 235 }, // 3:55
  ];

  return seeds.map((track, idx) => {
    const file = generateSyntheticAudio(track.name, track.duration);
    return {
      id: `seed-song-${idx + 1}`,
      file,
      name: track.name,
      size: file.size,
      duration: track.duration,
      category: null,
    };
  });
}
