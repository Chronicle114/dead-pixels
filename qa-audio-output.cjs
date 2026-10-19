const {chromium,webkit}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {wait,clickLogical}=require('./qa-support.cjs');
const url=process.env.QA_URL||'http://localhost:5173',dir=path.resolve('qa-artifacts/audio-output');fs.mkdirSync(dir,{recursive:true});
function wav(samples,file,rate){const b=Buffer.alloc(44+samples.length*2);b.write('RIFF');b.writeUInt32LE(b.length-8,4);b.write('WAVEfmt ',8);b.writeUInt32LE(16,16);b.writeUInt16LE(1,20);b.writeUInt16LE(1,22);b.writeUInt32LE(rate,24);b.writeUInt32LE(rate*2,28);b.writeUInt16LE(2,32);b.writeUInt16LE(16,34);b.write('data',36);b.writeUInt32LE(samples.length*2,40);samples.forEach((s,i)=>b.writeInt16LE(Math.round(Math.max(-1,Math.min(1,s))*32767),44+i*2));fs.writeFileSync(file,b);}
(async()=>{const results=[];for(const[name,engine]of[['chromium',chromium],['webkit',webkit]]){
  const browser=await engine.launch();const page=await browser.newPage({viewport:{width:1366,height:768}});const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  try{
    await page.addInitScript(()=>{
      window.__audioCapture={nodes:[],record:false,chunks:[]};
      const connect=AudioNode.prototype.connect;
      AudioNode.prototype.connect=function(destination,...args){
        const result=connect.call(this,destination,...args);
        if(destination instanceof AudioDestinationNode){
          // A silent side branch captures real post-master PCM; the actual output
          // connection remains intact. No gameplay/audio-manager state is edited.
          const processor=this.context.createScriptProcessor(2048,2,2),silent=this.context.createGain();silent.gain.value=0;
          processor.onaudioprocess=event=>{if(window.__audioCapture.record&&window.__audioCapture.chunks.length<120)window.__audioCapture.chunks.push(Array.from(event.inputBuffer.getChannelData(0)));};
          connect.call(this,processor);connect.call(processor,silent);connect.call(silent,destination);
          window.__audioCapture.nodes.push({processor,silent,rate:this.context.sampleRate});
        }
        return result;
      };
    });
    await page.goto(url);await wait(page,()=>window.deadPixels?.getState().mode==='menu');
    await page.evaluate(()=>{window.__audioCapture.record=true;window.__audioCapture.chunks=[];});
    await clickLogical(page,240,76);await wait(page,()=>window.deadPixels.getState().mode==='intro');
    await wait(page,()=>window.deadPixels.getAudioState().playing==='intro');await page.waitForTimeout(1200);
    async function collect(label){const recording=await page.evaluate(()=>({samples:window.__audioCapture.chunks.flat(),rate:window.__audioCapture.nodes[0]?.rate,nodes:window.__audioCapture.nodes.length,audio:window.deadPixels.getAudioState()}));
      assert.ok(recording.samples.length>4096,'actual output PCM must be captured');const rms=Math.sqrt(recording.samples.reduce((a,v)=>a+v*v,0)/recording.samples.length),peak=Math.max(...recording.samples.map(Math.abs));
      wav(recording.samples,path.join(dir,`${name}-${label}.wav`),recording.rate);return{rms,peak,nodes:recording.nodes,audio:recording.audio};}
    const first=await collect('first-new-game');assert.equal(first.nodes,1,'only one audio output context');assert.ok(first.rms>.01,`first gesture has measurable output: ${first.rms}`);
    await page.keyboard.press('Space');await wait(page,()=>window.deadPixels.getState().phase==='playing');await wait(page,()=>window.deadPixels.getAudioState().playing==='level-1');
    await page.evaluate(()=>{window.__audioCapture.chunks=[];});await page.waitForTimeout(1200);const music=await collect('gameplay');assert.ok(music.rms>.01,'gameplay music reaches output');
    await page.keyboard.press('m');await page.waitForTimeout(350);await page.evaluate(()=>{window.__audioCapture.chunks=[];});await page.waitForTimeout(500);const muted=await collect('muted');assert.ok(muted.rms<.0001,'mute silences actual captured PCM');
    await page.keyboard.press('m');await page.keyboard.press('Escape');await wait(page,()=>window.deadPixels.getState().mode==='menu');await clickLogical(page,240,128);await wait(page,()=>window.deadPixels.getState().screen==='settings');
    await clickLogical(page,158,63);await clickLogical(page,158,101); // mute music/ambience via their real sliders
    await page.keyboard.press('Escape');await wait(page,()=>window.deadPixels.getState().screen==='main');await clickLogical(page,240,102);await wait(page,()=>window.deadPixels.getState().phase==='playing');await page.waitForTimeout(900);
    await page.evaluate(()=>{window.__audioCapture.chunks=[];});await page.keyboard.down('ArrowRight');await page.waitForTimeout(450);await page.keyboard.up('ArrowRight');await page.keyboard.down('Space');await page.waitForTimeout(80);await page.keyboard.up('Space');await page.waitForTimeout(850);
    const effects=await collect('effects-only');assert.ok(effects.peak>.01&&effects.rms>.001,'real step/jump/land output is non-silent');assert.equal(errors.length,0);
    results.push({browser:name,firstGestureRMS:first.rms,gameplayRMS:music.rms,effectsRMS:effects.rms,mutedRMS:muted.rms,contexts:first.nodes,errors});console.log(name,results.at(-1));
  }finally{await browser.close();}
}fs.writeFileSync(path.join(dir,'results.json'),JSON.stringify({url,results,hardwareListeningVerified:false},null,2));})().catch(e=>{console.error(e);process.exitCode=1;});
