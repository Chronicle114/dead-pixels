"""Offline pixel art authoring. Requires Pillow; no build/runtime dependency.
Run: python3 scripts/generate-art.py --kenney /path/to/verified/archive.zip
All coordinates are integer pixels; output is deliberately unfiltered.
"""
from pathlib import Path
from PIL import Image, ImageDraw
import argparse, zipfile, io, math, random, hashlib

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public/assets'
PALS = [
    ['#0a111d','#101c2b','#1b3040','#2c4853','#426069','#6b8b91','#a7c2bd','#80c9ba','#deb477'],
    ['#0d101d','#18192d','#292b44','#403b59','#585373','#8c86aa','#c4c1db','#aa9acb','#b4c4dc'],
    ['#100e17','#1a1622','#2e242e','#49303b','#65424a','#92616a','#ba8d86','#c47758','#e3ab76'],
]

def save(im, path):
    p = OUT/path; p.parent.mkdir(parents=True, exist_ok=True); im.save(p, optimize=True)

def panel(d, box, p, inset=True):
    x,y,w,h=box
    d.rectangle((x,y,x+w-1,y+h-1),fill=p[0])
    d.rectangle((x+1,y+1,x+w-2,y+h-2),fill=p[3])
    d.line((x+1,y+1,x+w-2,y+1),fill=p[5])
    d.line((x+1,y+1,x+1,y+h-2),fill=p[4])
    if inset: d.rectangle((x+3,y+3,x+w-4,y+h-4),fill=p[2])

def terminal(d,x,y,p,ch):
    panel(d,(x,y,33,27),p)
    d.rectangle((x+4,y+4,x+28,y+18),fill=p[0])
    d.line((x+6,y+5,x+26,y+5),fill=p[3])
    if ch==1:
        for i,w in enumerate([7,17,11,15]): d.line((x+7,y+8+i*2,x+7+w,y+8+i*2),fill=p[5])
        d.point((x+25,y+16),fill=p[7])
    elif ch==2:
        d.ellipse((x+11,y+7,x+21,y+17),outline=p[5])
        d.line((x+6,y+12,x+26,y+12),fill=p[4])
    else:
        d.line([(x+6,y+5),(x+19,y+9),(x+13,y+13),(x+26,y+17)],fill=p[5])
        d.rectangle((x+8,y+15,x+15,y+16),fill=p[7])
    for i in range(4): d.line((x+5+i*4,y+22,x+7+i*4,y+22),fill=p[4])
    d.point((x+27,y+22),fill=p[8])
    d.rectangle((x+13,y+27,x+19,y+31),fill=p[2])

def reel(d,x,y,r,p,ch):
    d.ellipse((x-r,y-r,x+r,y+r),fill=p[1],outline=p[4])
    d.ellipse((x-r+2,y-r+2,x+r-2,y+r-2),outline=p[3])
    d.ellipse((x-2,y-2,x+2,y+2),fill=p[5])
    for a in range(0,360,60):
        xx=x+round(math.cos(math.radians(a))*r*.65); yy=y+round(math.sin(math.radians(a))*r*.65)
        d.ellipse((xx-1,yy-1,xx+1,yy+1),fill=p[0])
    if ch==3: d.line((x,y,x+r,y-r),fill=p[7])

