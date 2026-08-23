import { defineConfig } from 'vite'
import { resolve } from 'node:path'

export default defineConfig({
  base: './',
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        puzzle: resolve(__dirname, 'puzzle/index.html'),
        cumple: resolve(__dirname, 'cumple/index.html'),
        historia: resolve(__dirname, 'historia/index.html'),
        morpage: resolve(__dirname, 'morpag/index.html'),
        morpagFlow: resolve(__dirname, 'morpag/flow/main.html'),
        morpagFlower: resolve(__dirname, 'morpag/flow/flower.html'),
      },
    },
  },
})