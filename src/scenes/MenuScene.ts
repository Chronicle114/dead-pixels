import Phaser from 'phaser';
import { SceneKeys } from '../config/Constants';
import { PixelFont } from '../systems/PixelFont';
import { connectTelevision,setPresentation } from '../ui/Television';
import { RoomBackdrop } from '../ui/RoomBackdrop';
import { levelManager } from '../systems/LevelManager';
import { saveManager } from '../systems/SaveManager';
import { audioManager,type AudioPreferences } from '../systems/AudioManager';

type Screen='main'|'settings'|'credits'|'confirm';
export class MenuScene extends Phaser.Scene {
  private starting=false;
  private screen:Screen='main';
  private selection=0;
  private view:Phaser.GameObjects.GameObject[]=[];
  private buttons:Phaser.GameObjects.Rectangle[]=[];
  private room!:RoomBackdrop;
  private hoverX=-100;
  private hoverY=-100;
  private pendingKeys:string[]=[];
  constructor(){super(SceneKeys.Menu);}
  create():void{
    this.starting=false;this.screen='main';this.selection=0;this.view=[];this.buttons=[];this.pendingKeys=[];this.input.enabled=true;
    audioManager.playMusic('menu');setPresentation('menu');connectTelevision(null);this.scale.getParentBounds();this.scale.refresh();
    this.room=new RoomBackdrop(this);this.draw();
    const seen=new WeakSet<KeyboardEvent>();
    const handler=(event:KeyboardEvent)=>{
      // Phaser may reprocess its DOM queue between multiple sub-frame presses.
      if(!event.repeat&&!seen.has(event)){seen.add(event);this.pendingKeys.push(event.code);}
    };
    this.input.keyboard?.on('keydown',handler);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN,()=>this.input.keyboard?.off('keydown',handler));
  }
  override update(time:number):void{
    // Handle a snapshot of codes after the keyboard plugin finishes its event batch.
    // Each real DOM press is handled once, in its original order.
    const keys=this.pendingKeys;this.pendingKeys=[];for(const code of keys)this.keyboard(code);
    if(Math.floor(time/2300)%7===0)this.room.noise(time,0.13);else this.room.clearNoise();
  }
  private text(label:string,x:number,y:number,color=0xb6c9c6,scale=1):void{
    this.view.push(PixelFont.text(this,label,color,scale,x,y).setDepth(42));
  }
  private panel(x:number,y:number,w:number,h:number):void{this.view.push(this.add.rectangle(x,y,w,h,0x0a111d,0.94).setStrokeStyle(1,0x426069).setDepth(40));}
  private button(label:string,x:number,y:number,w:number,index:number,action:()=>void,disabled=false):void{
    const button=this.add.rectangle(x,y,w,17,disabled?0x15242b:this.selection===index?0x31534f:0x132c31).setStrokeStyle(1,this.selection===index?0x80c9ba:0x426069).setDepth(41);
    this.view.push(button);this.buttons[index]=button;
    this.text(label,x,y,disabled?0x426069:this.selection===index?0xe3c69b:0xb6c9c6);
    if(!disabled){button.setInteractive({useHandCursor:true});button.on('pointerover',(pointer:Phaser.Input.Pointer)=>{
      // Rebuilding a panel under a stationary mouse must not steal keyboard focus.
      if(pointer.x===this.hoverX&&pointer.y===this.hoverY)return;
      this.hoverX=pointer.x;this.hoverY=pointer.y;this.selection=index;this.highlight();audioManager.cue('hover');
    });button.on('pointerdown',()=>{audioManager.cue('click');action();});}
  }
  private highlight():void{this.buttons.forEach((b,i)=>{if(b)b.setStrokeStyle(1,i===this.selection?0x80c9ba:0x426069).setFillStyle(i===this.selection?0x31534f:0x132c31);});}
  private draw():void{
    this.view.forEach(o=>o.destroy());this.view=[];this.buttons=[];
    if(this.screen==='main'){
      this.panel(160,25,308,43);this.text('DEAD PIXELS',160,18,0xc3ddd2,2);this.text('THE LAST SIGNAL',160,38,0xd3a378);
      this.panel(240,105,144,101);
      ['NEW GAME','CONTINUE','SETTINGS','CREDITS'].forEach((label,i)=>this.button(label,240,72+i*22,130,i,()=>this.choose(i),i===1&&!saveManager.canContinue));
      this.text(saveManager.canContinue?`SAVED SIGNAL ${String(saveManager.savedLevel).padStart(2,'0')}`:'NO SAVED SIGNAL',240,160,0x6b8b91);
      this.text('ARROWS / ENTER SELECT',160,174,0x6b8b91);
    }else if(this.screen==='settings'){
      this.panel(160,90,304,174);this.text('SETTINGS',160,16,0xc3ddd2,2);
      const settings=audioManager.getPreferences();
      for(const [i,key]of(['master','music','sfx','ambience'] as const).entries()){
        const y=44+i*19;
        this.button(key.toUpperCase(),67,y,98,i,()=>{this.selection=i;},false);
        const bar=this.add.rectangle(205,y,94,8,0x243341).setStrokeStyle(1,0x6b8b91).setDepth(42).setInteractive({useHandCursor:true});
        this.view.push(bar,this.add.rectangle(159,y,94*settings[key],6,0x80c9ba).setOrigin(0,0.5).setDepth(43));
        this.text(String(Math.round(settings[key]*100)),278,y,0xe3c69b);
        bar.on('pointerdown',(p:Phaser.Input.Pointer)=>{this.selection=i;this.setSetting(key,Math.round(Math.max(0,Math.min(1,(p.worldX-158)/94))*10)/10);});
      }
      this.button(`MUTE AUDIO ${settings.muted?'ON':'OFF'}`,160,122,256,4,()=>this.adjust(1));
      this.button(`CRT EFFECTS ${settings.crt?'ON':'OFF'}`,160,141,256,5,()=>this.adjust(1));
      this.button('BACK',160,161,110,6,()=>this.back());
    }else if(this.screen==='credits'){
      this.panel(160,90,304,174);this.text('CREDITS',160,19,0xc3ddd2,2);
      ['DEAD PIXELS - THE LAST SIGNAL','DESIGN / CODE / ORIGINAL ART','AI-ASSISTED PROJECT WORKFLOW','KENNEY.NL - CC0 DETAILS','ORIGINAL GENERATED SOUNDTRACK','ORIGINAL MUSIC AND SOUND - CC0'].forEach((line,i)=>this.text(line,160,47+i*16,i===3?0xd3a378:0x94b0c2));
      this.button('BACK',160,161,110,0,()=>this.back());
    }else{
      this.panel(160,96,278,91);this.text('RESET SAVED CAMPAIGN?',160,70,0xe3c69b);this.text('THIS REPLACES YOUR PROGRESS.',160,87,0x94b0c2);
      this.button('YES - NEW GAME',99,117,128,0,()=>this.launch(false));this.button('NO - BACK',235,117,116,1,()=>this.back());
    }
  }
  private choose(index:number):void{
    if(index===0){if(saveManager.canContinue){this.screen='confirm';this.selection=1;this.draw();}else this.launch(false);}
    else if(index===1&&saveManager.canContinue)this.launch(true);
    else if(index===2||index===3){this.screen=index===2?'settings':'credits';this.selection=0;this.draw();}
  }
  private keyboard(code:string):void{
    if(this.starting)return;
    if(code==='Escape'){this.back();return;}
    const count=this.screen==='main'?4:this.screen==='settings'?7:this.screen==='confirm'?2:1;
    if(code==='ArrowDown'||code==='ArrowUp'){
      this.selection=(this.selection+(code==='ArrowDown'?1:count-1))%count;
      if(this.screen==='main'&&this.selection===1&&!saveManager.canContinue)this.selection=code==='ArrowDown'?2:0;
      audioManager.cue('hover');this.draw();return;
    }
    if(code==='ArrowLeft'||code==='ArrowRight'){
      if(this.screen==='settings')this.adjust(code==='ArrowLeft'?-1:1);
      else if(this.screen==='confirm'){this.selection=1-this.selection;this.draw();}return;
    }
    if(code!=='Enter'&&code!=='Space')return;
    audioManager.cue('click');
    if(this.screen==='main')this.choose(this.selection);
    else if(this.screen==='settings'){if(this.selection===6)this.back();else this.adjust(1);}
    else if(this.screen==='credits')this.back();
    else if(this.selection===0)this.launch(false);else this.back();
  }
  private adjust(direction:number):void{
    const prefs=audioManager.getPreferences();
    if(this.selection<4){const key=(['master','music','sfx','ambience'] as const)[this.selection];this.setSetting(key,Math.round((prefs[key]+direction*.1)*10)/10);}
    else if(this.selection===4)this.setSetting('muted',!prefs.muted);
    else if(this.selection===5)this.setSetting('crt',!prefs.crt);
  }
  private setSetting<K extends keyof AudioPreferences>(key:K,value:AudioPreferences[K]):void{
    audioManager.setPreferences({[key]:value});saveManager.setSettings(audioManager.getPreferences());audioManager.cue('click');this.draw();
  }
  private back():void{if(this.screen==='main')return;this.screen='main';this.selection=0;audioManager.cue('back');this.draw();}
  private launch(continuing:boolean):void{
    if(this.starting)return;this.starting=true;
    if(continuing)levelManager.continueSaved();else levelManager.begin();
    this.input.enabled=false;this.cameras.main.fadeOut(180,7,13,19);
    this.time.delayedCall(180,()=>this.scene.start(SceneKeys.Game));
  }
  getSnapshot(){return{mode:'menu' as const,screen:this.screen,selection:this.selection,canContinue:saveManager.canContinue,save:saveManager.snapshot(),messages:this.view.filter(o=>o instanceof Phaser.GameObjects.Image).map(o=>(o as Phaser.GameObjects.Image).texture.key.split(':')[1])};}
}
