import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { PUBLIC_PATHS, SITE_URL } from './src/config.js'

// Hand-rolled instead of vite-plugin-pwa: all it has to do is write the list
// of built files into the service worker so they are cached on first visit.
// Without that list, assets fetched before the worker activates would be
// missing offline.
function serviceWorker() {
  return {
    name: 'molarmasse-sw',
    apply: 'build',
    generateBundle(_, bundle) {
      const files = Object.keys(bundle).filter((f) => !f.endsWith('.map'))
      const statics = ['/', '/manifest.webmanifest', '/icon.svg', '/icon-192.png', '/icon-512.png', '/apple-touch-icon.png']
      const precache = [...statics, ...files.map((f) => '/' + f)]
      const version = createHash('sha256').update(precache.join('|')).digest('hex').slice(0, 10)
      const source = readFileSync(new URL('./src/sw.js', import.meta.url), 'utf8')
        .replace('[/*__PRECACHE__*/]', JSON.stringify(precache))
        .replace('__VERSION__', version)
      this.emitFile({ type: 'asset', fileName: 'sw.js', source })
    },
  }
}

// sitemap.xml and robots.txt come from src/config.js so the domain lives in
// one place.
function seoFiles() {
  return {
    name: 'molarmasse-seo',
    apply: 'build',
    generateBundle() {
      const urls = PUBLIC_PATHS.map((p) => `  <url><loc>${SITE_URL}${p}</loc></url>`).join('\n')
      const sitemap = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
        urls,
        '</urlset>',
        '',
      ].join('\n')
      const robots = ['User-agent: *', 'Allow: /', '', `Sitemap: ${SITE_URL}/sitemap.xml`, ''].join('\n')
      this.emitFile({ type: 'asset', fileName: 'sitemap.xml', source: sitemap })
      this.emitFile({ type: 'asset', fileName: 'robots.txt', source: robots })
    },
  }
}

export default defineConfig({
  plugins: [react(), serviceWorker(), seoFiles()],
  test: {
    include: ['src/**/__tests__/**/*.test.js'],
  },
})
