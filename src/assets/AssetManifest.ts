import type Phaser from 'phaser';

const asset = (path: string): string => `${import.meta.env.BASE_URL}assets/${path}`;

export const AssetKeys = {
  Explorer: 'explorer-sheet',
  Carrier: 'player-carrier',
  Exit: 'exit-bars',
  platform: (index: number): string => `platform-art-${index}`,
  far: (channel: number): string => `archive-${channel}-far`,
  mid: (channel: number): string => `archive-${channel}-mid`,
  near: (channel: number): string => `archive-${channel}-near`,
} as const;

/** Explicit, local-only asset inventory. No archive or authoring source ships. */
export function loadAssets(scene: Phaser.Scene): void {
  scene.load.spritesheet(AssetKeys.Explorer, asset('characters/explorer.png'), { frameWidth: 16, frameHeight: 24 });
  scene.load.image(AssetKeys.Carrier, asset('characters/carrier.png'));
  scene.load.image(AssetKeys.Exit, asset('decorations/exit.png'));
  for (let i = 0; i < 7; i++) scene.load.image(AssetKeys.platform(i), asset(`tilesets/platform-${i}.png`));
  for (let ch = 1; ch <= 3; ch++) {
    scene.load.image(AssetKeys.far(ch), asset(`backgrounds/archive-${ch}-far.png`));
    scene.load.image(AssetKeys.mid(ch), asset(`backgrounds/archive-${ch}-mid.png`));
    scene.load.image(AssetKeys.near(ch), asset(`decorations/archive-${ch}-near.png`));
  }
  for (const i of [80, 81]) scene.load.image(`grille-${i}`, asset(`decorations/kenney-grille-${i}.png`));
}
