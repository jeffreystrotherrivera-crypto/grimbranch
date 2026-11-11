/*
 * GrimBranch screenshot set for the Devpost gallery.
 * Headless Chrome, real page, scripted playthrough. Output: screenshots/.
 */
import { spawn, execSync } from 'node:child_process';
import fs from 'node:fs';
import { connectPage, sleep } from './cdp.mjs';

const CHROME = '/home/hatch/.cache/puppeteer/chrome/linux-157.0.8103.50/chrome-linux64/chrome';
const URL = 'http://127.0.0.1:8917/';
const OUT = '/home/hatch/workspace/kiroween/screenshots';

try { execSync('rm -rf /tmp/grim-profile-shots'); } catch {}
const chrome = spawn(CHROME, [
  '--headless=new', '--no-sandbox', '--disable-dev-shm-usage',
  '--remote-debugging-port=9343', '--remote-allow-origins=*',
  '--user-data-dir=/tmp/grim-profile-shots', '--window-size=1280,860',
  '--hide-scrollbars', '--mute-audio', '--no-first-run',
  '--force-device-scale-factor=1', URL,
], { stdio: 'ignore' });

try {
  const { send, evaluate } = await connectPage(9343, /127\.0\.0\.1:8917/);
  await send('Page.enable'); await send('Runtime.enable');
  let ready = false;
  for (let i = 0; i < 30 && !ready; i++) {
    await sleep(700);
    try { ready = await evaluate(`document.querySelectorAll('#choices .choice-btn').length >= 3`); } catch { ready = false; }
  }
  if (!ready) throw new Error('app never ready');

  const shot = async (name) => {
    const r = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(OUT + '/' + name, Buffer.from(r.data, 'base64'));
    console.log('shot', name);
  };
  const clickChoice = (substr) => evaluate(`(() => {
    const b = [...document.querySelectorAll('#choices .choice-btn')].find(x => x.innerText.includes(${JSON.stringify(substr)}));
    if (!b || b.disabled) return false; b.click(); return true; })()`);
  const clickTab = (view) => evaluate(`document.querySelector('.tab[data-view="${view}"]').click()`);
  const settle = async (ms = 500) => { await evaluate(`document.querySelector('#passageBody').click()`); await sleep(ms); };

  await settle(700);
  await shot('01-the-gate.png');

  await clickChoice('enter the house'); await settle();
  await clickChoice('Climb the stairs'); await settle();
  await shot('02-the-stair-locked.png');

  await clickChoice('smells of paper'); await settle();
  await shot('03-the-library.png');

  await clickChoice('return to the landing'); await settle(250);
  await clickChoice('back down to the hall'); await settle(250);
  await clickChoice('Return to the gate'); await settle(250);
  await clickChoice('Walk the grounds'); await settle(250);
  await clickChoice('gardener'); await settle(250);
  await clickChoice('Return to the grounds'); await settle(250);
  await clickChoice('back to the gate'); await settle(250);
  await clickChoice('enter the house'); await settle(250);
  await clickChoice('Climb the stairs'); await settle(250);
  await clickChoice('Unlock the narrow door'); await settle();
  await shot('04-the-attic.png');

  await clickChoice('Ring the bell for him'); await settle(700);
  await shot('05-ending-the-ninth-bell.png');

  await clickTab('map'); await sleep(900);
  await shot('06-story-map.png');

  await clickTab('workshop'); await sleep(700);
  await shot('07-workshop-clean.png');

  await evaluate(`(() => {
    const ed = document.querySelector('#storyEditor');
    ed.value = ed.value.replace('[[Push open the gate and enter the house->The Hall]]', '[[Push open the gate and enter the house->The Haul]]');
    ed.dispatchEvent(new Event('input', { bubbles: true }));
  })()`);
  await sleep(1000);
  await shot('08-workshop-error-caught.png');
  console.log('ALL SHOTS DONE');
} finally {
  chrome.kill('SIGKILL');
}