def backgrounds():
    for ch,p in enumerate(PALS,1):
        rng=random.Random(182+ch)
        im=Image.new('RGBA',(640,180),p[0]); d=ImageDraw.Draw(im)
        # Quiet vaulted archive, vertical depth and distant gantries.
        for y in range(180):
            t=max(0,1-abs(y-94)/100)*.45
            a=tuple(int(p[0][i:i+2],16) for i in (1,3,5)); b=tuple(int(p[2][i:i+2],16) for i in (1,3,5))
            col=tuple(round(a[i]*(1-t)+b[i]*t) for i in range(3))+(255,)
            d.line((0,y,639,y),fill=col)
        for x in range(-30,700,78):
            d.polygon([(x,0),(x+10,0),(x+32,29),(x+32,180),(x+23,180),(x+23,34)],fill=p[1])
            d.line((x+11,0,x+34,29,x+34,180),fill=p[2])
            for yy in (35,110):
                d.line((x+33,yy,x+82,yy),fill=p[2]); d.line((x+33,yy+3,x+82,yy+3),fill=p[1])
        for x in (32,119,218,319,413,521,597):
            y=52+(x%3)*12
            d.rectangle((x,y,x+24,173),fill=p[1],outline=p[2])
            for yy in range(y+7,170,9):
                d.line((x+4,yy,x+20,yy),fill=p[2])
                if ch!=3 or yy%3: d.point((x+18,yy+2),fill=p[3])
        # Giant old analog signal disc with antenna lattice.
        d.ellipse((148,30,238,120),outline=p[2],width=2)
        d.ellipse((155,37,231,113),outline=p[1])
        for a in range(0,360,30):
            x=193+round(math.cos(math.radians(a))*43); y=75+round(math.sin(math.radians(a))*43)
            d.line((193,75,x,y),fill=p[2])
        d.ellipse((184,66,202,84),fill=p[1],outline=p[3])
        if ch==2:
            for y in range(36,123,6): d.line((150,y,236,y),fill=p[1])
        if ch==3:
            d.polygon([(190,30),(195,51),(182,65),(201,83),(195,119),(206,83),(190,64),(201,51)],fill=p[0])
        save(im,Path(f'backgrounds/archive-{ch}-far.png'))
        im=Image.new('RGBA',(640,180)); d=ImageDraw.Draw(im)
        # Ceiling conduit bank, cables with a deliberate sag, no walkable-looking ledges.
        for y in (26,29,33):
            d.line((0,y,639,y),fill=p[2]); d.line((0,y+1,639,y+1),fill=p[1])
        for x in (14,171,294,462,611):
            d.rectangle((x,20,x+5,37),fill=p[3]); d.line((x+1,21,x+1,35),fill=p[4])
        for x in (50,245,443):
            pts=[(x,34),(x+8,43),(x+27,49),(x+57,51),(x+84,45),(x+94,34)]
            d.line(pts,fill=p[0],width=3); d.line(pts,fill=p[3],width=1)
            if ch==3: d.rectangle((x+40,48,x+49,53),fill=(0,0,0,0))
        # Tape archive stations and relays, composed around the playable route.
        for x,y in [(8,74),(159,70),(321,61),(480,76),(570,59)]:
            panel(d,(x,y,43,71),p)
            d.rectangle((x+4,y+4,x+38,y+10),fill=p[1])
            for xx in (x+8,x+19,x+29): d.line((xx,y+6,xx+5,y+6),fill=p[4])
            reel(d,x+13,y+25,9,p,ch); reel(d,x+31,y+25,8,p,ch)
            d.line((x+13,y+34,x+20,y+44,x+31,y+34),fill=p[4])
            for yy in range(y+48,y+64,4): d.line((x+6,yy,x+35,yy),fill=p[1])
            for xx in (x+6,x+10,x+14): d.point((xx,y+67),fill=p[5])
            if ch==2:
                for yy in (y+12,y+38,y+63): d.rectangle((x,yy,x+42,yy+1),fill=(0,0,0,0))
            if ch==3:
                d.polygon([(x+38,y),(x+23,y+16),(x+31,y+35),(x+18,y+53)],fill=p[0])
        terminal(d,73,76,p,ch); terminal(d,368,58,p,ch); terminal(d,532,91,p,ch)
        for x in (126,279,433):
            d.line((x,35,x,66,x+4,70,x+4,108),fill=p[3],width=2)
            for yy in range(48,65,4): d.line((x-2,yy,x+2,yy),fill=p[4])
        # Fine data glyphs are symbolic not illegible tiny text.
        for x,y in [(121,92),(281,100),(453,61)]:
            d.rectangle((x,y,x+17,y+15),outline=p[3])
            for i in range(3): d.line((x+4,y+4+i*3,x+8+i*2,y+4+i*3),fill=p[4])
        save(im,Path(f'backgrounds/archive-{ch}-mid.png'))
        # Environmental storytelling: discarded coils, old memory cassettes,
        # terminal shrine at exit. Dark silhouettes lie behind collision surfaces.
        im=Image.new('RGBA',(640,180)); d=ImageDraw.Draw(im)
        for x in (51,157,318,460,548):
            d.line((x,163,x,151,x+5,147,x+16,147),fill=p[2],width=2)
            for i in range(3): d.rectangle((x+7+i*4,153,x+9+i*4,162),fill=p[3],outline=p[2])
        for x in (17,180,352,508):
            d.arc((x,153,x+20,172),180,355,fill=p[4]); d.arc((x+3,155,x+16,167),180,355,fill=p[3])
        panel(d,(573,128,40,36),p); terminal(d,577,130,p,ch)
        d.line((568,163,568,122,611,122),fill=p[3],width=2)
        # Exit framing is behind original trigger; center remains free.
        d.rectangle((589,139,610,163),fill=p[1],outline=p[4])
        d.line((590,140,609,140),fill=p[7]); d.line((590,140,590,162),fill=p[5])
        save(im,Path(f'decorations/archive-{ch}-near.png'))

