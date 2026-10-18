import { DEFAULT_AUDIO, type AudioPreferences } from './AudioManager';

interface Progress { current:number; highest:number; introViewed:boolean; active:boolean }
class SaveManager {
  private storage:Storage|null=null;
  private progress:Progress|null=null;
  private preferences={...DEFAULT_AUDIO};
  constructor(){
    try{this.storage=window.localStorage;const raw=this.storage.getItem('dead-pixels-v1');if(raw)this.read(JSON.parse(raw));}catch{this.storage=null;}
  }
  private read(data:unknown):void{
    if(!data||typeof data!=='object')return;
    const record=data as {version?:unknown;progress?:unknown;preferences?:unknown};if(record.version!==1)return;
    const p=record.progress as Partial<Progress>|null;
    if(p&&Number.isInteger(p.current)&&p.current!>=1&&p.current!<=7&&Number.isInteger(p.highest)&&p.highest!>=p.current!&&p.highest!<=7&&typeof p.introViewed==='boolean'&&typeof p.active==='boolean')this.progress=p as Progress;
    const prefs=record.preferences as Partial<AudioPreferences>|undefined;
    if(prefs){for(const key of ['master','music','sfx','ambience'] as const){const n=prefs[key];if(typeof n==='number'&&Number.isFinite(n))this.preferences[key]=Math.max(0,Math.min(1,n));}
      if(typeof prefs.muted==='boolean')this.preferences.muted=prefs.muted;if(typeof prefs.crt==='boolean')this.preferences.crt=prefs.crt;}
  }
  private persist():void{try{this.storage?.setItem('dead-pixels-v1',JSON.stringify({version:1,progress:this.progress,preferences:this.preferences}));}catch{this.storage=null;}}
  get canContinue():boolean{return !!this.progress?.active;}
  get settings():AudioPreferences{return{...this.preferences};}
  get savedLevel():number{return this.progress?.current??1;}
  begin():void{this.progress={current:1,highest:1,introViewed:false,active:true};this.persist();}
  setLevel(current:number):void{if(!this.progress)this.begin();this.progress!.current=current;this.progress!.highest=Math.max(current,this.progress!.highest);this.progress!.active=true;this.persist();}
  markIntroViewed():void{if(this.progress){this.progress.introViewed=true;this.persist();}}
  finish():void{if(this.progress){this.progress.active=false;this.persist();}}
  setSettings(settings:AudioPreferences):void{this.preferences={...settings};this.persist();}
  snapshot(){return{persistent:!!this.storage,progress:this.progress?{...this.progress}:null,settings:this.settings};}
}
export const saveManager=new SaveManager();
