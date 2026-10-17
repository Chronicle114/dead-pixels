import Phaser from 'phaser';
import { SceneKeys } from '../config/Constants';
import { TextureFactory } from '../systems/TextureFactory';
import { loadAssets } from '../assets/AssetManifest';

export class BootScene extends Phaser.Scene {
  constructor() {
    super(SceneKeys.Boot);
  }

  preload(): void {
    loadAssets(this);
  }

  create(): void {
    TextureFactory.createAll(this);
    this.scene.start(SceneKeys.Menu);
  }
}
