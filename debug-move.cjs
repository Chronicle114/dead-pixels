const { chromium } = require('playwright');

const BASE_URL = 'http://localhost:5173';

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
  });
  const page = await context.newPage();

  page.on('pageerror', (err) => console.log('PAGE ERROR:', err));
  page.on('console', (msg) => {
    if (msg.type() === 'error') console.log('CONSOLE ERROR:', msg.text());
  });

  await page.goto(BASE_URL, { waitUntil: 'load' });
  await page.waitForTimeout(2000);

  // Start game
  await page.keyboard.press('Enter');
  await page.waitForTimeout(800);
  await page.click('#game-root canvas');
  await page.waitForTimeout(200);

  // Check initial state
  let state = await page.evaluate(() => {
    const game = window.__game;
    const scene = game.scene.getScene('Game');
    const player = scene.player;
    const body = player.body;
    return {
      x: player.x,
      y: player.y,
      vx: body.velocity.x,
      touchingDown: body.blocked.down || body.touching.down,
      touchDown: body.touching.down,
      blockDown: body.blocked.down,
    };
  });
  console.log('Initial state:', JSON.stringify(state));

  // Hold right for 1 second
  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(1000);
  await page.keyboard.up('ArrowRight');

  state = await page.evaluate(() => {
    const game = window.__game;
    const scene = game.scene.getScene('Game');
    const player = scene.player;
    const body = player.body;
    return {
      x: player.x,
      y: player.y,
      vx: body.velocity.x,
      touchingDown: body.blocked.down || body.touching.down,
    };
  });
  console.log('After holding right 1s:', JSON.stringify(state));

  // Try pressing right key repeatedly
  for (let i = 0; i < 10; i++) {
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(50);
  }

  state = await page.evaluate(() => {
    const game = window.__game;
    const scene = game.scene.getScene('Game');
    const player = scene.player;
    return { x: player.x, y: player.y };
  });
  console.log('After 10 right presses:', JSON.stringify(state));

  await page.screenshot({ path: '/tmp/debug-move.png', fullPage: true });
  console.log('Screenshot saved to /tmp/debug-move.png');

  await browser.close();
})().catch((err) => {
  console.error('FAILED:', err);
  process.exit(1);
});
