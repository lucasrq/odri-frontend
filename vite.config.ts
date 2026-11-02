import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// O Spring libera (CORS) só http://localhost:5173 no seu PC, então a porta fica fixa
export default defineConfig({
  plugins: [react()],
  server: { port: 5173, strictPort: true },
})
