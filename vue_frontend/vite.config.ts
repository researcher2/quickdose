import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

pages = [
  "dose_calculator"
]

// We are using js for the entrypoints because mathjax-vue3 refused to play nicely with ts.
let rollup_inputs = pages.map(page =>
{
  return `src/${page}/${page}.js`
});

export default defineConfig({
  build: {
    manifest: true,
    rollupOptions: {
      input: rollup_inputs
    }
  },
  base: "/vue/",
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    origin: 'http://127.0.0.1:3001'
  }
})
