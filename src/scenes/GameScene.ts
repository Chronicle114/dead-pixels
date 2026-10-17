import Phaser from 'phaser';
import { CHANNELS, type ChannelId, isPlatformActiveIn } from '../config/Channels';
import { GAME_WIDTH, SceneKeys } from '../config/Constants';
import { Palette } from '../config/Palette';
import { Player } from '../entities/Player';
import { TEST_LEVEL } from '../levels/TestLevel';
import { ChannelEvents, ChannelSystem } from '../systems/ChannelSystem';
import { ChannelTransition } from '../systems/ChannelTransition';
import { buildLevel, type BuiltLevel } from '../systems/LevelBuilder';
import { PixelFont } from '../systems/PixelFont';
import { ArchiveEnvironment } from '../systems/ArchiveEnvironment';
import { connectTelevision, setPresentation } from '../ui/Television';
import { ChannelHud } from '../ui/ChannelHud';

const FALL_THRESHOLD_Y = 170;
const RESPAWN_SAFE_DELAY_MS = 800;
const PLAYER_RECT_INSET = 1;

export class GameScene extends Phaser.Scene {
  private player!: Player;
  private level!: BuiltLevel;
  private channels!: ChannelSystem;
  private fx!: ChannelTransition;
  private hud!: ChannelHud;
  private environment!: ArchiveEnvironment;
  private lastGrounded: { x: number; y: number } | null = null;
  private lastRespawnAt = 0;
  private completed = false;
  private completionPhase: 'playing' | 'signal' | 'complete' = 'playing';

  constructor() {
    super(SceneKeys.Game);
  }

  create(): void {
    const data = TEST_LEVEL;

    this.completed = false;
    this.completionPhase = 'playing';
    this.lastGrounded = null;
    this.lastRespawnAt = 0;

    this.cameras.main.setBackgroundColor(CHANNELS[data.initialChannel].visual.background);
    this.cameras.main.setBounds(0, 0, data.width, data.height);
    this.physics.world.setBounds(0, 0, data.width, data.height);

    setPresentation('game');
    this.scale.getParentBounds();
    this.scale.refresh();
    this.environment = new ArchiveEnvironment(this);

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
    this.fx.setInstability(this.channels.active);

    connectTelevision(this.channels);

    PixelFont.text(this, 'ESC - MENU', Palette.gray, 1, 0, 0)
      .setOrigin(0, 0)
      .setPosition(6, 6)
      .setScrollFactor(0);

    PixelFont.text(this, 'A/D MOVE  SPACE JUMP  1/2/3 CHANNEL', Palette.silver, 1, 0, 0)
      .setOrigin(0, 0)
      .setPosition(6, 20)
      .setScrollFactor(0)
      .setDepth(100).setAlpha(0.8);

    const keyboard = this.input.keyboard;

    if (keyboard) {
      keyboard.on('keydown-ESC', () => {
        this.scene.start(SceneKeys.Menu);
      });
    }

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      connectTelevision(null);
      this.fx.destroy();
      this.hud.destroy();
    });
  }

  override update(): void {
    this.player.update();

    const body = this.player.body as Phaser.Physics.Arcade.Body;

    if (body.blocked.down || body.touching.down) {
      this.lastGrounded = { x: this.player.x, y: this.player.y };
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
    this.level.setChannel(to);
    this.applyChannelVisuals(to);
    this.hud.setChannel(to);
    this.fx.setInstability(to);
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
    const now = this.time.now;
    const grounded = this.lastGrounded;
    const target =
      grounded !== null && now - this.lastRespawnAt > RESPAWN_SAFE_DELAY_MS ? grounded : TEST_LEVEL.spawn;

    this.lastRespawnAt = now;
    this.lastGrounded = null;
    this.player.setPosition(target.x, target.y);
    this.player.setVelocity(0, 0);
    this.fx.playRejected();
  }

  private handleExit(): void {
    if (this.completed) {
      return;
    }

    this.completed = true;
    this.completionPhase = 'signal';
    this.player.setControlsEnabled(false);
    this.fx.playStatic(CHANNELS[this.channels.active].visual.accent);

    const signal = PixelFont.text(this, 'SIGNAL RESTORED', Palette.cyan, 2, GAME_WIDTH / 2, 80)
      .setScrollFactor(0)
      .setDepth(100);

    this.time.delayedCall(1100, () => {
      signal.destroy();
      this.completionPhase = 'complete';

      PixelFont.text(this, 'TEST CHAMBER COMPLETE', Palette.white, 1, GAME_WIDTH / 2, 80)
        .setScrollFactor(0)
        .setDepth(100);

      const prompt = PixelFont.text(this, 'PRESS ENTER - MENU', Palette.silver, 1, GAME_WIDTH / 2, 100)
        .setScrollFactor(0)
        .setDepth(100);

      this.tweens.add({
        targets: prompt,
        alpha: { from: 1, to: 0.3 },
        duration: 600,
        yoyo: true,
        repeat: -1,
      });

      const keyboard = this.input.keyboard;

      if (keyboard) {
        keyboard.once('keydown-ENTER', () => {
          this.scene.start(SceneKeys.Menu);
        });
      }

      this.input.once('pointerdown', () => {
        this.scene.start(SceneKeys.Menu);
      });
    });
  }

  getSnapshot() {
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    return {
      mode: 'game' as const, channel: this.channels.active, completed: this.completed,
      phase: this.completionPhase, x: this.player.x, y: this.player.y,
      vx: body.velocity.x, vy: body.velocity.y, grounded: body.blocked.down || body.touching.down,
      body: { width: body.width, height: body.height, offsetX: body.offset.x, offsetY: body.offset.y },
      cameraX: this.cameras.main.scrollX, fps: this.game.loop.actualFps,
      objects: this.children.length,
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
