const { chromium } = require('playwright');

const BASE_URL = 'http://localhost:5173';
const RESULTS_DIR = '/var/folders/8v/zm5wp0k17wj87f72s4l9sxgw0000gn/T/opencode/dp-e2e-screenshots';

const fs = require('fs');
if (!fs.existsSync(RESULTS_DIR)) {
  fs.mkdirSync(RESULTS_DIR, { recursive: true });
}

const RESOLUTIONS = [
  { name: '1920x1080', width: 1920, height: 1080 },
  { name: '1366x768', width: 1366, height: 768 },
  { name: '1280x720', width: 1280, height: 720 },
];

const VIEWS = [
  { name: 'menu', setup: async (page) => {}, wait: 2000 },
  { name: 'reality', setup: async (page) => {
    await page.keyboard.press('Enter');
    await page.waitForTimeout(800);
    await page.click('#game-root canvas');
    await page.waitForTimeout(200);
  }, wait: 500 },
  { name: 'memory', setup: async (page) => {
    await page.keyboard.press('Enter');
    await page.waitForTimeout(800);
    await page.click('#game-root canvas');
    await page.waitForTimeout(200);
    await page.keyboard.press('Digit2');
    await page.waitForTimeout(400);
  }, wait: 500 },
  { name: 'void', setup: async (page) => {
    await page.keyboard.press('Enter');
    await page.waitForTimeout(800);
    await page.click('#game-root canvas');
    await page.waitForTimeout(200);
    await page.keyboard.press('Digit3');
    await page.waitForTimeout(400);
  }, wait: 500 },
];

async function holdRightUntil(page, predicate, maxMs = 10000) {
  await page.keyboard.down('ArrowRight');
  const start = Date.now();
  while (Date.now() - start < maxMs) {
    const p = await page.evaluate(() => {
      const scene = window.__game.scene.getScene('Game');
      return { x: scene.player.x, blockedDown: scene.player.body.blocked.down };
    });
    if (predicate(p)) {
      await page.keyboard.up('ArrowRight');
      await page.waitForTimeout(150);
      return p;
    }
    await page.waitForTimeout(60);
  }
  await page.keyboard.up('ArrowRight');
  throw new Error(`holdRightUntil timeout`);
}

async function captureAtResolution(resolution) {
  console.log(`\n=== Capturing at ${resolution.name} ===`);
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: resolution.width, height: resolution.height },
  });
  const page = await context.newPage();

  const errors = [];
  page.on('pageerror', (err) => errors.push(String(err)));
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });

  for (const view of VIEWS) {
    await page.goto(BASE_URL, { waitUntil: 'load' });
    await page.waitForTimeout(1000);
    await view.setup(page);
    await page.waitForTimeout(view.wait);
    await page.screenshot({
      path: `${RESULTS_DIR}/${resolution.name}-${view.name}.png`,
      fullPage: true,
    });
    console.log(`  Captured ${view.name}`);
  }

  // Gameplay sequence screenshots
  await page.goto(BASE_URL, { waitUntil: 'load' });
  await page.waitForTimeout(1000);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(800);
  await page.click('#game-root canvas');
  await page.waitForTimeout(200);
  await page.screenshot({
    path: `${RESULTS_DIR}/${resolution.name}-gameplay-start.png`,
    fullPage: true,
  });

  // Walk to gap edge
  await holdRightUntil(page, (p) => p.x >= 200);
  await page.waitForTimeout(200);
  await page.screenshot({
    path: `${RESULTS_DIR}/${resolution.name}-gameplay-gap-edge.png`,
    fullPage: true,
  });

  // Switch to MEMORY, cross bridge
  await page.keyboard.press('Digit2');
  await page.waitForTimeout(400);
  await page.screenshot({
    path: `${RESULTS_DIR}/${resolution.name}-gameplay-memory-bridge.png`,
    fullPage: true,
  });

  await holdRightUntil(page, (p) => p.x >= 340);
  await page.waitForTimeout(200);
  await page.screenshot({
    path: `${RESULTS_DIR}/${resolution.name}-gameplay-crossed-bridge.png`,
    fullPage: true,
  });

  // Switch to VOID, pass wall
  await page.keyboard.press('Digit3');
  await page.waitForTimeout(400);
  await page.screenshot({
    path: `${RESULTS_DIR}/${resolution.name}-gameplay-wall-deactivated.png`,
    fullPage: true,
  });

  await holdRightUntil(page, (p) => p.x >= 415);
  await page.waitForTimeout(200);
  await page.screenshot({
    path: `${RESULTS_DIR}/${resolution.name}-gameplay-past-wall.png`,
    fullPage: true,
  });

  // Switch to REALITY, reach exit
  await page.keyboard.press('Digit1');
  await page.waitForTimeout(400);
  await holdRightUntil(page, (p) => p.x >= 560);
  await page.waitForTimeout(800);
  await page.screenshot({
    path: `${RESULTS_DIR}/${resolution.name}-gameplay-at-exit.png`,
    fullPage: true,
  });

  // Wait for completion
  await page.waitForTimeout(1200);
  await page.screenshot({
    path: `${RESULTS_DIR}/${resolution.name}-completion-sequence.png`,
    fullPage: true,
  });

  // Return to menu
  await page.keyboard.press('Enter');
  await page.waitForTimeout(800);
  await page.screenshot({
    path: `${RESULTS_DIR}/${resolution.name}-back-to-menu.png`,
    fullPage: true,
  });

  console.log(`  Page errors: ${errors.length}`);
  errors.forEach((e) => console.log(`    - ${e}`));

  await browser.close();
}

(async () => {
  for (const res of RESOLUTIONS) {
    await captureAtResolution(res);
  }
  console.log('\n=== All screenshots captured ===');
  process.exit(0);
})().catch((err) => {
  console.error('FAILED:', err);
  process.exit(1);
});
