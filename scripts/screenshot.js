// Phone screenshots via the Chrome DevTools Protocol, Node built-ins only.
// Headless Chrome will not size a window below 500 px, so the 375×812 touch
// viewport is emulated instead.
// Usage: node scripts/screenshot.js <baseUrl> <outDir>   (server must be running)
import { spawn } from 'node:child_process'
import { mkdirSync, writeFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

const BASE = process.argv[2] || 'http://localhost:4173'
const OUT = process.argv[3] || 'docs/screenshots'
const PORT = 9333
const CHROME = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
].find((p) => existsSync(p))

// name, path, optional steps run in the page after load, theme
const SHOTS = [
  { name: '1-shell-empty', path: '/' },
  { name: '2-keypad-typing', path: '/', steps: ['tap:Ca', 'tap:(', 'tap:O', 'tap:H', 'tap:)', 'tap:2'] },
  { name: '3-result-hydrate', path: '/?f=CuSO4·5H2O' },
  { name: '4-result-ion', path: '/?f=SO4^2-' },
  { name: '5-error-position', path: '/?f=Ca(OH' },
  { name: '6-ambiguous', path: '/?f=co' },
  { name: '7-light-theme', path: '/?f=C6H12O6', light: true },
  { name: '8-rounding-sheet', path: '/?f=C6H12O6', steps: ['click:.pill', 'wait'] },
  { name: '9-all-elements', path: '/?f=H2', steps: ['click:.elchip--all', 'wait'] },
  { name: '10-stoffmengde', path: '/stoffmengde' },
  { name: '11-masseprosent', path: '/masseprosent' },
  { name: '12-periodesystem', path: '/periodesystem' },
  { name: '13-quiz', path: '/quiz' },
  { name: '14-mer', path: '/mer' },
  { name: '15-sum-keypad', path: '/sum', steps: ['tap:Na', 'tap:+', 'tap:Cl', 'tap:+', 'tap:O', 'tap:×', 'tap:2'] },
  { name: '16-sum-empty', path: '/sum' },
  { name: '17-reaction-balanced', path: '/reaksjon', steps: ['type:#equation:Fe + O2 -> Fe2O3', 'type:[name=mass-0]:10'] },
  { name: '18-reaction-limiting', path: '/reaksjon', steps: ['type:#equation:H2 + O2 -> H2O', 'type:[name=mass-0]:1', 'type:[name=mass-1]:16', 'scroll:.stoich'] },
  { name: '20-konsentrasjon', path: '/konsentrasjon', steps: ['type:#conc-m:5,844', 'type:#conc-M:58.44', 'type:#conc-V:250'] },
  { name: '21-fortynning', path: '/konsentrasjon', steps: ['click:.segmented__opt:nth-child(2)', 'type:#dil-c1:2', 'type:#dil-V1:50', 'type:#dil-c2:0,5'] },
  { name: '19-reaction-ionic', path: '/reaksjon', steps: ['type:#equation:Cu + Ag+ -> Cu2+ + Ag'] },
]

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function main() {
  mkdirSync(OUT, { recursive: true })
  const chrome = spawn(CHROME, [
    '--headless=new', '--disable-gpu', '--hide-scrollbars', `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${join(tmpdir(), 'mm-cdp-' + Date.now())}`, 'about:blank',
  ], { stdio: 'ignore' })
  try {
    let target
    for (let i = 0; i < 50 && !target; i++) {
      await sleep(200)
      try {
        const list = await (await fetch(`http://127.0.0.1:${PORT}/json`)).json()
        target = list.find((t) => t.type === 'page')
      } catch {}
    }
    const ws = new WebSocket(target.webSocketDebuggerUrl)
    await new Promise((r) => ws.addEventListener('open', r))
    let id = 0
    const pending = new Map()
    ws.addEventListener('message', (e) => {
      const msg = JSON.parse(e.data)
      if (msg.id && pending.has(msg.id)) {
        pending.get(msg.id)(msg)
        pending.delete(msg.id)
      }
    })
    const send = (method, params = {}) =>
      new Promise((resolve, reject) => {
        const n = ++id
        pending.set(n, (m) => (m.error ? reject(new Error(method + ': ' + m.error.message)) : resolve(m.result)))
        ws.send(JSON.stringify({ id: n, method, params }))
      })
    const evaluate = async (expression) => {
      const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })
      if (r.exceptionDetails) throw new Error(r.exceptionDetails.text + ' ' + expression)
      return r.result.value
    }

    await send('Page.enable')
    await send('Runtime.enable')
    await send('Emulation.setDeviceMetricsOverride', { width: 375, height: 812, deviceScaleFactor: 2, mobile: true })
    await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 })

    const report = []
    for (const shot of SHOTS) {
      await send('Emulation.setEmulatedMedia', {
        features: [{ name: 'prefers-color-scheme', value: shot.light ? 'light' : 'dark' }],
      })
      // Fresh state per shot so history/settings from earlier shots don't leak.
      await send('Page.navigate', { url: BASE + '/mer' })
      await sleep(400)
      await evaluate('localStorage.clear(); true')
      await send('Page.navigate', { url: BASE + encodeURI(shot.path) })
      await sleep(900)
      for (const step of shot.steps || []) {
        if (step === 'wait') await sleep(500)
        else if (step.startsWith('tap:')) {
          const label = step.slice(4)
          await evaluate(`(() => { const b = [...document.querySelectorAll('.key, .elchip')].find(b => b.textContent.trim() === ${JSON.stringify(label)}); if (!b) throw new Error('no key ${label}'); b.click(); return true })()`)
          await sleep(60)
        } else if (step.startsWith('type:')) {
          // React tracks input values itself, so set through the native setter
          // and fire 'input' the way a real keystroke would.
          const [, sel, ...rest] = step.split(':')
          await evaluate(`(() => {
            const el = document.querySelector(${JSON.stringify(sel)})
            const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set
            set.call(el, ${JSON.stringify(rest.join(':'))})
            el.dispatchEvent(new Event('input', { bubbles: true }))
            return true
          })()`)
          await sleep(150)
        } else if (step.startsWith('scroll:')) {
          await evaluate(`document.querySelector(${JSON.stringify(step.slice(7))}).scrollIntoView(); true`)
          await sleep(150)
        } else if (step.startsWith('click:')) {
          await evaluate(`document.querySelector(${JSON.stringify(step.slice(6))}).click(); true`)
          await sleep(200)
        }
      }
      const metrics = await evaluate(`({ w: innerWidth, scrollW: document.documentElement.scrollWidth, text: (document.querySelector('.result__value')||{}).textContent || '' })`)
      const { data } = await send('Page.captureScreenshot', { format: 'png' })
      writeFileSync(join(OUT, shot.name + '.png'), Buffer.from(data, 'base64'))
      report.push(`${shot.name}: viewport ${metrics.w}px, scrollWidth ${metrics.scrollW}px${metrics.text ? `, result "${metrics.text}"` : ''}`)
    }
    console.log(report.join('\n'))
    ws.close()
  } finally {
    chrome.kill()
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
