import Phaser from 'phaser';
import { AssetKeys } from '../assets/AssetManifest';

/** One original pixel-art location shared by menu, introduction and ending. */
export class RoomBackdrop {
  readonly screen:Phaser.GameObjects.Image;
  readonly led:Phaser.GameObjects.Rectangle;
  readonly outside:Phaser.GameObjects.Sprite;
  private readonly staticArt:Phaser.GameObjects.Graphics;
  constructor(scene:Phaser.Scene,powered=true){
    scene.add.image(0,0,'forgotten-room').setOrigin(0).setDepth(-20);
    const texture=scene.textures.get(AssetKeys.far(1));
    if(!texture.has('room-window'))texture.add('room-window',0,0,0,320,180);
    this.screen=scene.add.image(44,76,AssetKeys.far(1),'room-window').setOrigin(0).setDisplaySize(84,47).setDepth(-19);
    const silhouette=scene.add.sprite(92,121,AssetKeys.Explorer,0).setOrigin(0.5,1).setTint(0x29463f).setAlpha(0.75).setDepth(-18);
    scene.tweens.add({targets:silhouette,alpha:0.45,duration:1800,yoyo:true,repeat:-1});
    this.led=scene.add.rectangle(134,134,1,1,0x9bcabb).setDepth(-17);
    this.staticArt=scene.add.graphics().setDepth(-16);
    this.outside=scene.add.sprite(154,147,AssetKeys.Explorer,0).setOrigin(0.5,1).setDepth(5).setVisible(false);
    this.setPowered(powered);silhouette.setVisible(powered);
  }
  setPowered(on:boolean):void{this.screen.setVisible(on);this.led.setFillStyle(on?0x9bcabb:0xb36a5d);}
  noise(time:number,strength=0.2):void{
    this.staticArt.clear();
    for(let i=0;i<7;i++){const y=76+(Math.floor(time/80)+i*7)%47;this.staticArt.fillStyle(0xb6c9c6,strength).fillRect(44,y,84,1);}
  }
  clearNoise():void{this.staticArt.clear();}
}
