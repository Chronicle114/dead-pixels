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
import { HealthSystem, type HealthEvent } from '../systems/HealthSystem';
import { HealthHud } from '../ui/HealthHud';
import { GameFeedback } from '../systems/GameFeedback';
import { HazardSystem } from '../systems/HazardSystem';
import { audioManager } from '../systems/AudioManager';
import { SecretSystem } from '../systems/SecretSystem';

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
  private health!: HealthSystem;
  private lowHealthAt = 0;
  private ambienceAt = 0;
  private ambienceStep = 0;
  private healthHud!: HealthHud;
  private feedback!: GameFeedback;
  private hazards!: HazardSystem;
  private secrets!: SecretSystem;
  private completed = false;
  private completionPhase: 'arrival' | 'playing' | 'signal' | 'shutdown' = 'arrival';

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
    this.lowHealthAt = 0;
    this.ambienceAt = 0; this.ambienceStep = levelManager.number%3;
    audioManager.playMusic(`level-${levelManager.number}` as import('../audio/AudioManifest').MusicId);

    this.cameras.main.setBackgroundColor(CHANNELS[data.initialChannel].visual.background);
    this.cameras.main.setBounds(0, 0, data.width, data.height);
    this.physics.world.setBounds(0, 0, data.width, data.height);

    setPresentation('game');
    this.scale.getParentBounds();
    this.scale.refresh();
    this.environment = new ArchiveEnvironment(this, false, data);

    this.level = buildLevel(this, data);

    this.player = new Player(this, data.spawn.x, data.spawn.y);
    this.feedback = new GameFeedback(this);
    this.health = new HealthSystem(event => this.handleDamage(event));
    this.healthHud = new HealthHud(this);
    this.secrets = new SecretSystem(this,data.secrets??[],this.feedback);
    this.physics.add.collider(this.player, this.level.platforms);
    this.physics.add.overlap(this.player, this.level.exit, () => this.handleExit());

    this.cameras.main.startFollow(this.player, true, 1, 1);

    this.fx = new ChannelTransition(this);
    this.hud = new ChannelHud(this, data.initialChannel);
    this.channels = new ChannelSystem(this, data.initialChannel, {
      canSwitchTo: (target) => this.canSwitchTo(target),
    });
    this.hazards = new HazardSystem(data.hazards ?? [], { scene: this, body: this.player.body as Phaser.Physics.Arcade.Body,
      channel: () => this.channels.active, solids: this.level.platformList, feedback: this.feedback,
      hit: source => this.completionPhase === 'playing' && this.health.damage(source, this.time.now), cue: (name,x) => { audioManager.cue(name,x); } });

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

    const menu = () => {audioManager.cue('back');this.scene.start(SceneKeys.Menu);};
    const restart = () => {
      if (this.completed) return;
      levelManager.restart();
      this.scene.restart();
    };
    keyboard?.on('keydown-ESC', menu);
    keyboard?.on('keydown-R', restart);
    const sounds = ['footstep','jump','land'].map(name => {
      const handler=(x:number)=>{
        if(this.completionPhase!=='playing')return;
        audioManager.cue(name,x);
        if(name==='land')this.feedback.burst(x,this.player.y+5,0x6b8b91,3);
      };
      this.events.on(`player-${name}`,handler);return{name,handler};
    });
    const fragileWarning=(x:number)=>audioManager.cue('metal-creak',x);
    const fragileCollapse=(x:number)=>{audioManager.cue('metal-impact',x);this.feedback.burst(x,this.player.y+6,0xd3a378,6);};
    this.events.on('fragile-warning',fragileWarning);this.events.on('fragile-collapse',fragileCollapse);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      connectTelevision(null);
      this.fx.destroy();
      this.hud.destroy();
      keyboard?.off('keydown-ESC', menu);
      keyboard?.off('keydown-R', restart);
      sounds.forEach(({name,handler})=>this.events.off(`player-${name}`,handler));
      this.events.off('fragile-warning',fragileWarning);this.events.off('fragile-collapse',fragileCollapse);
    });
  }

  override update(_time: number, delta: number): void {
    const health = this.health.snapshot(this.time.now);
    audioManager.setListenerX(this.player.x);
    this.player.setDamageVisual(health.invulnerable, health.dead);
    this.healthHud.update(health.hp);
    this.player.update();

    const body = this.player.body as Phaser.Physics.Arcade.Body;

    this.environment.update(this.cameras.main.scrollX);
    if (this.completionPhase !== 'playing') return;
    if(health.hp===1&&this.time.now-this.lowHealthAt>2000){this.lowHealthAt=this.time.now;audioManager.cue('low-health');}
    if(this.time.now-this.ambienceAt>8000){
      this.ambienceAt=this.time.now;
      audioManager.cue(['ambient-fan','ambient-relay','ambient-signal'][this.ambienceStep++%3],this.player.x+120);
    }
    this.hazards.update(delta);
    this.level.updateFragile(body,this.time.now);
    if (this.completionPhase !== 'playing') return;
    this.guidance.update(this.player.x);
    this.secrets.update(this.player.x,this.player.y,this.channels.active);
    if (body.blocked.down || body.touching.down) {
      for (const point of this.definition.checkpoints ?? []) {
        if (Math.abs(this.player.x - point.x) < 13 && Math.abs(this.player.y - point.y) < 3 && levelManager.activate(point)) {
          this.guidance.activate(point);
          this.feedback.burst(point.x,point.y,0x80c9ba,4);
          audioManager.cue('checkpoint',point.x);
          if (this.health.healCheckpoint(point.id)) this.feedback.burst(this.player.x, this.player.y, 0x80c9ba);
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
      if(item.collapsed)continue;

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
    audioManager.cue('channel',this.player.x);
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    if (this.completionPhase === 'playing' && !body.blocked.down && !body.touching.down && body.velocity.y !== 0) this.airSwitches++;
    this.level.setChannel(to);
    this.applyChannelVisuals(to);
    this.hud.setChannel(to);
    this.fx.setInstability(to, this.definition.visuals?.instability);
    this.fx.playStatic(CHANNELS[to].visual.accent);
    this.feedback.burst(this.player.x,this.player.y,CHANNELS[to].visual.accent,3);

  }

  private handleChannelRejected(): void {
    audioManager.cue('channel-invalid',this.player.x);
    this.fx.playRejected();
    this.hud.flashNoSignal();
  }

  private applyChannelVisuals(id: ChannelId): void {
    const visual = CHANNELS[id].visual;
    this.environment.setChannel(id);
    this.cameras.main.setBackgroundColor(visual.background);
  }

  private respawnPlayer(revive = false): void {
    const target = levelManager.respawnPoint;
    if (!isSafePoint(this.definition, target, target.channel)) throw new Error('Invalid checkpoint');
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    body.reset(target.x, target.y);
    this.channels.restore(target.channel);
    body.moves = true;
    this.player.setControlsEnabled(true);
    if (revive) this.health.reboot(this.time.now);
    else this.health.grantGrace(this.time.now);
    this.completionPhase = 'playing';
    this.channels.setEnabled(true);
    connectTelevision(this.channels);
    this.feedback.burst(target.x, target.y, 0x80c9ba);
    audioManager.cue('reboot',target.x);
    this.respawns++;
    levelManager.registerFall();
    this.fx.playRejected();
  }

  private handleDamage(event: HealthEvent): void {
    audioManager.cue(event.lethal?'death':'damage',this.player.x);
    this.feedback.burst(this.player.x, this.player.y - 4, 0xe3ab76);
    if (!event.lethal) return;
    this.completionPhase = 'shutdown';
    this.player.setControlsEnabled(false);
    this.channels.setEnabled(false);
    connectTelevision(null);
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0, 0); body.moves = false;
    this.time.delayedCall(330, () => this.cameras.main.fadeOut(120, 7, 11, 18));
    this.time.delayedCall(500, () => {
      this.respawnPlayer(true);
      this.cameras.main.resetFX(); this.cameras.main.fadeIn(160, 7, 11, 18);
    });
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
      this.health.setEnabled(true);
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
    this.feedback.burst(this.definition.exit.x,this.definition.exit.y-4,0x80c9ba,8);
    audioManager.cue('complete',this.player.x);
    this.health.setEnabled(false);
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
      health: this.health.diagnostics(this.time.now),
      hazards: this.hazards.snapshot(),
      secrets:this.secrets.snapshot(),
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
      platforms: this.level.platformList.map(({ definition, active, tile,collapsed,crackedAt }) => ({ ...definition, active,collapsed,cracking:crackedAt!==null&&!collapsed, enabled: (tile.body as Phaser.Physics.Arcade.StaticBody).enable })),
    };
  }
}
