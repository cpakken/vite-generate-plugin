import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import generate from 'vite-generate-plugin'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [generate(), react()],
})
