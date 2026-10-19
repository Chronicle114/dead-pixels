import Phaser from 'phaser';
import { isPlatformActiveIn, type ChannelId } from '../config/Channels';
import type { LevelDefinition, PlatformDefinition, PlatformStyle } from '../levels/LevelTypes';
import { TextureKeys } from './TextureFactory';
import { AssetKeys } from '../assets/AssetManifest';
import { PixelFont } from './PixelFont';
import { Palette } from '../config/Palette';

export interface BuiltPlatform {
  tile: Phaser.GameObjects.TileSprite;
  definition: PlatformDefinition;
  active: boolean;
  ghost?: Phaser.GameObjects.Graphics;
  collapsed:boolean;
  crackedAt:number|null;
  resetAt:number;
  cracks?:Phaser.GameObjects.Graphics;
}

export interface BuiltLevel {
  platforms: Phaser.Physics.Arcade.StaticGroup;
  platformList: readonly BuiltPlatform[];
  exit: Phaser.GameObjects.Sprite;
  setChannel(channel: ChannelId): void;
  updateFragile(body:Phaser.Physics.Arcade.Body,now:number):void;
}

export function buildLevel(scene: Phaser.Scene, level: LevelDefinition): BuiltLevel {
  const platforms = scene.physics.add.staticGroup();
  const builtList: BuiltPlatform[] = [];

  for (const definition of level.platforms) {
    const tile = scene.add
      .tileSprite(definition.x, definition.y, definition.width, definition.height, surfaceTexture(scene, definition))
      .setOrigin(0, 0).setDepth(10);

    platforms.add(tile);

    const body = tile.body as Phaser.Physics.Arcade.StaticBody;
    body.updateFromGameObject();

    let ghost: Phaser.GameObjects.Graphics | undefined;
    if (definition.channels) {
      const color = definition.channels[0] === 2 ? 0x8c86aa : definition.channels[0] === 3 ? 0x92616a : 0x6b8b91;
      ghost = scene.add.graphics().setDepth(4).setVisible(false);
      ghost.lineStyle(1, color, 0.3);
      for (let x = 0; x < definition.width; x += 8) {
        ghost.lineBetween(definition.x + x, definition.y, definition.x + Math.min(x + 3, definition.width), definition.y);
      }
      ghost.lineBetween(definition.x, definition.y, definition.x, definition.y + 3);
      ghost.lineBetween(definition.x + definition.width - 1, definition.y, definition.x + definition.width - 1, definition.y + 3);
    }
    const cracks=definition.fragile?scene.add.graphics().setDepth(11):undefined;
    builtList.push({ tile, definition, active: true, ghost,collapsed:false,crackedAt:null,resetAt:0,cracks });
  }

  const exit = scene.add.sprite(level.exit.x, level.exit.y, TextureKeys.ExitBars);
  exit.setDepth(12);
  PixelFont.text(scene, 'EXIT', Palette.cyan, 1, level.exit.x, level.exit.y - 30).setDepth(12);
  PixelFont.text(scene, '>', Palette.warmHighlight, 1, level.exit.x - 15, level.exit.y - 8).setDepth(12);
  scene.physics.add.existing(exit, true);

  const exitBody = exit.body as Phaser.Physics.Arcade.StaticBody;
  exitBody.updateFromGameObject();

  scene.tweens.add({
    targets: exit,
    alpha: { from: 1, to: 0.55 },
    duration: 700,
    yoyo: true,
    repeat: -1,
  });

  let currentChannel:ChannelId=level.initialChannel;
  const setChannel = (channel: ChannelId): void => {
    currentChannel=channel;
    for (const item of builtList) {
      const shouldActivate = !item.collapsed&&isPlatformActiveIn(item.definition.channels, channel);

      if (shouldActivate === item.active) {
        continue;
      }

      item.active = shouldActivate;
      item.tile.setVisible(shouldActivate);
      item.ghost?.setVisible(!shouldActivate);
      (item.tile.body as Phaser.Physics.Arcade.StaticBody).enable = shouldActivate;
    }
  };

  const updateFragile=(body:Phaser.Physics.Arcade.Body,now:number)=>{
    for(const item of builtList){
      const config=item.definition.fragile;if(!config)continue;
      const p=item.definition;
      if(item.active&&item.crackedAt===null&&(body.blocked.down||body.touching.down)&&Math.abs(body.bottom-p.y)<2&&body.right>p.x&&body.x<p.x+p.width){item.crackedAt=now;scene.events.emit('fragile-warning',p.x);}
      item.cracks?.clear();
      if(item.crackedAt!==null&&!item.collapsed){
        const progress=(now-item.crackedAt)/config.collapseMs;
        if(item.active&&item.cracks){
          item.cracks.lineStyle(1,progress>.7?0xe3ab76:0x92616a);
          for(let x=7;x<p.width;x+=16)if(progress>(x%4)*.12)item.cracks.lineBetween(p.x+x,p.y+2,p.x+x-3+(Math.floor(now/80)%2),p.y+9).lineBetween(p.x+x-3,p.y+9,p.x+x+2,p.y+14);
        }
        if(progress>=1){item.collapsed=true;item.resetAt=now+config.resetMs;item.cracks?.clear();scene.events.emit('fragile-collapse',p.x);setChannel(currentChannel);}
      }
      if(item.collapsed&&now>=item.resetAt&&!(body.x<p.x+p.width&&body.right>p.x&&body.y<p.y+p.height&&body.bottom>p.y)){
        item.collapsed=false;item.crackedAt=null;setChannel(currentChannel);
      }
    }
  };

  return { platforms, platformList: builtList, exit, setChannel,updateFragile };
}

/** Recompose the shipped art for arbitrary authored geometry, once per size/style.
 * No texture/body allocation on a channel change; no new art style introduced.
 */
function surfaceTexture(scene: Phaser.Scene, platform: PlatformDefinition): string {
  const { width, height, style } = platform;
  const key = `surface:${style}:${width}x${height}`;
  if (scene.textures.exists(key)) return key;
  const sources: Record<PlatformStyle, number> = { 'ground-top': 0, 'ground-fill': 4, brick: 5, memory: 2, 'void-crystal': 3 };
  const source = scene.textures.get(AssetKeys.platform(sources[style])).getSourceImage() as HTMLImageElement;
  const texture = scene.textures.createCanvas(key, width, height);
  if (!texture) throw new Error(`Could not compose ${key}`);
  const ctx = texture.getContext();
  ctx.imageSmoothingEnabled = false;
  for (let y = 0; y < height; y += 16) {
    for (let x = 0; x < width; x += 16) {
      const sx = x % source.width, sy = y % source.height;
      const w = Math.min(16, width - x, source.width - sx), h = Math.min(16, height - y, source.height - sy);
      ctx.drawImage(source, sx, sy, w, h, x, y, w, h);
    }
  }
  // Keep a continuous top rail and correct left/right caps at the exact body bounds.
  for (let x = 0; x < width; x++) ctx.drawImage(source, x % source.width, 0, 1, 3, x, 0, 1, 3);
  for (let y = 0; y < height; y++) {
    ctx.drawImage(source, 0, y % source.height, 1, 1, 0, y, 1, 1);
    ctx.drawImage(source, source.width - 1, y % source.height, 1, 1, width - 1, y, 1, 1);
  }
  texture.refresh();
  return key;
}
