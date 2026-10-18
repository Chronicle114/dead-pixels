import Phaser from 'phaser';
import { PixelFont } from '../systems/PixelFont';

export class HealthHud {
  private readonly cells: Phaser.GameObjects.Rectangle[] = [];
  constructor(scene: Phaser.Scene) {
    scene.add.rectangle(220, 14, 48, 25, 0x0a111d, 0.86).setDepth(101).setScrollFactor(0);
    PixelFont.text(scene, 'ENERGY', 0x94b0c2, 1, 220, 7).setDepth(102).setScrollFactor(0);
    for (let i = 0; i < 4; i++) this.cells.push(scene.add.rectangle(201 + i * 12, 19, 8, 7, 0x80c9ba)
      .setStrokeStyle(1, 0x6b8b91).setDepth(102).setScrollFactor(0));
  }
  update(hp: number): void {
    this.cells.forEach((cell, i) => cell.setFillStyle(i < hp ? hp === 1 ? 0xe3ab76 : 0x80c9ba : 0x243341));
  }
}
