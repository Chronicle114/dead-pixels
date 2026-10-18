import type { HazardContext, HazardDefinition } from '../hazards/HazardTypes';
import { BaseHazard } from '../hazards/BaseHazard';
import { LaserHazard } from '../hazards/LaserHazard';
import { ElectricHazard } from '../hazards/ElectricHazard';
import { FallingMachinery } from '../hazards/FallingMachinery';
import { TurretHazard } from '../hazards/TurretHazard';
import { CorruptionHazard } from '../hazards/CorruptionHazard';

export class HazardSystem {
  private readonly hazards:BaseHazard[];
  constructor(definitions:readonly HazardDefinition[],context:HazardContext){
    this.hazards=definitions.map(data=>data.type==='laser'?new LaserHazard(data,context):data.type==='electric'?new ElectricHazard(data,context):data.type==='machinery'?new FallingMachinery(data,context):data.type==='turret'?new TurretHazard(data,context):new CorruptionHazard(data,context));
    this.hazards.forEach(h=>h.update(0));
  }
  update(delta:number):void {this.hazards.forEach(h=>h.update(delta));}
  snapshot(){return this.hazards.map(h=>h.snapshot());}
}
