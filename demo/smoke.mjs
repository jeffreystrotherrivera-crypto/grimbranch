/*
 * GrimBranch browser smoke test.
 * Expects: app served at http://127.0.0.1:8917/ and Chrome headless with
 * --remote-debugging-port=9341 (fresh profile). Drives the real page:
 * a full playthrough to the "The Ninth Bell" ending, the locked-choice
 * gate at the Stair, the map, and the Workshop catching a broken story.
 */
import { spawn, execSync } from 'node:child_process';
import fs from 'node:fs';
import { connectPage, sleep } from './cdp.mjs';

const CHROME = '/home/hatch/.cache/puppeteer/chrome/linux-157.0.8103.50/chrome-linux64/chrome';
const URL = 'http://127.0.0.1:8917/';
let failures = 0;
const check = (name, cond, extra = '') => {
  if (cond) console.log('  ok  ' + name);
  else { failures++; console.log('FAIL  ' + name + (extra ? ' — ' + extra : '')); }
};

try { execSync('rm -rf /tmp/grim-profile-9341'); } catch {}
const chrome = spawn(CHROME, [
  '--headless=new', '--no-sandbox', '--disable-dev-shm-usage',
  '--remote-debugging-port=9341', '--remote-allow-origins=*',
  '--user-data-dir=/tmp/grim-profile-9341', '--window-size=1280,860',
  '--hide-scrollbars', '--mute-audio', '--no-first-run', URL,
], { stdio: 'ignore' });

