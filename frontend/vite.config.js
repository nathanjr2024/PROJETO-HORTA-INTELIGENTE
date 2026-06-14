import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test-setup.js',
  },
  build: {
    // Remove console.* do bundle de produção — evita vazar logs com dados sensíveis
    minify: 'esbuild',
    esbuildOptions: { drop: ['console'] },
  },
  server: {
    proxy: {
      '/api': 'https://horta-api-htggarb3eagagpgm.brazilsouth-01.azurewebsites.net',
    },
  },
})
