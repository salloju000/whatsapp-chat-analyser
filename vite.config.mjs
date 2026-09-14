import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// connect-src 'none' is the enforceable form of the privacy promise: the
// built page cannot make a network request even if some future code tried to.
const CSP = [
  "default-src 'self'",
  "connect-src 'none'",
  "img-src 'self' data:",
  "font-src 'self' data:",
  "style-src 'self' 'unsafe-inline'",
  "script-src 'self'",
  "worker-src 'self' blob:",
  "base-uri 'none'",
  "form-action 'none'",
  "object-src 'none'",
  "frame-ancestors 'none'",
].join('; ');

// Applied only to the production build — the dev server needs inline scripts
// and a websocket for HMR.
const cspPlugin = () => ({
  name: 'inject-csp',
  apply: 'build',
  transformIndexHtml: (html) =>
    html.replace(
      '<head>',
      `<head>\n    <meta http-equiv="Content-Security-Policy" content="${CSP}" />`
    ),
});

export default defineConfig({
  plugins: [react(), cspPlugin()],
  build: {
    sourcemap: false,
    rollupOptions: {
      output: {
        // recharts pulls in the d3 family and is used by one component;
        // splitting it keeps the initial parse off the critical path.
        manualChunks: {
          react: ['react', 'react-dom'],
          charts: ['recharts'],
        },
      },
    },
  },
  server: {
    watch: {
      usePolling: true,
    },
  },
});