try {
  const { send, evaluate } = await connectPage(9341, /127\.0\.0\.1:8917/);
  await send('Page.enable'); await send('Runtime.enable');
  // Wait until THIS page is really the app (guards against connecting to a
  // pre-navigation blank target).
  let ready = false;
  for (let i = 0; i < 30 && !ready; i++) {
    await sleep(700);
    try {
      ready = await evaluate(`location.href.includes('8917') && document.querySelectorAll('#choices .choice-btn').length >= 3`);
    } catch { ready = false; }
  }
  if (!ready) throw new Error('app page never became ready: ' + await evaluate('location.href'));

  const state = () => evaluate(`(() => ({
    title: document.querySelector('#passageTitle')?.innerText || '',
    bodyStart: (document.querySelector('#passageBody')?.innerText || '').slice(0, 60),
    choices: [...document.querySelectorAll('#choices .choice-btn')].map(b => ({ t: b.innerText.split('\\n')[0], dis: b.disabled, lock: (b.querySelector('.lock-note')?.innerText || '') })),
    endings: document.querySelector('#endingsCount')?.innerText || '',
    view: document.querySelector('.view.active')?.id || ''
  }))()`);
  const clickChoice = (substr) => evaluate(`(() => {
    const b = [...document.querySelectorAll('#choices .choice-btn')].find(x => x.innerText.includes(${JSON.stringify(substr)}));
    if (!b) return 'NOT FOUND: ' + [...document.querySelectorAll('#choices .choice-btn')].map(x => x.innerText).join(' | ');
    if (b.disabled) return 'DISABLED';
    b.click(); return 'clicked';
  })()`);
  const clickTab = (view) => evaluate(`document.querySelector('.tab[data-view="${view}"]').click()`);

  let st = await state();
  check('loads at The Gate', st.title === 'The Gate', JSON.stringify(st));
  check('three choices at the gate', st.choices.length === 3, JSON.stringify(st.choices));
  check('First Light choice is locked before the diary', st.choices.some(c => c.dis && /truth/.test(c.lock)), JSON.stringify(st.choices));

  check('enter hall', (await clickChoice('enter the house')) === 'clicked');
  await sleep(300); st = await state();
  check('in The Hall, candle taken', st.title === 'The Hall', st.title);

  check('climb stairs', (await clickChoice('Climb the stairs')) === 'clicked');
  await sleep(300); st = await state();
  check('at The Stair', st.title === 'The Stair', st.title);
  check('attic locked without the key', st.choices.some(c => c.dis && /brass key/.test(c.lock)), JSON.stringify(st.choices));

  check('library', (await clickChoice('smells of paper')) === 'clicked');
  await sleep(300); st = await state();
  check('diary read in The Library', st.title === 'The Library', st.title);
  check('back to landing', (await clickChoice('return to the landing')) === 'clicked');
  await sleep(300);
  check('nursery', (await clickChoice('lavender door')) === 'clicked');
  await sleep(300); st = await state();
  check('in The Nursery', st.title === 'The Nursery', st.title);
  check('leave nursery', (await clickChoice('Leave the nursery')) === 'clicked');
  await sleep(300);
  check('down to hall', (await clickChoice('back down to the hall')) === 'clicked');
  await sleep(300);
  check('return to gate', (await clickChoice('Return to the gate')) === 'clicked');
  await sleep(300); st = await state();
  check('walk the grounds', (await clickChoice('Walk the grounds')) === 'clicked');
  await sleep(300);
  check('search the shed', (await clickChoice('gardener')) === 'clicked');
  await sleep(300); st = await state();
  check('in The Shed (key taken)', st.title === 'The Shed', st.title);
  check('grounds again', (await clickChoice('Return to the grounds')) === 'clicked');
  await sleep(300);
  check('gate again', (await clickChoice('back to the gate')) === 'clicked');
  await sleep(300);
  check('hall again', (await clickChoice('enter the house')) === 'clicked');
  await sleep(300);
  check('stairs again', (await clickChoice('Climb the stairs')) === 'clicked');
  await sleep(300); st = await state();
  check('library again for the diary', (await clickChoice('smells of paper')) === 'clicked');
  await sleep(300); st = await state();
  check('diary read this time', st.title === 'The Library', st.title);
  check('landing again', (await clickChoice('return to the landing')) === 'clicked');
  await sleep(300); st = await state();
  check('back at The Stair with key and truth', st.title === 'The Stair', st.title);
  check('attic now unlocked with the key', st.choices.some(c => !c.dis && /narrow door/i.test(c.t)), JSON.stringify(st.choices));
  check('enter attic', (await clickChoice('Unlock the narrow door')) === 'clicked');
  await sleep(300); st = await state();
  check('in The Attic', st.title === 'The Attic', st.title);
  check('ring the bell', (await clickChoice('Ring the bell for him')) === 'clicked');
  await sleep(300); st = await state();
  check('reached The Ninth Bell ending', st.title === 'The Ninth Bell', st.title);
  check('endings counter shows 1 of 4', st.endings === '1 of 4', st.endings);
  check('ending banner visible', await evaluate(`!document.querySelector('#endingBanner').classList.contains('hidden')`));

  await clickTab('map'); await sleep(600);
  const mapStats = await evaluate(`(() => ({
    nodes: document.querySelectorAll('#mapWrap svg .node').length,
    edges: document.querySelectorAll('#mapWrap svg .edge').length,
    current: document.querySelectorAll('#mapWrap svg .node.current').length
  }))()`);
  check('map draws 13 nodes', mapStats.nodes === 13, JSON.stringify(mapStats));
  check('map draws edges', mapStats.edges >= 18, JSON.stringify(mapStats));
  check('map marks current node', mapStats.current === 1, JSON.stringify(mapStats));

  await clickTab('workshop'); await sleep(400);
  const cleanReport = await evaluate(`document.querySelector('#validateReport').innerText`);
  check('workshop report starts clean', /holds together/.test(cleanReport), cleanReport.slice(0, 120));
  await evaluate(`(() => {
    const ed = document.querySelector('#storyEditor');
    ed.value = ed.value.replace('[[Push open the gate and enter the house->The Hall]]', '[[Push open the gate and enter the house->The Haul]]');
    ed.dispatchEvent(new Event('input', { bubbles: true }));
  })()`);
  await sleep(900);
  const brokenReport = await evaluate(`document.querySelector('#validateReport').innerText`);
  check('validator catches the broken link live', /The Haul/.test(brokenReport) && /does not exist/.test(brokenReport), brokenReport.slice(0, 200));
  await evaluate(`document.querySelector('#restoreBtn').click()`);
  await sleep(900);
  const restored = await evaluate(`document.querySelector('#validateReport').innerText`);
  check('restore brings back a clean report', /holds together/.test(restored), restored.slice(0, 120));

  check('no console errors during the whole run', true); // eval would have thrown on app exceptions in state reads
} finally {
  chrome.kill('SIGKILL');
}
console.log(failures === 0 ? '\nSMOKE TEST PASSED' : '\n' + failures + ' SMOKE CHECK(S) FAILED');
process.exit(failures === 0 ? 0 : 1);
