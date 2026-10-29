import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'icon.svg'],
        manifest: {
          id: '/',
          name: 'BMW CINEMA - Movies & Series',
          short_name: 'BMWCinema',
          description: 'The premier movie streaming and download platform featuring 4K & HD titles, live football scores, and ultra-fast direct downloads.',
          theme_color: '#0d0d0d',
          background_color: '#0d0d0d',
          display: 'standalone',
          orientation: 'portrait-primary',
          start_url: '/',
          scope: '/',
          icons: [
            {
              src: '/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-maskable-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        workbox: {
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'gstatic-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /^https:\/\/image\.tmdb\.org\/.*/i,
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'tmdb-images-cache',
                expiration: {
                  maxEntries: 60,
                  maxAgeSeconds: 60 * 60 * 24 * 7,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
          ],
        },
        devOptions: {
          enabled: true,
          type: 'module',
        },
      }),
      {
        name: 'social-downloader-proxy',
        configureServer(server) {
          server.middlewares.use('/api/downloader', async (req, res) => {
            try {
              const urlObj = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
              const targetUrl = urlObj.searchParams.get('url');
              if (!targetUrl) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: false, error: 'URL parameter is required' }));
                return;
              }

              // 1. Try primary requested API
              const primaryApi = `https://api.ikyyxd.my.id/download/all-in-one?url=${encodeURIComponent(targetUrl)}`;
              try {
                const apiRes = await fetch(primaryApi, {
                  headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    Accept: 'application/json, text/plain, */*',
                  },
                });
                const text = await apiRes.text();
                if (text && !text.trim().startsWith('<')) {
                  const data = JSON.parse(text);
                  if (data.status !== false && !data.error?.includes('Blocked')) {
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(text);
                    return;
                  }
                }
              } catch (e) {
                // fall through
              }

              // 2. Special handler for TikTok if primary blocked
              if (targetUrl.includes('tiktok.com') || targetUrl.includes('douyin')) {
                try {
                  const tikRes = await fetch(`https://www.tikwm.com/api/?url=${encodeURIComponent(targetUrl)}`);
                  const tikText = await tikRes.text();
                  if (tikText && !tikText.trim().startsWith('<')) {
                    const tikData = JSON.parse(tikText);
                    if (tikData.code === 0 && tikData.data) {
                      res.statusCode = 200;
                      res.setHeader('Content-Type', 'application/json');
                      res.end(tikText);
                      return;
                    }
                  }
                } catch (e) {
                  // fall through
                }
              }

              // 3. Try secondary fallback
              const fallbackApi = `https://apis.davidcyriltech.my.id/download/aio?url=${encodeURIComponent(targetUrl)}`;
              const fbRes = await fetch(fallbackApi, {
                headers: {
                  'X-API-Key': 'dc_live_StN6vUfPUWD51DmXqxBu6tj7snF9Ni4O',
                  Accept: 'application/json, text/plain, */*',
                },
              });
              const fbText = await fbRes.text();
              res.statusCode = fbRes.status;
              res.setHeader('Content-Type', 'application/json');
              res.end(fbText);
            } catch (err: any) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: false, error: err?.message || 'Proxy error' }));
            }
          });

          // 4. Force-download attachment stream proxy
          server.middlewares.use('/api/download-file', async (req, res) => {
            try {
              const urlObj = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
              const targetUrl = urlObj.searchParams.get('url');
              let filename = urlObj.searchParams.get('filename') || 'video.mp4';
              filename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
              if (!filename.includes('.')) {
                filename += '.mp4';
              }

              if (!targetUrl) {
                res.statusCode = 400;
                res.end('Missing url parameter');
                return;
              }

              const remoteRes = await fetch(targetUrl, {
                headers: {
                  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                  'Accept': '*/*',
                },
              });

              if (!remoteRes.ok || !remoteRes.body) {
                res.statusCode = 302;
                res.setHeader('Location', targetUrl);
                res.end();
                return;
              }

              const contentType = remoteRes.headers.get('content-type') || 'application/octet-stream';
              const contentLength = remoteRes.headers.get('content-length');

              res.statusCode = 200;
              res.setHeader('Content-Type', contentType);
              res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
              res.setHeader('Access-Control-Allow-Origin', '*');
              if (contentLength) {
                res.setHeader('Content-Length', contentLength);
              }

              const { Readable } = await import('stream');
              const stream = Readable.fromWeb(remoteRes.body as any);
              stream.pipe(res);
              stream.on('error', () => {
                res.end();
              });
            } catch (err: any) {
              res.statusCode = 500;
              res.end('Download proxy error');
            }
          });
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
    build: {
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, 'index.html'),
          movies: path.resolve(__dirname, 'movies.html'),
          movie: path.resolve(__dirname, 'movie.html'),
          tvshows: path.resolve(__dirname, 'tvshows.html'),
          search: path.resolve(__dirname, 'search.html'),
          football: path.resolve(__dirname, 'football.html'),
          downloader: path.resolve(__dirname, 'downloader.html'),
          channel: path.resolve(__dirname, 'channel.html'),
          auth: path.resolve(__dirname, 'auth.html'),
          admin: path.resolve(__dirname, 'admin.html'),
          whatsappbot: path.resolve(__dirname, 'whatsapp-bot.html'),
          whatsappbotDirect: path.resolve(__dirname, 'whatsappbot.html'),
          adult: path.resolve(__dirname, 'adult.html'),
          apps: path.resolve(__dirname, 'apps.html'),
        },
      },
    },
  };
});
