import type { ChannelId } from '../config/Channels';
import type { HazardDefinition } from '../hazards/HazardTypes';

export type PlatformStyle = 'ground-top' | 'ground-fill' | 'brick' | 'memory' | 'void-crystal';

export interface PlatformDefinition {
  id?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  style: PlatformStyle;
  channels?: readonly ChannelId[];
}

export interface SpawnPoint {
  x: number;
  y: number;
}

export interface CheckpointDefinition extends SpawnPoint {
  id: string;
  channel: ChannelId;
}

export interface TutorialDefinition {
  from: number;
  to: number;
  text: string;
  /** Optional small world-space channel marker, not a collision object. */
  channel?: ChannelId;
}

export interface LevelVisuals {
  composition: number;
  machinery: 'receivers' | 'antenna' | 'cores' | 'tapes' | 'broken' | 'relays' | 'transmitter';
  instability: 0 | 1 | 2;
  accent: number;
}

export interface LevelDefinition {
  key: string;
  title?: string;
  subtitle?: string;
  width: number;
  height: number;
  spawn: SpawnPoint;
  exit: SpawnPoint;
  initialChannel: ChannelId;
  platforms: PlatformDefinition[];
  checkpoints?: CheckpointDefinition[];
  tutorials?: TutorialDefinition[];
  visuals?: LevelVisuals;
  hazards?: readonly HazardDefinition[];
}
