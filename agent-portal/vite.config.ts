import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'url'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'firebase/app': path.resolve(__dirname, 'node_modules/firebase/app'),
      'firebase/firestore': path.resolve(__dirname, 'node_modules/firebase/firestore'),
      'firebase/auth': path.resolve(__dirname, 'node_modules/firebase/auth'),
      'firebase/database': path.resolve(__dirname, 'node_modules/firebase/database'),
      'firebase': path.resolve(__dirname, 'node_modules/firebase'),
      '@shared-ui': path.resolve(__dirname, '../shared-ui/src'),
      'react': path.resolve(__dirname, 'node_modules/react'),
      'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
      'lucide-react': path.resolve(__dirname, 'node_modules/lucide-react'),
    }
  },
  server: {
    fs: {
      allow: ['.', '..']
    }
  }
})
