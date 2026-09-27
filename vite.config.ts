import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config();

function apiDevServerPlugin(): Plugin {
  return {
    name: 'api-dev-server',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/')) {
          return next();
        }

        try {
          const url = new URL(req.url, 'http://localhost');
          const pathname = url.pathname;

          let targetFile = '';
          if (pathname === '/api/auth/register') {
            targetFile = '/api/auth/register.ts';
          } else if (pathname === '/api/auth/login') {
            targetFile = '/api/auth/login.ts';
          } else if (pathname === '/api/auth/me') {
            targetFile = '/api/auth/me.ts';
          } else if (pathname === '/api/auth/change-password') {
            targetFile = '/api/auth/change-password.ts';
          } else if (pathname === '/api/status') {
            targetFile = '/api/status.ts';
          }

          if (targetFile) {
            const mod = await server.ssrLoadModule('.' + targetFile);
            if (mod && typeof mod.default === 'function') {
              const enhancedRes = res as any;
              if (!enhancedRes.status) {
                enhancedRes.status = (code: number) => {
                  res.statusCode = code;
                  return enhancedRes;
                };
              }
              if (!enhancedRes.json) {
                enhancedRes.json = (data: any) => {
                  res.setHeader('Content-Type', 'application/json; charset=utf-8');
                  res.end(JSON.stringify(data));
                  return enhancedRes;
                };
              }

              return await mod.default(req, enhancedRes);
            }
          }

          res.statusCode = 404;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(JSON.stringify({ error: 'Endpoint not found' }));
        } catch (error: any) {
          console.error('Dev server API error:', error);
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(JSON.stringify({ error: error.message || 'Internal server error' }));
        }
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  base: '/',
  build: {
    outDir: 'dist',
    chunkSizeWarningLimit: 1600,
  },
  plugins: [react(), tailwindcss(), apiDevServerPlugin()],
});
