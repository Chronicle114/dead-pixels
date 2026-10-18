"""Original deterministic score authoring; Python standard library only.
16-bar arrangements, recurring four-note motif, different harmony/orchestration.
Outputs local 22.05kHz mono PCM WAV, not runtime random-note synthesis.
"""
from pathlib import Path
from array import array
import math, wave, json, hashlib, random

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'public/assets/audio'
RATE=22050
# root MIDI, mode offsets for each four-bar harmony, beat/melody/orchestration.
SCORES=[
 ('menu','The Last Signal',88,50,[(0,'min'),(8,'maj'),(3,'maj'),(10,'maj')],'synthwave'),
 ('intro','A Room That Remembers',64,48,[(0,'min'),(5,'min'),(8,'maj'),(7,'maj')],'ambient'),
 ('level-1','First Signal',84,52,[(0,'min'),(8,'maj'),(3,'maj'),(10,'maj')],'explore'),
 ('level-2','Lost Frequency',102,45,[(0,'min'),(5,'maj'),(10,'maj'),(3,'maj')],'syncopated'),
 ('level-3','Broken Circuits',112,48,[(0,'min'),(8,'maj'),(10,'maj'),(7,'maj')],'industrial'),
 ('level-4','Memory Leak',76,53,[(0,'min'),(8,'maj'),(3,'maj'),(10,'maj')],'memory'),
 ('level-5','Static Interference',116,50,[(0,'min'),(11,'dim'),(8,'maj'),(7,'maj')],'glitch'),
 ('level-6','System Failure',108,43,[(0,'min'),(8,'maj'),(5,'min'),(7,'maj')],'dark'),
 ('level-7','Final Transmission',96,52,[(0,'min'),(5,'min'),(8,'maj'),(7,'maj')],'finale'),
 ('ending','Outside the Glass',72,48,[(0,'maj'),(4,'min'),(9,'min'),(5,'maj')],'resolve'),
]

