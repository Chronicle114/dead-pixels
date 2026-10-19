import Phaser from 'phaser';
import type { SecretDefinition } from '../levels/LevelTypes';
import type { ChannelId } from '../config/Channels';
import { PixelFont } from './PixelFont';
import { saveManager } from './SaveManager';
import { audioManager } from './AudioManager';
import type { GameFeedback } from './GameFeedback';

export class SecretSystem {
  private readonly icons:{data:SecretDefinition;art:Phaser.GameObjects.Graphics}[];
  private readonly counters:Phaser.GameObjects.Image[];
  private readonly memories:Phaser.GameObjects.Image[];
  constructor(private readonly scene:Phaser.Scene,definitions:readonly SecretDefinition[],private readonly feedback:GameFeedback){
    for(const data of definitions){
      // A recessed archive alcove, deliberately low-contrast and behind the
      // actual collision rail. The three niches read as places, not loose gems.
      const wall=scene.add.graphics().setDepth(2);
      wall.fillStyle(0x0a111d,.8).fillRect(data.x-32,data.y-23,64,46);
      wall.lineStyle(1,0x426069,.45).strokeRect(data.x-31,data.y-22,62,44);
      for(let i=0;i<4;i++)wall.lineBetween(data.x-25,data.y-16+i*4,data.x-14+i*2,data.y-16+i*4);
      wall.lineBetween(data.x+19,data.y-13,data.x+26,data.y-13).lineBetween(data.x+26,data.y-13,data.x+26,data.y+9);
    }
    this.icons=definitions.map(data=>{const art=scene.add.graphics().setDepth(21);art.fillStyle(0x0a111d).fillRect(data.x-4,data.y-4,9,9);art.lineStyle(1,0x80c9ba).strokeRect(data.x-3,data.y-3,6,6);art.fillStyle(0xe3c69b).fillRect(data.x-1,data.y-1,3,3);art.fillStyle(0x8c86aa).fillRect(data.x-6,data.y,1,1).fillRect(data.x+6,data.y,1,1);return{data,art};});
    this.counters=[0,1,2,3].map(n=>PixelFont.text(scene,`MEM ${n}/3`,0x94b0c2,1,6,174).setOrigin(0,0.5).setDepth(103).setScrollFactor(0).setVisible(false));
    this.memories=definitions.map(data=>PixelFont.text(scene,data.memory,0xe3c69b,1,160,data.y<70?92:67).setDepth(103).setScrollFactor(0).setAlpha(0));
  }
  update(x:number,y:number,channel:ChannelId):void{
    this.counters.forEach((image,i)=>image.setVisible(i===saveManager.fragments.length));
    for(const [i,icon]of this.icons.entries()){
      const visible=channel===icon.data.channel&&!saveManager.fragments.includes(icon.data.id);
      icon.art.setVisible(visible).setAlpha(0.72+Math.sin(this.scene.time.now/280)*.2);
      if(visible&&Math.hypot(x-icon.data.x,y-icon.data.y)<16&&saveManager.collectFragment(icon.data.id)){
        icon.art.setVisible(false);this.feedback.burst(icon.data.x,icon.data.y,0x80c9ba,8);audioManager.cue('checkpoint',x);
        this.memories[i].setAlpha(1);this.scene.tweens.add({targets:this.memories[i],alpha:0,delay:2100,duration:600});
      }
    }
  }
  snapshot(){return this.icons.map(icon=>({...icon.data,collected:saveManager.fragments.includes(icon.data.id),visible:icon.art.visible}));}
}
