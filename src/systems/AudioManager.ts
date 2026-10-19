import { MUSIC, type MusicId } from '../audio/AudioManifest';

export interface AudioPreferences { master:number; music:number; sfx:number; ambience:number; muted:boolean; crt:boolean }
export const DEFAULT_AUDIO:AudioPreferences={master:0.85,music:0.75,sfx:0.8,ambience:0.18,muted:false,crt:true};
type MusicVoice={source:AudioBufferSourceNode;gain:GainNode;id:MusicId};

/** One browser audio graph, shared across scenes; no Phaser audio duplication. */
class AudioManager {
  private context:AudioContext|null=null;
  private master:GainNode|null=null;
  private musicBus:GainNode|null=null;
  private sfxBus:GainNode|null=null;
  private ambienceBus:GainNode|null=null;
  private active:MusicVoice|null=null;
  private fading:MusicVoice|null=null;
  private desired:MusicId|null=null;
  private token=0;
  private buffers=new Map<MusicId,AudioBuffer>();
  private pending=new Map<MusicId,Promise<AudioBuffer>>();
  private preferences={...DEFAULT_AUDIO};
  private voices=0;
  private listenerX=0;
  private lastCue=new Map<string,number>();
  private counts:Record<string,number>={};
  private history:MusicId[]=[];
  private error:string|null=null;
  private ambienceStarted=false;
  private analyser:AnalyserNode|null=null;
  private samples=new Float32Array(2048);
  private needsGesture=true;

  installUnlock():void {
    const unlock=()=>{void this.unlock();};
    window.addEventListener('pointerdown',unlock,{capture:true});
    window.addEventListener('touchend',unlock,{capture:true});
    window.addEventListener('keydown',unlock,{capture:true});
    document.addEventListener('visibilitychange',()=>{
      if(document.hidden)void this.context?.suspend().catch(()=>{});
      else if(this.context){this.needsGesture=this.context.state!=='running';void this.unlock();}
    });
  }

  async unlock():Promise<void>{
    try{
      if(!this.context){
        const Constructor=window.AudioContext??(window as unknown as {webkitAudioContext?:typeof AudioContext}).webkitAudioContext;
        if(!Constructor)throw new Error('Web Audio is unavailable');
        this.context=new Constructor({latencyHint:'interactive'});
        this.master=this.context.createGain();this.musicBus=this.context.createGain();this.sfxBus=this.context.createGain();this.ambienceBus=this.context.createGain();
        this.musicBus.connect(this.master);this.sfxBus.connect(this.master);this.ambienceBus.connect(this.master);
        const limiter=this.context.createDynamicsCompressor();limiter.threshold.value=-10;limiter.ratio.value=6;
        this.analyser=this.context.createAnalyser();this.analyser.fftSize=2048;
        this.master.connect(limiter);limiter.connect(this.analyser);this.analyser.connect(this.context.destination);this.applyVolumes();
        this.context.onstatechange=()=>{
          this.needsGesture=this.context?.state!=='running';
          if(this.context?.state==='running'){this.startAmbience();if(this.desired&&this.active?.id!==this.desired)void this.startMusic(this.desired);}
        };
      }
      if(this.context.state!=='running'){
        // Start a real buffer synchronously inside the trusted gesture, before any
        // await/fetch. This also wakes Safari's audio output after interruption.
        const pulse=this.context.createBufferSource();pulse.buffer=this.context.createBuffer(1,1,this.context.sampleRate);
        pulse.connect(this.master!);pulse.start(0);pulse.onended=()=>pulse.disconnect();
        await this.context.resume();
      }
      this.needsGesture=this.context.state!=='running';
      if(this.needsGesture)return;
      this.startAmbience();
      if(this.desired&&this.active?.id!==this.desired)void this.startMusic(this.desired);
    }catch(e){this.error=String(e);}
  }

