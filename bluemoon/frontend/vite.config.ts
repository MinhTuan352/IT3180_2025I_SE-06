import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react' // (Hoặc plugin-react)

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173, // Cố định cổng Frontend là 5173
    // Proxy đã được loại bỏ - Frontend giờ gọi trực tiếp backend qua VITE_API_BASE_URL
  },
})