import Phaser from 'phaser';

/** Pixel-built ferrite transmitter and 24 bounded signal particles, no physics. */
export class SignalTransmitter {
  private readonly structure:Phaser.GameObjects.Graphics;
  private readonly rings:Phaser.GameObjects.Graphics;
  private readonly particles:Phaser.GameObjects.Rectangle[];
  convergence=0;
  stopped=false;
  constructor(scene:Phaser.Scene,private readonly x=180,private readonly y=112){
    this.structure=scene.add.graphics().setDepth(12);
    const a=this.structure;
    a.fillStyle(0x09111b).fillRect(x-35,y-50,70,102);a.fillStyle(0x29434b).fillRect(x-33,y-48,66,98);
    a.lineStyle(1,0x8ca8ad).lineBetween(x-32,y-48,x+31,y-48).lineBetween(x-32,y-48,x-32,y+49);
    a.fillStyle(0x101c2b).fillRect(x-27,y-42,54,69).fillRect(x-28,y+34,56,13);
    for(let i=0;i<6;i++)a.fillStyle(0x426069).fillRect(x-23+i*8,y+38,4,1);
    a.lineStyle(1,0x426069).lineBetween(x-35,y+10,x-58,y+10).lineBetween(x+35,y-9,x+67,y-9);
    a.fillStyle(0x80c9ba).fillRect(x-11,y+37,22,2);
    this.rings=scene.add.graphics().setDepth(13);
    const colors=[0x80c9ba,0x8c86aa,0xc47758];
    this.particles=Array.from({length:24},(_,i)=>scene.add.rectangle(0,0,i%4===0?2:1,1,colors[i%3]).setDepth(14));
  }
  update(time:number):void{
    const a=this.rings.clear(),colors=[0x80c9ba,0x8c86aa,0xc47758];
    for(let ring=0;ring<3;ring++){
      const radius=21-ring*6,angle=this.stopped?ring*.6:time/1800*(ring%2?-1:1);
      a.lineStyle(1,colors[ring],.55+.4*this.convergence);
      for(let i=0;i<12;i++){
        const t=angle+i*Math.PI/6,t2=t+.32;
        a.lineBetween(this.x+Math.round(Math.cos(t)*radius),this.y+Math.round(Math.sin(t)*radius),this.x+Math.round(Math.cos(t2)*radius),this.y+Math.round(Math.sin(t2)*radius));
      }
    }
    a.fillStyle(this.convergence>.85?0xe3efe3:0x80c9ba).fillRect(this.x-2,this.y-2,5,5);
    for(const [i,p]of this.particles.entries()){
      const t=((time/2000+i/24)%1),originX=[20,160,300][i%3],originY=[52,22,52][i%3];
      p.setPosition(Math.round(originX+(this.x-originX)*t),Math.round(originY+(this.y-originY)*t+Math.sin(t*Math.PI)*12)).setAlpha((.2+.8*this.convergence)*Math.sin(t*Math.PI));
    }
  }
}
