import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    // Teto de bundle do CONSTRAINTS.md. Avisa, não quebra o build.
    chunkSizeWarningLimit: 430,
  },
  server: {
    port: 3000,
    proxy: {
      // the server mounts its routes under /api too, so the path passes through as-is
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
})
