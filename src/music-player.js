import { SONGS, fetchLrclibLyrics } from './lyrics/songs-data.js';

const ICONS = {
  play: `<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M8 5.14v13.72a1 1 0 0 0 1.54.84l11-6.86a1 1 0 0 0 0-1.68l-11-6.86A1 1 0 0 0 8 5.14z"/></svg>`,
  pause: `<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M6 5h4v14H6zm8 0h4v14h-4z"/></svg>`,
  heart: `<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>`,
  note: `<svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>`,
  rewind: `<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v4m0-4L8 8m4-4c5.523 0 10 4.477 10 10s-4.477 10-10 10S2 19.523 2 14c0-3.1 1.4-5.87 3.6-7.7"/><text x="12" y="16" font-size="7.5" font-family="sans-serif" font-weight="bold" fill="currentColor" text-anchor="middle" stroke="none">10</text></svg>`,
  volumeOn: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>`,
  volumeMute: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>`,
  expand: `<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>`,
  collapse: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>`,
  next: `<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>`,
  prev: `<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>`,
  lyrics: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>`,
  close: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
};

let currentTrackIndex = 0;
const audio = new Audio();
audio.volume = 0.55;

let isPlaying = false;
let isMuted = false;
let isExpanded = false;
let isLyricsOpen = false;
let highlightColor = localStorage.getItem('lyrics_highlight_color') || 'yellow';
let activeLineIndex = -1;

const haptic = (ms = 8) => {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    try { navigator.vibrate(ms); } catch {}
  }
};

