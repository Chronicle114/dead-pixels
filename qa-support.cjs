const wait=(page,predicate,timeout=10000)=>page.waitForFunction(predicate,null,{polling:'raf',timeout});
async function clickLogical(page,x,y){
  // Let Phaser commit newly added interactive objects after a menu-panel rebuild.
  await page.waitForTimeout(70);
  const b=await page.locator('canvas').boundingBox();await page.mouse.click(b.x+b.width*x/320,b.y+b.height*y/180);
}
async function startNew(page,click=false){
  if(click)await clickLogical(page,240,76);else await page.keyboard.press('Enter');
  await wait(page,()=>{const s=window.deadPixels.getState();return s.mode!=='menu'||s.screen==='confirm';});
  let s=await page.evaluate(()=>window.deadPixels.getState());
  if(s.mode==='menu'&&s.screen==='confirm'){
    await page.keyboard.press('ArrowLeft');await page.keyboard.press('Enter');
    await wait(page,()=>window.deadPixels.getState().mode!=='menu');
  }
  s=await page.evaluate(()=>window.deadPixels.getState());
  if(s.mode==='intro'){await page.waitForTimeout(100);await page.keyboard.press('Space');}
  await wait(page,()=>{const s=window.deadPixels.getState();return s.mode==='game'&&s.phase==='playing'&&s.grounded;});
}
module.exports={wait,clickLogical,startNew};
