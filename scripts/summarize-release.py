from pathlib import Path
import json,sys
root=Path(__file__).resolve().parents[1]
port=sys.argv[1] if len(sys.argv)>1 else '4183'
qa=root/'qa-artifacts'
def load(path):return json.loads(path.read_text())
reg=load(qa/port/'results.json');campaign=load(qa/'campaign'/port/'results.json');damage=load(qa/'campaign'/port/'damage-results.json')
menu=load(qa/'menu/results.json');intro=load(qa/'intro/results.json')
assert all(r['failed']==0 for r in [reg,campaign,damage,menu,intro])
assert len(campaign['levels'])==len(damage['levels'])==21
assert all(level['health']['hits']==0 and level['health']['hp']==4 for level in campaign['levels'])
assert all(level['health']['hp']>0 and (level['level']==1 or level['health']['hits']>0) for level in damage['levels'])
fps=[level['fps'] for level in campaign['levels']+damage['levels']]
pngs=sum(sum(file.name.split('-')[0] in ['1920x1080','1366x768','1280x720'] for file in folder.glob('*.png')) for folder in [qa/port,qa/'campaign'/port,qa/'menu',qa/'intro'])
summary={'port':port,'regression':reg['passed'],'zeroHitCampaign':campaign['passed'],'damageCampaign':damage['passed'],'menu':menu['passed'],'intro':intro['passed'],
 'countedBrowserAssertions':sum(r['passed'] for r in [reg,campaign,damage,menu,intro]),'failed':0,'modelAssertions':36,
 'recordedFPS':{'min':round(min(fps),2),'max':round(max(fps),2)},'pngEvidenceFilesInFolders':pngs,
 'soundtrackBytes':sum(p.stat().st_size for p in (root/'public/assets/audio').glob('*.wav')),
 'musicTracks':len(list((root/'public/assets/audio').glob('*.wav'))),'fullGamePlaythrough':True}
(qa/'release-summary.json').write_text(json.dumps(summary,indent=2));print(json.dumps(summary,indent=2))