def render(identifier,title,bpm,root,harmony,style):
    beat=60/bpm; duration=64*beat; length=round(duration*RATE)
    buffer=array('f',[0])*length; cache={}; events=[]
    def mix(samples,time,volume=1):
        start=round(time*RATE)
        for i,value in enumerate(samples):
            j=start+i
            if j>=length:j-=length
            buffer[j]+=value*volume
    def note(midi,time,beats,voice,volume):
        seconds=beats*beat
        key=(midi,round(seconds,3),voice)
        if key not in cache:
            tail=.28 if voice in ('pad','bell') else .07
            size=round((seconds+tail)*RATE); frequency=440*2**((midi-69)/12); samples=array('f')
            for i in range(size):
                t=i/RATE; phase=2*math.pi*frequency*t
                attack=min(1,t/(.09 if voice=='pad' else .012))
                release=min(1,max(0,(seconds+tail-t)/tail))
                if voice=='pad': value=(math.sin(phase)+.22*math.sin(phase*2)+.12*math.sin(phase*1.003))*.45
                elif voice=='bell': value=(math.sin(phase)+.32*math.sin(phase*2.01)+.12*math.sin(phase*3.98))*math.exp(-t*3.3)*.7
                elif voice=='bass': value=(math.sin(phase)+.22*math.sin(phase*2)+.13*math.sin(phase*3))*.72
                elif voice=='pluck': value=(math.sin(phase)+.25*math.sin(phase*3)+.12*math.sin(phase*5))*math.exp(-t*5)*.75
                else: value=(math.sin(phase)+.28*math.sin(phase*3)+.15*math.sin(phase*5)+.07*math.sin(phase*7))*.66
                samples.append(value*attack*release)
            cache[key]=samples
        mix(cache[key],time,volume); events.append((midi,round(time,3),beats,voice,volume))
    rng=random.Random(804)
    drums={}
    for kind,seconds in [('kick',.18),('snare',.13),('hat',.035),('tick',.018)]:
        samples=array('f')
        for i in range(round(seconds*RATE)):
            t=i/RATE; noise=rng.random()*2-1
            if kind=='kick': value=math.sin(2*math.pi*(54*t+3.3*(1-math.exp(-t*25))))*math.exp(-t*26)
            elif kind=='snare': value=(noise*.7+math.sin(2*math.pi*173*t)*.2)*math.exp(-t*32)
            else: value=noise*math.exp(-t*(110 if kind=='hat' else 190))*.4
            samples.append(value*min(1,t/.002))
        drums[kind]=samples
    for bar in range(16):
        chordRoot,chordKind=harmony[(bar//2)%4]
        base=root+chordRoot; intervals=[0,3,6] if chordKind=='dim' else [0,3,7] if chordKind=='min' else [0,4,7]
        time=bar*4*beat
        for pitch in intervals: note(base+pitch+12,time,3.8,'pad',.048 if style not in ('ambient','memory','resolve') else .08)
        bassSteps=[0,1.5,2.5,3.5] if style=='syncopated' else [0,2] if style in ('explore','memory','resolve','ambient') else [0,.5,1,1.5,2,2.5,3,3.5]
        for i,step in enumerate(bassSteps):
            pitch=base-12+(7 if i%4==3 else 0)
            note(pitch,time+step*beat,.38 if len(bassSteps)>4 else 1.4,'bass',.14 if style!='ambient' else .06)
        # A recurring motif (root, fifth, fourth, minor/major third) is answered
        # by different rhythms, registers and instruments in each composition.
        motif=[0,7,5,3 if chordKind!='maj' else 4]
        if style in ('ambient','memory','resolve'):
            if bar%2==0:
                for i,pitch in enumerate(motif):note(base+24+pitch,time+i*beat*.9,.9,'bell' if style!='resolve' else 'pluck',.075)
            if style=='memory' and bar>=8:note(base+31,time+2.5*beat,1.1,'bell',.065)
        else:
            offsets=[0,.75,1.5,2.75] if style=='syncopated' else [0,1,2,3]
            if style=='glitch':offsets=[0,.5,1.75,3.25]
            if style=='industrial':offsets=[.25,1.25,2,2.75]
            leadVolume=.12 if style in ('synthwave','finale') else .085
            if style=='finale' and bar<4:leadVolume*=.45
            for i,step in enumerate(offsets):
                pitch=base+24+motif[(i+bar%2)%4]+(12 if bar>=12 and i==3 else 0)
                note(pitch,time+step*beat,.55 if style!='glitch' else .22,'lead' if style in ('synthwave','dark','finale') else 'pluck',leadVolume)
        if style not in ('ambient','memory','resolve'):
            arpSteps=range(16) if style in ('industrial','glitch') else range(8)
            stepLength=.25 if style in ('industrial','glitch') else .5
            for i in arpSteps:
                if style=='glitch' and i%5==3:continue
                note(base+12+intervals[(i+bar)%3],time+i*stepLength*beat,.16,'pluck',.035)
            for step in ([0,1,2,3] if style in ('dark','finale') else [0,2.5]):mix(drums['kick'],time+step*beat,.18)
            for step in [1,3]:mix(drums['snare'],time+step*beat,.10)
            for i in range(8):mix(drums['hat'],time+i*.5*beat,.075 if i%2 else .045)
            if style=='glitch':
                for i in [3,7,14]:mix(drums['tick'],time+i*.25*beat,.07)
        elif style=='memory' and bar>=8:
            mix(drums['kick'],time,.06)
    # Quiet stereo-like space using circular taps; the WAV remains portable mono.
    dry=array('f',buffer)
    for delay,gain in [(.173,.14),(.311,.08)]:
        offset=round(delay*RATE)
        for i,value in enumerate(dry):buffer[(i+offset)%length]+=value*gain
    peak=max(abs(v) for v in buffer); scale=.78/max(peak,.001)
    pcm=array('h'); fade=round(.012*RATE)
    for i,value in enumerate(buffer):
        edge=min(1,i/fade,(length-1-i)/fade)
        pcm.append(round(math.tanh(value*scale)*28000*max(0,edge)))
    OUT.mkdir(parents=True,exist_ok=True); file=OUT/f'{identifier}.wav'
    with wave.open(str(file),'wb') as wav:wav.setnchannels(1);wav.setsampwidth(2);wav.setframerate(RATE);wav.writeframes(pcm.tobytes())
    rms=math.sqrt(sum((v/32768)**2 for v in pcm)/len(pcm))
    assert pcm[0]==pcm[-1]==0 and rms>.035 and max(abs(v) for v in pcm)<30000
    return {'id':identifier,'title':title,'bpm':bpm,'seconds':round(duration,3),'arrangement':style,'events':len(events),'scoreHash':hashlib.sha256(repr(events).encode()).hexdigest(),'pcmHash':hashlib.sha256(pcm.tobytes()).hexdigest(),'rms':round(rms,4),'license':'CC0-1.0','author':'DEAD PIXELS original programmatic score'}

if __name__=='__main__':
    metadata=[]
    for score in SCORES:
        entry=render(*score);metadata.append(entry);print(entry['id'],entry['seconds'],'seconds',entry['events'],'authored notes',flush=True)
    assert len({e['pcmHash'] for e in metadata})==10
    (OUT/'soundtrack.json').write_text(json.dumps(metadata,indent=2))
