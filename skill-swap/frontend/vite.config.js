import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5518,
    proxy: {
      '/api': {
        target: 'http://localhost:4118',
        changeOrigin: true
      }
    }
  }
})
