import './css/main.css';

const audio = document.querySelector('#song');
const lyrics = document.querySelector('#lyrics');

const lyricsData = [
  { text: 'Ya no importa cada noche que esperé', time: 11 },
  { text: 'Cada calle o laberinto que crucé', time: 17 },
  { text: 'Porque el cielo a conspirado a mi favor', time: 22 },
  { text: 'Y a un segundo de rendirme te encontré', time: 28 },
  { text: 'Piel con piel', time: 33 },
  { text: 'El corazón se me desarma', time: 34 },
  { text: 'Me haces bien', time: 39 },
  { text: 'Enciendes luces en mi alma', time: 41 },
  { text: 'Creo en tí y en este amor', time: 44 },
  { text: 'Que me vuelve indestructible', time: 50 },
  { text: 'Que detuvo mi caída libre', time: 52 },
  { text: 'Creo en ti y mi dolor', time: 55 },
  { text: 'Se quedó kilómetros atrás', time: 61 },
  { text: 'Y mis fantasmas hoy por fin están en paz', time: 65 },
  { text: 'El pasado es un mal sueño que acabó', time: 84 },
  { text: 'Un incendio que en tus brazos se apagó', time: 90 },
  { text: 'Cuando estaba a medio paso de caer', time: 95 },
  { text: 'Mis silencios se encontraron con tu voz', time: 101 },
  { text: 'Te seguí y rescribiste mi futuro', time: 107 },
  { text: 'Es aquí mi único lugar seguro', time: 111 },
  { text: 'Creo en tí y en este amor', time: 117 },
  { text: 'Que me ha vuelto indestructible', time: 122 },
  { text: 'Que detuvo mi caída libre', time: 125 },
  { text: 'Creo en ti y mi dolor', time: 128 },
  { text: 'Se quedo kilómetros atrás', time: 134 },
  { text: 'Y mis fantasmas hoy por fin están en paz', time: 138 },
];

function calcularDuracion(line) {
  const words = line.text.split(' ').length;
  return words * 0.8;
}

function updateLyrics() {
  const time = Math.floor(audio.currentTime);

  for (let i = 0; i < lyricsData.length; i++) {
    const line = lyricsData[i];
    const duration = calcularDuracion(line);

    if (time >= line.time && time < line.time + duration) {
      const opacity = Math.min(1, (time - line.time) / 0.1);
      lyrics.style.opacity = opacity;
      lyrics.innerHTML = line.text;
      return;
    }
  }

  lyrics.style.opacity = 0;
  lyrics.innerHTML = '';
}

setInterval(updateLyrics, 100);

function ocultarTitulo() {
  const titulo = document.querySelector('.titulo');
  if (!titulo) return;
  titulo.style.animation = 'fadeOut 3s forwards';
  setTimeout(() => {
    titulo.style.display = 'none';
  }, 3000);
}

setTimeout(ocultarTitulo, 216000);