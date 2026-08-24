import '@fontsource/playfair-display/400.css';
import '@fontsource/lato/300.css';
import '@fontsource/lato/400.css';
import '../src/styles/tokens.css';
import '../src/styles/base.css';
import './style.css';
import { startNeonAnimation } from './neon.js';

const phrases = [
  'Tus ojos son mi espejo favorito',
  'Tu sonrisa ilumina mi mundo',
  'Eres el sol que ilumina mi día',
  'No hay estrella más brillante que tú',
  'Mi lugar favorito es contigo',
  'Contigo, todo es perfecto',
  'Contigo, cada día es un regalo',
  'Eres la melodía que alegra mi vida',
  'Tu risa es la banda sonora de mi felicidad',
  'Cada momento contigo es un sueño hecho realidad',
  'Mi hogar está donde estás tú',
  'Tu amor es la luz que guía mi camino',
  'Eres mi razón de ser y sonreír',
  'Contigo, el mundo es un lugar mejor',
  'Eres mi refugio en medio de la tormenta',
];

const emojis = ['❤️', '💖', '💘', '💝', '😍', '🥰', '😘', '💞', '💓', '💗', '💕', '💌', '💟', '💎', '🌹', '🌺', '💐', '🌷', '🌸', '🏵️', '🎁', '🥳', '🎉', '✨', '🌟', '🌈'];

const phraseEl = document.querySelector('#phrase');
const greetingEl = document.querySelector('#greeting');
const emojiContainer = document.querySelector('#emojiContainer');
const modal = document.querySelector('#modal');
const hText = document.querySelector('.h-text');
const codeBtn = document.querySelector('#codeBtn');
const closeBtn = document.querySelector('#closeBtn');
const modalForm = document.querySelector('#modalForm');
const modalInput = document.querySelector('#modalInput');

function changePhrase() {
  phraseEl.textContent = phrases[Math.floor(Math.random() * phrases.length)];
}

function updateGreeting() {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) greetingEl.textContent = 'Buenos días mi amor';
  else if (hour >= 12 && hour < 18) greetingEl.textContent = 'Buenas tardes mi amor';
  else greetingEl.textContent = 'Buenas noches mi amor';
}

function splashEmojis() {
  emojiContainer.innerHTML = '';
  for (let i = 0; i < 100; i++) {
    const emoji = document.createElement('div');
    emoji.className = 'emoji';
    emoji.textContent = emojis[Math.floor(Math.random() * emojis.length)];
    emoji.style.left = `${Math.random() * window.innerWidth}px`;
    emoji.style.top = `${window.innerHeight - Math.random() * (window.innerHeight / 2)}px`;
    emojiContainer.appendChild(emoji);
    setTimeout(() => emoji.remove(), 2000);
  }
}

function showModal() {
  modal.style.display = 'flex';
  hText.style.display = 'none';
  modalInput.focus();
}

function closeModal() {
  modal.style.display = 'none';
  hText.style.display = 'block';
}

const codeActions = {
  MOR: () => splashHearts(),
  NEON: () => startNeonAnimation(),
  FOTOS: () => showGallery(),
  '0409': () => showLetter(),
  TRAKA: () => showQuestion(),
  VUELVEPRONTO: () => showMap(),
  '21FY': () => {
    window.location.href = './flow/main.html';
  },
};

modalForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const code = modalInput.value.trim().toUpperCase();
  const action = codeActions[code];
  if (action) action();
  else splashError();
  modalInput.value = '';
  closeModal();
});

codeBtn.addEventListener('click', showModal);
closeBtn.addEventListener('click', closeModal);
window.addEventListener('click', (event) => {
  if (event.target === modal) closeModal();
});

const refreshBtn = document.querySelector('#refreshBtn');
refreshBtn.addEventListener('click', (event) => {
  event.preventDefault();
  changePhrase();
  splashEmojis();
});

