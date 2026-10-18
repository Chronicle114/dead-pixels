import Phaser from 'phaser';
import { CHANNELS, type ChannelId, isPlatformActiveIn } from '../config/Channels';
import { GAME_WIDTH, SceneKeys } from '../config/Constants';
import { Palette } from '../config/Palette';
import { Player } from '../entities/Player';
import type { LevelDefinition } from '../levels/LevelTypes';
import { isSafePoint } from '../levels/ValidateLevel';
import { levelManager } from '../systems/LevelManager';
import { ChannelEvents, ChannelSystem } from '../systems/ChannelSystem';
import { ChannelTransition } from '../systems/ChannelTransition';
import { buildLevel, type BuiltLevel } from '../systems/LevelBuilder';
import { PixelFont } from '../systems/PixelFont';
import { ArchiveEnvironment } from '../systems/ArchiveEnvironment';
import { connectTelevision, setPresentation } from '../ui/Television';
import { ChannelHud } from '../ui/ChannelHud';
import { LevelGuidance } from '../ui/LevelGuidance';

const FALL_THRESHOLD_Y = 170;
const PLAYER_RECT_INSET = 1;

export class GameScene extends Phaser.Scene {
  private player!: Player;
  private level!: BuiltLevel;
  private channels!: ChannelSystem;
  private fx!: ChannelTransition;
  private hud!: ChannelHud;
  private environment!: ArchiveEnvironment;
  private guidance!: LevelGuidance;
  private definition!: LevelDefinition;
  private airSwitches = 0;
  private respawns = 0;
  private completed = false;
  private completionPhase: 'arrival' | 'playing' | 'signal' = 'arrival';

  constructor() {
    super(SceneKeys.Game);
  }

