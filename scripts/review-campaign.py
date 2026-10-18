"""Create labeled review boards from the actual final production playthrough.
No images are synthesized; the full-resolution evidence remains alongside them.
"""
from pathlib import Path
from PIL import Image, ImageDraw

root=Path(__file__).resolve().parents[1]/'qa-artifacts/campaign/4173'

def compose(size, label, names):
    board=Image.new('RGB',(1536,312*((len(names)+2)//3)),'#101820')
    d=ImageDraw.Draw(board)
    for i,name in enumerate(names):
        file=root/f'{size}-{name}.png'
        im=Image.open(file).convert('RGB').resize((512,288),Image.Resampling.NEAREST)
        x=(i%3)*512; y=(i//3)*312
        board.paste(im,(x,y)); d.text((x+8,y+291),f'{size} / {name}',fill='#bdd0ca')
    board.save(root/f'review-{size}-{label}.jpg',quality=95)

for size in ['1920x1080','1366x768','1280x720']:
    early=[]; late=[]
    for number in range(1,8):
        names=[f'level-{number}-start',f'level-{number}-'+('airborne' if number>=3 else 'checkpoint'),f'level-{number}-route']
        (early if number<=4 else late).extend(names)
    late.extend(['ending-transmission','ending-waiting','ending-card'])
    compose(size,'levels-1-4',early)
    compose(size,'levels-5-7-ending',late)
    compose(size,'exits',[f'level-{n}-exit' for n in range(1,8)])
    print(size,'reviewed evidence boards contain all seven levels and ending')
