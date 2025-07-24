import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true
  },
  build: {
    outDir: 'build',
    sourcemap: false
  },
  define: {
    global: 'globalThis',
  },
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx']
  },
  assetsInclude: ['**/*.xlsx', '**/*.xls', '**/*.doc', '**/*.docx', '**/*.pdf']
})