  create(): void {
    const data = levelManager.current;
    this.definition = data;

    this.completed = false;
    this.completionPhase = 'arrival';
    this.airSwitches = 0;
    this.respawns = 0;

    this.cameras.main.setBackgroundColor(CHANNELS[data.initialChannel].visual.background);
    this.cameras.main.setBounds(0, 0, data.width, data.height);
    this.physics.world.setBounds(0, 0, data.width, data.height);

    setPresentation('game');
    this.scale.getParentBounds();
    this.scale.refresh();
    this.environment = new ArchiveEnvironment(this, false, data);

    this.level = buildLevel(this, data);

    this.player = new Player(this, data.spawn.x, data.spawn.y);
    this.physics.add.collider(this.player, this.level.platforms);
    this.physics.add.overlap(this.player, this.level.exit, () => this.handleExit());

    this.cameras.main.startFollow(this.player, true, 1, 1);

    this.fx = new ChannelTransition(this);
    this.hud = new ChannelHud(this, data.initialChannel);
    this.channels = new ChannelSystem(this, data.initialChannel, {
      canSwitchTo: (target) => this.canSwitchTo(target),
    });

    this.channels.on(ChannelEvents.Changed, (_from: ChannelId, to: ChannelId) =>
      this.handleChannelChanged(to),
    );
    this.channels.on(ChannelEvents.Rejected, () => this.handleChannelRejected());

    this.level.setChannel(this.channels.active);
    this.applyChannelVisuals(this.channels.active);
    this.fx.setInstability(this.channels.active, data.visuals?.instability);

    this.guidance = new LevelGuidance(this, data, levelManager.number, levelManager.total);
    this.showArrival();

    const keyboard = this.input.keyboard;

    const menu = () => this.scene.start(SceneKeys.Menu);
    const restart = () => {
      if (this.completed) return;
      levelManager.restart();
      this.scene.restart();
    };
    keyboard?.on('keydown-ESC', menu);
    keyboard?.on('keydown-R', restart);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      connectTelevision(null);
      this.fx.destroy();
      this.hud.destroy();
      keyboard?.off('keydown-ESC', menu);
      keyboard?.off('keydown-R', restart);
    });
  }

  override update(): void {
    this.player.update();

    const body = this.player.body as Phaser.Physics.Arcade.Body;

    this.environment.update(this.cameras.main.scrollX);
    if (this.completionPhase !== 'playing') return;
    this.guidance.update(this.player.x);
    if (body.blocked.down || body.touching.down) {
      for (const point of this.definition.checkpoints ?? []) {
        if (Math.abs(this.player.x - point.x) < 13 && Math.abs(this.player.y - point.y) < 3 && levelManager.activate(point)) {
          this.guidance.activate(point);
        }
      }
    }

    if (!this.completed && this.player.y > FALL_THRESHOLD_Y) {
      this.respawnPlayer();
    }
  }

  private canSwitchTo(target: ChannelId): boolean {
    const playerBody = this.player.body as Phaser.Physics.Arcade.Body;
    const playerRect = new Phaser.Geom.Rectangle(
      playerBody.x + PLAYER_RECT_INSET,
      playerBody.y + PLAYER_RECT_INSET,
      Math.max(playerBody.width - PLAYER_RECT_INSET * 2, 1),
      Math.max(playerBody.height - PLAYER_RECT_INSET * 2, 1),
    );

    for (const item of this.level.platformList) {
      if (item.active) {
        continue;
      }

      if (!isPlatformActiveIn(item.definition.channels, target)) {
        continue;
      }

      const platformRect = new Phaser.Geom.Rectangle(
        item.definition.x,
        item.definition.y,
        item.definition.width,
        item.definition.height,
      );

      if (Phaser.Geom.Intersects.RectangleToRectangle(playerRect, platformRect)) {
        return false;
      }
    }

    return true;
  }

  private handleChannelChanged(to: ChannelId): void {
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    if (this.completionPhase === 'playing' && !body.blocked.down && !body.touching.down && body.velocity.y !== 0) this.airSwitches++;
    this.level.setChannel(to);
    this.applyChannelVisuals(to);
    this.hud.setChannel(to);
    this.fx.setInstability(to, this.definition.visuals?.instability);
    this.fx.playStatic(CHANNELS[to].visual.accent);

  }

  private handleChannelRejected(): void {
    this.fx.playRejected();
    this.hud.flashNoSignal();
  }

  private applyChannelVisuals(id: ChannelId): void {
    const visual = CHANNELS[id].visual;
    this.environment.setChannel(id);
    this.cameras.main.setBackgroundColor(visual.background);
  }

  private respawnPlayer(): void {
    const target = levelManager.respawnPoint;
    if (!isSafePoint(this.definition, target, target.channel)) throw new Error('Invalid checkpoint');
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    body.reset(target.x, target.y);
    this.channels.restore(target.channel);
    this.respawns++;
    levelManager.registerFall();
    this.fx.playRejected();
  }

  private showArrival(): void {
    this.player.setControlsEnabled(false);
    this.channels.setEnabled(false);
    connectTelevision(null);
    const backdrop = this.add.rectangle(160, 83, 302, 83, 0x09111b, 0.93).setScrollFactor(0).setDepth(110);
    const number = PixelFont.text(this, `LEVEL ${String(levelManager.number).padStart(2, '0')}`, Palette.warmHighlight, 1, 160, 58).setScrollFactor(0).setDepth(111);
    const title = PixelFont.text(this, this.definition.title ?? this.definition.key, Palette.cyan, 2, 160, 81).setScrollFactor(0).setDepth(111);
    const subtitle = PixelFont.text(this, this.definition.subtitle ?? '', Palette.silver, 1, 160, 105).setScrollFactor(0).setDepth(111);
    this.fx.playStatic(this.definition.visuals?.accent ?? Palette.cyan);
    this.time.delayedCall(650, () => {
      this.completionPhase = 'playing';
      this.player.setControlsEnabled(true);
      this.channels.setEnabled(true);
      connectTelevision(this.channels);
      this.tweens.add({ targets: [backdrop, number, title, subtitle], alpha: 0, duration: 180, onComplete: () => [backdrop, number, title, subtitle].forEach(object => object.destroy()) });
    });
  }

  private handleExit(): void {
    if (this.completed) {
      return;
    }

    this.completed = true;
    this.completionPhase = 'signal';
    this.player.setControlsEnabled(false);
    this.channels.setEnabled(false);
    connectTelevision(null);
    this.fx.playStatic(CHANNELS[this.channels.active].visual.accent);

    const signal = PixelFont.text(this, 'SIGNAL RESTORED', Palette.cyan, 2, GAME_WIDTH / 2, 80)
      .setScrollFactor(0)
      .setDepth(100);

    PixelFont.text(this, `LEVEL ${String(levelManager.number).padStart(2, '0')} COMPLETE`, Palette.silver, 1, 160, 103).setScrollFactor(0).setDepth(100);
    this.time.delayedCall(850, () => this.cameras.main.fadeOut(200, 7, 11, 18));
    this.time.delayedCall(1100, () => {
      signal.destroy();
      if (levelManager.advance()) this.scene.restart();
      else this.scene.start(SceneKeys.Ending);
    });
  }

  getSnapshot() {
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    return {
      mode: 'game' as const, channel: this.channels.active, completed: this.completed,
      level: levelManager.snapshot(), airSwitches: this.airSwitches, respawns: this.respawns,
      phase: this.completionPhase, x: this.player.x, y: this.player.y,
      vx: body.velocity.x, vy: body.velocity.y, grounded: body.blocked.down || body.touching.down,
      body: { width: body.width, height: body.height, offsetX: body.offset.x, offsetY: body.offset.y },
      cameraX: this.cameras.main.scrollX, fps: this.game.loop.actualFps,
      objects: this.children.length,
      physics: { dynamic: this.physics.world.bodies.size, static: this.physics.world.staticBodies.size },
      animation: this.children.list.filter((child) => child instanceof Phaser.GameObjects.Sprite && child.texture.key === 'explorer-sheet').map((child) => {
        const sprite = child as Phaser.GameObjects.Sprite;
        return { key: sprite.anims.currentAnim?.key, frame: sprite.frame.name, x: sprite.x, y: sprite.y };
      })[0],
      messages: this.children.list.filter((child) => child instanceof Phaser.GameObjects.Image && child.visible && child.alpha > 0 && child.texture.key.startsWith('pixel-font:')).map((child) => (child as Phaser.GameObjects.Image).texture.key.split(':')[1]),
      noSignal: this.children.list.some((child) => child instanceof Phaser.GameObjects.Image && child.texture.key.startsWith('pixel-font:NO SIGNAL') && child.alpha > 0),
      platforms: this.level.platformList.map(({ definition, active, tile }) => ({ ...definition, active, enabled: (tile.body as Phaser.Physics.Arcade.StaticBody).enable })),
    };
  }
}
