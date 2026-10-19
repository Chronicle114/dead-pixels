import Phaser from 'phaser';
import { SceneKeys } from '../config/Constants';
import { AssetKeys } from '../assets/AssetManifest';
import { PixelFont } from '../systems/PixelFont';
import { ChannelTransition } from '../systems/ChannelTransition';
import { levelManager } from '../systems/LevelManager';
import { connectTelevision,setPresentation } from '../ui/Television';
import { audioManager } from '../systems/AudioManager';
import { RoomBackdrop } from '../ui/RoomBackdrop';
import { Player,PlayerAnimations } from '../entities/Player';
import { ArchiveEnvironment } from '../systems/ArchiveEnvironment';
import { SignalTransmitter } from '../ui/SignalTransmitter';

export class EndingScene extends Phaser.Scene {
  private stage:'transmitter'|'reconstruction'|'escape'|'found'|'end'='transmitter';
  private lines:Phaser.GameObjects.Image[]=[];
  private storySeen:string[]=[];
  private fx!:ChannelTransition;
  private room!:RoomBackdrop;
  private digital!:Phaser.GameObjects.Container;
  private fragments!:Phaser.GameObjects.Container;
  private unit!:Phaser.GameObjects.Sprite;
  private machine!:SignalTransmitter;
  private flare!:Phaser.GameObjects.Rectangle;
  private returning=false;
  private elapsed=0;
  constructor(){super(SceneKeys.Ending);}
  create():void{
    this.stage='transmitter';this.lines=[];this.storySeen=[];this.returning=false;this.elapsed=0;
    setPresentation('game');connectTelevision(null);this.scale.getParentBounds();this.scale.refresh();Player.ensureAnimations(this);
    audioManager.playMusic('ending');this.cameras.main.setBackgroundColor(0x05090e);
    const before=new Set(this.children.list);
    new ArchiveEnvironment(this,false,{...levelManager.current,width:320,exit:{x:280,y:156}});
    this.add.tileSprite(0,164,320,16,AssetKeys.platform(0)).setOrigin(0).setDepth(10);
    this.machine=new SignalTransmitter(this,180,112);
    this.unit=this.add.sprite(60,164,AssetKeys.Explorer).setOrigin(.5,1).setDepth(20).play(PlayerAnimations.Walk);
    this.digital=this.add.container(0,0,this.children.list.filter(o=>!before.has(o)).sort((a,b)=>(a as Phaser.GameObjects.Image).depth-(b as Phaser.GameObjects.Image).depth));
    this.room=new RoomBackdrop(this,false);this.room.container.setVisible(false).setDepth(1);
    this.fragments=this.add.container(0,0).setDepth(2).setVisible(false);
    for(let i=0;i<3;i++)this.fragments.add(this.add.image(0,0,'forgotten-room').setOrigin(0).setCrop(i*106,0,i===2?108:106,180).setTint([0x80c9ba,0x8c86aa,0xc47758][i]));
    this.flare=this.add.rectangle(160,90,320,180,0xeaf4e5).setDepth(80).setAlpha(0);
    this.fx=new ChannelTransition(this);
    this.add.rectangle(160,173,300,11,0x071118,.85).setDepth(119).setName('skip-backing');
    PixelFont.text(this,'SPACE / ENTER / ESC - SKIP',0x94b0c2,1,160,173).setDepth(120).setName('skip-label');
    this.write('TRANSMISSION COMPLETE',26,0x80c9ba);
    this.tweens.add({targets:this.unit,x:158,duration:5200,ease:'Sine.easeInOut',onComplete:()=>this.unit.play(PlayerAnimations.Idle)});
    this.time.delayedCall(3000,()=>{this.machine.stopped=true;audioManager.cue('metal-creak');});
    this.time.delayedCall(4000,()=>{this.clearLines();this.write('TRANSMISSION SOURCE FOUND',26,0x80c9ba);});
    this.time.delayedCall(6000,()=>{this.write('IDENTITY: UNIT 07',42,0xb6c9c6);this.unit.anims.stop();this.unit.setFrame(10);audioManager.cue('confirm');this.tweens.add({targets:this.machine,convergence:1,duration:5000});});
    this.time.delayedCall(8000,()=>this.write('STATUS: ORIGINAL SIGNAL',58,0xe3c69b));
    this.time.delayedCall(12000,()=>{
      this.stage='reconstruction';this.clearLines();this.digital.setVisible(false);this.room.container.setVisible(true);this.room.setPowered(true);this.room.outside.setPosition(178,147).setVisible(true).setTint(0x243341);
      this.write('BEFORE THE SILENCE',26,0xb6c9c6);this.time.delayedCall(1200,()=>{this.room.outside.clearTint().play(PlayerAnimations.Idle);audioManager.cue('reboot');});
    });
    this.time.delayedCall(16000,()=>{this.fx.playRejected();audioManager.cue('death');this.room.outside.anims.stop();this.tweens.add({targets:this.room.outside,angle:90,alpha:.4,duration:1100});});
    this.time.delayedCall(19000,()=>{
      this.clearLines();this.write('MEMORY FRAGMENTED',26,0xe3c69b);this.room.container.setVisible(false);this.fragments.setVisible(true);
      this.fragments.list.forEach((image,i)=>this.tweens.add({targets:image,x:(i-1)*19,y:i===1?-9:7,alpha:.55,duration:2500,ease:'Sine.easeInOut'}));audioManager.cue('corrupt-break');
    });
    this.time.delayedCall(21000,()=>this.write('REALITY - THE BODY',58,0x80c9ba));
    this.time.delayedCall(23000,()=>this.write('MEMORY - THE PAST',83,0xa8a2d8));
    this.time.delayedCall(25000,()=>this.write('VOID - THE ERASED',108,0xc47758));
    this.time.delayedCall(27500,()=>{this.clearLines();this.write('TO PRESERVE YOU, THEY DIVIDED YOU.',40,0xb6c9c6);if(levelManager.snapshot().fragments.length===3)this.write('ALL THREE MEMORIES ARE YOURS.',65,0x80c9ba);});
    this.time.delayedCall(30000,()=>{
      this.stage='escape';this.clearLines();this.fragments.setVisible(false);this.digital.setVisible(true);this.write('YOU WERE THE SIGNAL.',26,0xe3c69b,2);
      this.tweens.add({targets:this.digital,scaleX:1.08,scaleY:1.08,x:-14,y:-7,duration:3000});
      this.tweens.add({targets:this.flare,alpha:1,duration:2500});audioManager.cue('complete');
    });
    this.time.delayedCall(33500,()=>{
      this.clearLines();this.digital.setVisible(false);this.room.container.setVisible(true);this.room.setPowered(false);this.room.clearNoise();this.room.outside.setAngle(0).setAlpha(0).setPosition(180,147).setVisible(true).play(PlayerAnimations.Idle);
      this.room.led.setFillStyle(0x243341);
      this.tweens.add({targets:this.flare,displayWidth:1,displayHeight:1,duration:1400,ease:'Cubic.easeInOut',onComplete:()=>this.flare.setAlpha(0)});audioManager.cue('laser-off');
    });
    this.time.delayedCall(36000,()=>this.tweens.add({targets:this.room.outside,alpha:1,duration:1200}));
    this.time.delayedCall(40000,()=>{this.room.outside.setFlipX(true).play(PlayerAnimations.Walk);this.tweens.add({targets:this.room.outside,x:140,duration:2700,onComplete:()=>this.room.outside.play(PlayerAnimations.Idle)});});
    this.time.delayedCall(43000,()=>this.screenMessage('SIGNAL LOST',0x94b0c2));
    this.time.delayedCall(46000,()=>{
      this.stage='found';this.screenMessage('SIGNAL FOUND.',0x80c9ba);this.room.led.setFillStyle(0x80c9ba);this.room.outside.anims.stop();this.room.outside.setFlipX(false).setFrame(10);audioManager.cue('checkpoint');
      this.tweens.add({targets:this.room.container,scaleX:.88,scaleY:.88,x:19,y:10,duration:6000,ease:'Sine.easeInOut'});
    });
    this.time.delayedCall(48500,()=>this.room.outside.play(PlayerAnimations.Idle));
    this.time.delayedCall(52000,()=>this.showEnd(false));
    const seen=new WeakSet<KeyboardEvent>();const advance=(e:KeyboardEvent)=>{if(!['Space','Enter','Escape'].includes(e.code)||seen.has(e)||e.repeat)return;seen.add(e);if(this.stage==='end')this.returnMenu();else this.showEnd(true);};
    this.input.keyboard?.on('keydown',advance);this.events.once(Phaser.Scenes.Events.SHUTDOWN,()=>{this.input.keyboard?.off('keydown',advance);this.fx.destroy();});
  }
  override update(time:number,delta:number):void{this.elapsed+=delta;if(this.stage==='transmitter'||this.stage==='escape')this.machine.update(time);if(this.stage==='reconstruction'&&this.elapsed<19000)this.room.noise(time,.08);}
  private screenMessage(text:string,color:number):void{
    for(const child of [...this.room.container.list])if(child.name==='screen-message')child.destroy();
    this.room.container.add(PixelFont.text(this,text,color,1,86,100).setName('screen-message'));this.storySeen.push(text);
  }
  private showEnd(skipped:boolean):void{
    if(this.stage==='end')return;this.stage='end';this.time.removeAllEvents();this.clearLines();this.cameras.main.resetFX();this.fx.setInstability(1);
    this.children.getByName('skip-label')?.destroy();this.children.getByName('skip-backing')?.destroy();
    if(skipped){this.tweens.killAll();this.digital.setVisible(false);this.fragments.setVisible(false);this.flare.setAlpha(0);this.room.container.setVisible(true).setScale(.88).setPosition(19,10);this.room.clearNoise();this.room.setPowered(false);this.room.outside.setVisible(true).setAlpha(1).setAngle(0).setPosition(140,147).setFlipX(false).play(PlayerAnimations.Idle);this.screenMessage('SIGNAL FOUND.',0x80c9ba);}
    this.add.rectangle(160,36,306,68,0x0a111d,.94).setStrokeStyle(1,0x426069).setDepth(90);
    this.write('DEAD PIXELS',19,0xc3ddd2,2);this.write('THE LAST SIGNAL',39,0xd3a378);this.write('END OF TRANSMISSION',56,0x94b0c2);
    const button=this.add.rectangle(160,164,140,21,0x13201f).setStrokeStyle(1,0x5a8d9e).setDepth(100).setInteractive({useHandCursor:true});this.write('RETURN TO MENU',164,0xe3c69b);
    button.on('pointerdown',()=>this.returnMenu());button.on('pointerover',()=>button.setFillStyle(0x29413c));button.on('pointerout',()=>button.setFillStyle(0x13201f));
  }
  private returnMenu():void{if(this.returning)return;this.returning=true;audioManager.cue('back');this.scene.start(SceneKeys.Menu);}
  private write(text:string,y:number,color:number,scale=1):void{this.lines.push(PixelFont.text(this,text,color,scale,160,y).setDepth(110));this.storySeen.push(text);}
  private clearLines():void{this.lines.forEach(line=>line.destroy());this.lines=[];}
  getSnapshot(){return{mode:'ending' as const,phase:this.stage,durationMs:52000,elapsedMs:Math.round(this.elapsed),level:levelManager.snapshot(),outsideUnitVisible:this.room.outside.visible&&this.room.container.visible,storySeen:[...this.storySeen],messages:this.lines.map(line=>line.texture.key.split(':')[1])};}
}
