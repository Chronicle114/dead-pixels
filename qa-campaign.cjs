/* Full campaign, actual browser keyboard input only. No writes to gameplay state.
   QA_URL=http://localhost:4173 QA_SIZES=1920x1080,1366x768,1280x720 node qa-campaign.cjs */
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {startNew}=require('./qa-support.cjs');
const baseURL = process.env.QA_URL || 'http://localhost:5173';
const sizes = (process.env.QA_SIZES || '1366x768').split(',').map(s => s.split('x').map(Number));
const damaging = process.env.QA_DAMAGE === '1';
const directory = path.resolve('qa-artifacts/campaign', new URL(baseURL).port);
fs.mkdirSync(directory, { recursive:true });
let passed = 0;
const results = [];
const check = (condition, message) => { assert.ok(condition,message); passed++; console.log(`PASS ${message}`); };

async function run(browser, width, height) {
  const page = await browser.newPage({ viewport:{width,height} });
  const errors=[], failedAssets=[];
  page.on('pageerror', e => errors.push(String(e)));
  page.on('console', m => { if(m.type()==='error') errors.push(m.text()); });
  page.on('response', r => { if(r.status()>=400) failedAssets.push(r.url()); });
  const get = () => page.evaluate(() => window.deadPixels.getState());
  let current = 1, permittedFalls = 0, capturedAir = false, capturedCheckpoint = false;
  const wait = (predicate, timeout=9000) => page.waitForFunction(predicate, null, {polling:'raf',timeout});
  const shot = async label => page.screenshot({path:path.join(directory,`${width}x${height}-${damaging?'damage-':''}${label}.png`)});
  const safe = async label => {
    const s=await get();
    check(s.mode==='game' && s.level.number===current && s.phase==='playing',`${current} ${label}: current playable level`);
    check(s.respawns===permittedFalls,`${current} ${label}: no accidental pit fall`);
    check(s.body.width===6 && s.body.height===12,`${current} ${label}: unchanged physics body`);
    if (!damaging) check(s.health.hits===0 && s.health.hp===4,`${current} ${label}: damage-free solution`);
  };
  const walk = async x => {
    const start=await get();
    await page.keyboard.down('ArrowRight');
    try {
      await page.waitForFunction(({x,n,falls}) => {
        const s=window.deadPixels.getState();
        if(s.mode!=='game'||s.level.number!==n||s.respawns!==falls) throw new Error(`Unexpected transition or fall: ${JSON.stringify(s)}`);
        return s.x>=x;
      },{x,n:current,falls:permittedFalls},{timeout:9000,polling:'raf'});
    } catch(e) { throw new Error(`Walk ${start.x.toFixed(0)} -> ${x}: ${e.message}; last=${JSON.stringify(await get())}`); }
    finally { await page.keyboard.up('ArrowRight'); }
    await page.waitForTimeout(35);
  };
  const settle = () => wait(() => { const s=window.deadPixels.getState();return s.mode==='game'&&s.grounded&&s.vy===0; });
  const channel = async ch => {
    await page.waitForTimeout(160);
    await page.keyboard.press(`Digit${ch}`);
    await page.waitForTimeout(35);
    check((await get()).channel===ch,`${current} selects CH-${ch}`);
  };
  const jump = async (x, switchTo) => {
    await settle();
    const start=await get();
    await page.keyboard.down('ArrowRight'); await page.keyboard.down('Space');
    await page.waitForTimeout(80); await page.keyboard.up('Space');
    check((await get()).vy<0,`${current} real takeoff at ${Math.round(start.x)}`);
    if(switchTo) {
      await page.waitForTimeout(80);
      const airborne=await get();
      check(!airborne.grounded && airborne.vy<0,`${current} switches while rising`);
      await page.keyboard.press(`Digit${switchTo}`);
      check((await get()).channel===switchTo,`${current} airborne channel ${switchTo} accepted`);
      if (!capturedAir) { await shot(`level-${current}-airborne`); capturedAir=true; }
    }
    try {
      await page.waitForFunction(({x,n,falls})=>{
        const s=window.deadPixels.getState();
        if(s.mode!=='game'||s.level.number!==n||s.respawns!==falls) throw new Error('Unexpected fall during jump');
        return s.x>=x;
      },{x,n:current,falls:permittedFalls},{polling:'raf',timeout:3500});
    } finally { await page.keyboard.up('ArrowRight'); }
    await settle();
    const landed=await get();
    check(landed.x>=x && landed.respawns===permittedFalls,`${current} landed safely after jump to ${x}`);
    if(switchTo) check(landed.airSwitches>start.airSwitches,`${current} midair switch recorded by actual gameplay`);
  };
  const checkpoint = async (x,id) => {
    await walk(x); await settle();
    check((await get()).level.checkpoint.id===id,`${current} checkpoint ${id} reachable`);
    if (!capturedCheckpoint) { await shot(`level-${current}-checkpoint`); capturedCheckpoint=true; }
  };
  const recover = async (leftEdge, disableChannel) => {
    const before=await get();
    await channel(disableChannel);
    await page.keyboard.down('ArrowLeft');
    await wait(()=>window.deadPixels.getState().y>164);
    await page.keyboard.up('ArrowLeft');
    await wait(()=>{const s=window.deadPixels.getState();return s.respawns>0&&s.grounded;});
    const s=await get(); permittedFalls++;
    check(before.x>leftEdge && s.respawns===permittedFalls && Math.abs(s.x-before.level.checkpoint.x)<.1,`${current} real pit fall returns to latest checkpoint`);
    check(s.channel===before.level.checkpoint.channel && s.grounded,`${current} checkpoint channel/support restored consistently`);
    await safe('after recovery');
  };
  const relay = async (before,after,restore) => { await walk(before); await channel(3); await walk(after); if(restore) await channel(restore); };
  const left = async x => {
    await page.keyboard.down('ArrowLeft');
    await page.waitForFunction(x=>window.deadPixels.getState().x<=x,x,{timeout:5000,polling:'raf'});
    await page.keyboard.up('ArrowLeft'); await page.waitForTimeout(40);
  };
  const receive = async source => {
    const before=(await get()).health;
    if(before.hitsBySource[source]===0){
      await page.waitForFunction(source=>window.deadPixels.getState().hazards.some(h=>h.type===source&&['WARNING','CHARGING','DETECT','AIM'].includes(h.state)),source,{timeout:7000,polling:'raf'});
      await shot(`warning-${source}`);
    }
    await page.waitForFunction(h=>window.deadPixels.getState().health.hits>h,before.hits,{timeout:10000,polling:'raf'});
    const h=(await get()).health;
    check(h.lastSource===source && h.hp===before.hp-(source==='machinery'?2:1),`${current} actual ${source} damage amount`);
    await shot(`hit-${source}`);
    await page.waitForTimeout(200);
    check((await get()).health.hits===h.hits,`${current} invulnerability suppresses repeat contact`);
  };

  try {
    await page.goto(baseURL,{waitUntil:'networkidle'});
    await wait(()=>window.deadPixels?.getState().mode==='menu');
    await shot('menu');
    await startNew(page);

    for(current=1;current<=7;current++) {
      permittedFalls=0; capturedAir=false; capturedCheckpoint=false;
      await page.waitForFunction(n=>{const s=window.deadPixels.getState();return s.mode==='game'&&s.level.number===n&&s.phase==='playing'&&s.grounded;},current,{timeout:12000,polling:'raf'});
      await safe('spawn');
      const start=await get();
      await page.waitForFunction(id=>window.deadPixels.getAudioState().playing===id,`level-${current}`,{timeout:7000});
      check((await page.evaluate(()=>window.deadPixels.getAudioState())).musicVoices<=2,`${current} correct soundtrack with bounded crossfade voices`);
      check(start.physics.dynamic===1 && start.physics.static===start.platforms.length+1,`${current} old bodies cleaned up between levels`);
      await page.waitForTimeout(220);
      await shot(`level-${current}-start`);
      if(current===1) {
        await walk(200); await channel(2); await checkpoint(328,'bridge');
        await recover(304,1);
        await relay(373,414,1); await checkpoint(464,'receiver');
      } else if(current===2) {
        await walk(150); await jump(202); await checkpoint(328,'fork');
        await recover(288,3);
        await channel(2); await page.keyboard.down('ArrowLeft');
        await wait(()=>window.deadPixels.getState().x<=146); await page.keyboard.up('ArrowLeft');
        await walk(328); await settle();
        check((await get()).channel===2 && (await get()).y===158 && (await get()).respawns===permittedFalls,'2 alternative lower MEMORY route is also playable');
        if (damaging) {
          await channel(1); await walk(352); await receive('laser');
          await wait(()=>window.deadPixels.getState().health.hp===1); await shot('low-hp');
          const hits=(await get()).health.recentHits;
          check(hits.every((hit,i)=>i===0||hit.at-hits[i-1].at>=999),'actual contact hits respect one-second invulnerability');
          await wait(()=>window.deadPixels.getState().phase==='shutdown');
          check((await get()).health.deaths===1 && (await get()).health.hp===0,'one death at zero HP'); await shot('death');
          await page.waitForFunction(n=>{const s=window.deadPixels.getState();return s.respawns>n&&s.grounded&&s.phase==='playing';},permittedFalls,{timeout:5000});
          permittedFalls++;
          check((await get()).health.hp===4 && (await get()).health.deaths===1 && (await get()).x===328,'death restores full HP once at checkpoint');
          await shot('reboot');
          await walk(352); await receive('laser'); await channel(2); await left(328);
          check((await get()).health.hp===3,'revisiting consumed checkpoint does not heal');
        }
        await relay(390,430,2); await checkpoint(648,'antenna');
        if (damaging) check((await get()).health.hp===4 && (await get()).health.heals===1,'new checkpoint heals exactly one HP');
        await channel(1); await checkpoint(904,'reunion');
        await relay(910,960);
      } else if(current===3) {
        await walk(110); await jump(160); await walk(176); await jump(232,2);
        await walk(264); await jump(328); await checkpoint(352,'capacitor');
        await recover(304,3); await shot(`level-${current}-midair`);
        if (damaging) { await channel(1); await left(334); await receive('electric'); await channel(2); await walk(352); }
        await walk(462); await jump(512); await walk(528); await jump(584,1);
        await walk(616); await jump(680); await checkpoint(704,'return');
        await relay(798,848,2); await checkpoint(1040,'recovered');
      } else if(current===4) {
        await walk(140); await channel(2); await checkpoint(304,'tape-a'); await recover(272,3);
        await page.keyboard.press('r');
        await wait(()=>{const s=window.deadPixels.getState();return s.mode==='game'&&s.level.number===4&&s.phase==='playing'&&s.x===28&&s.level.checkpoint.id==='spawn';});
        permittedFalls=0;
        check((await get()).x===28 && (await get()).channel===1 && (await get()).level.reached.length===0 && (await get()).level.cleared.length===3,'4 R resets local progress, preserving campaign position');
        await walk(140); await channel(2); await checkpoint(304,'tape-a');
        await relay(318,368,1);
        if (damaging) { await walk(576); await receive('machinery'); await channel(3); }
        await checkpoint(592,'tape-b');
        await relay(606,656,2); await checkpoint(848,'tape-c'); await channel(1);
        await walk(894); await jump(944); await walk(960); await jump(1016,2);
        await walk(1048); await jump(1112); await checkpoint(1136,'spool');
        await checkpoint(1224,'last-tape'); await relay(1262,1312,1);
      } else if(current===5) {
        await walk(160); await channel(1); await checkpoint(352,'stable'); await recover(320,3);
        await relay(366,416,2); await checkpoint(608,'monitor');
        if (damaging) {
          await channel(1); await walk(632); await receive('turret'); await channel(2); await left(608);
          check((await get()).hazards.filter(h=>h.type==='turret').every(h=>h.projectiles.length===0),'channel deactivation clears pooled bolts');
        }
        await walk(686); await jump(736); await walk(752); await jump(808,3);
        await walk(840); await jump(904); await checkpoint(928,'ember');
        await walk(1080); await channel(1); await checkpoint(1296,'intact');
        if (damaging) {
          await channel(2); await walk(1350); await page.waitForTimeout(1600);
          check((await get()).hazards.find(h=>h.id==='last-sentry').fired===0,'solid relay wall blocks turret targeting');
        }
        await relay(1358,1408); await checkpoint(1424,'beyond');
      } else if(current===6) {
        await walk(110); await jump(160); await walk(176); await jump(232,2);
        await walk(264); await jump(328); await checkpoint(352,'core'); await recover(304,3);
        await checkpoint(672,'relay-a'); await relay(686,736,1); await checkpoint(944,'bus');
        await walk(990); await jump(1040); await walk(1056); await jump(1112,3);
        await walk(1144); await jump(1208); await checkpoint(1232,'relay-b');
        if (damaging) { await walk(1310); await channel(1); await receive('electric'); await channel(3); }
        await checkpoint(1328,'coolant');
        await walk(1408); await channel(2); await checkpoint(1616,'lift');
        await walk(1662); await jump(1712); await walk(1728); await jump(1784,1);
        await walk(1800); await jump(1864); await checkpoint(1888,'uplink');
      } else {
        await walk(144); await channel(2); await checkpoint(336,'incoming'); await recover(304,3);
        await relay(350,400,1); await checkpoint(624,'carrier');
        await walk(702); await jump(752); await walk(768); await jump(824,2);
        await walk(848); await jump(920); await checkpoint(944,'receiver');
        await checkpoint(1280,'heart'); await relay(1294,1344);
        await walk(1358); await jump(1408); await walk(1424); await jump(1480,1);
        await walk(1512); await jump(1576); await checkpoint(1600,'awake');
        await walk(1712); await channel(2); await checkpoint(1936,'last-relay');
        await relay(1950,2000,damaging?undefined:1);
        if (damaging) { await walk(2028); await receive('corruption'); await channel(1); }
        await checkpoint(2080,'transmitter');
      }
      await safe('route complete');
      const end=await get();
      const expectedCP=[2,3,3,5,5,7,7][current-1];
      check(end.level.reached.length===expectedCP,`${current} all ${expectedCP} checkpoints reached through gameplay`);
      if([3,4,5,6,7].includes(current)) check(end.airSwitches>0,`${current} required midair switching executed`);
      if (damaging && current>1) check(end.health.hits>0 && end.health.hp>0,`${current} route remains completable after taking damage`);
      check(end.cameraX>0,`${current} camera followed the route`);
      check(end.hazards.filter(h=>h.type==='turret').every(h=>h.projectiles.length<=3&&h.poolSize===3),`${current} projectile pools remain bounded`);
      await shot(`level-${current}-route`);
      await page.keyboard.down('ArrowRight');
      await wait(()=>window.deadPixels.getState().completed===true);
      await page.keyboard.up('ArrowRight');
      const cleared=await get();
      check(cleared.messages.includes('SIGNAL RESTORED'),`${current} exit reached legitimately`);
      await shot(`level-${current}-exit`);
      results.push({viewport:`${width}x${height}`,level:current,title:end.level.title,checkpoints:end.level.reached,airSwitches:end.airSwitches,respawns:end.respawns,health:end.health,fps:end.fps,elapsedSeconds:end.level.elapsedSeconds});
    }
    await wait(()=>window.deadPixels.getState().mode==='ending');
    await wait(()=>window.deadPixels.getAudioState().playing==='ending');
    check((await page.evaluate(()=>window.deadPixels.getAudioState())).error===null,'ending soundtrack decoded without errors');
    check((await get()).messages.includes('TRANSMISSION COMPLETE'),'final TRANSMISSION COMPLETE');
    check((await get()).level.cleared.length===7,'seven actual exits recorded');
    await shot('ending-transmission');
    await wait(()=>window.deadPixels.getState().phase==='waiting');
    check((await get()).messages.includes('THE SIGNAL WAS NEVER LOST.') && (await get()).messages.includes('IT WAS WAITING FOR YOU.'),'complete mysterious ending text');
    await shot('ending-waiting');
    if (width===1920) {
      await page.keyboard.press('Enter');
      check((await get()).phase==='end','ending can be skipped with real input');
    }
    await wait(()=>window.deadPixels.getState().phase==='end');
    check((await get()).messages.includes('END OF TRANSMISSION'),'final title card');
    check((await get()).outsideUnitVisible===true,'UNIT 07 appears outside the dark receiver in the shared room');
    await shot('ending-card');
    if (width===1280) {
      const box=await page.locator('canvas').boundingBox();
      await page.mouse.click(box.x+box.width/2,box.y+box.height*164/180);
    } else await page.keyboard.press('Enter');
    await wait(()=>window.deadPixels.getState().mode==='menu');
    check((await get()).mode==='menu','full campaign returns to main menu');
    await startNew(page);
    await wait(()=>{const s=window.deadPixels.getState();return s.mode==='game'&&s.phase==='playing';});
    check((await get()).level.number===1 && (await get()).level.cleared.length===0 && (await get()).x===28,'new campaign starts cleanly after ending');
    check(errors.length===0,`no browser errors: ${errors.join(';')}`);
    check(failedAssets.length===0,'no missing assets');
  } catch(e) {
    await shot(`failure-level-${current}`);
    console.error('LAST STATE',JSON.stringify(await get()));
    throw e;
  } finally { await page.close(); }
}

(async()=>{
  const browser=await chromium.launch();
  try {
    for(const [w,h] of sizes) await run(browser,w,h);
    fs.writeFileSync(path.join(directory,damaging?'damage-results.json':'results.json'),JSON.stringify({url:baseURL,passed,failed:0,fullGamePlaythrough:true,damageRun:damaging,levels:results},null,2));
    console.log(`FULL GAME PLAYTHROUGH VERIFIED: ${passed} passed / 0 failed`);
  } finally { await browser.close(); }
})().catch(e=>{console.error(e);process.exitCode=1;});
