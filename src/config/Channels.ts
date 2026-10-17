import { Palette } from './Palette';

export type ChannelId = 1 | 2 | 3;

export interface ChannelVisualConfig {
  background: number;
  ambient: number;
  ambientAlpha: number;
  accent: number;
  dotsAlpha: number;
}

export interface ChannelConfig {
  id: ChannelId;
  name: string;
  code: string;
  visual: ChannelVisualConfig;
}

export const CHANNELS: Readonly<Record<ChannelId, ChannelConfig>> = {
  1: {
    id: 1,
    name: 'REALITY',
    code: 'CH-01',
    visual: {
      background: Palette.deepNavy,
      ambient: Palette.mutedGreen,
      ambientAlpha: 0.08,
      accent: Palette.desatCyan,
      dotsAlpha: 0.25,
    },
  },
  2: {
    id: 2,
    name: 'MEMORY',
    code: 'CH-02',
    visual: {
      background: Palette.deepViolet,
      ambient: Palette.lavender,
      ambientAlpha: 0.12,
      accent: Palette.mutedMagenta,
      dotsAlpha: 0.20,
    },
  },
  3: {
    id: 3,
    name: 'VOID',
    code: 'CH-03',
    visual: {
      background: Palette.nearBlack,
      ambient: Palette.darkCrimson,
      ambientAlpha: 0.10,
      accent: Palette.burntOrange,
      dotsAlpha: 0.30,
    },
  },
};

export const CHANNEL_ORDER: readonly ChannelId[] = [1, 2, 3];

export function nextChannel(id: ChannelId): ChannelId {
  const index = CHANNEL_ORDER.indexOf(id);
  return CHANNEL_ORDER[(index + 1) % CHANNEL_ORDER.length];
}

export function previousChannel(id: ChannelId): ChannelId {
  const index = CHANNEL_ORDER.indexOf(id);
  return CHANNEL_ORDER[(index - 1 + CHANNEL_ORDER.length) % CHANNEL_ORDER.length];
}

export function isPlatformActiveIn(channels: readonly ChannelId[] | undefined, channel: ChannelId): boolean {
  return channels === undefined || channels.includes(channel);
}
