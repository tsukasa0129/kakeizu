// Renders ad.html frame by frame and encodes it (with music.wav) to an MP4.
//   cd promo && npm install && python3 music.py && node render.mjs
// Env: FPS (default 30), OUT (default kakeizu-ad.mp4), FFMPEG (ffmpeg binary),
//      CHROMIUM (Chromium executable), FRAMES="0,90,200" to only dump stills.
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright-core';

const here = path.dirname(fileURLToPath(import.meta.url));
const FPS = Number(process.env.FPS ?? 30);
const OUT = path.resolve(here, process.env.OUT ?? 'kakeizu-ad.mp4');
const FFMPEG = process.env.FFMPEG ?? 'ffmpeg';
const CHROMIUM = process.env.CHROMIUM ?? (existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

const browser = await chromium.launch({ executablePath: CHROMIUM });
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
await page.goto(pathToFileURL(path.join(here, 'ad.html')).href + '?render');
// Make sure every glyph subset of the web font is loaded before capturing.
await page.evaluate(async () => {
  const texts = document.body.innerText + 'あなたのひいおじいちゃんの名前、言えますか？家系図クエスト✨AIが読み取り中…✅4人を見つけました！0123456789/人日連続！';
  for (const w of [500, 800, 900]) await document.fonts.load(`${w} 40px "M PLUS Rounded 1c"`, texts);
  await document.fonts.ready;
});
const duration = await page.evaluate(() => window.DURATION);
const total = Math.round(duration * FPS);

if (process.env.FRAMES) {
  const dir = path.join(here, 'stills');
  mkdirSync(dir, { recursive: true });
  for (const f of process.env.FRAMES.split(',').map(Number)) {
    await page.evaluate((t) => window.render(t), f / FPS);
    writeFileSync(path.join(dir, `f${String(f).padStart(4, '0')}.png`), await page.screenshot({ type: 'png' }));
  }
  await browser.close();
  process.exit(0);
}

const music = path.join(here, 'music.wav');
const args = ['-y', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-'];
if (existsSync(music)) args.push('-i', music, '-c:a', 'aac', '-b:a', '192k', '-shortest');
args.push('-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', OUT);
const ff = spawn(FFMPEG, args, { stdio: ['pipe', 'inherit', 'inherit'] });

for (let f = 0; f < total; f++) {
  await page.evaluate((t) => window.render(t), f / FPS);
  const buf = await page.screenshot({ type: 'jpeg', quality: 95 });
  if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
  if (f % FPS === 0) process.stdout.write(`\rframe ${f}/${total}`);
}
ff.stdin.end();
await new Promise((r) => ff.on('close', r));
await browser.close();
console.log(`\nwrote ${OUT}`);
