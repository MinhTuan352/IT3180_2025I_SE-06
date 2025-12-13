import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react' // (Hoặc plugin-react)

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // port: 5173, // Cố định cổng Frontend là 5173 (để tránh tranh chấp với Backend 3000)
    // proxy: {
    //   '/api': {
    //     target: 'http://localhost:3000', // <-- Chuyển hướng mọi request /api sang Backend 3000
    //     changeOrigin: true,
    //     secure: false,
    //   }
    // }
  }
})