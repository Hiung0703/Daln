import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    hmr: {
      overlay: false, // Tắt overlay lỗi
      timeout: 5000   // Tăng timeout
    }
  }
})