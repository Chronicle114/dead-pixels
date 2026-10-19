import { BaseHazard } from './BaseHazard';
import { cycleState } from './HazardGeometry';

export class ElectricHazard extends BaseHazard {
  protected tick(): void {
    const phase=cycleState(this.age,500,900,1000,1200);
    const raw=this.rearming&&phase==='ACTIVE'?'WARNING':phase;
    const next=raw==='IDLE'?'OFF':raw==='WARNING'?'CHARGING':raw==='COOLDOWN'?'DISCHARGING':raw;
    this.setState(next, next==='CHARGING'?'electric-charge':next==='ACTIVE'?'electric-arc':next==='DISCHARGING'?'electric-off':undefined);
    if(next==='ACTIVE') this.contact();
  }
  protected draw(): void {
    const {x,y,width:w,height:h}=this.bounds,a=this.art.clear();
    const color=this.state==='ACTIVE'?0xf5db9b:this.state==='CHARGING'?0xd39676:0x426069;
    a.fillStyle(0x142431).fillRect(x,y+h-3,w,3);
    a.lineStyle(1,color).lineBetween(x,y+h-2,x+w-1,y+h-2);
    a.fillStyle(color).fillRect(x,y+h-5,2,4).fillRect(x+w-2,y+h-5,2,4);
    if(!this.enabled || this.state==='OFF' || this.state==='DISCHARGING') return;
    if(this.state==='CHARGING') {
      if(Math.floor(this.age/150)%2) a.fillStyle(color).fillRect(x+3,y+h-5,2,1);
      return;
    }
    a.fillStyle(0xe3ab76,0.12).fillRect(x,y,w,h);
    a.lineStyle(1,color);
    let px=x,py=y+h-4;
    for(let i=1;i<=w;i+=3){const xx=Math.min(x+i,x+w-1),yy=y+2+((i+Math.floor(this.age/75))%Math.max(3,h-3));a.lineBetween(px,py,xx,yy);px=xx;py=yy;}
  }
}
