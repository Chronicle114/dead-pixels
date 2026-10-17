import { ChannelEvents, type ChannelSystem } from '../systems/ChannelSystem';
import type { ChannelId } from '../config/Channels';

let connected: ChannelSystem | null = null;

function showChannel(_from: ChannelId, to: ChannelId): void {
  document.body.dataset.channel = String(to);
  document.querySelectorAll<HTMLButtonElement>('.channel-btn').forEach((button) => {
    const selected = Number(button.dataset.channel) === to;
    button.classList.toggle('channel-active', selected);
    button.setAttribute('aria-pressed', String(selected));
  });
}

export function connectTelevision(system: ChannelSystem | null): void {
  connected?.off(ChannelEvents.Changed, showChannel);
  connected = system;
  system?.on(ChannelEvents.Changed, showChannel);
  if (system) showChannel(system.active, system.active);
  document.querySelectorAll<HTMLButtonElement>('.channel-btn').forEach((button) => { button.disabled = !system; });
}

export function selectChannel(id: number): boolean {
  return (id === 1 || id === 2 || id === 3) && !!connected?.requestSwitch(id);
}

export function setPresentation(mode: 'menu' | 'game'): void {
  document.body.dataset.mode = mode;
  resizeDisplay();
}

/** Integer pixel scaling when possible, with a fractional fallback below 320px. */
export function resizeDisplay(): void {
  const playing = document.body.dataset.mode === 'game';
  const availableWidth = Math.max(160, window.innerWidth - (playing ? 32 : 104));
  const availableHeight = Math.max(90, window.innerHeight - (playing ? 92 : 220));
  const fit = Math.min(availableWidth / 320, availableHeight / 180, playing ? 6 : 3);
  const scale = fit >= 1 ? Math.floor(fit) : fit;
  document.documentElement.style.setProperty('--screen-width', `${320 * scale}px`);
}
