import Phaser from 'phaser';
import { CHANNELS, type ChannelId } from '../config/Channels';
import { GAME_WIDTH } from '../config/Constants';
import { Palette } from '../config/Palette';
import { PixelFont } from '../systems/PixelFont';

const HUD_RIGHT = GAME_WIDTH - 6;
const HUD_BOX_WIDTH = 58;
const HUD_BOX_HEIGHT = 24;
const HUD_BOX_TOP = 4;

export class ChannelHud {
  private readonly scene: Phaser.Scene;
  private readonly backing: Phaser.GameObjects.Rectangle;
  private readonly accentBar: Phaser.GameObjects.Rectangle;
  private readonly codeTexts: Record<ChannelId, Phaser.GameObjects.Image>;
  private readonly nameTexts: Record<ChannelId, Phaser.GameObjects.Image>;
  private readonly noSignal: Phaser.GameObjects.Image;

  constructor(scene: Phaser.Scene, initial: ChannelId) {
    this.scene = scene;

    const boxCenterX = HUD_RIGHT - HUD_BOX_WIDTH / 2;
    const boxCenterY = HUD_BOX_TOP + HUD_BOX_HEIGHT / 2;

    this.backing = scene.add
      .rectangle(boxCenterX, boxCenterY, HUD_BOX_WIDTH, HUD_BOX_HEIGHT, Palette.black, 0.6)
      .setScrollFactor(0)
      .setDepth(100);

    this.accentBar = scene.add
      .rectangle(HUD_RIGHT, boxCenterY, 2, HUD_BOX_HEIGHT, CHANNELS[initial].visual.accent)
      .setOrigin(0, 0.5)
      .setScrollFactor(0)
      .setDepth(101);

    this.codeTexts = {} as Record<ChannelId, Phaser.GameObjects.Image>;
    this.nameTexts = {} as Record<ChannelId, Phaser.GameObjects.Image>;

    for (const id of [1, 2, 3] as const) {
      const accent = CHANNELS[id].visual.accent;

      this.codeTexts[id] = PixelFont.text(scene, CHANNELS[id].code, accent, 1, 0, 0)
        .setOrigin(1, 0.5)
        .setPosition(HUD_RIGHT - 6, HUD_BOX_TOP + 8)
        .setScrollFactor(0)
        .setDepth(101)
        .setVisible(false);

      this.nameTexts[id] = PixelFont.text(scene, CHANNELS[id].name, accent, 1, 0, 0)
        .setOrigin(1, 0.5)
        .setPosition(HUD_RIGHT - 6, HUD_BOX_TOP + 18)
        .setScrollFactor(0)
        .setDepth(101)
        .setVisible(false);
    }

    this.noSignal = PixelFont.text(scene, 'NO SIGNAL', Palette.warmHighlight, 2, GAME_WIDTH / 2, 80)
      .setScrollFactor(0)
      .setDepth(102)
      .setAlpha(0);

    this.setChannel(initial);
  }

  setChannel(id: ChannelId): void {
    for (const channel of [1, 2, 3] as const) {
      const visible = channel === id;
      this.codeTexts[channel].setVisible(visible);
      this.nameTexts[channel].setVisible(visible);
    }

    this.accentBar.setFillStyle(CHANNELS[id].visual.accent);

    this.scene.tweens.add({
      targets: this.accentBar,
      scaleY: { from: 1.5, to: 1 },
      duration: 220,
      ease: 'Quad.easeOut',
    });
  }

  flashNoSignal(): void {
    this.scene.tweens.add({
      targets: this.noSignal,
      alpha: { from: 1, to: 0 },
      duration: 110,
      yoyo: true,
      repeat: 2,
      ease: 'Linear',
      onComplete: () => {
        this.noSignal.setAlpha(0);
      },
    });
  }

  destroy(): void {
    this.backing.destroy();
    this.accentBar.destroy();
    this.noSignal.destroy();

    for (const channel of [1, 2, 3] as const) {
      this.codeTexts[channel].destroy();
      this.nameTexts[channel].destroy();
    }
  }
}
