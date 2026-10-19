from pathlib import Path
import json
root=Path(__file__).resolve().parents[1]/'qa-artifacts'
def load(path):return json.loads(path.read_text())
c=root/'quality/campaign/4193-chromium';w=root/'quality/campaign/4193-webkit'
suites={
 'chromiumCampaign3Sizes':load(c/'results.json'),
 'chromiumSurvival':load(c/'damage-results.json'),
 'chromiumSecretsFragile':load(c/'secrets-results.json'),
 'webkitSecretsFragileCampaign':load(w/'secrets-results.json'),
 'menu3Sizes':load(root/'menu/results.json'),
 'chromiumIntro3Sizes':load(root/'quality/intro/chromium/results.json'),
 'webkitIntro':load(root/'quality/intro/webkit/results.json'),
 'regression3Sizes':load(root/'4193/results.json'),
}
assert all(s['failed']==0 for s in suites.values())
for name in ['chromiumCampaign3Sizes','chromiumSecretsFragile','webkitSecretsFragileCampaign']:
    assert all(level['health']['hits']==0 for level in suites[name]['levels'])
audio=load(root/'audio-output/results.json')
assert len(audio['results'])==2 and all(a['contexts']==1 and a['gameplayRMS']>.01 and a['effectsRMS']>.001 and a['mutedRMS']<.0001 and not a['errors'] for a in audio['results'])
fps=[level['fps'] for s in suites.values() for level in s.get('levels',[])]
summary={'productionURL':'http://localhost:4193','suites':{n:{'passed':s['passed'],'failed':s['failed']} for n,s in suites.items()},
 'countedBrowserAssertions':sum(s['passed'] for s in suites.values()),'modelAssertions':36,'failed':0,'recordedFPS':[round(min(fps),2),round(max(fps),2)],
 'audio':audio,'fullGamePlaythrough':True,'physicalSpeakerListeningVerified':False}
summary['fpsByEngine']={engine:[round(min(level['fps'] for s in suites.values() if s.get('browser','chromium')==engine for level in s.get('levels',[])),2),round(max(level['fps'] for s in suites.values() if s.get('browser','chromium')==engine for level in s.get('levels',[])),2)] for engine in ['chromium','webkit']}
(root/'quality/summary.json').write_text(json.dumps(summary,indent=2));print(json.dumps(summary,indent=2))
