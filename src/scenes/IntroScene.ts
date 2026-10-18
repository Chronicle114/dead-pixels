import Phaser from 'phaser';
import { SceneKeys } from '../config/Constants';
import { AssetKeys } from '../assets/AssetManifest';
import { PixelFont } from '../systems/PixelFont';
import { RoomBackdrop } from '../ui/RoomBackdrop';
import { ArchiveEnvironment } from '../systems/ArchiveEnvironment';
import { ChannelTransition } from '../systems/ChannelTransition';
import { audioManager } from '../systems/AudioManager';
import { saveManager } from '../systems/SaveManager';
import { connectTelevision,setPresentation } from '../ui/Television';

/** Forty-second scene timeline; every delayed event is owned by Phaser's scene. */
export class IntroScene extends Phaser.Scene {
  private phase:'room'|'signal'|'awakening'|'entering'='room';
  private room!:RoomBackdrop;
  private lines:Phaser.GameObjects.Image[]=[];
  private unit:Phaser.GameObjects.Sprite|null=null;
  private fx!:ChannelTransition;
  private startedAt=0;
  private finished=false;
  constructor(){super(SceneKeys.Intro);}
  create():void{
    this.phase='room';this.lines=[];this.unit=null;this.finished=false;this.startedAt=this.time.now;
    setPresentation('game');connectTelevision(null);this.scale.getParentBounds();this.scale.refresh();
    this.cameras.main.setBackgroundColor(0x05090e);this.cameras.main.fadeIn(1800,0,0,0);
    this.room=new RoomBackdrop(this,false);this.room.led.setAlpha(0.15);
    this.fx=new ChannelTransition(this);audioManager.playMusic('intro');
    PixelFont.text(this,'SPACE / ENTER / ESC - SKIP',0x94b0c2,1,160,173).setDepth(120).setScrollFactor(0);
    this.write('THE LAST SIGNAL',24,0x6b8b91);
    this.time.delayedCall(5800,()=>{this.tweens.add({targets:this.room.led,alpha:1,duration:1200});audioManager.cue('room-click');});
    this.time.delayedCall(8000,()=>{
      this.phase='signal';this.clearLines();this.room.setPowered(true);audioManager.cue('signal');
      const scale=320/84;
      this.tweens.add({targets:this.room.container,scaleX:scale,scaleY:scale,x:160-86*scale,y:90-99.5*scale,duration:9500,ease:'Sine.easeInOut'});
    });
    ['BOOTING SYSTEM...','SIGNAL DETECTED','UNKNOWN ENTITY FOUND','MEMORY CORRUPTED'].forEach((line,i)=>this.time.delayedCall(9000+i*2100,()=>this.write(line,25+i*13,i===3?0xe3ab76:0xb6c9c6)));
    this.time.delayedCall(17300,()=>{this.room.screen.setAlpha(0.2);audioManager.cue('channel-invalid');this.fx.playStatic(0x8c86aa);});
    this.time.delayedCall(18000,()=>{
      this.phase='awakening';this.clearLines();this.room.container.setVisible(false);
      new ArchiveEnvironment(this);
      this.add.tileSprite(0,164,224,16,AssetKeys.platform(0)).setOrigin(0).setDepth(10);
      this.add.tileSprite(96,128,48,16,AssetKeys.platform(1)).setOrigin(0).setDepth(10);
      this.unit=this.add.sprite(32,162,AssetKeys.Explorer,14).setOrigin(0.5,1).setAngle(-90).setTint(0x243341).setDepth(20);
      this.write('REINITIALIZING UNIT 07...',68,0x94b0c2);
    });
    this.time.delayedCall(23000,()=>{
      this.unit?.clearTint();audioManager.cue('reboot');
      if(this.unit)this.tweens.add({targets:this.unit,angle:0,x:28,y:164,duration:1600,ease:'Sine.easeOut'});
    });
    this.time.delayedCall(26000,()=>{this.clearLines();this.write('THREE SIGNALS.',67,0xb6c9c6,2);});
    this.time.delayedCall(28000,()=>this.write('ONE WAY OUT.',94,0xe3c69b,2));
    this.time.delayedCall(30000,()=>{
      this.phase='entering';this.clearLines();this.fx.playStatic(0x80c9ba);
      this.write('CH-01 REALITY',65,0x80c9ba,2);this.write('LEVEL 01 - FIRST SIGNAL',94,0xb6c9c6);
    });
    this.time.delayedCall(39500,()=>this.cameras.main.fadeOut(450,7,11,18));
    this.time.delayedCall(40000,()=>this.finish());
    const skip=(event:KeyboardEvent)=>{if(['Space','Enter','Escape'].includes(event.code))this.finish();};
    this.input.keyboard?.on('keydown',skip);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN,()=>{this.input.keyboard?.off('keydown',skip);this.fx.destroy();});
  }
  override update():void{
    if(this.phase==='signal')this.room.noise(this.time.now,0.3);
    if(this.unit&&this.time.now-this.startedAt>=25000)this.unit.setFrame(Math.floor(this.time.now/280)%4);
  }
  private write(text:string,y:number,color:number,scale=1):void{this.lines.push(PixelFont.text(this,text,color,scale,160,y).setDepth(110));}
  private clearLines():void{this.lines.forEach(line=>line.destroy());this.lines=[];}
  private finish():void{if(this.finished)return;this.finished=true;saveManager.markIntroViewed();this.scene.start(SceneKeys.Game);}
  getSnapshot(){return{mode:'intro' as const,phase:this.phase,elapsedMs:Math.round(this.time.now-this.startedAt),durationMs:40000,messages:this.lines.map(line=>line.texture.key.split(':')[1]),save:saveManager.snapshot()};}
}
