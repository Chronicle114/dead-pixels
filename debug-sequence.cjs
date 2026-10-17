const { chromium } = require('playwright');

const BASE_URL = 'http://localhost:5173';

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
  });
  const page = await context.newPage();

  page.on('pageerror', (err) => console.log('PAGE ERROR:', err));

  async function logState(label) {
    const s = await page.evaluate(() => {
      const game = window.__game;
      if (!game) return null;
      const scene = game.scene.getScene('Game');
      if (!scene) return null;
      const p = scene.player;
      return {
        x: p ? p.x : null,
        y: p ? p.y : null,
        vx: p ? p.body.velocity.x : null,
        vy: p ? p.body.velocity.y : null,
        touchingDown: p ? (p.body.blocked.down || p.body.touching.down) : null,
        channel: scene.channels ? scene.channels.active : null,
      };
    });
    console.log(`  [${label}]`, JSON.stringify(s));
  }

  await page.goto(BASE_URL, { waitUntil: 'load' });
  await page.waitForTimeout(2000);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(800);
  await page.click('#game-root canvas');
  await page.waitForTimeout(200);

  await logState('start');

  // Move right
  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(1000);
  await page.keyboard.up('ArrowRight');
  await logState('after-right-1s');

  // Move left
  await page.keyboard.down('ArrowLeft');
  await page.waitForTimeout(500);
  await page.keyboard.up('ArrowLeft');
  await logState('after-left-0.5s');

  // Jump
  await page.keyboard.press('ArrowUp');
  await page.waitForTimeout(400);
  await logState('after-jump-press-400ms');

  // Wait for landing
  await page.waitForTimeout(600);
  await logState('after-jump-landed');

  // Move right again
  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(1000);
  await page.keyboard.up('ArrowRight');
  await logState('after-right-again-1s');

  await page.screenshot({ path: '/tmp/debug-sequence.png', fullPage: true });
  console.log('Screenshot saved');

  await browser.close();
})().catch((err) => {
  console.error('FAILED:', err);
  process.exit(1);
});
