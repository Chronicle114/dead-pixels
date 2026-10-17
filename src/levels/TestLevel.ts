import { GAME_HEIGHT } from '../config/Constants';
import type { LevelDefinition } from './LevelTypes';

export const TEST_LEVEL: LevelDefinition = {
  key: 'test-chamber',
  width: 640,
  height: GAME_HEIGHT,
  spawn: { x: 28, y: 150 },
  exit: { x: 600, y: 156 },
  initialChannel: 1,
  platforms: [
    { x: 0, y: 164, width: 224, height: 16, style: 'ground-top' },
    { x: 96, y: 128, width: 48, height: 16, style: 'brick' },
    { x: 224, y: 164, width: 80, height: 16, style: 'memory', channels: [2] },
    { x: 248, y: 132, width: 32, height: 16, style: 'void-crystal', channels: [3] },
    { x: 304, y: 164, width: 128, height: 16, style: 'ground-top' },
    { x: 384, y: 100, width: 16, height: 64, style: 'brick', channels: [1, 2] },
    { x: 432, y: 164, width: 208, height: 16, style: 'ground-top', channels: [1, 2] },
  ],
};
