import type { ChannelId } from '../config/Channels';

export type PlatformStyle = 'ground-top' | 'ground-fill' | 'brick' | 'memory' | 'void-crystal';

export interface PlatformDefinition {
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

export interface LevelDefinition {
  key: string;
  width: number;
  height: number;
  spawn: SpawnPoint;
  exit: SpawnPoint;
  initialChannel: ChannelId;
  platforms: PlatformDefinition[];
}
