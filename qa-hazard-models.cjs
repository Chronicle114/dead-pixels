const ts=require('typescript'),fs=require('node:fs'),assert=require('node:assert/strict');
const exported={};new Function('exports',ts.transpileModule(fs.readFileSync('src/hazards/HazardGeometry.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText)(exported);
const {cycleState,segmentHitsBox,intersects}=exported;let passed=0;
function test(value,label){assert.ok(value,label);passed++;}
const b={x:10,y:10,width:8,height:8};
test(intersects(b,{x:12,y:12,width:2,height:2}),'interior contact');
test(!intersects(b,{x:18,y:10,width:2,height:2}),'touching edge does not hurt');
test(segmentHitsBox(0,14,30,14,b),'wall stops horizontal bolt');
test(segmentHitsBox(14,0,14,30,b),'vertical swept contact');
test(segmentHitsBox(30,30,0,0,b),'reverse diagonal contact');
test(!segmentHitsBox(0,9,30,9,b),'near miss');
test(segmentHitsBox(0,9,30,9,b,1.5),'projectile radius contact');
test(!segmentHitsBox(0,0,8,8,b),'segment ends before wall');
test(!segmentHitsBox(20,20,30,30,b),'segment moves away');
for(const [time,state] of [[0,'IDLE'],[349,'IDLE'],[350,'WARNING'],[1149,'WARNING'],[1150,'ACTIVE'],[2349,'ACTIVE'],[2350,'COOLDOWN'],[3849,'COOLDOWN'],[3850,'IDLE']])test(cycleState(time,350,800,1200,1500)===state,`laser ${time} -> ${state}`);
console.log(`Hazard geometry/timing: ${passed} passed / 0 failed`);
