import Phaser from 'phaser';
import type { CheckpointDefinition, LevelDefinition } from '../levels/LevelTypes';
import { PixelFont } from '../systems/PixelFont';
import { Palette } from '../config/Palette';

export class LevelGuidance {
  private readonly prompts: { from: number; to: number; image: Phaser.GameObjects.Image }[];
  private readonly markers = new Map<string, Phaser.GameObjects.Graphics>();
  private readonly saved: Phaser.GameObjects.Image;
  private readonly seen = new Map<number, number>();
  private activePrompt = -1;
  private promptBegan = 0;

  constructor(private readonly scene: Phaser.Scene, level: LevelDefinition, number: number, total: number) {
    PixelFont.text(scene, `${String(number).padStart(2, '0')}/${String(total).padStart(2, '0')} ${level.title}`, Palette.silver, 1, 6, 6)
      .setOrigin(0).setScrollFactor(0).setDepth(100);
    PixelFont.text(scene, 'ESC MENU / R RESTART', Palette.gray, 1, 6, 17).setOrigin(0).setScrollFactor(0).setDepth(100);
    const back = scene.add.rectangle(160, 38, 302, 13, 0x0a111d, 0.86).setScrollFactor(0).setDepth(99);
    this.prompts = (level.tutorials ?? []).map(t => ({ ...t,
      image: PixelFont.text(scene, t.text, t.channel === 2 ? Palette.lavender : t.channel === 3 ? Palette.warmHighlight : Palette.silver, 1, 160, 38)
        .setScrollFactor(0).setDepth(100).setVisible(false),
    }));
    this.saved = PixelFont.text(scene, 'CHECKPOINT - SIGNAL SAVED', Palette.cyan, 1, 160, 53).setScrollFactor(0).setDepth(100).setAlpha(0);
    for (const point of level.checkpoints ?? []) {
      const marker = scene.add.graphics().setDepth(9).setPosition(point.x - 12, point.y + 6);
      marker.lineStyle(1, 0x566c86);
      marker.lineBetween(0, -1, 0, -20);
      marker.strokePoints([{ x: -3, y: -18 }, { x: 0, y: -22 }, { x: 3, y: -18 }, { x: 0, y: -14 }, { x: -3, y: -18 }]);
      this.markers.set(point.id, marker);
    }
    const updateBacking = () => { back.setVisible(this.activePrompt >= 0 && this.prompts[this.activePrompt].image.visible); };
    scene.events.on(Phaser.Scenes.Events.POST_UPDATE, updateBacking);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => scene.events.off(Phaser.Scenes.Events.POST_UPDATE, updateBacking));
  }

  update(x: number): void {
    const now = this.scene.time.now;
    const index = this.prompts.findIndex(p => x >= p.from && x <= p.to);
    if (index !== this.activePrompt) {
      this.prompts.forEach(p => p.image.setVisible(false));
      this.activePrompt = index; this.promptBegan = now;
      if (index >= 0) this.seen.set(index, (this.seen.get(index) ?? 0) + 1);
    }
    if (index >= 0) {
      // Short prompts fade after eight seconds, and do not nag on repeated passes.
      const visible = now - this.promptBegan < 8000 && (this.seen.get(index) ?? 0) <= 2;
      this.prompts[index].image.setVisible(visible);
    }
  }

  activate(point: CheckpointDefinition): void {
    const marker = this.markers.get(point.id);
    if (marker) {
      marker.clear().lineStyle(1, 0x80c9ba).lineBetween(0, -1, 0, -20);
      marker.fillStyle(0x80c9ba).fillRect(-2, -20, 5, 5);
    }
    this.scene.tweens.killTweensOf(this.saved);
    this.saved.setAlpha(1);
    this.scene.tweens.add({ targets: this.saved, alpha: 0, delay: 700, duration: 450 });
  }
}
