// Tests the actual pure TS model with a deterministic scene clock, not a mirror.
const fs = require('node:fs'), ts = require('typescript'), assert = require('node:assert/strict');
const exported = {};
new Function('exports', ts.transpileModule(fs.readFileSync('src/systems/HealthSystem.ts','utf8'), {
  compilerOptions:{ module:ts.ModuleKind.CommonJS, target:ts.ScriptTarget.ES2020 }
}).outputText)(exported);
const { HealthSystem } = exported;
let count=0; const check=(condition,label)=>{assert.ok(condition,label);count++;};
const events=[]; const h=new HealthSystem(e=>events.push(e));
check(h.snapshot(0).hp===4,'four initial HP');
check(!h.damage('laser',0),'arrival lock ignores hits'); h.setEnabled(true);
check(h.damage('laser',10)&&h.snapshot(10).hp===3,'laser one HP');
check(!h.damage('electric',1009),'full 999ms invulnerability');
check(h.damage('turret',1010)&&h.snapshot(1010).hp===2,'turret one HP at 1000ms boundary');
check(h.healCheckpoint('one')&&h.snapshot(1010).hp===3,'new checkpoint heals one');
check(!h.healCheckpoint('one'),'checkpoint cannot farm');
check(h.damage('machinery',2010)&&h.snapshot(2010).hp===1,'machinery two HP');
check(h.damage('corruption',3010)&&h.snapshot(3010).dead,'zero HP shuts down');
check(h.snapshot(3010).deaths===1&&events.filter(e=>e.lethal).length===1,'one death event');
check(!h.damage('laser',6010)&&!h.healCheckpoint('two'),'no duplicate deaths or resurrection by healing');
h.reboot(7000);
check(h.snapshot(7000).hp===4&&!h.snapshot(7000).dead,'full reboot');
check(!h.damage('electric',7999),'reboot protection');
check(h.damage('electric',8000)&&h.snapshot(8000).hp===3,'electric one HP');
check(!h.healCheckpoint('one'),'healing history survives death');
check(h.healCheckpoint('two')&&h.snapshot(8000).hp===4,'another checkpoint can heal');
check(!h.healCheckpoint('full'),'full-health visit consumes restoration');
h.damage('laser',9000); check(!h.healCheckpoint('full'),'no delayed full-health farming');
console.log(`Health model: ${count} passed / 0 failed`);
