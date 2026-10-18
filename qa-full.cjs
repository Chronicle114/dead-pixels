/* Real-input, no-teleport regression + full playthrough. Works on dev AND prod.
   QA_URL=http://localhost:4173 QA_SIZES=1920x1080,1366x768,1280x720 node qa-full.cjs */
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const URL = process.env.QA_URL || 'http://localhost:5173';
const sizes = (process.env.QA_SIZES || '1366x768').split(',').map(v => v.split('x').map(Number));
const output = path.resolve('qa-artifacts', new globalThis.URL(URL).port || 'default');
fs.mkdirSync(output, { recursive: true });
let passed = 0;
const check = (condition, label) => { assert.ok(condition, label); passed++; console.log(`PASS ${label}`); };
const state = p => p.evaluate(() => window.deadPixels.getState());
const wait = (p, fn, timeout = 8000) => p.waitForFunction(fn, null, { timeout, polling: 'raf' });
const key = async (p, k, delay = 200) => { await p.keyboard.press(k); await p.waitForTimeout(delay); };

async function run(browser, width, height) {
  const page = await browser.newPage({ viewport: { width, height } });
  const errors = [], failedAssets = [], remote = [];
  page.on('pageerror', e => errors.push(String(e)));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('response', r => { if (r.status() >= 400) failedAssets.push(`${r.status()} ${r.url()}`); });
  page.on('request', r => {
    const requested = new globalThis.URL(r.url()), local = new globalThis.URL(URL);
    if (requested.protocol !== 'data:' && requested.origin !== local.origin &&
      !(['ws:', 'wss:'].includes(requested.protocol) && requested.host === local.host)) remote.push(r.url());
  });
  const shot = name => page.screenshot({ path: path.join(output, `${width}x${height}-${name}.png`) });
  const walk = async (direction, target) => {
    await page.keyboard.down(direction);
    try {
      await page.waitForFunction(({ target, right }) => {
        const s = window.deadPixels.getState();
        return s.mode === 'game' && (right ? s.x >= target : s.x <= target);
      }, { target, right: direction === 'ArrowRight' }, { polling: 'raf', timeout: 7000 });
    } finally { await page.keyboard.up(direction); }
    await page.waitForTimeout(40);
  };
  const layout = async label => {
    const r = await page.evaluate(() => {
      const c = document.querySelector('canvas'), tv = document.querySelector('.crt-tv');
      const a = c.getBoundingClientRect(), b = tv.getBoundingClientRect(), glass = document.querySelector('.screen-glass').getBoundingClientRect();
      return { w: c.width, h: c.height, ratio: a.width / a.height, left: b.left, top: b.top, right: b.right, bottom: b.bottom, sharp: getComputedStyle(c).imageRendering,
        fillsScreen: Math.abs(a.width - glass.width) < 1 && Math.abs(a.height - glass.height) < 1,
        overlays: [...document.querySelectorAll('.crt-glass,.crt-vignette,.crt-scanlines')].every(e => getComputedStyle(e).pointerEvents === 'none') };
    });
    check(r.w === 320 && r.h === 180 && Math.abs(r.ratio - 16/9) < .001, `${label}: logical/display ratio`);
    check(r.left >= 0 && r.top >= 0 && r.right <= width && r.bottom <= height, `${label}: whole presentation fits`);
    check(r.overlays && ['pixelated', 'crisp-edges'].includes(r.sharp), `${label}: sharp canvas and click-through glass`);
    check(r.fillsScreen, `${label}: canvas fills entire glass without internal letterboxing`);
  };
  const activeButton = async id => Number(await page.locator('.channel-active').getAttribute('data-channel')) === id;
  const start = async click => {
    if (click) {
      const box = await page.locator('canvas').boundingBox();
      await page.mouse.click(box.x + box.width / 2, box.y + box.height * 124/180);
    } else await page.keyboard.press('Enter');
    await wait(page, () => window.deadPixels.getState().mode === 'game');
    await wait(page, () => window.deadPixels.getState().phase === 'playing');
    await wait(page, () => window.deadPixels.getState().grounded === true);
  };

  await page.goto(URL, { waitUntil: 'networkidle' });
  await wait(page, () => window.deadPixels?.getState().mode === 'menu');
  await shot('01-menu'); await layout('menu');
  await start(false); await layout('game');
  check((await state(page)).channel === 1 && await activeButton(1), 'fresh run and physical selector in REALITY');
  await shot('02-reality');

  await walk('ArrowRight', 68); const right = await state(page);
  await walk('ArrowLeft', 43); const left = await state(page);
  check(right.x > 60 && left.x < 50, 'actual movement in both directions');
  await page.waitForTimeout(60); check((await state(page)).vx === 0, 'release stops horizontal velocity');
  const y = (await state(page)).y;
  await page.keyboard.down('Space'); await page.waitForTimeout(80); await page.keyboard.up('Space');
  check((await state(page)).vy < 0, 'actual jump starts with rising velocity');
  await page.waitForTimeout(280);
  const apex = await state(page);
  check(y - apex.y > 32 && y - apex.y < 44, 'original jump envelope ~42 pixels');
  check(apex.animation.key === 'player-anim-jump', 'rising animation');
  await shot('03-jump');
  await wait(page, () => window.deadPixels.getState().vy > 20);
  check((await state(page)).animation.key === 'player-anim-fall', 'falling animation');
  await shot('04-fall');
  await wait(page, () => window.deadPixels.getState().grounded);
  check(Math.abs((await state(page)).y - 158) < .1, 'lands on shared platform without falling through');
  check(JSON.stringify((await state(page)).body) === JSON.stringify({ width:6, height:12, offsetX:1, offsetY:0 }), 'original body dimensions and offset');

  for (const ch of [2,3,1]) {
    await key(page, `Digit${ch}`);
    check((await state(page)).channel === ch && await activeButton(ch), `keyboard ${ch} syncs physical control`);
    if (ch !== 1) await shot(ch === 2 ? '05-memory' : '06-void');
  }
  for (const [k,ch] of [['q',3],['e',1],['e',2],['q',1]]) {
    await key(page,k); check((await state(page)).channel === ch, `${k} cycles to ${ch}`);
  }
  const before = await state(page);
  await key(page,'Digit1'); check((await state(page)).x === before.x, 'same-channel input does not move player');
  await page.keyboard.press('Digit2'); await page.keyboard.press('Digit3');
  check((await state(page)).channel === 2, 'cooldown blocks immediate second switch');
  await page.waitForTimeout(180); await key(page,'Digit1');
  const count = (await state(page)).objects;
  for (let i=0;i<9;i++) await key(page, `Digit${i%3+1}`, 160);
  check((await state(page)).objects === count, 'switches reuse environment/platform objects');
  await key(page,'Digit1');

  // A real pit fall, followed by a fresh run via ESC (no coordinate mutation).
  await walk('ArrowRight', 201);
  await page.keyboard.down('ArrowRight');
  await wait(page, () => window.deadPixels.getState().y > 163);
  await page.keyboard.up('ArrowRight');
  await wait(page, () => { const s=window.deadPixels.getState();return s.grounded && s.y < 160; });
  check((await state(page)).x < 235, 'pit fall respawns onto valid shared floor');
  await key(page, 'Escape'); check((await state(page)).mode === 'menu', 'ESC returns to menu');
  await start(true); check((await state(page)).x === 28, 'canvas click starts a genuinely fresh run');

  // Complete route from menu using ONLY legitimate player input.
  await walk('ArrowRight',200);
  await page.keyboard.press('Digit2'); await page.waitForTimeout(45); await shot('07-transition'); await page.waitForTimeout(180);
  check((await state(page)).platforms[2].enabled, 'MEMORY bridge collision active');
  await walk('ArrowRight',342);
  check((await state(page)).x >= 340 && (await state(page)).cameraX > 0, 'crossed MEMORY bridge; camera follows');
  await shot('08-mid-level');
  await walk('ArrowRight',373);
  await page.keyboard.down('ArrowRight'); await page.waitForTimeout(400); await page.keyboard.up('ArrowRight');
  check((await state(page)).x <= 381, 'REALITY/MEMORY wall blocks movement');
  await key(page,'Digit3');
  check(!(await state(page)).platforms[5].enabled, 'VOID wall collision inactive');
  await walk('ArrowRight',390);
  await page.locator('[data-channel="1"]').click();
  check((await state(page)).channel === 3 && await activeButton(3), 'geometry rejection preserves game and physical selector state');
  await wait(page, () => window.deadPixels.getState().noSignal);
  check((await state(page)).noSignal, 'NO SIGNAL appears after rejected physical switch');
  await shot('09-rejected');
  await walk('ArrowRight',414); await page.waitForTimeout(180); await key(page,'Digit1');
  check((await state(page)).platforms[6].enabled, 'end floor restored before leaving shared floor');
  await page.keyboard.down('ArrowRight');
  await wait(page, () => window.deadPixels.getState().completed, 8000);
  await page.keyboard.up('ArrowRight');
  check((await state(page)).phase === 'signal' && (await state(page)).messages.includes('SIGNAL RESTORED'), 'legitimate exit overlap displays SIGNAL RESTORED');
  await shot('10-exit-signal');
  const exitX=(await state(page)).x;
  await page.keyboard.down('ArrowLeft'); await page.keyboard.down('Space'); await page.waitForTimeout(200);
  await page.keyboard.up('ArrowLeft'); await page.keyboard.up('Space');
  check((await state(page)).x === exitX && (await state(page)).vy === 0, 'movement and jumping disabled during completion');
  await wait(page, () => window.deadPixels.getState().messages?.includes('LEVEL 01 COMPLETE'));
  check((await state(page)).messages.includes('LEVEL 01 COMPLETE'), 'level completion message really rendered');
  await shot('11-complete');
  await wait(page, () => { const s=window.deadPixels.getState();return s.mode === 'game' && s.level.number === 2 && s.phase === 'playing'; });
  check((await state(page)).level.number === 2, 'completion automatically transitions to the next level');
  await key(page,'Escape'); check((await state(page)).mode === 'menu', 'ESC navigates back to menu after transition');
  await start(false);
  check((await state(page)).x === 28 && (await state(page)).channel === 1 && !(await state(page)).completed && await activeButton(1), 'new run resets gameplay and external channel state');
  await walk('ArrowRight',68); await key(page,'r');
  await wait(page, () => window.deadPixels.getState().phase === 'playing');
  check((await state(page)).x === 28 && (await state(page)).level.checkpoint.id === 'spawn', 'R restarts current level and resets checkpoint progress');
  await page.waitForTimeout(1400);
  check((await state(page)).fps >= 50, `desktop frame rate ${(await state(page)).fps.toFixed(1)} fps`);
  check(errors.length === 0, `no browser errors: ${errors.join(';')}`);
  check(failedAssets.length === 0 && remote.length === 0, `all assets loaded locally, no failed requests (${[...failedAssets,...remote].join(';')})`);
  await page.close();
}

(async () => {
  const browser = await chromium.launch();
  try {
    for (const [width,height] of sizes) await run(browser,width,height);
    fs.writeFileSync(path.join(output,'results.json'), JSON.stringify({ url:URL, sizes, passed, failed:0, scope:'regression and level 1 progression' },null,2));
    console.log(`RESULT ${passed} passed / 0 failed; regression and level 1 progression verified`);
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode=1; });
