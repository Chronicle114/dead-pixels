import { BaseHazard } from './BaseHazard';

export class FallingMachinery extends BaseHazard {
  private stageAge=0;
  private velocity=0;
  protected override onDisabled():void { this.bounds.y=this.definition.y;this.stageAge=0;this.velocity=0; }
  protected tick(delta:number):void {
    this.stageAge+=delta;
    const center=this.definition.x+this.definition.width/2;
    if(this.state==='IDLE' && Math.abs(this.ctx.body.center.x-center)<54){this.stageAge=0;this.setState('WARNING','metal-creak');}
    else if(this.state==='WARNING'&&this.stageAge>=1000){this.stageAge=0;this.velocity=20;this.setState('FALLING','metal-fall');}
    else if(this.state==='FALLING'){
      this.velocity+=400*delta/1000;
      this.bounds.y=Math.min((this.definition.groundY??164)-this.bounds.height,this.bounds.y+this.velocity*delta/1000);
      this.contact();
      if(this.bounds.y+this.bounds.height>=(this.definition.groundY??164)){
        this.stageAge=0;this.setState('IMPACT','metal-impact');this.ctx.feedback.burst(center,this.bounds.y+this.bounds.height,0xd3a378,8);
      }
    } else if(this.state==='IMPACT'&&this.stageAge>=2200){this.setState('COOLDOWN');}
    else if(this.state==='COOLDOWN'&&Math.abs(this.ctx.body.center.x-center)>40){this.onDisabled();this.setState('IDLE');}
  }
  protected draw():void {
    const {width:w,height:h}=this.bounds;
    const x=this.bounds.x+(this.state==='WARNING'?Math.floor(this.stageAge/70)%3-1:0),y=Math.round(this.bounds.y),a=this.art.clear();
    a.lineStyle(1,0x426069).lineBetween(this.definition.x+w/2,42,this.definition.x+w/2,this.definition.y);
    a.fillStyle(0x0a111d).fillRect(x,y,w,h);
    a.fillStyle(this.enabled?0x426069:0x243341).fillRect(x+1,y+1,w-2,h-2);
    a.fillStyle(0x0a111d).fillRect(x+3,y+3,w-6,h-8);
    a.lineStyle(1,0x8ca8ad).lineBetween(x+2,y+1,x+w-3,y+1);
    a.fillStyle(this.state==='WARNING'?0xe3ab76:0x6b8b91).fillRect(x+4,y+4,w-8,2);
    for(let i=3;i<w-2;i+=4)a.fillStyle(0x142431).fillRect(x+i,y+h-4,2,1);
    if(this.state==='WARNING'){
      const ground=this.definition.groundY??164;
      a.fillStyle(0xe3ab76,0.5).fillRect(x,ground-1,3,1).fillRect(x+w-3,ground-1,3,1);
      a.fillStyle(0xe3ab76).fillRect(x+w/2,y-7,1,3).fillRect(x+w/2,y-2,1,1);
    }
  }
}
