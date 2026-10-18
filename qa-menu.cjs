const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {wait,clickLogical,startNew}=require('./qa-support.cjs');
const URL=process.env.QA_URL||'http://localhost:5173';const out=path.resolve('qa-artifacts/menu');fs.mkdirSync(out,{recursive:true});
let passed=0;function check(value,label){assert.ok(value,label);passed++;console.log('PASS',label);}
(async()=>{const browser=await chromium.launch();try{
for(const [width,height] of (process.env.QA_SIZES||'1366x768').split(',').map(s=>s.split('x').map(Number))){
  const page=await browser.newPage({viewport:{width,height}});const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  const state=()=>page.evaluate(()=>window.deadPixels.getState());
  const shot=name=>page.screenshot({path:path.join(out,`${width}x${height}-${name}.png`)});
  await page.goto(URL);await wait(page,()=>window.deadPixels?.getState().mode==='menu');
  check(!(await state()).canContinue,'Continue disabled without save');
  check((await state()).messages.includes('THE LAST SIGNAL')&&!(await state()).messages.some(m=>m.includes('LUDUM')),'standalone title and no competition branding');await shot('main');
  await clickLogical(page,240,116);await wait(page,()=>window.deadPixels.getState().screen==='settings');
  await page.keyboard.press('ArrowLeft');await page.waitForTimeout(180);
  const audio=await page.evaluate(()=>window.deadPixels.getAudioState());
  check(Math.abs(audio.preferences.master-.6)<.001&&Math.abs(audio.gains.master-.6)<.01,'master setting changes actual gain');
  await page.keyboard.press('ArrowDown');await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('ArrowDown');await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('ArrowDown');await page.keyboard.press('ArrowDown');await page.keyboard.press('Enter');await page.waitForTimeout(200);
  check((await page.evaluate(()=>window.deadPixels.getAudioState())).gains.master<.01,'mute silences actual master bus');await shot('settings');
  const mixed=await page.evaluate(()=>window.deadPixels.getAudioState());
  check(Math.abs(mixed.gains.music-mixed.preferences.music)<.01&&Math.abs(mixed.gains.sfx-mixed.preferences.sfx)<.01,'music and SFX controls change separate actual buses');
  await page.keyboard.press('Enter');await page.keyboard.press('ArrowDown');await page.keyboard.press('Enter');
  await page.waitForTimeout(80);
  check(await page.evaluate(()=>getComputedStyle(document.querySelector('.crt-scanlines')).display==='none'),'CRT setting affects actual visual overlay');
  await page.keyboard.press('Enter');await page.keyboard.press('Escape');await wait(page,()=>window.deadPixels.getState().screen==='main');await clickLogical(page,240,138);
  await wait(page,()=>window.deadPixels.getState().screen==='credits');check((await state()).messages.some(m=>m.includes('KENNEY')),'credits contain real external attribution');await shot('credits');await page.keyboard.press('Escape');await wait(page,()=>window.deadPixels.getState().screen==='main');
  await startNew(page);await page.keyboard.press('Escape');await wait(page,()=>window.deadPixels.getState().mode==='menu');
  check((await state()).canContinue,'playing creates saved campaign');
  await page.reload();await wait(page,()=>window.deadPixels?.getState().mode==='menu');
  check((await state()).canContinue&&Math.abs((await state()).save.settings.master-.6)<.001,'campaign and volume persist across reload');
  await clickLogical(page,240,94);await wait(page,()=>{const s=window.deadPixels.getState();return s.mode==='game'&&s.phase==='playing';});
  check((await state()).level.number===1&&(await state()).x===28&&(await state()).channel===1,'Continue uses a valid level spawn/channel');
  await page.keyboard.press('Escape');await wait(page,()=>window.deadPixels.getState().mode==='menu');await page.keyboard.press('Enter');
  await wait(page,()=>window.deadPixels.getState().screen==='confirm');check((await state()).selection===1,'overwriting progress requires explicit confirmation');await shot('confirm');
  await page.keyboard.press('Enter');await wait(page,()=>window.deadPixels.getState().screen==='main');check((await state()).canContinue,'cancel preserves save');
  check(errors.length===0,'menu has no browser errors');await page.close();
}
const restricted=await browser.newPage();await restricted.addInitScript(()=>{Object.defineProperty(window,'localStorage',{get(){throw new DOMException('Blocked','SecurityError');}});});
await restricted.goto(URL);await wait(restricted,()=>window.deadPixels?.getState().mode==='menu');check(!(await restricted.evaluate(()=>window.deadPixels.getState())).save.persistent,'blocked storage falls back safely');
await startNew(restricted);await restricted.keyboard.press('Escape');await wait(restricted,()=>window.deadPixels.getState().mode==='menu');check((await restricted.evaluate(()=>window.deadPixels.getState())).canContinue,'in-memory continue works when storage blocked');await restricted.close();
const quota=await browser.newPage();await quota.addInitScript(()=>{Storage.prototype.setItem=function(){throw new DOMException('Full','QuotaExceededError');};});
await quota.goto(URL);await wait(quota,()=>window.deadPixels?.getState().mode==='menu');await startNew(quota);await quota.keyboard.press('Escape');await wait(quota,()=>window.deadPixels.getState().mode==='menu');
check((await quota.evaluate(()=>window.deadPixels.getState())).canContinue&&!(await quota.evaluate(()=>window.deadPixels.getState())).save.persistent,'storage write failure safely retains in-memory progress');await quota.close();
fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({url:URL,passed,failed:0},null,2));
console.log(`Menu/save/settings: ${passed} passed / 0 failed`);
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
