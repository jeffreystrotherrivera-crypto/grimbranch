/*
 * GrimBranch demo-video capture — same pattern as the Pip's Choice demo:
 * real Chrome under Xvfb, ffmpeg x11grab, scripted REAL mouse clicks via
 * CDP. Plays the story to the "Ninth Bell" ending, shows the map, then
 * breaks the story in the Workshop and lets the validator catch it.
 * Output: demo/raw.mkv (convert afterwards). Target: under 3 minutes.
 */
import { spawn, execSync } from 'node:child_process';
import fs from 'node:fs';
import { connectPage, sleep } from './cdp.mjs';

const DIR = '/home/hatch/workspace/kiroween/demo';
const CHROME = '/home/hatch/.cache/puppeteer/chrome/linux-157.0.8103.50/chrome-linux64/chrome';
const URL = 'http://127.0.0.1:8917/';
const OUT = DIR + '/raw.mkv';
const log = [];
const t0 = Date.now();
const stamp = () => ((Date.now() - t0) / 1000).toFixed(1) + 's';

try { execSync('rm -rf /tmp/grim-video-profile2'); } catch {}
const chrome = spawn(CHROME, [
  '--no-sandbox', '--disable-dev-shm-usage', '--remote-debugging-port=9349',
  '--remote-allow-origins=*', '--user-data-dir=/tmp/grim-video-profile2',
  '--window-size=1280,720', '--window-position=0,0',
  '--enable-unsafe-swiftshader', '--use-angle=swiftshader',
  '--hide-scrollbars', '--mute-audio', '--no-first-run',
  '--app=' + URL, // app mode: no tab strip, no address bar, no infobars
], { env: { ...process.env, DISPLAY: ':99' }, stdio: 'ignore' });

