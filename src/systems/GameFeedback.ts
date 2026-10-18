import Phaser from 'phaser';

/** Sixteen preallocated pixels, shared by impacts, healing and landing. No bodies. */
export class GameFeedback {
  private readonly pixels: Phaser.GameObjects.Rectangle[];
  constructor(private readonly scene: Phaser.Scene) {
    this.pixels = Array.from({ length: 16 }, () => scene.add.rectangle(0, 0, 1, 1, 0xffffff).setDepth(25).setVisible(false));
  }
  burst(x: number, y: number, color: number, count = 6): void {
    let used = 0;
    for (const pixel of this.pixels) {
      if (pixel.visible) continue;
      const index = used++;
      pixel.setPosition(Math.round(x), Math.round(y)).setFillStyle(color).setAlpha(1).setVisible(true);
      this.scene.tweens.add({ targets: pixel, x: x + (index % 2 ? -1 : 1) * (5 + index * 2), y: y - 3 - (index * 7) % 16,
        alpha: 0, duration: 250 + index * 25, onComplete: () => pixel.setVisible(false) });
      if (used >= count) break;
    }
  }
}
