import Phaser from 'phaser';
import { intersects } from './HazardGeometry';
import type { HazardContext, HazardDefinition, Box } from './HazardTypes';

export abstract class BaseHazard {
  protected readonly art: Phaser.GameObjects.Graphics;
  protected state = 'DISABLED';
  protected age = 0;
  protected enabled = false;
  protected readonly bounds: Box;
  protected impacts = 0;
  constructor(readonly definition: HazardDefinition, protected readonly ctx: HazardContext) {
    this.art = ctx.scene.add.graphics().setDepth(16);
    this.bounds = { x: definition.x, y: definition.y, width: definition.width, height: definition.height };
  }
  update(delta: number): void {
    const enabled = this.definition.channels.includes(this.ctx.channel());
    if (!enabled) { this.enabled = false; this.age = 0; this.state = 'DISABLED'; this.onDisabled(); this.draw(); return; }
    if (!this.enabled) { this.age = 0; this.state = 'IDLE'; this.enabled = true; }
    this.age += Math.min(delta, 50);
    this.tick(Math.min(delta, 50));
    this.draw();
  }
  protected setState(state: string, cue?: string): void {
    if (this.state === state) return;
    this.state = state;
    if (cue) this.ctx.cue(cue, this.definition.x);
  }
  protected contact(): void {
    if (intersects(this.bounds, this.ctx.body) && this.ctx.hit(this.definition.type)) this.impacts++;
  }
  protected onDisabled(): void {}
  protected abstract tick(delta: number): void;
  protected abstract draw(): void;
  snapshot() { return { ...this.definition, state: this.state, enabled: this.enabled, dangerous: this.state === 'ACTIVE' || this.state === 'FALLING', bounds: { ...this.bounds }, impacts: this.impacts }; }
}
