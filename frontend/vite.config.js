import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  if (env.GITHUB_PAGES === 'true') {
    let apiUrl
    try {
      apiUrl = new URL(env.VITE_API_URL)
    } catch {
      throw new Error('GitHub Pages requiere la variable VITE_API_URL con la URL HTTPS del backend.')
    }
    if (apiUrl.protocol !== 'https:' || apiUrl.username || apiUrl.password || apiUrl.search || apiUrl.hash) {
      throw new Error('VITE_API_URL debe ser una URL HTTPS sin credenciales, query ni fragmento.')
    }
  }

  return {
    base: env.PAGES_BASE_PATH || '/',
    plugins: [react()],
    server: {
      port: 5173,
      host: '0.0.0.0',
      strictPort: true,
      cors: true,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      },
      proxy: {
        '/api': {
          target: 'http://localhost:8000',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path,
          configure: (proxy, options) => {
            proxy.on('error', (err, req, res) => {
              console.log('proxy error', err);
            });
            proxy.on('proxyReq', (proxyReq, req, res) => {
              console.log('Sending Request to the Target:', req.method, req.url);
            });
            proxy.on('proxyRes', (proxyRes, req, res) => {
              console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
            });
          }
        }
      },
      hmr: {
        port: 5173
      }
    },
    preview: {
      port: 5173,
      host: '0.0.0.0',
      strictPort: true,
      cors: true
    },
    build: {
      outDir: 'dist',
      sourcemap: true,
      rollupOptions: {
        output: {
          manualChunks: undefined
        }
      }
    }
  }
})
