import Phaser from 'phaser';
import {
  CHANNELS,
  type ChannelConfig,
  type ChannelId,
  nextChannel,
  previousChannel,
} from '../config/Channels';

export const ChannelEvents = {
  Changed: 'channel-changed',
  Rejected: 'channel-rejected',
} as const;

const SWITCH_COOLDOWN_MS = 150;

export interface ChannelSystemOptions {
  canSwitchTo: (target: ChannelId) => boolean;
}

export class ChannelSystem extends Phaser.Events.EventEmitter {
  private readonly scene: Phaser.Scene;
  private readonly canSwitchTo: (target: ChannelId) => boolean;
  private current: ChannelId;
  private lastAttemptAt = 0;
  private enabled = true;

  constructor(scene: Phaser.Scene, initial: ChannelId, options: ChannelSystemOptions) {
    super();

    const keyboard = scene.input.keyboard;

    if (!keyboard) {
      throw new Error('ChannelSystem: keyboard input is required.');
    }

    this.scene = scene;
    this.canSwitchTo = options.canSwitchTo;
    this.current = initial;

    const handlers: [string, () => void][] = [
      ['keydown-ONE', () => this.requestSwitch(1)], ['keydown-TWO', () => this.requestSwitch(2)],
      ['keydown-THREE', () => this.requestSwitch(3)], ['keydown-Q', () => this.requestSwitch(previousChannel(this.current))],
      ['keydown-E', () => this.requestSwitch(nextChannel(this.current))],
    ];
    handlers.forEach(([event, handler]) => keyboard.on(event, handler));
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      handlers.forEach(([event, handler]) => keyboard.off(event, handler));
      this.removeAllListeners();
    });
  }

  get active(): ChannelId {
    return this.current;
  }

  get activeConfig(): ChannelConfig {
    return CHANNELS[this.current];
  }

  requestSwitch(to: ChannelId): boolean {
    if (!this.enabled || to === this.current) {
      return false;
    }

    const now = this.scene.time.now;

    if (now - this.lastAttemptAt < SWITCH_COOLDOWN_MS) {
      return false;
    }

    this.lastAttemptAt = now;

    if (!this.canSwitchTo(to)) {
      this.emit(ChannelEvents.Rejected, to);
      return false;
    }

    const from = this.current;
    this.current = to;
    this.emit(ChannelEvents.Changed, from, to);
    return true;
  }

  setEnabled(enabled: boolean): void { this.enabled = enabled; }

  /** Respawn-only restore: ignores cooldown, still validates real geometry. */
  restore(to: ChannelId): void {
    if (!this.canSwitchTo(to)) throw new Error('Unsafe checkpoint channel restore');
    this.lastAttemptAt = 0;
    if (to === this.current) return;
    const from = this.current;
    this.current = to;
    this.emit(ChannelEvents.Changed, from, to);
  }
}
