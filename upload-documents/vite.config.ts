import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '')

  const documentationHost = env.VITE_DOCUMENTATION_HOST || 'https://wrongurl.dev'

  return {
    plugins: [
      react(),
      {
        name: 'html-transform',
        transformIndexHtml(html) {
          return html.replace('%VITE_DOCUMENTATION_HOST%', documentationHost)
        }
      }
    ],
    server: {
      headers: {
        'Content-Security-Policy': `default-src 'self'; connect-src 'self' ${documentationHost}; img-src 'self' data: blob:; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';`
      }
    }
  }
})
