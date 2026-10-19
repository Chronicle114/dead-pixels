import Phaser from 'phaser';
import { BaseHazard } from './BaseHazard';
import { segmentHitsBox } from './HazardGeometry';
import type { HazardContext, HazardDefinition } from './HazardTypes';

interface Bolt { art: Phaser.GameObjects.Rectangle; x:number;y:number;vx:number;vy:number;age:number;active:boolean }
export class TurretHazard extends BaseHazard {
  private readonly bolts:Bolt[];
  private stageAge=0;
  private aimX=-1;
  private aimY=0;
  private fired=0;
  private wallHits=0;
  private burstLeft=0;
  private nextShot=0;
  constructor(data:HazardDefinition,ctx:HazardContext){
    super(data,ctx);
    this.bolts=Array.from({length:3},()=>({art:ctx.scene.add.rectangle(0,0,3,3,0xffd898).setStrokeStyle(1,0xfff0c8).setDepth(19).setVisible(false),x:0,y:0,vx:0,vy:0,age:0,active:false}));
  }
  protected override onDisabled():void {for(const b of this.bolts){b.active=false;b.art.setVisible(false);}this.stageAge=0;this.burstLeft=0;}
  private blocked(x0:number,y0:number,x1:number,y1:number):boolean{
    return this.ctx.solids.some(s=>s.active&&segmentHitsBox(x0,y0,x1,y1,s.definition,1.5));
  }
  protected tick(delta:number):void {
    this.stageAge+=delta;
    const cx=this.definition.x+this.definition.width/2,cy=this.definition.y+this.definition.height/2;
    const targetY=this.ctx.body.y+3;
    const dx=this.ctx.body.center.x-cx,dy=targetY-cy,distance=Math.hypot(dx,dy);
    const detected=distance<(this.definition.range??104)&&distance>24&&!this.blocked(cx,cy,this.ctx.body.center.x,targetY);
    if(this.state==='IDLE'&&detected){this.stageAge=0;this.setState('DETECT','turret-lock');}
    else if(this.state==='DETECT'&&this.stageAge>400){this.aimX=dx/Math.max(distance,1);this.aimY=dy/Math.max(distance,1);this.stageAge=0;this.setState('AIM','turret-aim');}
    else if(this.state==='AIM'&&this.stageAge>450){
      this.burstLeft=this.definition.burst??3;this.nextShot=0;this.stageAge=0;this.setState('FIRE');
    } else if(this.state==='FIRE'){
      this.nextShot-=delta;
      if(this.burstLeft>0&&this.nextShot<=0){
      const bolt=this.bolts.find(b=>!b.active);
      if(bolt&&distance>24){
        const speed=this.definition.projectileSpeed??80;
        bolt.x=cx+this.aimX*11;bolt.y=cy+this.aimY*11;bolt.vx=this.aimX*speed;bolt.vy=this.aimY*speed;bolt.age=0;bolt.active=true;
        this.fired++;this.ctx.cue('turret-fire',cx);
      }
      this.burstLeft--;this.nextShot=240;
      }
      if(this.burstLeft===0){this.stageAge=0;this.setState('COOLDOWN');}
    }
    else if(this.state==='COOLDOWN'&&this.stageAge>1700){this.stageAge=0;this.setState('IDLE');}
    for(const bolt of this.bolts){
      if(!bolt.active)continue;
      const nx=bolt.x+bolt.vx*delta/1000,ny=bolt.y+bolt.vy*delta/1000;
      bolt.age+=delta;
      if(this.blocked(bolt.x,bolt.y,nx,ny)){
        this.wallHits++;bolt.active=false;this.ctx.feedback.burst(nx,ny,0xe3ab76,3);this.ctx.cue('bolt-impact',nx);
      } else if(segmentHitsBox(bolt.x,bolt.y,nx,ny,this.ctx.body,1.5)){
        if(this.ctx.hit('turret'))this.impacts++;bolt.active=false;
      } else if(bolt.age>3500||ny>180||ny<0)bolt.active=false;
      bolt.x=nx;bolt.y=ny;bolt.art.setPosition(Math.round(nx),Math.round(ny)).setVisible(bolt.active);
    }
  }
  protected draw():void {
    const {x,y,width:w,height:h}=this.definition,a=this.art.clear();
    a.fillStyle(0x0a111d).fillRect(x,y,w,h);
    a.fillStyle(this.enabled?0x426069:0x243341).fillRect(x+1,y+1,w-2,h-2);
    a.lineStyle(1,0x8ca8ad).lineBetween(x+2,y+1,x+w-3,y+1);
    const warning=this.state==='DETECT'||this.state==='AIM'||this.state==='FIRE';
    a.fillStyle(warning?0xe3ab76:0x6b8b91).fillRect(x+3,y+3,2,2);
    a.lineStyle(3,0x142431).lineBetween(x+w/2,y+h/2,x+w/2+Math.round(this.aimX*10),y+h/2+Math.round(this.aimY*10));
    a.lineStyle(1,0x8ca8ad).lineBetween(x+w/2,y+h/2-1,x+w/2+Math.round(this.aimX*10),y+h/2+Math.round(this.aimY*10)-1);
    if(this.state==='AIM')a.fillStyle(0xe3ab76).fillRect(x+w/2-1,y-5,2,2);
    if(this.state==='AIM'||this.state==='FIRE'){
      a.lineStyle(1,0xe3ab76,0.3);
      for(let i=14;i<100;i+=8)a.lineBetween(x+w/2+this.aimX*i,y+h/2+this.aimY*i,x+w/2+this.aimX*(i+3),y+h/2+this.aimY*(i+3));
    }
  }
  override snapshot(){return{...super.snapshot(),fired:this.fired,wallHits:this.wallHits,projectiles:this.bolts.filter(b=>b.active).map(b=>({x:b.x,y:b.y,vx:b.vx,vy:b.vy})),poolSize:this.bolts.length};}
}
