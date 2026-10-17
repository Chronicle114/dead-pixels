import Phaser from 'phaser';
import { AssetKeys } from '../assets/AssetManifest';
import type { ChannelId } from '../config/Channels';
import { TextureKeys } from './TextureFactory';

/** Prebuilt raster art + a strict 18-object ambient animation budget. */
export class ArchiveEnvironment {
  private readonly groups: Phaser.GameObjects.Image[][] = [];
  private readonly lights: Phaser.GameObjects.Rectangle[] = [];

  constructor(scene: Phaser.Scene, menu = false) {
    for (const ch of [1, 2, 3] as const) {
      const far = scene.add.image(0, 0, AssetKeys.far(ch)).setOrigin(0).setScrollFactor(0.18).setDepth(-30);
      const mid = scene.add.image(0, 0, AssetKeys.mid(ch)).setOrigin(0).setScrollFactor(0.55).setDepth(-20).setAlpha(menu ? 0.45 : 0.72);
      const near = scene.add.image(0, 0, AssetKeys.near(ch)).setOrigin(0).setDepth(2);
      this.groups.push([far, mid, near]);
    }
    scene.add.tileSprite(0, 0, 640, 180, TextureKeys.BackgroundDots).setOrigin(0).setScrollFactor(0.4).setDepth(-12).setAlpha(0.13);
    for (const [i, x] of [37, 184, 346, 504, 559, 600].entries()) {
      const led = scene.add.rectangle(x, 83 + (i % 3) * 13, 1, 1, 0x9bcabb).setDepth(-10).setScrollFactor(0.55);
      this.lights.push(led);
      scene.tweens.add({ targets: led, alpha: { from: 0.3, to: 0.95 }, duration: 1000 + i * 270, yoyo: true, repeat: -1 });
      // Small local pools of light, no full-screen bloom/filter.
      scene.add.ellipse(x, 88 + (i % 3) * 13, 22, 14, 0x7bb5ae, 0.025).setDepth(-11).setScrollFactor(0.55);
    }
    for (let i = 0; i < 12; i++) {
      const dust = scene.add.rectangle((i * 53 + 21) % 640, 42 + (i * 19) % 110, 1, 1, 0xa7b6bb, 0.25).setDepth(3).setScrollFactor(0.75);
      scene.tweens.add({ targets: dust, y: dust.y - 8, alpha: 0.05, duration: 3500 + i * 240, yoyo: true, repeat: -1 });
    }
    // CC0 adaptations: wall-mounted mechanical vents, explicitly background depth.
    scene.add.image(146, 85, 'grille-80').setDepth(-15).setScrollFactor(0.55).setAlpha(0.45);
    scene.add.image(452, 99, 'grille-81').setDepth(-15).setScrollFactor(0.55).setAlpha(0.45);
    this.setChannel(1);
  }

  setChannel(channel: ChannelId): void {
    this.groups.forEach((images, index) => images.forEach((image) => image.setVisible(index + 1 === channel)));
    for (const light of this.lights) light.setFillStyle(channel === 1 ? 0x99cbb8 : channel === 2 ? 0xb9acdc : 0xd39676);
  }
}
