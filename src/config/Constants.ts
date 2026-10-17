export const GAME_WIDTH = 320;
export const GAME_HEIGHT = 180;

export const TILE_SIZE = 16;

export const GRAVITY_Y = 500;

export const SceneKeys = {
  Boot: 'Boot',
  Menu: 'Menu',
  Game: 'Game',
} as const;

export type SceneKey = (typeof SceneKeys)[keyof typeof SceneKeys];