def explorer():
    sheet=Image.new('RGBA',(16*17,24)); frames=[]
    outline='#09121e'; steel='#657e89'; rim='#b6c9c6'; body='#243d4e'; light='#d6ece0'; cyan='#7dd9ce'; amber='#d3a378'
    for idx in range(17):
        im=Image.new('RGBA',(16,24)); d=ImageDraw.Draw(im)
        kind='idle' if idx<4 else 'run' if idx<10 else 'jump' if idx<12 else 'fall' if idx<14 else 'land'
        f=idx if idx<4 else idx-4 if idx<10 else idx-10 if idx<12 else idx-12 if idx<14 else idx-14
        bob=([0,0,1,0][f] if kind=='idle' else [0,-1,-1,0,0,-1][f] if kind=='run' else 0)
        squash=[2,1,0][f] if kind=='land' else 0
        hy=3+bob+squash
        # antenna, asymmetrical cable backpack, scarf tail
        d.line((9,hy,10,hy-2),fill=steel); d.point((10,hy-2),fill=amber)
        d.rectangle((1,hy+9,4,hy+15),fill=outline); d.line((2,hy+10,2,hy+14),fill=steel)
        tail=(2+(f%3),hy+11+(f%2))
        d.polygon([(5,hy+9),tail,(0,hy+10+(f%2)),(3,hy+13),(6,hy+11)],fill=amber)
        d.rounded_rectangle((3,hy,12,hy+9),radius=2,fill=outline)
        d.rectangle((4,hy+1,11,hy+7),fill=steel)
        d.line((5,hy+1,10,hy+1),fill=rim); d.line((4,hy+2,4,hy+5),fill=rim)
        d.rectangle((5,hy+3,11,hy+6),fill=body)
        blink=kind=='idle' and f==3
        if blink: d.line((7,hy+5,10,hy+5),fill=cyan)
        else:
            d.rectangle((7,hy+4,8,hy+5),fill=light); d.line((10,hy+4,10,hy+5),fill=cyan)
        d.point((11,hy+2),fill=amber)
        d.rectangle((5,hy+9,11,hy+15-squash),fill=outline)
        d.rectangle((6,hy+10,10,hy+14-squash),fill=body)
        d.line((6,hy+9,10,hy+9),fill=amber); d.point((9,hy+11),fill=cyan)
        # Arms, independent gait and trailing scarf, genuinely distinct silhouettes.
        arm=[1,0,-1,0,1,2][f] if kind=='run' else -1 if kind=='jump' else 1 if kind=='fall' else -1 if kind=='land' else 0
        d.line((4,hy+10,3,hy+14+arm),fill=steel,width=2)
        d.line((11,hy+10,12,hy+14-arm),fill=rim)
        if kind=='jump': legs=[(5,18,7,21),(9,18,11,20)] if f==0 else [(5,18,7,20),(9,18,11,22)]
        elif kind=='fall': legs=[(5,19,7,22),(9,19,11,23)] if f==0 else [(5,19,7,23),(9,19,11,22)]
        elif kind=='run':
            steps=[(-2,1),(-1,0),(1,-1),(2,-2),(1,0),(-1,1)]
            l,r=steps[f]; legs=[(5+l,18+bob,7+l,22),(9+r,18+bob,11+r,23)]
        else: legs=[(5,18+squash,7,23),(9,18+squash,11,23)]
        for x,y,x2,y2 in legs:
            d.rectangle((x,y,x2,y2),fill=outline); d.line((x,y,x,y2-1),fill=steel); d.line((x,y2,x2+1,y2),fill=rim)
        # Chest phosphor activity is drawn as part of each pose, never an alpha blink.
        d.point((7+(f%2),hy+12),fill=cyan if f%2 else amber)
        frames.append(im); sheet.paste(im,(idx*16,0))
    hashes=[hashlib.sha256(im.tobytes()).hexdigest() for im in frames]
    assert len(set(hashes))==17, [(i,j) for i in range(17) for j in range(i) if hashes[i]==hashes[j]]
    save(sheet,Path('characters/explorer.png'))
    save(Image.new('RGBA',(8,12)),Path('characters/carrier.png'))

