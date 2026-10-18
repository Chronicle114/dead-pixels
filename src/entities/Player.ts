import Phaser from 'phaser';
import { AssetKeys } from '../assets/AssetManifest';

const MOVE_SPEED = 85;
const JUMP_VELOCITY = -205;
const MAX_FALL_SPEED = 320;

export const PlayerAnimations = {
  Idle: 'player-anim-idle', Walk: 'player-anim-walk', Jump: 'player-anim-jump',
  Fall: 'player-anim-fall', Land: 'player-anim-land',
} as const;

/** Original collision carrier; the larger animated robot never resizes the body. */
export class Player extends Phaser.Physics.Arcade.Sprite {
  private readonly cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private readonly keyA: Phaser.Input.Keyboard.Key;
  private readonly keyD: Phaser.Input.Keyboard.Key;
  private readonly keyW: Phaser.Input.Keyboard.Key;
  private readonly keySpace: Phaser.Input.Keyboard.Key;
  private readonly visual: Phaser.GameObjects.Sprite;
  private controlsEnabled = true;
  private wasOnGround = false;
  private landUntil = 0;
  private shuttingDown = false;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, AssetKeys.Carrier);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    Player.ensureAnimations(scene);
    this.visual = scene.add.sprite(x, y + 6, AssetKeys.Explorer, 0).setOrigin(0.5, 1).setDepth(20);
    const keyboard = scene.input.keyboard;
    if (!keyboard) throw new Error('Player: keyboard input is required.');
    this.cursors = keyboard.createCursorKeys();
    this.keyA = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.keyD = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    this.keyW = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    this.keySpace = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(6, 12);
    body.setOffset(1, 0);
    body.setMaxVelocity(MOVE_SPEED, MAX_FALL_SPEED);
    this.visual.on(Phaser.Animations.Events.ANIMATION_UPDATE, (animation:Phaser.Animations.Animation, frame:Phaser.Animations.AnimationFrame) => {
      if(animation.key===PlayerAnimations.Walk && (frame.index===1||frame.index===4) && (body.blocked.down||body.touching.down) && Math.abs(body.velocity.x)>0) scene.events.emit('player-footstep',this.x);
    });
    this.setCollideWorldBounds(true);
    // Sync after physics integration, including camera-follow/respawn frames.
    scene.events.on(Phaser.Scenes.Events.POST_UPDATE, this.syncVisual, this);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      scene.events.off(Phaser.Scenes.Events.POST_UPDATE, this.syncVisual, this);
    });
  }

  setControlsEnabled(enabled: boolean): void {
    this.controlsEnabled = enabled;
    if (!enabled) this.setVelocityX(0);
  }

  setDamageVisual(invulnerable: boolean, dead: boolean): void {
    this.shuttingDown = dead;
    this.visual.setAlpha(invulnerable && Math.floor(this.scene.time.now / 110) % 2 ? 0.6 : 1);
    if (dead) {
      this.visual.anims.stop();
      this.visual.setFrame(14 + Math.min(2, Math.floor(this.scene.time.now / 140) % 3)).setTint(0x263641);
    } else this.visual.clearTint();
  }

  override update(): void {
    if (this.shuttingDown) return;
    const body = this.body as Phaser.Physics.Arcade.Body;
    const onGround = body.blocked.down || body.touching.down;
    let moving = false;
    if (this.controlsEnabled) {
      const left = this.cursors.left.isDown || this.keyA.isDown;
      const right = this.cursors.right.isDown || this.keyD.isDown;
      moving = left !== right;
      this.setVelocityX(moving ? (left ? -MOVE_SPEED : MOVE_SPEED) : 0);
      if (moving) { this.setFlipX(left); this.visual.setFlipX(left); }
      const jump = Phaser.Input.Keyboard.JustDown(this.cursors.up) ||
        Phaser.Input.Keyboard.JustDown(this.keyW) || Phaser.Input.Keyboard.JustDown(this.keySpace);
      if (jump && onGround) { this.setVelocityY(JUMP_VELOCITY); this.scene.events.emit('player-jump',this.x); }
    }
    if (onGround && !this.wasOnGround) { this.landUntil = this.scene.time.now + 180; this.scene.events.emit('player-land',this.x); }
    const next = !onGround || body.velocity.y < 0
      ? (body.velocity.y > 0 ? PlayerAnimations.Fall : PlayerAnimations.Jump)
      : this.scene.time.now < this.landUntil ? PlayerAnimations.Land
      : moving ? PlayerAnimations.Walk : PlayerAnimations.Idle;
    this.visual.play(next, true);
    this.wasOnGround = onGround;
  }

  private syncVisual(): void {
    this.visual.setPosition(Math.round(this.x), Math.round(this.y + 6));
  }

  private static ensureAnimations(scene: Phaser.Scene): void {
    if (scene.anims.exists(PlayerAnimations.Idle)) return;
    const sequences = [
      [PlayerAnimations.Idle, 0, 3, 4, -1], [PlayerAnimations.Walk, 4, 9, 12, -1],
      [PlayerAnimations.Jump, 10, 11, 8, 0], [PlayerAnimations.Fall, 12, 13, 7, -1],
      [PlayerAnimations.Land, 14, 16, 17, 0],
    ] as const;
    for (const [key, start, end, frameRate, repeat] of sequences) {
      scene.anims.create({ key, frames: scene.anims.generateFrameNumbers(AssetKeys.Explorer, { start, end }), frameRate, repeat });
    }
  }
}