const heartEmojis = ['❤️', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎'];

function splashHearts() {
  emojiContainer.innerHTML = '';
  const numberOfHearts = Math.floor(Math.random() * 6) + 12;

  for (let i = 0; i < numberOfHearts; i++) {
    const heart = document.createElement('div');
    heart.className = 'heart';
    heart.textContent = heartEmojis[Math.floor(Math.random() * heartEmojis.length)];
    let left = Math.random() * (window.innerWidth - 60);
    let top = Math.random() * (window.innerHeight - 60);
    const velocityX = (Math.random() - 0.5) * 4;
    const velocityY = (Math.random() - 0.5) * 4;
    heart.style.left = `${left}px`;
    heart.style.top = `${top}px`;
    emojiContainer.appendChild(heart);

    function moveHeart() {
      left += velocityX;
      top += velocityY;

      if (left <= 0 || left >= window.innerWidth - 60) velocityX *= -1;
      if (top <= 0 || top >= window.innerHeight - 60) velocityY *= -1;

      heart.style.left = `${left}px`;
      heart.style.top = `${top}px`;
      requestAnimationFrame(moveHeart);
    }

    heart.addEventListener('click', () => {
      heart.style.transition = 'opacity 0.5s';
      heart.style.opacity = '0';
      setTimeout(() => heart.remove(), 500);
    });

    requestAnimationFrame(moveHeart);
  }
}

const errors = ['😭', '😥', '🥺', '💩', '😔'];

function splashError() {
  for (let i = 0; i < 12; i++) {
    const emoji = document.createElement('div');
    emoji.className = 'errorEmoji';
    emoji.textContent = errors[Math.floor(Math.random() * errors.length)];
    emoji.style.left = `${Math.random() * window.innerWidth}px`;
    emoji.style.top = `${window.innerHeight - Math.random() * (window.innerHeight / 2)}px`;
    emojiContainer.appendChild(emoji);
    setTimeout(() => emoji.remove(), 2000);
  }
}

const galleryModal = document.querySelector('#gallery-modal');
const backButton2 = document.querySelector('#backButton2');

function showGallery() {
  galleryModal.style.display = 'flex';
}

backButton2.addEventListener('click', () => {
  galleryModal.style.display = 'none';
});

const box = document.querySelector('.box');
const prevBtn = document.querySelector('.prev');
const nextBtn = document.querySelector('.next');
let degrees = 0;

prevBtn.addEventListener('click', () => {
  degrees += 45;
  box.style.transform = `perspective(1000px) rotateY(${degrees}deg)`;
});

nextBtn.addEventListener('click', () => {
  degrees -= 45;
  box.style.transform = `perspective(1000px) rotateY(${degrees}deg)`;
});

const letterModal = document.querySelector('#letter-modal');
const backButton3 = document.querySelector('#backButton3');

function showLetter() {
  letterModal.style.display = 'grid';
}

backButton3.addEventListener('click', () => {
  letterModal.style.display = 'none';
});

const envelope = document.querySelector('.envelope-wrapper');
envelope.addEventListener('click', () => {
  envelope.classList.toggle('flap');
});

const questionModal = document.querySelector('#question-modal');
const backButton4 = document.querySelector('#backButton4');
const questionGif = document.querySelector('#questionGif');
const questionTitle = document.querySelector('#questionTitle');
const yesBtn = document.querySelector('#yesBtn');
const noBtn = document.querySelector('#noBtn');
const questionBtns = document.querySelector('.question-btn');
let noClickCount = 0;

function showQuestion() {
  questionModal.style.display = 'flex';
}

backButton4.addEventListener('click', () => {
  questionModal.style.display = 'none';
});

yesBtn.addEventListener('click', (event) => {
  event.preventDefault();
  questionGif.src = './assets/gifs/question4.gif';
  questionTitle.textContent = '¿Y que esperas mi amor? Hazme tuyo';
  questionBtns.style.display = 'none';
});

function moveNoButton() {
  const maxX = window.innerWidth - noBtn.offsetWidth - 20;
  const maxY = window.innerHeight - noBtn.offsetHeight - 20;
  noBtn.style.left = `${Math.random() * maxX}px`;
  noBtn.style.top = `${Math.random() * maxY}px`;
}

noBtn.addEventListener('click', (event) => {
  event.preventDefault();
  noClickCount++;
  if (noClickCount === 1) {
    questionGif.src = './assets/gifs/question2.gif';
    questionTitle.textContent = '¿Por qué ño queles?';
  } else if (noClickCount === 2) {
    questionGif.src = './assets/gifs/question3.gif';
    questionTitle.textContent = '¡Di que chi mi amor di que CHIIII!';
  } else {
    noBtn.classList.add('move');
    noBtn.style.position = 'absolute';
    noBtn.addEventListener('mouseover', moveNoButton, { once: true });
    noBtn.addEventListener('click', moveNoButton);
  }
});

const mapModal = document.querySelector('#map-modal');
const backButton5 = document.querySelector('#backButton5');
const points = document.querySelectorAll('.point');
const imageContainer = document.querySelector('.image-container');
const descriptionContainer = document.querySelector('#image-description');
const descriptionText = document.querySelector('#description-text');

function showMap() {
  mapModal.style.display = 'flex';
  resetMap();
}

backButton5.addEventListener('click', () => {
  mapModal.style.display = 'none';
});

const mapView = document.querySelector('#map');
const mapReset = document.querySelector('#mapReset');

let mapZoom = 1;
let mapPanX = 0;
let mapPanY = 0;
let isPanning = false;
let panStartX = 0;
let panStartY = 0;

function applyMapTransform() {
  imageContainer.style.transform = `translate(${mapPanX}px, ${mapPanY}px) scale(${mapZoom})`;
}

function resetMap() {
  mapZoom = 1;
  mapPanX = 0;
  mapPanY = 0;
  applyMapTransform();
  descriptionContainer.style.display = 'none';
}

function clampPan() {
  const rect = mapView.getBoundingClientRect();
  const maxX = (rect.width * (mapZoom - 1)) / 2;
  const maxY = (rect.height * (mapZoom - 1)) / 2;
  mapPanX = Math.max(-maxX, Math.min(maxX, mapPanX));
  mapPanY = Math.max(-maxY, Math.min(maxY, mapPanY));
}

mapView.addEventListener(
  'wheel',
  (event) => {
    event.preventDefault();
    const rect = mapView.getBoundingClientRect();
    const originX = event.clientX - rect.left - rect.width / 2;
    const originY = event.clientY - rect.top - rect.height / 2;
    const factor = event.deltaY < 0 ? 1.15 : 1 / 1.15;
    const nextZoom = Math.min(3, Math.max(1, mapZoom * factor));
    const ratio = nextZoom / mapZoom;
    mapPanX = originX - (originX - mapPanX) * ratio;
    mapPanY = originY - (originY - mapPanY) * ratio;
    mapZoom = nextZoom;
    clampPan();
    applyMapTransform();
    descriptionContainer.style.display = 'none';
  },
  { passive: false }
);

mapView.addEventListener('pointerdown', (event) => {
  if (event.button !== 0) return;
  isPanning = true;
  panStartX = event.clientX - mapPanX;
  panStartY = event.clientY - mapPanY;
  mapView.classList.add('panning');
  imageContainer.classList.add('panning');
  mapView.setPointerCapture(event.pointerId);
  descriptionContainer.style.display = 'none';
});

mapView.addEventListener('pointermove', (event) => {
  if (!isPanning) return;
  mapPanX = event.clientX - panStartX;
  mapPanY = event.clientY - panStartY;
  clampPan();
  applyMapTransform();
});

function stopPanning(event) {
  if (!isPanning) return;
  isPanning = false;
  mapView.classList.remove('panning');
  imageContainer.classList.remove('panning');
  try {
    mapView.releasePointerCapture(event.pointerId);
  } catch (error) {
    // no-op: pointer capture may already be released
  }
}

mapView.addEventListener('pointerup', stopPanning);
mapView.addEventListener('pointercancel', stopPanning);

mapReset.addEventListener('click', resetMap);

points.forEach((point) => {
  point.addEventListener('click', () => {
    const rect = point.getBoundingClientRect();
    const viewRect = mapView.getBoundingClientRect();
    const top = rect.bottom - viewRect.top;
    const left = rect.left - viewRect.left + rect.width / 2;

    descriptionText.textContent = point.dataset.description;
    descriptionContainer.style.top = `${top}px`;
    descriptionContainer.style.left = `${left}px`;
    descriptionContainer.style.display = 'block';
  });
});

updateGreeting();
changePhrase();