const formatTime = (seconds) => {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

// Create main music widget container
const container = document.createElement('aside');
container.className = 'music-widget is-collapsed';
container.setAttribute('aria-label', 'Reproductor de música');

container.innerHTML = `
  <!-- Collapsed mini player bar -->
  <div class="music-widget__pill" role="region" aria-label="Minireproductor">
    <div class="music-widget__disc music-widget__disc--mini" aria-hidden="true">
      <div class="music-widget__disc-core">${ICONS.note}</div>
    </div>
    <div class="music-widget__pill-info">
      <span class="music-widget__pill-title"></span>
      <div class="music-widget__pill-sub">
        <span class="music-widget__eq" aria-hidden="true">
          <span></span><span></span><span></span>
        </span>
        <span class="music-widget__pill-artist"></span>
      </div>
    </div>
    <div class="music-widget__pill-actions">
      <button class="music-widget__icon-btn music-widget__pill-lyrics" type="button" aria-label="Ver letras sincronizadas" title="Ver letras (Lyrics Plus)">
        <span aria-hidden="true">${ICONS.lyrics}</span>
      </button>
      <button class="music-widget__icon-btn music-widget__pill-play" type="button" aria-label="Reproducir">
        <span class="music-widget__pill-symbol" aria-hidden="true">${ICONS.play}</span>
      </button>
      <button class="music-widget__icon-btn music-widget__pill-expand" type="button" aria-label="Expandir reproductor">
        <span aria-hidden="true">${ICONS.expand}</span>
      </button>
    </div>
  </div>

  <!-- Expanded card panel -->
  <div class="music-widget__panel">
    <div class="music-widget__top">
      <div class="music-widget__disc-wrap">
        <div class="music-widget__disc" aria-hidden="true">
          <div class="music-widget__disc-grooves"></div>
          <div class="music-widget__disc-core">${ICONS.heart}</div>
        </div>
      </div>
      <div class="music-widget__info">
        <span class="music-widget__badge">Nuestra canción</span>
        <h4 class="music-widget__title"></h4>
        <p class="music-widget__artist"></p>
      </div>
      <button class="music-widget__icon-btn music-widget__collapse" type="button" aria-label="Minimizar reproductor">
        <span aria-hidden="true">${ICONS.collapse}</span>
      </button>
    </div>

    <!-- Interactive Playlist Queue -->
    <div class="music-widget__queue" role="region" aria-label="Lista de reproducción">
      <div class="music-widget__queue-header">
        <span class="music-widget__queue-title">Playlist TYR</span>
        <span class="music-widget__queue-badge">${SONGS.length} canciones</span>
      </div>
      <div class="music-widget__queue-list">
        ${SONGS.map((song, i) => `
          <button class="music-widget__queue-item ${i === 0 ? 'is-active' : ''}" type="button" data-index="${i}">
            <div class="music-widget__queue-item-left">
              <span class="music-widget__queue-num">${i + 1}</span>
              <span class="music-widget__queue-eq" aria-hidden="true">
                <span></span><span></span><span></span>
              </span>
              <div class="music-widget__queue-item-meta">
                <span class="music-widget__queue-item-title">${song.title}</span>
                <span class="music-widget__queue-item-artist">${song.artist}</span>
              </div>
            </div>
            <span class="music-widget__queue-item-dur">${song.durationStr}</span>
          </button>
        `).join('')}
      </div>
    </div>

    <!-- Scrubber -->
    <div class="music-widget__timeline">
      <div class="music-widget__track" role="slider" aria-label="Línea de tiempo" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" tabindex="0">
        <div class="music-widget__fill"></div>
        <div class="music-widget__thumb"></div>
      </div>
      <div class="music-widget__times">
        <span class="music-widget__time music-widget__time--curr">0:00</span>
        <span class="music-widget__time music-widget__time--dur">0:00</span>
      </div>
    </div>

    <!-- Controls -->
    <div class="music-widget__controls">
      <button class="music-widget__ctrl music-widget__ctrl--prev" type="button" aria-label="Canción anterior">
        <span class="music-widget__ctrl-icon" aria-hidden="true">${ICONS.prev}</span>
      </button>

      <button class="music-widget__ctrl music-widget__ctrl--rewind" type="button" aria-label="Retroceder 10 segundos">
        <span class="music-widget__ctrl-icon" aria-hidden="true">${ICONS.rewind}</span>
      </button>

      <button class="music-widget__ctrl music-widget__ctrl--play" type="button" aria-label="Reproducir">
        <span class="music-widget__play-symbol" aria-hidden="true">${ICONS.play}</span>
      </button>

      <button class="music-widget__ctrl music-widget__ctrl--next" type="button" aria-label="Siguiente canción">
        <span class="music-widget__ctrl-icon" aria-hidden="true">${ICONS.next}</span>
      </button>

      <button class="music-widget__ctrl music-widget__ctrl--mute" type="button" aria-label="Silenciar">
        <span class="music-widget__mute-symbol" aria-hidden="true">${ICONS.volumeOn}</span>
      </button>

      <button class="music-widget__ctrl music-widget__ctrl--lyrics" type="button" aria-label="Abrir letras sincronizadas">
        <span class="music-widget__ctrl-icon" aria-hidden="true">${ICONS.lyrics}</span>
        <span>Letras</span>
      </button>
    </div>
  </div>
`;

document.body.appendChild(container);

// Create Lyrics Plus Fullscreen Overlay
const lyricsOverlay = document.createElement('div');
lyricsOverlay.className = 'lyrics-overlay';
lyricsOverlay.setAttribute('data-highlight', highlightColor);

lyricsOverlay.innerHTML = `
  <div class="lyrics-overlay__ambient" aria-hidden="true"></div>
  <canvas class="lyrics-particles-canvas" aria-hidden="true"></canvas>

  <header class="lyrics-header">
    <div class="lyrics-header__meta">
      <div class="lyrics-header__disc" aria-hidden="true">
        ${ICONS.heart}
      </div>
      <div class="lyrics-header__titles">
        <span class="lyrics-header__title"></span>
        <span class="lyrics-header__artist"></span>
      </div>
    </div>

    <div class="lyrics-header__actions">
      <div class="lyrics-color-switch" role="group" aria-label="Color de letra en foco">
        <button class="lyrics-color-btn ${highlightColor === 'yellow' ? 'is-active' : ''}" type="button" data-theme="yellow">
          <span class="lyrics-color-btn__swatch" aria-hidden="true"></span>
          <span>Amarillo</span>
        </button>
        <button class="lyrics-color-btn ${highlightColor === 'pink' ? 'is-active' : ''}" type="button" data-theme="pink">
          <span class="lyrics-color-btn__swatch" aria-hidden="true"></span>
          <span>Rosa</span>
        </button>
      </div>

      <button class="lyrics-close-btn" type="button" aria-label="Cerrar letras">
        <span aria-hidden="true">${ICONS.close}</span>
      </button>
    </div>
  </header>

  <main class="lyrics-body" tabindex="0" aria-label="Letras de la canción">
    <div class="lyrics-list"></div>
  </main>

  <footer class="lyrics-footer">
    <div class="lyrics-footer__progress">
      <span class="lyrics-footer__time lyrics-footer__time--curr">0:00</span>
      <div class="lyrics-footer__track" role="slider" aria-label="Línea de tiempo en letras">
        <div class="lyrics-footer__fill"></div>
      </div>
      <span class="lyrics-footer__time lyrics-footer__time--dur">0:00</span>
    </div>

    <div class="lyrics-footer__controls">
      <button class="lyrics-footer__btn lyrics-footer__btn--prev" type="button" aria-label="Canción anterior">
        <span aria-hidden="true">${ICONS.prev}</span>
      </button>
      <button class="lyrics-footer__btn lyrics-footer__btn--play" type="button" aria-label="Reproducir">
        <span class="lyrics-footer__play-symbol" aria-hidden="true">${ICONS.play}</span>
      </button>
      <button class="lyrics-footer__btn lyrics-footer__btn--next" type="button" aria-label="Siguiente canción">
        <span aria-hidden="true">${ICONS.next}</span>
      </button>
    </div>
  </footer>
`;

document.body.appendChild(lyricsOverlay);

// DOM Elements inside Widget
const pillTitle = container.querySelector('.music-widget__pill-title');
const pillArtist = container.querySelector('.music-widget__pill-artist');
const pillPlay = container.querySelector('.music-widget__pill-play');
const pillExpand = container.querySelector('.music-widget__pill-expand');
const pillSymbol = container.querySelector('.music-widget__pill-symbol');
const pillLyrics = container.querySelector('.music-widget__pill-lyrics');
const panelTitle = container.querySelector('.music-widget__title');
const panelArtist = container.querySelector('.music-widget__artist');
const collapseBtn = container.querySelector('.music-widget__collapse');
const queueItems = container.querySelectorAll('.music-widget__queue-item');
const prevBtn = container.querySelector('.music-widget__ctrl--prev');
const nextBtn = container.querySelector('.music-widget__ctrl--next');
const playBtn = container.querySelector('.music-widget__ctrl--play');
const playSymbol = container.querySelector('.music-widget__play-symbol');
const rewindBtn = container.querySelector('.music-widget__ctrl--rewind');
const muteBtn = container.querySelector('.music-widget__ctrl--mute');
const muteSymbol = container.querySelector('.music-widget__mute-symbol');
const panelLyricsBtn = container.querySelector('.music-widget__ctrl--lyrics');

const timeline = container.querySelector('.music-widget__track');
const fill = container.querySelector('.music-widget__fill');
const thumb = container.querySelector('.music-widget__thumb');
const timeCurr = container.querySelector('.music-widget__time--curr');
const timeDur = container.querySelector('.music-widget__time--dur');

// DOM Elements inside Lyrics Overlay
const lyricsTitle = lyricsOverlay.querySelector('.lyrics-header__title');
const lyricsArtist = lyricsOverlay.querySelector('.lyrics-header__artist');
const lyricsList = lyricsOverlay.querySelector('.lyrics-list');
const lyricsBody = lyricsOverlay.querySelector('.lyrics-body');
const lyricsClose = lyricsOverlay.querySelector('.lyrics-close-btn');
const lyricsColorBtns = lyricsOverlay.querySelectorAll('.lyrics-color-btn');
const lyricsTrack = lyricsOverlay.querySelector('.lyrics-footer__track');
const lyricsFill = lyricsOverlay.querySelector('.lyrics-footer__fill');
const lyricsTimeCurr = lyricsOverlay.querySelector('.lyrics-footer__time--curr');
const lyricsTimeDur = lyricsOverlay.querySelector('.lyrics-footer__time--dur');
const lyricsPlayBtn = lyricsOverlay.querySelector('.lyrics-footer__btn--play');
const lyricsPlaySymbol = lyricsOverlay.querySelector('.lyrics-footer__play-symbol');
const lyricsPrevBtn = lyricsOverlay.querySelector('.lyrics-footer__btn--prev');
const lyricsNextBtn = lyricsOverlay.querySelector('.lyrics-footer__btn--next');
const particlesCanvas = lyricsOverlay.querySelector('.lyrics-particles-canvas');

// Ambient Particles Canvas in Lyrics View
let particlesAnimationId = null;
function initLyricsParticles() {
  const ctx = particlesCanvas.getContext('2d');
  let width = (particlesCanvas.width = window.innerWidth);
  let height = (particlesCanvas.height = window.innerHeight);

  const onResize = () => {
    width = particlesCanvas.width = window.innerWidth;
    height = particlesCanvas.height = window.innerHeight;
  };
  window.addEventListener('resize', onResize);

  const particleCount = 75;
  const particles = Array.from({ length: particleCount }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    radius: Math.random() * 1.6 + 0.6,
    alpha: Math.random() * 0.7 + 0.2,
    speedY: - (Math.random() * 0.45 + 0.15),
    speedX: (Math.random() - 0.5) * 0.25,
    pulse: Math.random() * Math.PI * 2,
  }));

  function loop() {
    ctx.clearRect(0, 0, width, height);

    for (let p of particles) {
      p.y += p.speedY;
      p.x += p.speedX;
      p.pulse += 0.03;

      if (p.y < -10) {
        p.y = height + 10;
        p.x = Math.random() * width;
      }
      if (p.x < -10) p.x = width + 10;
      if (p.x > width + 10) p.x = -10;

      const currentAlpha = p.alpha * (0.65 + 0.35 * Math.sin(p.pulse));
      ctx.fillStyle = `rgba(255, 255, 255, ${currentAlpha})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    if (isLyricsOpen) {
      particlesAnimationId = requestAnimationFrame(loop);
    }
  }

  loop();
}

function startParticles() {
  if (!particlesAnimationId) {
    initLyricsParticles();
  }
}

function stopParticles() {
  if (particlesAnimationId) {
    cancelAnimationFrame(particlesAnimationId);
    particlesAnimationId = null;
  }
}

// Track Management
function loadTrack(index, autoPlay = false) {
  if (index < 0 || index >= SONGS.length) index = 0;
  currentTrackIndex = index;
  const track = SONGS[index];

  audio.src = track.src;
  audio.currentTime = 0;

  // Update labels
  pillTitle.textContent = track.title;
  pillArtist.textContent = track.artist;
  panelTitle.textContent = track.title;
  panelArtist.textContent = track.artist;
  lyricsTitle.textContent = track.title;
  lyricsArtist.textContent = track.artist;

  queueItems.forEach((item, i) => {
    item.classList.toggle('is-active', i === index);
  });
  container.style.setProperty('--color-accent', track.accent);
  lyricsOverlay.style.setProperty('--lyrics-glow', track.glow);

  // Render Lyrics Lines
  renderLyrics(track);

  if (autoPlay) {
    audio.play().then(() => updatePlayState(true)).catch(() => updatePlayState(false));
  } else if (isPlaying) {
    audio.play().then(() => updatePlayState(true)).catch(() => updatePlayState(false));
  }
}

function renderLyrics(track) {
  lyricsList.innerHTML = '';
  activeLineIndex = -1;

  if (!track.lines || track.lines.length === 0) {
    lyricsList.innerHTML = `
      <div class="lyrics-line is-active" style="text-align:center;">
        ♪ Disfruta de la música ♪
      </div>
    `;
    return;
  }

  track.lines.forEach((line, i) => {
    const lineEl = document.createElement('div');
    lineEl.className = 'lyrics-line is-future';
    lineEl.dataset.index = i;
    lineEl.dataset.time = line.time;
    lineEl.textContent = line.text;

    lineEl.addEventListener('click', () => {
      haptic(10);
      audio.currentTime = Math.max(0, line.time + 0.05);
      if (!isPlaying) {
        audio.play().then(() => updatePlayState(true));
      }
    });

    lyricsList.appendChild(lineEl);
  });
}

function updateLyricsHighlight(currentTime) {
  const track = SONGS[currentTrackIndex];
  if (!track || !track.lines || track.lines.length === 0) return;

  const lines = track.lines;
  // Visual lead-in offset: 0.18s
  const checkTime = currentTime + 0.18;

  let newActive = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].time <= checkTime) {
      newActive = i;
    } else {
      break;
    }
  }

  if (newActive !== activeLineIndex) {
    activeLineIndex = newActive;
    const lineElements = lyricsList.querySelectorAll('.lyrics-line');

    lineElements.forEach((el, idx) => {
      if (idx < activeLineIndex) {
        el.className = 'lyrics-line is-past';
      } else if (idx === activeLineIndex) {
        el.className = 'lyrics-line is-active';
        if (isLyricsOpen) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      } else {
        el.className = 'lyrics-line is-future';
      }
    });
  }
}

function setLyricsOpen(open) {
  isLyricsOpen = open;
  haptic(15);
  lyricsOverlay.classList.toggle('is-active', open);
  document.body.classList.toggle('is-lyrics-open', open);

  if (open) {
    startParticles();
    // Scroll to currently active line
    setTimeout(() => {
      const activeEl = lyricsList.querySelector('.lyrics-line.is-active');
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'auto', block: 'center' });
      }
    }, 100);
  } else {
    stopParticles();
  }
}

function updatePlayState(playing) {
  isPlaying = playing;
  container.classList.toggle('is-playing', playing);

  const icon = playing ? ICONS.pause : ICONS.play;
  const label = playing ? 'Pausar' : 'Reproducir';

  playSymbol.innerHTML = icon;
  playBtn.setAttribute('aria-label', label);
  pillSymbol.innerHTML = icon;
  pillPlay.setAttribute('aria-label', label);
  lyricsPlaySymbol.innerHTML = icon;
  lyricsPlayBtn.setAttribute('aria-label', label);
}

const togglePlay = async () => {
  haptic(12);
  if (isPlaying) {
    audio.pause();
    updatePlayState(false);
  } else {
    try {
      await audio.play();
      updatePlayState(true);
    } catch (err) {
      console.warn('Playback prevented:', err);
    }
  }
};

const setExpanded = (expanded) => {
  haptic(10);
  isExpanded = expanded;
  container.classList.toggle('is-expanded', expanded);
  container.classList.toggle('is-collapsed', !expanded);
};

// Event Listeners for Player
pillPlay.addEventListener('click', togglePlay);
pillExpand.addEventListener('click', () => setExpanded(true));
pillLyrics.addEventListener('click', () => setLyricsOpen(true));
collapseBtn.addEventListener('click', () => setExpanded(false));
playBtn.addEventListener('click', togglePlay);

prevBtn.addEventListener('click', () => {
  haptic(10);
  const prevIdx = (currentTrackIndex - 1 + SONGS.length) % SONGS.length;
  loadTrack(prevIdx, isPlaying);
});

nextBtn.addEventListener('click', () => {
  haptic(10);
  const nextIdx = (currentTrackIndex + 1) % SONGS.length;
  loadTrack(nextIdx, isPlaying);
});

rewindBtn.addEventListener('click', () => {
  haptic(8);
  audio.currentTime = Math.max(0, audio.currentTime - 10);
});

muteBtn.addEventListener('click', () => {
  haptic(8);
  isMuted = !isMuted;
  audio.muted = isMuted;
  muteSymbol.innerHTML = isMuted ? ICONS.volumeMute : ICONS.volumeOn;
  muteBtn.setAttribute('aria-label', isMuted ? 'Activar sonido' : 'Silenciar');
});

panelLyricsBtn.addEventListener('click', () => setLyricsOpen(true));

queueItems.forEach((item) => {
  item.addEventListener('click', () => {
    haptic(10);
    const idx = parseInt(item.getAttribute('data-index'), 10);
    loadTrack(idx, true);
  });
});

// Lyrics View Listeners
lyricsClose.addEventListener('click', () => setLyricsOpen(false));
lyricsPlayBtn.addEventListener('click', togglePlay);
lyricsPrevBtn.addEventListener('click', () => {
  haptic(10);
  loadTrack((currentTrackIndex - 1 + SONGS.length) % SONGS.length, isPlaying);
});
lyricsNextBtn.addEventListener('click', () => {
  haptic(10);
  loadTrack((currentTrackIndex + 1) % SONGS.length, isPlaying);
});

// Color Switcher (Yellow / Pink)
lyricsColorBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    haptic(8);
    const color = btn.getAttribute('data-theme');
    highlightColor = color;
    localStorage.setItem('lyrics_highlight_color', color);
    lyricsOverlay.setAttribute('data-highlight', color);

    lyricsColorBtns.forEach((b) => b.classList.toggle('is-active', b === btn));
  });
});

// Audio events
audio.addEventListener('loadedmetadata', () => {
  const durStr = formatTime(audio.duration);
  timeDur.textContent = durStr;
  lyricsTimeDur.textContent = durStr;
});

audio.addEventListener('timeupdate', () => {
  if (!audio.duration) return;
  const curr = audio.currentTime;
  const dur = audio.duration;
  const percent = (curr / dur) * 100;

  fill.style.width = `${percent}%`;
  thumb.style.left = `${percent}%`;
  lyricsFill.style.width = `${percent}%`;

  const currStr = formatTime(curr);
  timeCurr.textContent = currStr;
  lyricsTimeCurr.textContent = currStr;

  updateLyricsHighlight(curr);
});

audio.addEventListener('ended', () => {
  // Autoplay next track in playlist loop
  const nextIdx = (currentTrackIndex + 1) % SONGS.length;
  loadTrack(nextIdx, true);
});

// Seeking logic
let isSeeking = false;
const seek = (event, trackElement) => {
  const rect = trackElement.getBoundingClientRect();
  const clientX = event.clientX || (event.touches ? event.touches[0].clientX : 0);
  const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
  if (audio.duration) {
    audio.currentTime = ratio * audio.duration;
  }
};

timeline.addEventListener('pointerdown', (e) => {
  haptic(6);
  isSeeking = true;
  seek(e, timeline);
  try { timeline.setPointerCapture(e.pointerId); } catch {}
});
timeline.addEventListener('pointermove', (e) => {
  if (isSeeking) seek(e, timeline);
});
const stopSeek = (e) => {
  if (isSeeking) {
    isSeeking = false;
    try { timeline.releasePointerCapture(e.pointerId); } catch {}
  }
};
timeline.addEventListener('pointerup', stopSeek);
timeline.addEventListener('pointercancel', stopSeek);

// Seeking in Lyrics footer
lyricsTrack.addEventListener('click', (e) => {
  haptic(6);
  seek(e, lyricsTrack);
});

// Escape key to close lyrics
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && isLyricsOpen) {
    setLyricsOpen(false);
  }
});

// Initial track load
loadTrack(0, false);
