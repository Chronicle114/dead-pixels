import Phaser from 'phaser';
import { isPlatformActiveIn, type ChannelId } from '../config/Channels';
import type { LevelDefinition, PlatformDefinition } from '../levels/LevelTypes';
import { TextureKeys } from './TextureFactory';
import { AssetKeys } from '../assets/AssetManifest';
import { PixelFont } from './PixelFont';
import { Palette } from '../config/Palette';

export interface BuiltPlatform {
  tile: Phaser.GameObjects.TileSprite;
  definition: PlatformDefinition;
  active: boolean;
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

  for (const [index, definition] of level.platforms.entries()) {
    const tile = scene.add
      .tileSprite(definition.x, definition.y, definition.width, definition.height, AssetKeys.platform(index))
      .setOrigin(0, 0).setDepth(10);

    platforms.add(tile);

    const body = tile.body as Phaser.Physics.Arcade.StaticBody;
    body.updateFromGameObject();

    builtList.push({ tile, definition, active: true });
  }

  const exit = scene.add.sprite(level.exit.x, level.exit.y, TextureKeys.ExitBars);
  exit.setDepth(12);
  PixelFont.text(scene, 'EXIT', Palette.cyan, 1, level.exit.x, 126).setDepth(12);
  PixelFont.text(scene, '>', Palette.warmHighlight, 1, level.exit.x - 15, 148).setDepth(12);
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
      (item.tile.body as Phaser.Physics.Arcade.StaticBody).enable = shouldActivate;
    }
  };

  return { platforms, platformList: builtList, exit, setChannel };
}
