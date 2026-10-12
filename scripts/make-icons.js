// Generates the PWA / home-screen PNG icons and the SVG favicon from one
// shape definition, with only Node built-ins (no image dependency).
// Run: npm run icons
import { writeFileSync } from 'node:fs'
import { deflateSync } from 'node:zlib'

const BG = [16, 20, 22]
const FG = [123, 224, 194]

// Block "M" in a 0..1 box, plus a subscript bar suggesting "Mₘ".
const M = [
  [0, 1], [0, 0], [0.24, 0], [0.5, 0.42], [0.76, 0], [1, 0], [1, 1],
  [0.78, 1], [0.78, 0.4], [0.57, 0.74], [0.43, 0.74], [0.22, 0.4], [0.22, 1],
]
// Glyph box as a fraction of the icon; kept inside the maskable safe zone.
const BOX = { x: 0.27, y: 0.3, w: 0.46, h: 0.4 }
const BAR = { x: 0.27, y: 0.75, w: 0.46, h: 0.05 }

function inPoly(px, py, poly) {
  let inside = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i]
    const [xj, yj] = poly[j]
    if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) inside = !inside
  }
  return inside
}

function coverage(u, v) {
  const gx = (u - BOX.x) / BOX.w
  const gy = (v - BOX.y) / BOX.h
  if (gx >= 0 && gx <= 1 && gy >= 0 && gy <= 1 && inPoly(gx, gy, M)) return 1
  if (u >= BAR.x && u <= BAR.x + BAR.w && v >= BAR.y && v <= BAR.y + BAR.h) return 1
  return 0
}

function png(size) {
  const SS = 4
  const raw = Buffer.alloc(size * (size * 3 + 1))
  for (let y = 0; y < size; y++) {
    raw[y * (size * 3 + 1)] = 0
    for (let x = 0; x < size; x++) {
      let c = 0
      for (let sy = 0; sy < SS; sy++)
        for (let sx = 0; sx < SS; sx++) c += coverage((x + (sx + 0.5) / SS) / size, (y + (sy + 0.5) / SS) / size)
      const a = c / (SS * SS)
      const o = y * (size * 3 + 1) + 1 + x * 3
      for (let k = 0; k < 3; k++) raw[o + k] = Math.round(BG[k] * (1 - a) + FG[k] * a)
    }
  }
  const chunk = (type, data) => {
    const len = Buffer.alloc(4)
    len.writeUInt32BE(data.length)
    const td = Buffer.concat([Buffer.from(type), data])
    const crc = Buffer.alloc(4)
    crc.writeUInt32BE(crc32(td) >>> 0)
    return Buffer.concat([len, td, crc])
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8
  ihdr[9] = 2
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

let table
function crc32(buf) {
  if (!table) {
    table = new Int32Array(256)
    for (let n = 0; n < 256; n++) {
      let c = n
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
      table[n] = c
    }
  }
  let c = -1
  for (const b of buf) c = table[(c ^ b) & 0xff] ^ (c >>> 8)
  return c ^ -1
}

function svg() {
  const pt = ([x, y]) => `${((BOX.x + x * BOX.w) * 100).toFixed(2)},${((BOX.y + y * BOX.h) * 100).toFixed(2)}`
  const hex = (c) => '#' + c.map((v) => v.toString(16).padStart(2, '0')).join('')
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="22" fill="${hex(BG)}"/><polygon points="${M.map(pt).join(' ')}" fill="${hex(FG)}"/><rect x="${BAR.x * 100}" y="${BAR.y * 100}" width="${BAR.w * 100}" height="${BAR.h * 100}" fill="${hex(FG)}"/></svg>\n`
}

const out = new URL('../public/', import.meta.url)
writeFileSync(new URL('icon-192.png', out), png(192))
writeFileSync(new URL('icon-512.png', out), png(512))
writeFileSync(new URL('apple-touch-icon.png', out), png(180))
writeFileSync(new URL('icon.svg', out), svg())
console.log('icons written to public/')
