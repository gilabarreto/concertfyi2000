import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  base: '/concertfyi2000/',
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/api/, ''),
      },
      '/setlist': {
        target: 'https://api.setlist.fm',
        changeOrigin: true,
        secure: true,
        rewrite: path => path.replace(/^\/setlist/, ''),
      },
      '/ticketmaster': {
        target: 'https://app.ticketmaster.com',
        changeOrigin: true,
        secure: true,
        rewrite: path => path.replace(/^\/ticketmaster/, ''),
      }
    },
  },
})
