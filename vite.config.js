import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.js',
    css: true,
    // Tests use the plain fetch path (no simulated 2-3 s latency) and no search
    // debounce, so assertions can stay synchronous. Debounce has its own tests.
    env: { VITE_SIMULATE_BACKEND: 'false', VITE_SEARCH_DEBOUNCE_MS: '0' },
  },
})
