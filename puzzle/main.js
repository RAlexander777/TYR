import '@fontsource/playfair-display/400-italic.css'
import '@fontsource/playfair-display/600.css'
import '@fontsource/lato/300.css'
import '../src/styles/tokens.css'
import '../src/styles/base.css'
import './style.css'
import { spawnBurstHearts } from '../src/lib/hearts.js'

const container = document.getElementById('puzzle-container')
const root = document.documentElement
const thumbnails = document.querySelectorAll('.thumb')
const gallery = document.getElementById('gallery')

const gridSize = 3
let tiles = []
let emptyPos = gridSize * gridSize - 1
let isDragging = false
let startX = 0
let startY = 0
let currentTile = null
let tileSize = 0

const images = ['assets/1.webp', 'assets/2.webp', 'assets/3.webp', 'assets/4.webp']
let currentImageIndex = 0

const levelsData = [
  {
    message: 'Eres mi complemento, la pieza del rompecabezas que encaja justo en mi corazón.',
    color: '#ffc8dd',
  },
  {
    message: 'Lamento no poder estar ahora a tu lado, pero sentir tus besos y caricias es lo que anhelo a diario.',
    color: '#bde0fe',
  },
  {
    message: 'Espero poder seguir recorriendo este cruel pero emocionante camino de la vida junto a ti.',
    color: '#cdb4db',
  },
  {
    message: 'Gracias por aceptarme como fui, y por ayudarme a ser lo que soy ahora, te amo.',
    color: '#ccffcc',
  },
]

function init() {
  tileSize = container.clientWidth / gridSize
  container.innerHTML = ''
  tiles = []

  for (let i = 0; i < gridSize * gridSize - 1; i++) {
    const tile = document.createElement('div')
    tile.classList.add('tile')

    const row = Math.floor(i / gridSize)
    const col = i % gridSize

    tile.style.backgroundPosition = `${col * 50}% ${row * 50}%`

    const tileData = {
      element: tile,
      currentPos: i,
      correctPos: i,
      x: col * tileSize,
      y: row * tileSize,
    }

    tiles.push(tileData)
    container.appendChild(tile)
    updateTileVisual(tileData)
  }

  emptyPos = gridSize * gridSize - 1
  updateLetterDetails(0)
  setTimeout(scramble, 500)
}

function updateTileVisual(tileData, offsetX = 0, offsetY = 0) {
  const col = tileData.currentPos % gridSize
  const row = Math.floor(tileData.currentPos / gridSize)
  const x = col * tileSize
  const y = row * tileSize

  tileData.x = x
  tileData.y = y
  tileData.element.style.transform = `translate3d(${x + offsetX}px, ${y + offsetY}px, 0)`
}

function canMove(pos) {
  const row = Math.floor(pos / gridSize)
  const col = pos % gridSize
  const eRow = Math.floor(emptyPos / gridSize)
  const eCol = emptyPos % gridSize
  return Math.abs(row - eRow) + Math.abs(col - eCol) === 1
}

function handleStart(e) {
  const letterScene = document.getElementById('letter-scene')
  if (letterScene.classList.contains('visible')) return

  const target = e.target
  currentTile = tiles.find((t) => t.element === target)
  if (!currentTile || !canMove(currentTile.currentPos)) return

  isDragging = true
  currentTile.element.classList.add('dragging')

  const clientX = e.type.startsWith('touch') ? e.touches[0].clientX : e.clientX
  const clientY = e.type.startsWith('touch') ? e.touches[0].clientY : e.clientY

  startX = clientX
  startY = clientY
  if (e.type.startsWith('touch')) e.preventDefault()
}

function handleMove(e) {
  if (!isDragging || !currentTile) return

  const clientX = e.type.startsWith('touch') ? e.touches[0].clientX : e.clientX
  const clientY = e.type.startsWith('touch') ? e.touches[0].clientY : e.clientY

  const diffX = clientX - startX
  const diffY = clientY - startY

  const emptyRow = Math.floor(emptyPos / gridSize)
  const emptyCol = emptyPos % gridSize
  const currentRow = Math.floor(currentTile.currentPos / gridSize)
  const currentCol = currentTile.currentPos % gridSize

  let moveX = diffX
  let moveY = diffY

  if (currentRow === emptyRow) {
    moveX = Math.max(-tileSize, Math.min(tileSize, diffX))
    moveY = 0
  } else if (currentCol === emptyCol) {
    moveY = Math.max(-tileSize, Math.min(tileSize, diffY))
    moveX = 0
  }

  updateTileVisual(currentTile, moveX, moveY)
  if (e.type.startsWith('touch')) e.preventDefault()
}

function handleEnd() {
  if (!isDragging || !currentTile) return

  isDragging = false
  currentTile.element.classList.remove('dragging')

  const matrix = new DOMMatrix(currentTile.element.style.transform)
  const movedX = matrix.m41 - currentTile.x
  const movedY = matrix.m42 - currentTile.y

  if (Math.abs(movedX) > tileSize / 2 || Math.abs(movedY) > tileSize / 2) {
    const temp = currentTile.currentPos
    currentTile.currentPos = emptyPos
    emptyPos = temp
    checkWin()
  }

  updateTileVisual(currentTile)
  currentTile = null
}

