import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), vueDevTools()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    proxy: {
      '/api/libcal': {
        target: 'https://uri.libcal.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/libcal/, '/api/1.1'),
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq, req) => {
            console.log('🔧 Proxying request:', req.method, req.url)
            console.log('🔑 Headers being forwarded:', req.headers)
          })
          proxy.on('proxyRes', (proxyRes, req) => {
            console.log('📡 Proxy response:', proxyRes.statusCode, 'for', req.url)
          })
        },
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        },
      },
    },
  },
})
