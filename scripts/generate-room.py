"""Original shared menu/intro/ending pixel-art location. Pillow authoring only."""
from pathlib import Path
from PIL import Image,ImageDraw
root=Path(__file__).resolve().parents[1]
im=Image.new('RGB',(320,180),'#090f19');d=ImageDraw.Draw(im)
for y in range(180):
    glow=max(0,1-abs(y-106)/100)
    d.line((0,y,319,y),fill=(9+int(glow*5),15+int(glow*9),25+int(glow*10)))
# Forgotten laboratory wall, conduits and patched plaster.
for x in (9,170,280):
    d.line((x,0,x,135),fill='#243b43');d.line((x+2,0,x+2,135),fill='#122630')
for y in (18,21):d.line((0,y,319,y),fill='#20343c')
for x in range(14,313,40):d.rectangle((x,15,x+5,23),fill='#30424a')
d.rectangle((176,38,218,85),fill='#10222d',outline='#2c4149')
for y in range(44,79,7):d.line((181,y,211,y),fill='#1d3540')
d.line([(222,0),(222,44),(234,56),(234,108),(243,120)],fill='#2a3d46',width=2)
d.line([(241,0),(241,35),(231,51),(231,96)],fill='#1a303b')
# Workbench and drawers.
d.polygon([(0,143),(180,143),(195,150),(0,150)],fill='#45534c')
d.line((0,143,180,143),fill='#738071');d.rectangle((0,150,182,179),fill='#1b2d2e')
for x in (3,60,120):
    d.rectangle((x,155,x+54,178),fill='#223638',outline='#30474a')
    d.line((x+19,160,x+32,160),fill='#62716a')
# Warm-grey vintage receiver; screen is separately animated at (44,76) 84x47.
d.rounded_rectangle((32,65,141,142),radius=4,fill='#182b2c')
d.rounded_rectangle((34,64,139,140),radius=4,fill='#57675d')
d.line((38,65,135,65),fill='#adb29b');d.line((35,68,35,136),fill='#879280')
d.rectangle((39,70,133,129),fill='#253b35',outline='#748171')
d.rectangle((42,73,130,126),fill='#101e20')
d.rectangle((44,76,127,122),fill='#071118')
d.line((43,74,129,74),fill='#09171c')
for x in range(43,118,4):d.line((x,133,x+1,136),fill='#293f35')
d.ellipse((125,132,129,136),fill='#172b25',outline='#8d977f')
d.point((134,134),fill='#6b3d38')
d.rectangle((47,141,63,143),fill='#10251e');d.rectangle((116,141,131,143),fill='#10251e')
# Old personal computer and storage media, not modern military equipment.
d.rectangle((1,95,28,125),fill='#334848',outline='#65746b')
d.rectangle((4,99,24,117),fill='#071118');d.line((7,102,19,102),fill='#426d61')
d.line((7,105,13,105),fill='#365b53');d.rectangle((5,126,25,131),fill='#253f3d')
d.polygon([(0,134),(25,134),(30,141),(0,141)],fill='#5b665a')
for y in (136,138):
    for x in range(2,24,4):d.line((x,y,x+2,y),fill='#263f39')
for x,y in [(6,145),(19,147),(156,141)]:
    d.rectangle((x,y,x+10,y+8),fill='#10232b',outline='#3e5658')
    d.rectangle((x+2,y+1,x+8,y+3),fill='#7a8272');d.rectangle((x+3,y+6,x+7,y+7),fill='#314a50')
# Cable coils and neglected analog equipment.
for x,y in [(164,134),(25,150),(217,157)]:
    d.arc((x-10,y-6,x+12,y+7),0,320,fill='#3c5355',width=2)
    d.arc((x-6,y-3,x+7,y+4),30,330,fill='#1b343b')
d.line([(140,113),(149,117),(149,137),(171,137),(171,144)],fill='#34504f',width=2)
d.rectangle((253,103,309,168),fill='#142832',outline='#31454b')
for y in range(109,161,9):
    d.rectangle((257,y,305,y+5),fill='#0c1c26');d.point((300,y+2),fill='#4f7068')
d.rectangle((181,165,247,179),fill='#112530')
d.line((0,179,319,179),fill='#2f4447')
out=root/'public/assets/ui/forgotten-room.png';out.parent.mkdir(parents=True,exist_ok=True);im.save(out,optimize=True)
print(out)
