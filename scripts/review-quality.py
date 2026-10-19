from pathlib import Path
from PIL import Image,ImageDraw
root=Path(__file__).resolve().parents[1]/'qa-artifacts'
out=root/'quality/review';out.mkdir(exist_ok=True)
c=root/'quality/campaign/4193-chromium';w=root/'quality/campaign/4193-webkit'
def board(name,files):
    image=Image.new('RGB',(1536,312*((len(files)+2)//3)),'#101820');d=ImageDraw.Draw(image)
    for i,file in enumerate(files):
        frame=Image.open(file).convert('RGB').resize((512,288),Image.Resampling.NEAREST);x=i%3*512;y=i//3*312
        image.paste(frame,(x,y));d.text((x+7,y+291),file.stem,fill='#bdd0ca')
    image.save(out/f'{name}.jpg',quality=95)
for size in ['1920x1080','1366x768','1280x720']:
    files=[root/'menu'/f'{size}-main.png']+[root/'quality/intro/chromium'/f'{size}-{phase}.png' for phase in ['room','signal','awakening','entering']]
    files +=[c/f'{size}-normal-level-{n}-route.png' for n in range(1,8)]
    board(f'{size}-campaign-intro',files)
    board(f'{size}-ending',[c/f'{size}-normal-{phase}.png' for phase in ['ending-transmission','ending-reconstruction','ending-escape','ending-lost','ending-found','ending-card']])
special=['secret-activation','secret-division','secret-erasure','fragile-warning','fragile-escape','turret-cover','ending-laboratory','ending-failure','ending-fragmentation']
board('secrets-fragile-story',[c/f'1366x768-secrets-{name}.png' for name in special])
board('webkit-secrets-fragile',[w/f'1366x768-secrets-{name}.png' for name in special[:6]])
print('Created eight quality review boards from actual production screenshots')
