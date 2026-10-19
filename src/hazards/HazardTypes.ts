import type Phaser from 'phaser';
import type { ChannelId } from '../config/Channels';
import type { DamageSource } from '../systems/HealthSystem';
import type { BuiltPlatform } from '../systems/LevelBuilder';
import type { GameFeedback } from '../systems/GameFeedback';

export interface HazardDefinition {
  id: string;
  type: DamageSource;
  x: number; y: number; width: number; height: number;
  channels: readonly ChannelId[];
  groundY?: number;
  range?: number;
  projectileSpeed?: number;
  phaseMs?: number;
  activeMs?: number;
  burst?: number;
}
export interface Box { x: number; y: number; width: number; height: number }
export interface HazardContext {
  scene: Phaser.Scene;
  body: Phaser.Physics.Arcade.Body;
  channel: () => ChannelId;
  solids: readonly BuiltPlatform[];
  hit: (source: DamageSource) => boolean;
  feedback: GameFeedback;
  cue: (name: string, x: number) => void;
}
