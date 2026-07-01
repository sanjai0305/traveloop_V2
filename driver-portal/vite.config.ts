import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@shared-ui': path.resolve(__dirname, '../shared-ui/src'),
        'react': path.resolve(__dirname, 'node_modules/react'),
        'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
        'lucide-react': path.resolve(__dirname, 'node_modules/lucide-react'),
      }
    },
    server: {
      port: 5176,
      fs: {
        allow: ['.', '..']
      },
      proxy: {
        '/api': {
          target: env.VITE_API_URL || 'https://traveloopv2.duckdns.org',
          changeOrigin: true,
        },
      },
    },
  };
})
