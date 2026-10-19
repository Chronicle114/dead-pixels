const {chromium,webkit}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {wait}=require('./qa-support.cjs');const base=process.env.QA_URL||'http://localhost:5173';const engine=process.env.QA_BROWSER||'chromium';const out=path.resolve('qa-artifacts/quality/intro',engine);fs.mkdirSync(out,{recursive:true});
(async()=>{const browser=await (engine==='webkit'?webkit:chromium).launch();let passed=0;try{
for(const [width,height] of (process.env.QA_SIZES||'1366x768').split(',').map(s=>s.split('x').map(Number))){
  const page=await browser.newPage({viewport:{width,height}});await page.goto(base);await wait(page,()=>window.deadPixels?.getState().mode==='menu');await page.keyboard.press('Enter');await wait(page,()=>window.deadPixels.getState().mode==='intro');
  await wait(page,()=>window.deadPixels.getAudioState().playing==='intro');passed++;
  for(const phase of ['room','signal','awakening','entering']){
    await page.waitForFunction(phase=>window.deadPixels.getState().phase===phase,phase,{timeout:21000,polling:'raf'});
    if(phase==='room')await page.waitForTimeout(3500);
    if(phase==='signal'){await wait(page,()=>window.deadPixels.getState().messages.includes('MEMORY FRAGMENTED'),10000);await page.waitForTimeout(650);}
    if(phase==='awakening')await page.waitForTimeout(6500);
    if(phase==='entering'){await wait(page,()=>window.deadPixels.getState().messages.includes('CH-01 REALITY'),9000);await page.waitForTimeout(650);}
    await page.screenshot({path:path.join(out,`${width}x${height}-${phase}.png`)});passed++;
  }
  await wait(page,()=>{const s=window.deadPixels.getState();return s.mode==='game'&&s.phase==='playing';},14000);
  assert.equal((await page.evaluate(()=>window.deadPixels.getState())).level.number,1);passed++;
  await page.keyboard.press('Escape');await wait(page,()=>window.deadPixels.getState().mode==='menu');assert.ok((await page.evaluate(()=>window.deadPixels.getState())).save.progress.introViewed);passed++;await page.close();
}
  for(const key of ['Space','Enter','Escape']){
    const p=await browser.newPage();await p.goto(base);await wait(p,()=>window.deadPixels?.getState().mode==='menu');await p.keyboard.press('Enter');await wait(p,()=>window.deadPixels.getState().mode==='intro');await p.waitForTimeout(120);await p.keyboard.press(key);
    await wait(p,()=>{const s=window.deadPixels.getState();return s.mode==='game'&&s.phase==='playing';});assert.equal((await p.evaluate(()=>window.deadPixels.getState())).x,28);passed++;await p.close();
  }
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({url:base,browser:engine,passed,failed:0},null,2));
  console.log(`Intro: ${passed} passed / 0 failed; full 34-second animated timeline and all three skip keys verified`);
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
