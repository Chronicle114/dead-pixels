import Phaser from 'phaser';
import { SceneKeys } from '../config/Constants';
import { Palette } from '../config/Palette';
import { PixelFont } from '../systems/PixelFont';
import { ArchiveEnvironment } from '../systems/ArchiveEnvironment';
import { connectTelevision, setPresentation } from '../ui/Television';
import { levelManager } from '../systems/LevelManager';

export class MenuScene extends Phaser.Scene {
  private starting = false;
  constructor() { super(SceneKeys.Menu); }

  create(): void {
    this.starting = false;
    this.input.enabled = true;
    setPresentation('menu');
    connectTelevision(null);
    this.scale.getParentBounds();
    this.scale.refresh();
    new ArchiveEnvironment(this, true);
    this.add.rectangle(160, 89, 246, 149, 0x0b1521, 0.92).setStrokeStyle(1, 0x324952).setDepth(40);
    const text = (label: string, color: number, scale: number, y: number, x = 160) =>
      PixelFont.text(this, label, color, scale, x, y).setDepth(42);
    text('ARCHIVE 01 - TRANSMISSION LOST', Palette.desatCyan, 1, 28);
    text('DEAD PIXELS', 0x152c38, 3, 59, 161);
    text('DEAD PIXELS', 0xc3ddd2, 3, 57);
    this.add.rectangle(160, 75, 194, 1, 0x426069).setDepth(42);
    text('A BROKEN SIGNAL.', Palette.silver, 1, 88);
    text('THREE REALITIES.', Palette.lavender, 1, 100);
    const button = this.add.rectangle(160, 124, 152, 22, 0x20383f)
      .setStrokeStyle(1, 0x80c9ba).setDepth(41).setInteractive({ useHandCursor: true });
    text('> START TRANSMISSION', Palette.warmHighlight, 1, 124);
    button.on('pointerover', () => button.setFillStyle(0x34535a));
    button.on('pointerout', () => button.setFillStyle(0x20383f));
    button.on('pointerdown', this.startGame, this);
    const prompt = text('ENTER / SPACE / CLICK', Palette.silver, 1, 145);
    this.tweens.add({ targets: prompt, alpha: 0.55, duration: 1400, yoyo: true, repeat: -1 });
    text('LUDUM DARE 60 - OLD TECH', Palette.gray, 1, 173);
    const keyboard = this.input.keyboard;
    keyboard?.on('keydown-ENTER', this.startGame, this);
    keyboard?.on('keydown-SPACE', this.startGame, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      keyboard?.off('keydown-ENTER', this.startGame, this);
      keyboard?.off('keydown-SPACE', this.startGame, this);
    });
  }

  private startGame(): void {
    if (this.starting) return;
    this.starting = true;
    levelManager.begin();
    this.input.enabled = false;
    this.cameras.main.fadeOut(180, 7, 13, 19);
    this.time.delayedCall(180, () => this.scene.start(SceneKeys.Game));
  }
}
