import songDosSegundos from '../music/Dos Segundos.mp3';
import songVuelaConmigo from '../music/Vuela Conmigo.mp3';
import songPoeta from '../music/El poeta.mp3';
import songTu from '../music/Tu.mp3';

import lrcDosSegundos from '../music/dos_segundos.lrc?raw';
import lrcVuelaConmigo from '../music/vuela_conmigo.lrc?raw';
import lrcPoeta from '../music/el_poeta.lrc?raw';
import lrcTu from '../music/tu.lrc?raw';

/**
 * Parses raw LRC string into a sorted array of { time: number (seconds), text: string }
 */
export function parseLrc(lrcText = '') {
  if (!lrcText || typeof lrcText !== 'string') return [];

  const lines = lrcText.split(/\r?\n/);
  const result = [];
  // Matches [mm:ss.xx] or [mm:ss.xxx] or [mm:ss]
  const timeRegex = /\[(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?\]/g;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    timeRegex.lastIndex = 0;
    const matches = [...trimmed.matchAll(timeRegex)];
    if (matches.length === 0) continue;

    // The text is after the last timestamp tag
    const text = trimmed.replace(timeRegex, '').trim();

    for (const match of matches) {
      const minutes = parseInt(match[1], 10);
      const seconds = parseInt(match[2], 10);
      const fraction = match[3] ? parseFloat('0.' + match[3]) : 0;
      const totalSeconds = minutes * 60 + seconds + fraction;

      result.push({
        time: totalSeconds,
        text: text || '♪',
      });
    }
  }

  // Sort chronologically
  result.sort((a, b) => a.time - b.time);
  return result;
}

export const SONGS = [
  {
    id: 'dos_segundos',
    title: '2 segundos',
    artist: 'Erreway',
    durationStr: '3:34',
    src: songDosSegundos,
    lrcRaw: lrcDosSegundos,
    lines: parseLrc(lrcDosSegundos),
    accent: '#facc15', // warm yellow
    glow: 'rgba(250, 204, 21, 0.45)',
  },
  {
    id: 'vuela_conmigo',
    title: 'Vuela Conmigo',
    artist: 'Dragonfly',
    durationStr: '5:39',
    src: songVuelaConmigo,
    lrcRaw: lrcVuelaConmigo,
    lines: parseLrc(lrcVuelaConmigo),
    accent: '#38bdf8', // celestial cyan
    glow: 'rgba(56, 189, 248, 0.45)',
  },
  {
    id: 'el_poeta',
    title: 'El Poeta',
    artist: 'Chino & Nacho',
    durationStr: '3:38',
    src: songPoeta,
    lrcRaw: lrcPoeta,
    lines: parseLrc(lrcPoeta),
    accent: '#e5b95c', // golden
    glow: 'rgba(229, 185, 92, 0.45)',
  },
  {
    id: 'tu',
    title: 'Tú',
    artist: 'Noelia',
    durationStr: '5:06',
    src: songTu,
    lrcRaw: lrcTu,
    lines: parseLrc(lrcTu),
    accent: '#fb7185', // rose
    glow: 'rgba(251, 113, 133, 0.45)',
  },
];

/**
 * Fallback online fetcher using LRCLIB open API
 */
export async function fetchLrclibLyrics(trackName, artistName) {
  try {
    const query = new URLSearchParams({
      track_name: trackName,
      artist_name: artistName,
    });
    const res = await fetch(`https://lrclib.net/api/get?${query.toString()}`, {
      headers: { 'User-Agent': 'TYR-Suite (https://github.com)' },
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.syncedLyrics) {
      return parseLrc(data.syncedLyrics);
    }
  } catch (err) {
    console.warn('LRCLIB fetch error:', err);
  }
  return null;
}
