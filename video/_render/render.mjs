// Renderizza video/index.html in MP4 fotogramma per fotogramma.
// Uso: node video/_render/render.mjs [--stills t1,t2,...] [--fps 30] [--out file.mp4]
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
import { spawn } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

const args = process.argv.slice(2);
const opt = k => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
const here = path.dirname(new URL(import.meta.url).pathname);
const page_url = pathToFileURL(path.join(here, '..', 'index.html')).href + '?render';
const fps = Number(opt('--fps') || 30);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
await page.goto(page_url, { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(300);
const stage = page.locator('#stage');

const stills = opt('--stills');
if (stills) {
  for (const t of stills.split(',').map(Number)) {
    await page.evaluate(t => window.seek(t), t);
    await stage.screenshot({ path: path.join(opt('--dir') || '.', `still-${t}.png`) });
  }
  await browser.close();
  process.exit(0);
}

const out = opt('--out') || path.join(here, '..', 'francesco-gizzi.mp4');
const duration = await page.evaluate(() => window.DURATION);
const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-i', '-',
  '-c:v', 'libx264', '-preset', 'slow', '-crf', '20', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out],
  { stdio: ['pipe', 'inherit', 'inherit'] });
const total = Math.round(duration * fps);
for (let f = 0; f <= total; f++) {
  await page.evaluate(t => window.seek(t), f / fps);
  const buf = await stage.screenshot({ type: 'jpeg', quality: 95 });
  if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
  if (f % 150 === 0) console.log(`frame ${f}/${total}`);
}
ff.stdin.end();
await new Promise(r => ff.on('close', r));
await browser.close();
console.log('scritto', out);
