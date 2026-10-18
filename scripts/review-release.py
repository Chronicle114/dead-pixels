"""Contact sheets from actual release QA captures. Run after both campaign modes."""
from pathlib import Path
from PIL import Image,ImageDraw
import sys
root=Path(__file__).resolve().parents[1]/'qa-artifacts'
port=sys.argv[1] if len(sys.argv)>1 else '4183'
out=root/'release-review';out.mkdir(exist_ok=True)
for size in ('1920x1080','1366x768','1280x720'):
    files=[root/'menu'/f'{size}-{name}.png' for name in ['main','settings','credits','confirm']]
    files += [root/'intro'/f'{size}-{name}.png' for name in ['room','signal','awakening','entering']]
    campaign=root/'campaign'/port
    files += [campaign/f'{size}-damage-{name}.png' for name in ['warning-laser','hit-laser','warning-electric','hit-electric','warning-machinery','hit-machinery','warning-turret','hit-turret','warning-corruption','hit-corruption','low-hp','death','reboot']]
    files += [campaign/f'{size}-{name}.png' for name in ['ending-transmission','ending-waiting','ending-card']]
    for batch in range(2):
        selected=files[batch*12:(batch+1)*12]
        board=Image.new('RGB',(1536,1248),'#101820');d=ImageDraw.Draw(board)
        for i,file in enumerate(selected):
            image=Image.open(file).convert('RGB').resize((512,288),Image.Resampling.NEAREST)
            x=i%3*512;y=i//3*312;board.paste(image,(x,y));d.text((x+7,y+291),file.stem,fill='#bdd0ca')
        board.save(out/f'{size}-review-{batch+1}.jpg',quality=95)
    print(size,len(files),'actual release screenshots on review boards')