PLATFORMS=[(224,16,'floor'),(48,16,'relay'),(80,16,'memory'),(32,16,'void'),(128,16,'floor'),(16,64,'relay'),(208,16,'floor')]
def platforms():
    for index,(w,h,style) in enumerate(PLATFORMS):
        im=Image.new('RGBA',(w,h)); d=ImageDraw.Draw(im)
        p=PALS[1 if style=='memory' else 2 if style=='void' else 0]
        # Continuous silhouette including exact collision boundary, not a spaced tile grid.
        d.rectangle((0,0,w-1,h-1),fill=p[0]); d.line((0,0,w-1,0),fill=p[6])
        d.line((0,1,w-1,1),fill=p[4]); d.line((0,2,w-1,2),fill=p[1])
        for y in range(3,h,16):
            for x in range(0,w,16):
                v=(x//16+index*3+y//16)%4
                panel(d,(x,y,16,min(13,h-y)),p)
                if style=='floor':
                    if v in (0,2):
                        for xx in range(x+4,x+13,3): d.line((xx,y+4,xx,y+8),fill=p[1])
                    else:
                        d.line((x+4,y+5,x+10,y+5,x+10,y+8),fill=p[4])
                        d.point((x+5,y+5),fill=p[8] if v==1 else p[7])
                    if v==3: d.line((x+8,y+1,x+5,y+4),fill=p[1])
                elif style=='relay':
                    d.rectangle((x+4,y+4,x+11,y+8),fill=p[1])
                    for xx in range(x+5,x+11,2): d.line((xx,y+3,xx,y+9),fill=p[5])
                    d.point((x+12,y+4),fill=p[8])
                elif style=='memory':
                    d.line((x+3,y+4,x+12,y+4),fill=p[5]); d.line((x+4,y+7,x+9,y+7),fill=p[4])
                    for xx in (x+3,x+12): d.point((xx,y+9),fill=p[7])
                else:
                    d.polygon([(x+3,y+3),(x+11,y+3),(x+9,y+5),(x+12,y+8),(x+4,y+8)],fill=p[3])
                    d.line((x+4,y+5,x+8,y+5,x+7,y+9,x+12,y+9),fill=p[7])
                d.point((x+2,y+2),fill=p[5]); d.point((x+13,y+10),fill=p[4])
        d.line((0,1,0,h-1),fill=p[5]); d.line((w-1,1,w-1,h-1),fill=p[3])
        save(im,Path(f'tilesets/platform-{index}.png'))
    # Preserve the exact original 16x17 exit overlap rectangle.
    im=Image.new('RGBA',(16,17)); d=ImageDraw.Draw(im); p=PALS[0]
    panel(d,(0,0,16,17),p); d.rectangle((3,2,12,15),fill=p[0])
    for x,col in enumerate(['#dfbf88','#80c9ba','#668fa3','#a497bd','#d4ded4']):
        d.line((4+x*2,4,4+x*2,12),fill=col)
    d.line((2,1,13,1),fill='#a7e2d5'); save(im,Path('decorations/exit.png'))

def kenney(archive):
    if not archive: return
    with zipfile.ZipFile(archive) as z:
        # Two CC0 mechanical cable fittings, used as background cabinet details.
        for i in (80,81):
            im=Image.open(io.BytesIO(z.read(f'Tiles/tile_{i:04d}.png'))).convert('RGBA')
            # Pixel-preserving 18->16 crop, recolored into the archive palette.
            im=im.crop((1,1,17,17)); px=im.load(); p=PALS[0]
            for y in range(16):
                for x in range(16):
                    r,g,b,a=px[x,y]
                    if a: px[x,y]=tuple(int(p[min(5,int((r+g+b)/3/48))][j:j+2],16) for j in (1,3,5))+(a,)
            save(im,Path(f'decorations/kenney-grille-{i}.png'))
        license=z.read('License.txt').decode('utf-8-sig')
        (ROOT/'KENNEY_LICENSE.txt').write_text(license)

if __name__=='__main__':
    ap=argparse.ArgumentParser(); ap.add_argument('--kenney'); args=ap.parse_args()
    explorer(); platforms(); backgrounds(); kenney(args.kenney)
    print('Wrote local PNG character, platform and environment assets into',OUT)
