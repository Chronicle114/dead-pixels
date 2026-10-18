import Phaser from 'phaser';
import { AssetKeys } from '../assets/AssetManifest';
import type { ChannelId } from '../config/Channels';
import { TextureKeys } from './TextureFactory';
import type { LevelDefinition } from '../levels/LevelTypes';

/** Prebuilt raster art + a strict 18-object ambient animation budget. */
export class ArchiveEnvironment {
  private readonly groups: (Phaser.GameObjects.Image | Phaser.GameObjects.TileSprite)[][] = [];
  private readonly lights: Phaser.GameObjects.Rectangle[] = [];
  private readonly distant: Phaser.GameObjects.TileSprite[] = [];
  private readonly composition: number;

  constructor(scene: Phaser.Scene, menu = false, level?: LevelDefinition) {
    const width = level?.width ?? 640;
    this.composition = level?.visuals?.composition ?? 0;
    for (const ch of [1, 2, 3] as const) {
      const far = scene.add.tileSprite(0, 0, 320, 180, AssetKeys.far(ch)).setOrigin(0).setScrollFactor(0).setDepth(-30);
      far.tilePositionX = this.composition;
      this.distant.push(far);
      const mid = scene.add.tileSprite(0, 0, width, 180, AssetKeys.mid(ch)).setOrigin(0).setScrollFactor(0.55).setDepth(-20).setAlpha(menu ? 0.45 : 0.65);
      mid.tilePositionX = this.composition;
      // Keep the existing receiver shrine at the actual exit, not every 640px.
      const debrisKey = `archive-debris-${ch}`;
      if (!scene.textures.exists(debrisKey)) {
        const texture = scene.textures.createCanvas(debrisKey, 640, 180);
        const source = scene.textures.get(AssetKeys.near(ch)).getSourceImage() as HTMLImageElement;
        texture?.getContext().drawImage(source, 0, 0, 568, 180, 0, 0, 568, 180);
        texture?.refresh();
      }
      const near = scene.add.tileSprite(0, 0, width, 180, debrisKey).setOrigin(0).setDepth(2);
      near.tilePositionX = this.composition;
      const shrine = scene.add.image((level?.exit.x ?? 600) - 600, (level?.exit.y ?? 156) - 156, AssetKeys.near(ch)).setOrigin(0).setDepth(2).setCrop(568, 120, 72, 60);
      this.groups.push([far, mid, near, shrine]);
    }
    scene.add.tileSprite(0, 0, width, 180, TextureKeys.BackgroundDots).setOrigin(0).setScrollFactor(0.4).setDepth(-12).setAlpha(0.13);
    for (const [i, fraction] of [0.06, 0.23, 0.4, 0.57, 0.74, 0.92].entries()) {
      const x = Math.round(width * fraction);
      const led = scene.add.rectangle(x, 83 + (i % 3) * 13, 1, 1, 0x9bcabb).setDepth(-10).setScrollFactor(0.55);
      this.lights.push(led);
      scene.tweens.add({ targets: led, alpha: { from: 0.3, to: 0.95 }, duration: 1000 + i * 270, yoyo: true, repeat: -1 });
      // Small local pools of light, no full-screen bloom/filter.
      scene.add.ellipse(x, 88 + (i % 3) * 13, 22, 14, 0x7bb5ae, 0.025).setDepth(-11).setScrollFactor(0.55);
    }
    for (let i = 0; i < 12; i++) {
      const dust = scene.add.rectangle(Math.round(width * (i + 0.5) / 12), 42 + (i * 19) % 110, 1, 1, 0xa7b6bb, 0.25).setDepth(3).setScrollFactor(0.75);
      scene.tweens.add({ targets: dust, y: dust.y - 8, alpha: 0.05, duration: 3500 + i * 240, yoyo: true, repeat: -1 });
    }
    // CC0 adaptations: wall-mounted mechanical vents, explicitly background depth.
    scene.add.image(146, 85, 'grille-80').setDepth(-15).setScrollFactor(0.55).setAlpha(0.45);
    scene.add.image(452, 99, 'grille-81').setDepth(-15).setScrollFactor(0.55).setAlpha(0.45);
    if (level?.visuals) this.buildLandmark(scene, level);
    this.setChannel(1);
  }

  update(cameraX: number): void {
    for (const far of this.distant) far.tilePositionX = Math.round(cameraX * 0.18 + this.composition);
  }

  private buildLandmark(scene: Phaser.Scene, level: LevelDefinition): void {
    const visual = level.visuals!;
    const art = scene.add.graphics().setDepth(-13);
    art.lineStyle(1, visual.accent, 0.16);
    const center = visual.machinery === 'transmitter' ? level.exit.x - 80 : Math.round(level.width * 0.52);
    if (['antenna', 'transmitter', 'cores'].includes(visual.machinery)) {
      const radius = visual.machinery === 'transmitter' ? 53 : 34;
      for (const r of [radius, radius - 8, 7]) art.strokeCircle(center, 90, r);
      for (let i = 0; i < 8; i++) {
        const a = i * Math.PI / 4;
        art.lineBetween(center + Math.round(Math.cos(a) * 12), 90 + Math.round(Math.sin(a) * 12), center + Math.round(Math.cos(a) * radius), 90 + Math.round(Math.sin(a) * radius));
      }
      art.lineBetween(center, 90 + radius, center, 164);
    } else {
      // Composed busbars/tape rails, deliberately behind the playable silhouette.
      for (let i = 0; i < 4; i++) {
        art.strokeRect(center - 64 + i * 28, 63 + (i % 2) * 12, 23, 60);
        for (let j = 0; j < 4; j++) art.lineBetween(center - 60 + i * 28, 77 + j * 9, center - 46 + i * 28, 77 + j * 9);
      }
      if (visual.machinery === 'broken') art.lineBetween(center - 50, 64, center + 36, 126);
    }
  }

  setChannel(channel: ChannelId): void {
    this.groups.forEach((images, index) => images.forEach((image) => image.setVisible(index + 1 === channel)));
    for (const light of this.lights) light.setFillStyle(channel === 1 ? 0x99cbb8 : channel === 2 ? 0xb9acdc : 0xd39676);
  }
}
