from pathlib import Path
import wave,json,hashlib,math
from array import array
root=Path(__file__).resolve().parents[1]/'public/assets/audio'
entries=json.loads((root/'soundtrack.json').read_text())
hashes=set()
for item in entries:
    with wave.open(str(root/f"{item['id']}.wav"),'rb') as f:
        assert f.getnchannels()==1 and f.getsampwidth()==2 and f.getframerate()==22050
        samples=array('h',f.readframes(f.getnframes()))
    assert samples[0]==samples[-1]==0
    assert max(abs(s) for s in samples)<30000
    assert math.sqrt(sum((s/32768)**2 for s in samples)/len(samples))>.035
    digest=hashlib.sha256(samples.tobytes()).hexdigest()
    assert digest==item['pcmHash'] and digest not in hashes
    hashes.add(digest)
assert len(entries)==10
print('10 distinct scored WAVs: format, manifest hashes, non-silence, peaks and loop edges PASS')
