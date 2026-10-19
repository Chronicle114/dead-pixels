import { BaseHazard } from './BaseHazard';
import { cycleState } from './HazardGeometry';

export class CorruptionHazard extends BaseHazard {
  protected tick(): void {
    const phase=cycleState(this.age,600,1100,900,1300);
    const next=this.rearming&&phase==='ACTIVE'?'WARNING':phase;
    this.setState(next,next==='WARNING'?'corrupt-charge':next==='ACTIVE'?'corrupt-break':undefined);
    if(next==='ACTIVE') this.contact();
  }
  protected draw(): void {
    const {x,y,width:w,height:h}=this.bounds,a=this.art.clear();
    a.lineStyle(1,this.enabled?0x92616a:0x426069,0.8).strokeRect(x,y+h-3,w,2);
    if(!this.enabled || this.state==='IDLE'||this.state==='COOLDOWN')return;
    const active=this.state==='ACTIVE';
    a.lineStyle(1,0xe3ab76,active?1:0.55).strokeRect(x,y,w-1,h-1);
    for(let row=0;row<h-2;row+=3)for(let col=0;col<w-2;col+=4){
      if((row+col+Math.floor(this.age/120))%3===0)a.fillStyle(active?0xe3ab76:0x92616a,active?0.9:0.3).fillRect(x+col+1,y+row+1,2,2);
    }
  }
}
