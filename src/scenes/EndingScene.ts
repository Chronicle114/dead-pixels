import Phaser from 'phaser';
import { SceneKeys } from '../config/Constants';
import { Palette } from '../config/Palette';
import { PixelFont } from '../systems/PixelFont';
import { ChannelTransition } from '../systems/ChannelTransition';
import { levelManager } from '../systems/LevelManager';
import { connectTelevision, setPresentation } from '../ui/Television';
import { audioManager } from '../systems/AudioManager';

export class EndingScene extends Phaser.Scene {
  private stage: 'transmission' | 'waiting' | 'end' = 'transmission';
  private lines: Phaser.GameObjects.Image[] = [];
  private fx!: ChannelTransition;
  constructor() { super(SceneKeys.Ending); }

  create(): void {
    this.stage = 'transmission'; this.lines = [];
    audioManager.playMusic('ending');
    setPresentation('game'); connectTelevision(null);
    this.cameras.main.setBackgroundColor(0x080d14);
    this.fx = new ChannelTransition(this);
    this.fx.playStatic(Palette.warmHighlight);
    this.write('TRANSMISSION COMPLETE', 77, Palette.cyan, 2);
    this.write('ENTER - SKIP', 160, Palette.gray);
    this.time.delayedCall(1250, () => {
      if (this.stage !== 'transmission') return;
      this.stage = 'waiting'; this.clearLines();
      this.write('THE SIGNAL WAS NEVER LOST.', 72, Palette.silver);
      this.write('IT WAS WAITING FOR YOU.', 93, Palette.warmHighlight);
      this.write('ENTER - SKIP', 160, Palette.gray);
    });
    this.time.delayedCall(3500, () => { if (this.stage !== 'end') this.cameras.main.fadeOut(450); });
    this.time.delayedCall(4000, () => { if (this.stage !== 'end') this.showEnd(); });
    const advance = () => {
      if (this.stage === 'end') this.scene.start(SceneKeys.Menu);
      else this.showEnd();
    };
    const menu = () => this.scene.start(SceneKeys.Menu);
    this.input.keyboard?.on('keydown-ENTER', advance);
    this.input.keyboard?.on('keydown-SPACE', advance);
    this.input.keyboard?.on('keydown-ESC', menu);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.keyboard?.off('keydown-ENTER', advance);
      this.input.keyboard?.off('keydown-SPACE', advance);
      this.input.keyboard?.off('keydown-ESC', menu);
      this.fx.destroy();
    });
  }

  private showEnd(): void {
    this.stage = 'end'; this.clearLines();
    this.cameras.main.resetFX();
    this.cameras.main.setBackgroundColor(0x000000);
    this.write('DEAD PIXELS', 57, 0xc3ddd2, 3);
    this.write('END OF TRANSMISSION', 85, Palette.gray);
    const button = this.add.rectangle(160, 123, 140, 23, 0x13201f).setStrokeStyle(1, Palette.desatCyan).setInteractive({ useHandCursor: true });
    this.write('RETURN TO MENU', 123, Palette.warmHighlight);
    button.on('pointerdown', () => this.scene.start(SceneKeys.Menu));
    button.on('pointerover', () => button.setFillStyle(0x29413c));
    button.on('pointerout', () => button.setFillStyle(0x13201f));
  }

  private write(text: string, y: number, color: number, scale = 1): void {
    this.lines.push(PixelFont.text(this, text, color, scale, 160, y).setDepth(100));
  }
  private clearLines(): void { this.lines.forEach(line => line.destroy()); this.lines = []; }
  getSnapshot() { return { mode: 'ending' as const, phase: this.stage, level: levelManager.snapshot(), messages: this.lines.map(line => line.texture.key.split(':')[1]) }; }
}
