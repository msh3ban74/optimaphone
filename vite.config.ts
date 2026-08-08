import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Relative base so the built site works from any host path
  // (GitHub Pages subdirectory, local file preview, or a root domain).
  base: './',
})