  setPreferences(p:Partial<AudioPreferences>):void{
    for(const key of ['master','music','sfx','ambience'] as const){const n=p[key];if(typeof n==='number'&&Number.isFinite(n))this.preferences[key]=Math.max(0,Math.min(1,n));}
    if(typeof p.muted==='boolean')this.preferences.muted=p.muted;
    if(typeof p.crt==='boolean')this.preferences.crt=p.crt;
    document.body.dataset.crt=String(this.preferences.crt);this.applyVolumes();
  }
  getPreferences():AudioPreferences{return{...this.preferences};}
  private applyVolumes():void{
    const t=this.context?.currentTime??0;
    for(const [gain,value] of [[this.master,this.preferences.muted?0:this.preferences.master],[this.musicBus,this.preferences.music],[this.sfxBus,this.preferences.sfx],[this.ambienceBus,this.preferences.ambience]] as const){gain?.gain.setTargetAtTime(value,t,0.025);}
  }
  setListenerX(x:number):void{this.listenerX=x;}
  playMusic(id:MusicId):void{
    this.desired=id;
    if(this.active?.id===id)return;
    if(this.context?.state==='running')void this.startMusic(id);
  }
  private async startMusic(id:MusicId):Promise<void>{
    const url=MUSIC[id],ctx=this.context;if(!url||!ctx||!this.musicBus)return;
    const request=++this.token;
    try{
      let buffer=this.buffers.get(id);
      if(!buffer){
        let pending=this.pending.get(id);
        if(!pending){pending=fetch(url).then(r=>{if(!r.ok)throw new Error(`Audio ${r.status}: ${id}`);return r.arrayBuffer();}).then(bytes=>ctx.decodeAudioData(bytes));this.pending.set(id,pending);}
        buffer=await pending;this.buffers.set(id,buffer);this.pending.delete(id);
      }
      if(request!==this.token||this.desired!==id)return;
      this.fading?.source.stop();this.fading=null;
      const now=ctx.currentTime;
      if(this.active){this.fading=this.active;this.active=null;this.fading.gain.gain.cancelScheduledValues(now);this.fading.gain.gain.setValueAtTime(this.fading.gain.gain.value,now);this.fading.gain.gain.linearRampToValueAtTime(0,now+0.65);this.fading.source.stop(now+0.7);}
      const source=ctx.createBufferSource(),gain=ctx.createGain();source.buffer=buffer;source.loop=true;source.connect(gain);gain.connect(this.musicBus);
      gain.gain.setValueAtTime(0,now);gain.gain.linearRampToValueAtTime(0.9,now+0.65);
      const voice={source,gain,id};source.onended=()=>{source.disconnect();gain.disconnect();if(this.fading===voice)this.fading=null;};
      this.active=voice;source.start();this.history.push(id);if(this.history.length>30)this.history.shift();
    }catch(e){this.pending.delete(id);this.error=String(e);}
  }

