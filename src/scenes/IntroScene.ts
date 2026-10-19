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
import { SignalTransmitter } from '../ui/SignalTransmitter';
import { Player,PlayerAnimations } from '../entities/Player';

export class IntroScene extends Phaser.Scene {
  private phase:'room'|'signal'|'awakening'|'entering'='room';
  private room!:RoomBackdrop;
  private lines:Phaser.GameObjects.Image[]=[];
  private unit:Phaser.GameObjects.Sprite|null=null;
  private world:Phaser.GameObjects.Container|null=null;
  private machine:SignalTransmitter|null=null;
  private dust:Phaser.GameObjects.Rectangle[]=[];
  private fx!:ChannelTransition;
  private elapsed=0;
  private finished=false;
  constructor(){super(SceneKeys.Intro);}
  create():void{
    this.phase='room';this.lines=[];this.unit=null;this.world=null;this.machine=null;this.finished=false;this.elapsed=0;
    setPresentation('game');connectTelevision(null);this.scale.getParentBounds();this.scale.refresh();Player.ensureAnimations(this);
    this.cameras.main.setBackgroundColor(0x05090e);this.cameras.main.fadeIn(1300,0,0,0);
    this.room=new RoomBackdrop(this,false);this.room.led.setAlpha(.12);this.room.container.setScale(1.08).setPosition(-10,-8);
    this.tweens.add({targets:this.room.container,scaleX:1,scaleY:1,x:0,y:0,duration:5800,ease:'Sine.easeInOut'});
    this.dust=Array.from({length:10},(_,i)=>this.add.rectangle(i*31+6,35+(i*17)%110,1,1,0x7d9996,.25).setDepth(2));
    this.fx=new ChannelTransition(this);audioManager.playMusic('intro');
    this.add.rectangle(160,173,302,11,0x071118,.92).setDepth(119);
    PixelFont.text(this,'SPACE / ENTER / ESC - SKIP',0x94b0c2,1,160,173).setDepth(120);
    this.write('THE LAST SIGNAL',25,0x6b8b91);
    this.time.delayedCall(4200,()=>{this.tweens.add({targets:this.room.led,alpha:1,duration:1100});audioManager.cue('room-click');});
    this.time.delayedCall(6000,()=>{
      this.phase='signal';this.clearLines();this.room.setPowered(true);audioManager.cue('signal');
      this.room.screen.setDisplaySize(84,1).setAlpha(.8);
      this.tweens.add({targets:this.room.screen,displayHeight:47,duration:600,ease:'Cubic.easeOut'});
      const scale=320/84;this.tweens.add({targets:this.room.container,scaleX:scale,scaleY:scale,x:160-86*scale,y:90-99.5*scale,duration:7600,ease:'Sine.easeInOut'});
    });
    ['BOOTING SYSTEM...','UNKNOWN ENTITY DETECTED','MEMORY FRAGMENTED'].forEach((line,i)=>this.time.delayedCall(7000+i*2100,()=>this.write(line,25+i*14,i===2?0xe3ab76:0xb6c9c6)));
    this.time.delayedCall(13400,()=>{this.room.screen.setAlpha(.08);this.fx.playStatic(0x8c86aa);audioManager.cue('channel-invalid');});
    this.time.delayedCall(14000,()=>{
      this.phase='awakening';this.clearLines();this.room.container.setVisible(false);this.dust.forEach(p=>p.setVisible(false));
      const before=new Set(this.children.list);
      new ArchiveEnvironment(this);this.add.tileSprite(0,164,224,16,AssetKeys.platform(0)).setOrigin(0).setDepth(10);this.add.tileSprite(96,128,48,16,AssetKeys.platform(1)).setOrigin(0).setDepth(10);
      this.machine=new SignalTransmitter(this,240,98);this.machine.convergence=.15;
      this.unit=this.add.sprite(96,162,AssetKeys.Explorer,14).setOrigin(.5,1).setAngle(-90).setTint(0x243341).setDepth(20);
      const objects=this.children.list.filter(o=>!before.has(o)).sort((a,b)=>(a as Phaser.GameObjects.Image).depth-(b as Phaser.GameObjects.Image).depth);
      this.world=this.add.container(-18,-46,objects).setScale(1.3).setDepth(0);
      this.write('REINITIALIZING UNIT 07...',55,0x94b0c2);
    });
    this.time.delayedCall(17500,()=>{
      this.unit?.setTintFill(0x80c9ba);audioManager.cue('reboot');
      this.time.delayedCall(180,()=>this.unit?.clearTint());
      if(this.unit)this.tweens.add({targets:this.unit,angle:0,x:96,y:164,duration:1700,ease:'Sine.easeOut',onComplete:()=>this.unit?.play(PlayerAnimations.Idle)});
      if(this.machine)this.tweens.add({targets:this.machine,convergence:1,duration:5000});
    });
    this.time.delayedCall(21000,()=>{this.clearLines();this.write('THREE SIGNALS.',58,0xb6c9c6,2);});
    this.time.delayedCall(23000,()=>this.write('ONE WAY OUT.',84,0xe3c69b,2));
    this.time.delayedCall(24000,()=>{
      this.phase='entering';this.clearLines();
      if(this.world)this.tweens.add({targets:this.world,scaleX:1,scaleY:1,x:0,y:0,duration:5000,ease:'Sine.easeInOut'});
      this.unit?.setFlipX(true).play(PlayerAnimations.Walk);
      if(this.unit)this.tweens.add({targets:this.unit,x:28,duration:2600,onComplete:()=>this.unit?.setFlipX(false).play(PlayerAnimations.Idle)});
    });
    this.time.delayedCall(29000,()=>{this.fx.playStatic(0x80c9ba);this.write('CH-01 REALITY',65,0x80c9ba,2);this.write('LEVEL 01 - FIRST SIGNAL',94,0xb6c9c6);});
    this.time.delayedCall(33600,()=>this.cameras.main.fadeOut(350,7,11,18));this.time.delayedCall(34000,()=>this.finish());
    const seen=new WeakSet<KeyboardEvent>();const skip=(e:KeyboardEvent)=>{if(!seen.has(e)&&['Space','Enter','Escape'].includes(e.code)){seen.add(e);this.finish();}};
    this.input.keyboard?.on('keydown',skip);this.events.once(Phaser.Scenes.Events.SHUTDOWN,()=>{this.input.keyboard?.off('keydown',skip);this.fx.destroy();});
  }
  override update(time:number,delta:number):void{
    this.elapsed+=delta;
    if(this.phase==='signal')this.room.noise(time,.18+.14*Math.sin(time/160));
    if(this.phase==='room')this.dust.forEach((p,i)=>p.setY(35+(i*17+time/1800)%110));
    this.machine?.update(time);
  }
  private write(text:string,y:number,color:number,scale=1):void{
    const image=PixelFont.text(this,text,color,scale,160,y).setDepth(110);this.lines.push(image);
    this.tweens.addCounter({from:0,to:image.width,duration:600,onUpdate:t=>image.setCrop(0,0,Math.max(1,Math.round(t.getValue()??0)),image.height)});
  }
  private clearLines():void{this.lines.forEach(line=>line.destroy());this.lines=[];}
  private finish():void{if(this.finished)return;this.finished=true;saveManager.markIntroViewed();this.scene.start(SceneKeys.Game);}
  getSnapshot(){return{mode:'intro' as const,phase:this.phase,elapsedMs:Math.round(this.elapsed),durationMs:34000,messages:this.lines.map(line=>line.texture.key.split(':')[1]),save:saveManager.snapshot()};}
}