function scramble() {
  container.classList.add('shuffling')
  let moves = 0
  const totalMoves = 60
  let lastEmptyPos = -1

  const interval = setInterval(() => {
    const movableTiles = tiles.filter((t) => canMove(t.currentPos))
    let candidates = movableTiles.filter((t) => t.currentPos !== lastEmptyPos)
    if (candidates.length === 0) candidates = movableTiles

    const randomTile = candidates[Math.floor(Math.random() * candidates.length)]
    lastEmptyPos = emptyPos

    const temp = randomTile.currentPos
    randomTile.currentPos = emptyPos
    emptyPos = temp
    updateTileVisual(randomTile)

    moves++
    if (moves >= totalMoves) {
      clearInterval(interval)
      setTimeout(() => container.classList.remove('shuffling'), 100)
    }
  }, 50)
}

function selectImage(index) {
  if (index === currentImageIndex) return
  currentImageIndex = index
  root.style.setProperty('--bg-image', `url(${images[index]})`)
  updateLetterDetails(index)

  thumbnails.forEach((thumb, i) => thumb.classList.toggle('active', i === index))
  scramble()
}

function updateLetterDetails(index) {
  const data = levelsData[index]
  const letterText = document.getElementById('letter-text')
  const bodyPath = document.querySelector('.envelope-body path')
  const flapPath = document.querySelector('.envelope-flap path')

  letterText.textContent = data.message
  bodyPath.style.fill = data.color
  flapPath.style.fill = data.color
}

function nextPhoto() {
  const nextIndex = (currentImageIndex + 1) % images.length
  selectImage(nextIndex)
}

function restartGame() {
  scramble()
}

function checkWin() {
  const won = tiles.every((t) => t.currentPos === t.correctPos)
  if (won) {
    setTimeout(() => {
      document.getElementById('letter-scene').classList.add('visible')
    }, 500)
  }
}

/* ------- Carta ------- */

const letterScene = document.getElementById('letter-scene')
const sticker = document.getElementById('sticker')
const finalLetter = document.getElementById('final-letter')
const flapContainer = document.getElementById('flap-container')
const letterActions = document.getElementById('letter-actions')

let isStickerRemoved = false
let isEnvelopeOpen = false

function removeSticker(event) {
  if (event) event.stopPropagation()
  if (isStickerRemoved) return
  sticker.classList.add('removed')
  isStickerRemoved = true
}

function openEnvelope() {
  if (!isStickerRemoved) {
    sticker.style.transform = 'translateX(-50%) scale(1.3)'
    setTimeout(() => {
      sticker.style.transform = ''
    }, 200)
    return
  }

  if (isEnvelopeOpen) return

  flapContainer.classList.add('open')
  isEnvelopeOpen = true
  finalLetter.style.transform = 'translateY(20px)'
  spawnBurstHearts(document.querySelector('.envelope-container'))
}

function enableLetterDrag() {
  let startY = 0

  const handlePull = () => {
    finalLetter.classList.add('pulled')
    letterActions.classList.remove('hidden')
  }

  finalLetter.addEventListener('click', handlePull)
  finalLetter.addEventListener('touchstart', (e) => {
    startY = e.touches[0].clientY
  })
  finalLetter.addEventListener('touchend', (e) => {
    if (startY - e.changedTouches[0].clientY > 50) handlePull()
  })
}

function resetEnvelope() {
  isStickerRemoved = false
  isEnvelopeOpen = false
  sticker.classList.remove('removed')
  sticker.style.transform = ''
  flapContainer.classList.remove('open')
  finalLetter.classList.remove('pulled')
  finalLetter.style.transform = 'translateY(120px)'
  letterActions.classList.add('hidden')
}

function closeLetterAndRestart() {
  letterScene.classList.remove('visible')
  setTimeout(() => {
    resetEnvelope()
    restartGame()
  }, 500)
}

function closeLetterAndNext() {
  letterScene.classList.remove('visible')
  setTimeout(() => {
    resetEnvelope()
    nextPhoto()
  }, 500)
}

/* ------- Corazones de fondo ------- */

const bgContainer = document.getElementById('bg-effects')

function createHeart() {
  const heart = document.createElement('div')
  heart.className = 'heart-item'
  heart.innerHTML =
    '<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>'

  const startLeft = Math.random() * 100
  const scale = Math.random() * 1.2 + 0.8
  const duration = Math.random() * 10 + 15
  const tilt = Math.random() * 90 - 45
  const blurAmount = Math.random() * 2 + 0.5

  heart.style.left = `${startLeft}%`
  heart.style.setProperty('--heart-scale', scale)
  heart.style.setProperty('--fall-duration', `${duration}s`)
  heart.style.setProperty('--rotation-tilt', `${tilt}deg`)
  heart.style.filter = `blur(${blurAmount}px)`

  bgContainer.appendChild(heart)
  setTimeout(() => heart.remove(), duration * 1000 + 500)
}

/* ------- Eventos ------- */

gallery.addEventListener('click', (e) => {
  const thumb = e.target.closest('.thumb')
  if (!thumb) return
  selectImage([...thumbnails].indexOf(thumb))
})

flapContainer.addEventListener('click', openEnvelope)
sticker.addEventListener('click', removeSticker)
document.getElementById('btn-restart').addEventListener('click', closeLetterAndRestart)
document.getElementById('btn-next').addEventListener('click', closeLetterAndNext)

container.addEventListener('mousedown', handleStart)
container.addEventListener('touchstart', handleStart, { passive: false })
window.addEventListener('mousemove', handleMove)
window.addEventListener('touchmove', handleMove, { passive: false })
window.addEventListener('mouseup', handleEnd)
window.addEventListener('touchend', handleEnd)

let resizeRaf = null
window.addEventListener('resize', () => {
  if (resizeRaf) return
  resizeRaf = requestAnimationFrame(() => {
    tileSize = container.clientWidth / gridSize
    tiles.forEach(updateTileVisual)
    resizeRaf = null
  })
})

setInterval(createHeart, 800)
enableLetterDrag()
init()