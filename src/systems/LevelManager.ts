import { CAMPAIGN } from '../levels/Campaign';
import type { CheckpointDefinition, LevelDefinition } from '../levels/LevelTypes';
import { validateLevel } from '../levels/ValidateLevel';
import { saveManager } from './SaveManager';

/** In-memory campaign state; GameScene is reused for every data-defined level. */
export class LevelManager {
  private index = 0;
  private checkpoint: CheckpointDefinition;
  private reached = new Set<string>();
  private finished = false;
  private startedAt = 0;
  private cleared: string[] = [];
  private falls = 0;

  constructor(readonly definitions: readonly LevelDefinition[] = CAMPAIGN) {
    if (!definitions.length) throw new Error('A campaign needs at least one level');
    definitions.forEach(validateLevel);
    this.checkpoint = this.spawnCheckpoint();
  }

  get current(): LevelDefinition { return this.definitions[this.index]; }
  get number(): number { return this.index + 1; }
  get total(): number { return this.definitions.length; }
  get isFinal(): boolean { return this.number === this.total; }
  get respawnPoint(): Readonly<CheckpointDefinition> { return this.checkpoint; }
  get completed(): boolean { return this.finished; }

  begin(): void {
    saveManager.begin();
    this.index = 0; this.finished = false; this.cleared = []; this.falls = 0;
    this.startedAt = Date.now(); this.restart();
  }

  continueSaved():void{
    this.index=saveManager.savedLevel-1;this.finished=false;
    this.cleared=this.definitions.slice(0,this.index).map(level=>level.key);this.falls=0;this.startedAt=Date.now();this.restart();
  }

  restart(): void {
    this.reached.clear();
    this.checkpoint = this.spawnCheckpoint();
  }

  activate(point: CheckpointDefinition): boolean {
    if (this.reached.has(point.id)) return false;
    // Checkpoints are ordered along the route; walking backwards never loses progress.
    if (point.x < this.checkpoint.x) return false;
    this.reached.add(point.id);
    this.checkpoint = point;
    return true;
  }

  registerFall(): void { this.falls++; }

  /** Called only after the player's real exit overlap. Returns false at the finale. */
  advance(): boolean {
    if (!this.cleared.includes(this.current.key)) this.cleared.push(this.current.key);
    if (this.isFinal) { this.finished = true; saveManager.finish(); return false; }
    this.index++; this.restart(); saveManager.setLevel(this.number); return true;
  }

  snapshot() {
    return {
      number: this.number, total: this.total, key: this.current.key, title: this.current.title,
      checkpoint: { ...this.checkpoint }, reached: [...this.reached], cleared: [...this.cleared],
      finished: this.finished, falls: this.falls, elapsedSeconds: Math.round((Date.now() - this.startedAt) / 1000),
      fragments:[...saveManager.fragments],
    };
  }

  private spawnCheckpoint(): CheckpointDefinition {
    return { id: 'spawn', ...this.current.spawn, channel: this.current.initialChannel };
  }
}

export const levelManager = new LevelManager();
