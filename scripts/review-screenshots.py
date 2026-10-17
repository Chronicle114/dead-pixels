"""Offline QA contact sheets; originals remain available for full-size review."""
from pathlib import Path
from PIL import Image, ImageDraw

root=Path(__file__).resolve().parents[1]
folder=root/'qa-artifacts/4173'
for size in ('1920x1080','1366x768','1280x720'):
    files=sorted(folder.glob(f'{size}-*.png'))
    sheet=Image.new('RGB',(1536,4*312),'#111820')
    d=ImageDraw.Draw(sheet)
    for i,file in enumerate(files):
        im=Image.open(file).convert('RGB').resize((512,288),Image.Resampling.NEAREST)
        x=(i%3)*512; y=(i//3)*312
        sheet.paste(im,(x,y)); d.text((x+8,y+291),file.stem,fill='#bdd0ca')
    sheet.save(folder/f'review-{size}.jpg',quality=95)
    print(size,len(files),'screenshots composed')
