import Phaser from 'phaser';
import type { ChannelId } from '../config/Channels';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/Constants';
import { Palette } from '../config/Palette';

const STATIC_LINE_COUNT = 7;
const STATIC_DURATION_MS = 190;
const INSTABILITY_MIN_MS = 2200;
const INSTABILITY_MAX_MS = 5200;

export class ChannelTransition {
  private readonly scene: Phaser.Scene;
  private readonly overlay: Phaser.GameObjects.Graphics;
  private readonly flash: Phaser.GameObjects.Rectangle;
  private jitterEvent: Phaser.Time.TimerEvent | null = null;
  private instabilityEvent: Phaser.Time.TimerEvent | null = null;
  private atmosphericIntensity = 0;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.overlay = scene.add.graphics().setScrollFactor(0).setDepth(90).setAlpha(0);
    this.flash = scene.add
      .rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, Palette.white, 0)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(89);
  }

  playStatic(accent: number): void {
    this.stopJitter();
    this.drawStaticLines(accent);
    this.overlay.setAlpha(0.8);

    this.scene.tweens.add({
      targets: this.overlay,
      alpha: 0,
      duration: STATIC_DURATION_MS,
      ease: 'Linear',
    });

    this.flash.setFillStyle(accent, 0.22).setAlpha(1);

    this.scene.tweens.add({
      targets: this.flash,
      alpha: 0,
      duration: 150,
      ease: 'Linear',
    });

    this.jitterEvent = this.scene.time.addEvent({
      delay: 40,
      repeat: 4,
      callback: () => {
        this.drawStaticLines(accent);
      },
    });
  }

  playRejected(): void {
    this.stopJitter();
    this.drawStaticLines(Palette.red);
    this.overlay.setAlpha(0.45);

    this.scene.tweens.add({
      targets: this.overlay,
      alpha: 0,
      duration: 130,
      ease: 'Linear',
    });

    this.flash.setFillStyle(Palette.red, 0.3).setAlpha(1);

    this.scene.tweens.add({
      targets: this.flash,
      alpha: 0,
      duration: 130,
      ease: 'Linear',
    });
  }

  setInstability(channel: ChannelId, atmosphere = 0): void {
    this.stopInstability();
    this.atmosphericIntensity = atmosphere;

    if (channel !== 3 && atmosphere === 0) {
      return;
    }

    this.scheduleInstabilityFlicker();
  }

  destroy(): void {
    this.stopJitter();
    this.stopInstability();
    this.overlay.destroy();
    this.flash.destroy();
  }

  private scheduleInstabilityFlicker(): void {
    const delay = Phaser.Math.Between(INSTABILITY_MIN_MS, INSTABILITY_MAX_MS) / (this.atmosphericIntensity === 2 ? 1.4 : 1);

    this.instabilityEvent = this.scene.time.addEvent({
      delay,
      callback: () => {
        if (!this.scene.sys.isActive()) {
          return;
        }

        this.drawFlickerLines();
        this.overlay.setAlpha(0.16);
        this.scene.tweens.add({
          targets: this.overlay,
          alpha: 0,
          duration: 80,
          ease: 'Linear',
        });
        this.scheduleInstabilityFlicker();
      },
    });
  }

  private drawStaticLines(accent: number): void {
    this.overlay.clear();

    for (let i = 0; i < STATIC_LINE_COUNT; i++) {
      const width = Phaser.Math.Between(60, GAME_WIDTH);
      const x = Phaser.Math.Between(-24, GAME_WIDTH - 24);
      const y = Phaser.Math.Between(2, GAME_HEIGHT - 4);
      const height = Phaser.Math.Between(1, 2);
      const color = i % 3 === 0 ? accent : i % 3 === 1 ? Palette.white : Palette.silver;
      const alpha = Phaser.Math.FloatBetween(0.45, 0.9);

      this.overlay.fillStyle(color, alpha);
      this.overlay.fillRect(x, y, width, height);
    }
  }

  private drawFlickerLines(): void {
    this.overlay.clear();

    const lineCount = Phaser.Math.Between(1, 2);

    for (let i = 0; i < lineCount; i++) {
      const width = Phaser.Math.Between(80, GAME_WIDTH);
      const x = Phaser.Math.Between(-16, GAME_WIDTH - 16);
      const y = Phaser.Math.Between(2, GAME_HEIGHT - 4);

      this.overlay.fillStyle(Palette.silver, 0.7);
      this.overlay.fillRect(x, y, width, 1);
    }
  }

  private stopJitter(): void {
    if (this.jitterEvent) {
      this.jitterEvent.remove(false);
      this.jitterEvent = null;
    }
  }

  private stopInstability(): void {
    if (this.instabilityEvent) {
      this.instabilityEvent.remove(false);
      this.instabilityEvent = null;
    }
  }
}
