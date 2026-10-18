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
}

export interface BuiltLevel {
  platforms: Phaser.Physics.Arcade.StaticGroup;
  platformList: readonly BuiltPlatform[];
  exit: Phaser.GameObjects.Sprite;
  setChannel(channel: ChannelId): void;
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
    builtList.push({ tile, definition, active: true, ghost });
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

  const setChannel = (channel: ChannelId): void => {
    for (const item of builtList) {
      const shouldActivate = isPlatformActiveIn(item.definition.channels, channel);

      if (shouldActivate === item.active) {
        continue;
      }

      item.active = shouldActivate;
      item.tile.setVisible(shouldActivate);
      item.ghost?.setVisible(!shouldActivate);
      (item.tile.body as Phaser.Physics.Arcade.StaticBody).enable = shouldActivate;
    }
  };

  return { platforms, platformList: builtList, exit, setChannel };
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
