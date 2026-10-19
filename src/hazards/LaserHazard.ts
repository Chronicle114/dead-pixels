import { BaseHazard } from './BaseHazard';
import { cycleState } from './HazardGeometry';

export class LaserHazard extends BaseHazard {
  protected tick(): void {
    const cycle = cycleState(this.age+(this.definition.phaseMs??0), 350, 800, this.definition.activeMs??1800, 1500);
    const next=this.rearming&&cycle==='ACTIVE'?'WARNING':cycle;
    this.setState(next, next === 'WARNING' ? 'laser-warning' : next === 'ACTIVE' ? 'laser-on' : next === 'COOLDOWN' ? 'laser-off' : undefined);
    if (next === 'ACTIVE') this.contact();
  }
  protected draw(): void {
    const { x, y, width:w, height:h } = this.bounds, a = this.art.clear();
    a.fillStyle(0x142431).fillRect(x-3,y-5,w+6,5).fillRect(x-3,y+h,w+6,4);
    a.lineStyle(1,0x6b8b91).lineBetween(x-2,y-5,x+w+2,y-5);
    a.fillStyle(this.state==='ACTIVE'?0xeacba0:this.state==='WARNING'?0xc47758:0x426069).fillRect(x-1,y-3,w+2,1);
    if (!this.enabled) return;
    if (this.state==='WARNING') {
      a.fillStyle(0xc47758,0.25).fillRect(x,y,w,h);
      a.fillStyle(0xeacba0).fillRect(x-5,y-9,1,3).fillRect(x+w+4,y-9,1,3);
    }
    if (this.state==='ACTIVE') {
      a.fillStyle(0xc47758,0.12).fillRect(x-2,y,w+4,h);
      a.fillStyle(0xe3ab76).fillRect(x,y,w,h);
      a.fillStyle(0xfff0c8).fillRect(x+Math.floor(w/2),y,1,h);
    }
  }
}
