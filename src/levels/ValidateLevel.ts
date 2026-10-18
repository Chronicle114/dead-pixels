import { isPlatformActiveIn, type ChannelId } from '../config/Channels';
import type { LevelDefinition, SpawnPoint } from './LevelTypes';

/** The unchanged carrier's body is x-3..x+3, y-6..y+6. */
export function isSafePoint(level: LevelDefinition, point: SpawnPoint, channel: ChannelId): boolean {
  const left = point.x - 3, right = point.x + 3, top = point.y - 6, bottom = point.y + 6;
  const solids = level.platforms.filter(p => isPlatformActiveIn(p.channels, channel));
  const inside = solids.some(p => left < p.x + p.width && right > p.x && top < p.y + p.height && bottom > p.y);
  const supported = solids.some(p => point.x - 4 >= p.x && point.x + 4 <= p.x + p.width && p.y >= bottom && p.y - bottom <= 12);
  return !inside && supported && left >= 0 && right <= level.width;
}

export function validateLevel(level: LevelDefinition): void {
  if (!isSafePoint(level, level.spawn, level.initialChannel)) throw new Error(`${level.key}: unsafe spawn`);
  if (level.platforms.some(p => p.width <= 0 || p.height <= 0 || p.x < 0 || p.x + p.width > level.width || p.y < 0 || p.y + p.height > level.height)) {
    throw new Error(`${level.key}: platform outside world bounds`);
  }
  for (const cp of level.checkpoints ?? []) {
    if (!isSafePoint(level, cp, cp.channel)) throw new Error(`${level.key}: unsafe checkpoint ${cp.id}`);
  }
  for (const hazard of level.hazards ?? []) {
    if (hazard.x<0 || hazard.x+hazard.width>level.width || hazard.y<0 || hazard.y+hazard.height>180 || hazard.width<=0 || hazard.height<=0 || !hazard.channels.length) throw new Error(`${level.key}: invalid hazard ${hazard.id}`);
    for (const point of [{...level.spawn,channel:level.initialChannel},...(level.checkpoints??[])]) {
      if (hazard.channels.includes(point.channel) && point.x+3>hazard.x && point.x-3<hazard.x+hazard.width && point.y+6>hazard.y && point.y-6<hazard.y+hazard.height) throw new Error(`${level.key}: hazard overlaps safe point`);
    }
  }
  if (![1, 2, 3].some(ch => isSafePoint(level, { x: level.exit.x, y: level.exit.y + 2 }, ch as ChannelId))) {
    throw new Error(`${level.key}: exit has no safe support`);
  }
}