let ffmpeg = null;
try {
  const { send, evaluate } = await connectPage(9349, /127\.0\.0\.1:8917/);
  await send('Page.enable'); await send('Runtime.enable');

  let ready = false;
  for (let i = 0; i < 40 && !ready; i++) {
    await sleep(700);
    try { ready = await evaluate(`document.querySelectorAll('#choices .choice-btn').length >= 3`); } catch { ready = false; }
  }
  if (!ready) throw new Error('app never became ready');
  await evaluate(`document.body.style.zoom = '0.82'`);
  await sleep(600);
  const shot0 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(DIR + '/record-start.png', Buffer.from(shot0.data, 'base64'));
  log.push({ t: stamp(), event: 'loaded' });

  ffmpeg = spawn('ffmpeg', ['-y', '-f', 'x11grab', '-framerate', '30', '-video_size', '1280x720',
    '-i', ':99.0+0,0', '-codec:v', 'libx264', '-preset', 'veryfast', '-pix_fmt', 'yuv420p', OUT],
    { stdio: ['pipe', 'ignore', 'ignore'] });
  const recStart = Date.now();
  const rec = () => ((Date.now() - recStart) / 1000).toFixed(1);
  await sleep(1200);
  console.log('RECORDING');

  const glide = async (x, y) => {
    const sx = 640, sy = 300, steps = 12;
    for (let i = 1; i <= steps; i++) {
      await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: Math.round(sx + (x - sx) * i / steps), y: Math.round(sy + (y - sy) * i / steps) });
      await sleep(22);
    }
  };
  const clickXY = async (x, y) => {
    await glide(x, y);
    await send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
    await sleep(90);
    await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 });
  };
  const centerOf = (expr) => evaluate(`(() => { const el = ${expr}; if (!el) return null;
    el.scrollIntoView({ block: 'center', behavior: 'instant' });
    const r = el.getBoundingClientRect(); return { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) }; })()`);
  const choiceCenter = (substr) => centerOf(`[...document.querySelectorAll('#choices .choice-btn')].find(b => b.innerText.includes(${JSON.stringify(substr)}) && !b.disabled)`);
  const clickChoice = async (substr, holdAfter = 2600) => {
    const c = await choiceCenter(substr);
    if (!c) throw new Error('choice not clickable: ' + substr);
    await clickXY(c.x, c.y);
    log.push({ t: stamp(), rec: rec(), clicked: substr });
    console.log('CLICK', rec() + 's', substr);
    await sleep(holdAfter);
    // complete the typewriter so the text is readable on camera
    await evaluate(`document.querySelector('#passageBody').click()`);
    await sleep(400);
  };
  const clickEl = async (expr, holdAfter = 2000) => {
    const c = await centerOf(expr);
    if (!c) throw new Error('element not found: ' + expr);
    await clickXY(c.x, c.y);
    await sleep(holdAfter);
  };

  await sleep(5000); // opening hold on The Gate
  await evaluate(`document.querySelector('#passageBody').click()`); await sleep(1500);

  // Listen: read-along highlighting (voice if present, silent otherwise)
  await clickEl(`document.querySelector('#listenBtn')`, 6500);
  await clickEl(`document.querySelector('#stopBtn')`, 1200);
  log.push({ t: stamp(), rec: rec(), event: 'narration shown' });

  await clickChoice('enter the house', 3000);            // The Hall (candle)
  await clickChoice('Climb the stairs', 3200);           // The Stair — attic locked
  await sleep(1800);                                     // hold on the lock note
  await clickChoice('smells of paper', 3400);            // The Library (diary)
  await clickChoice('return to the landing', 1400);
  await clickChoice('back down to the hall', 1200);
  await clickChoice('Return to the gate', 1200);
  await clickChoice('Walk the grounds', 1600);
  await clickChoice('gardener', 2600);                   // The Shed (brass key)
  await clickChoice('Return to the grounds', 1100);
  await clickChoice('back to the gate', 1100);
  await clickChoice('enter the house', 1300);
  await clickChoice('Climb the stairs', 1500);
  await clickChoice('Unlock the narrow door', 3600);     // The Attic — now unlocked
  await clickChoice('Ring the bell for him', 6500);      // Ending: The Ninth Bell
  log.push({ t: stamp(), rec: rec(), event: 'ending reached' });

  await clickEl(`document.querySelector('.tab[data-view="map"]')`, 6500);
  await evaluate(`document.querySelector('#mapWrap').scrollTo({ left: 260, behavior: 'smooth' })`);
  await sleep(3500);
  log.push({ t: stamp(), rec: rec(), event: 'map shown' });

  await clickEl(`document.querySelector('.tab[data-view="workshop"]')`, 4200);
  await evaluate(`(() => {
    const ed = document.querySelector('#storyEditor');
    ed.value = ed.value.replace('[[Push open the gate and enter the house->The Hall]]', '[[Push open the gate and enter the house->The Haul]]');
    ed.dispatchEvent(new Event('input', { bubbles: true }));
    document.querySelector('#validateReport').scrollIntoView({ block: 'center' });
  })()`);
  await sleep(5200); // the validator's report names the broken link
  log.push({ t: stamp(), rec: rec(), event: 'workshop error shown' });
  await clickEl(`document.querySelector('#restoreBtn')`, 3200);
  await clickEl(`document.querySelector('#playDraftBtn')`, 4500); // back to The Gate
  log.push({ t: stamp(), rec: rec(), event: 'restored and replayed' });

  const shot1 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(DIR + '/record-end.png', Buffer.from(shot1.data, 'base64'));
  console.log('TOTAL REC', rec() + 's');
} finally {
  if (ffmpeg) { ffmpeg.stdin.write('q'); await sleep(1500); try { ffmpeg.kill('SIGKILL'); } catch {} }
  chrome.kill('SIGKILL');
}
fs.writeFileSync(DIR + '/record-log.json', JSON.stringify(log, null, 1));
console.log('DONE', JSON.stringify(log.slice(-3)));
