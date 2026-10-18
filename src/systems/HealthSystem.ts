export type DamageSource = 'laser' | 'turret' | 'electric' | 'machinery' | 'corruption';
export interface HealthEvent { hp: number; source: DamageSource; amount: number; lethal: boolean }

/** Time is supplied by the scene: deterministic, pause-safe, and independently testable. */
export class HealthSystem {
  readonly max = 4;
  private hp = 4;
  private invulnerableUntil = 0;
  private enabled = false;
  private healed = new Set<string>();
  private hits = 0;
  private deaths = 0;
  private heals = 0;
  private lastSource: DamageSource | null = null;
  private lastHitAt = 0;
  private hitsBySource: Record<DamageSource,number> = {laser:0,turret:0,electric:0,machinery:0,corruption:0};
  private recentHits:{at:number;source:DamageSource;hp:number}[]=[];
  private onHit: (event: HealthEvent) => void;

  constructor(onHit: (event: HealthEvent) => void = () => {}) { this.onHit = onHit; }
  setEnabled(enabled: boolean): void { this.enabled = enabled; }

  damage(source: DamageSource, now: number): boolean {
    if (!this.enabled || this.hp === 0 || now < this.invulnerableUntil) return false;
    const amount = source === 'machinery' ? 2 : 1;
    this.hp = Math.max(0, this.hp - amount);
    this.invulnerableUntil = now + 1000;
    this.hits++;
    this.lastSource = source; this.lastHitAt = now; this.hitsBySource[source]++;
    this.recentHits.push({at:now,source,hp:this.hp});if(this.recentHits.length>16)this.recentHits.shift();
    const lethal = this.hp === 0;
    if (lethal) { this.enabled = false; this.deaths++; }
    this.onHit({ hp: this.hp, source, amount, lethal });
    return true;
  }

  healCheckpoint(id: string): boolean {
    if (this.healed.has(id) || this.hp === 0) return false;
    // Visiting while full still consumes the checkpoint's one restoration.
    this.healed.add(id);
    if (this.hp === this.max) return false;
    this.hp++; this.heals++; return true;
  }

  reboot(now: number): void {
    this.hp = this.max; this.invulnerableUntil = now + 1000; this.enabled = true;
    // Healing history deliberately survives death/pit respawn in this level.
  }

  grantGrace(now: number): void { this.invulnerableUntil = now + 1000; }

  snapshot(now: number) {
    return { hp: this.hp, max: this.max, invulnerable: this.hp > 0 && now < this.invulnerableUntil,
      invulnerableMs: Math.max(0, this.invulnerableUntil - now), dead: this.hp === 0,
      hits: this.hits, deaths: this.deaths, heals: this.heals, spentCheckpoints: [...this.healed] };
  }

  diagnostics(now: number) {
    return {...this.snapshot(now),lastSource:this.lastSource,lastHitAt:this.lastHitAt,hitsBySource:{...this.hitsBySource},recentHits:this.recentHits.map(hit=>({...hit}))};
  }
}
