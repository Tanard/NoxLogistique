import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true,
  },
  optimizeDeps: {
    include: ['react-big-calendar', 'react-big-calendar/lib/localizers/date-fns', 'date-fns', 'date-fns/locale'],
  },
})