  cue(name:string,x=this.listenerX):boolean{
    const ctx=this.context;if(!ctx||ctx.state!=='running'||!this.sfxBus||this.voices>=16)return false;
    const now=ctx.currentTime;if(now-(this.lastCue.get(name)??-100)<(name==='footstep'?0.14:0.07))return false;
    this.lastCue.set(name,now);this.counts[name]=(this.counts[name]??0)+1;this.voices++;
    const gain=ctx.createGain(),pan=ctx.createStereoPanner();pan.pan.value=Math.max(-0.7,Math.min(0.7,(x-this.listenerX)/160));gain.gain.value=name.startsWith('ambient-')?0.22:0.65;gain.connect(pan);pan.connect(name.startsWith('ambient-')&&this.ambienceBus?this.ambienceBus:this.sfxBus);
    const tone=(f:number,to:number,duration:number,delay=0,type:OscillatorType='triangle',volume=0.25)=>{
      const osc=ctx.createOscillator(),amp=ctx.createGain();osc.type=type;osc.frequency.setValueAtTime(f,now+delay);osc.frequency.exponentialRampToValueAtTime(Math.max(20,to),now+delay+duration);
      amp.gain.setValueAtTime(0,now+delay);amp.gain.linearRampToValueAtTime(volume,now+delay+0.005);amp.gain.exponentialRampToValueAtTime(0.001,now+delay+duration);
      osc.connect(amp);amp.connect(gain);osc.start(now+delay);osc.stop(now+delay+duration+0.01);osc.onended=()=>{osc.disconnect();amp.disconnect();};
    };
    const noise=(duration:number,volume=0.2,frequency=900)=>{
      const buffer=ctx.createBuffer(1,Math.ceil(ctx.sampleRate*duration),ctx.sampleRate),data=buffer.getChannelData(0);let seed=731;
      for(let i=0;i<data.length;i++){seed=(seed*1664525+1013904223)>>>0;data[i]=((seed/4294967296)*2-1)*Math.pow(1-i/data.length,2);}
      const source=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),amp=ctx.createGain();source.buffer=buffer;filter.type='lowpass';filter.frequency.value=frequency;amp.gain.value=volume;source.connect(filter);filter.connect(amp);amp.connect(gain);source.start();source.onended=()=>{source.disconnect();filter.disconnect();amp.disconnect();};
    };
    if(name==='footstep'){noise(0.045,0.14,1300);tone(150,65,0.055,0,'sine',0.16);}
    else if(name==='jump'){tone(220,650,0.12);noise(0.04,0.08);}
    else if(name==='land'){tone(180,50,0.13,0,'sine');noise(0.065,0.12,1100);}
    else if(name==='damage'){noise(0.2,0.5,2800);tone(120,45,0.19,0,'sawtooth',0.16);}
    else if(name==='death'){tone(330,24,0.55,0,'square',0.12);noise(0.3,0.16,600);}
    else if(['checkpoint','reboot','complete','confirm'].includes(name)){[330,440,660].forEach((f,i)=>tone(f,f,0.24,i*0.065,'triangle',0.18));}
    else if(name==='channel'){noise(0.025,0.12,2500);tone(310,640,0.09);}
    else if(name==='channel-invalid'||name==='back'){tone(180,80,0.14,0,'triangle',0.2);}
    else if(name==='hover'){tone(1100,1100,0.035,0,'sine',0.08);}
    else if(name==='click'){tone(700,260,0.065,0,'triangle',0.2);noise(0.02,0.08);}
    else if(name==='low-health'){tone(420,420,0.09,0,'sine',0.14);tone(330,330,0.08,0.14,'sine',0.12);}
    else if(name.startsWith('laser')){tone(name==='laser-warning'?880:1200,name==='laser-off'?150:620,0.16,0,'sine',0.15);if(name==='laser-on')noise(0.1,0.15,1800);}
    else if(name.startsWith('turret')){tone(name==='turret-lock'?440:240,90,0.12,0,'triangle',0.17);noise(0.06,0.14,1300);}
    else if(name==='metal-creak'){tone(77,61,0.5,0,'triangle',0.15);tone(103,73,0.45,0,'sine',0.1);noise(0.4,0.15,700);}
    else if(name==='metal-impact'){tone(120,32,0.32,0,'sine',0.4);noise(0.25,0.5,900);}
    else if(name==='metal-fall'){noise(0.35,0.15,700);tone(180,65,0.28,0,'triangle',0.1);}
    else if(name.startsWith('electric')){noise(0.18,0.23,3200);tone(380,780,0.16,0,'sawtooth',0.08);}
    else if(name.startsWith('corrupt')){noise(0.2,0.2,2400);tone(220,233,0.16,0,'square',0.08);tone(311,147,0.13,0.06,'triangle',0.12);}
    else if(name==='bolt-impact'){noise(0.07,0.12,1800);}
    else if(name==='room-click'){noise(0.045,0.23,500);tone(80,45,0.08,0,'sine');}
    else if(name==='signal'){noise(0.16,0.13,1400);}
    else if(name==='ambient-fan'){noise(0.6,0.22,360);tone(72,69,0.55,0,'sine',0.09);}
    else if(name==='ambient-relay'){noise(0.035,0.16,850);tone(90,52,0.18,0,'triangle',0.1);tone(103,73,0.16,0.25,'sine',0.07);}
    else if(name==='ambient-signal'){noise(0.2,0.09,1700);tone(470,460,0.34,0.05,'sine',0.035);}
    else {tone(330,260,0.08,0,'triangle',0.08);}
    // Every cue envelope ends within .6s. Disconnect the shared output once.
    setTimeout(()=>{gain.disconnect();pan.disconnect();this.voices=Math.max(0,this.voices-1);},850);
    return true;
  }

  private startAmbience():void{
    if(this.ambienceStarted||!this.context||!this.ambienceBus)return;this.ambienceStarted=true;
    for(const [frequency,level] of [[50,0.035],[100,0.012],[151,0.006]]){
      const osc=this.context.createOscillator(),gain=this.context.createGain();osc.type='sine';osc.frequency.value=frequency;gain.gain.value=level;osc.connect(gain);gain.connect(this.ambienceBus);osc.start();
    }
  }

  destroy():void{
    this.token++;this.active?.source.stop();this.fading?.source.stop();this.active=null;this.fading=null;
    void this.context?.close().catch(()=>{});this.context=null;
  }

  snapshot(){
    let rms=0,peak=0;
    if(this.analyser){this.analyser.getFloatTimeDomainData(this.samples);for(const sample of this.samples){rms+=sample*sample;peak=Math.max(peak,Math.abs(sample));}rms=Math.sqrt(rms/this.samples.length);}
    return{state:this.context?.state??'locked',needsGesture:this.needsGesture,output:{rms,peak,dbfs:rms?20*Math.log10(rms):-120},desired:this.desired,playing:this.active?.id??null,fading:this.fading?.id??null,
    musicVoices:Number(!!this.active)+Number(!!this.fading),sfxVoices:this.voices,preferences:this.getPreferences(),
    gains:{master:this.master?.gain.value??0,music:this.musicBus?.gain.value??0,sfx:this.sfxBus?.gain.value??0,ambience:this.ambienceBus?.gain.value??0},
    cues:{...this.counts},history:[...this.history],decoded:this.buffers.size,error:this.error};}
}
export const audioManager=new AudioManager();
