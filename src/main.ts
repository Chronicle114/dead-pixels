import Phaser from 'phaser';
import './styles/main.css';
import { createGameConfig } from './config/GameConfig';
import { connectTelevision, resizeDisplay, selectChannel, setPresentation } from './ui/Television';
import type { GameScene } from './scenes/GameScene';
import type { EndingScene } from './scenes/EndingScene';
import { audioManager } from './systems/AudioManager';
import { saveManager } from './systems/SaveManager';
import type { MenuScene } from './scenes/MenuScene';
import type { IntroScene } from './scenes/IntroScene';

const parent = document.getElementById('game-root');
if (!parent) throw new Error('DEAD PIXELS: missing #game-root');
setPresentation('menu');
audioManager.installUnlock();
audioManager.setPreferences(saveManager.settings);
const game = new Phaser.Game(createGameConfig(parent));
if (import.meta.env.DEV) window.__game = game;
connectTelevision(null);
document.querySelectorAll<HTMLButtonElement>('.channel-btn').forEach((button) => {
  button.addEventListener('click', () => {
    selectChannel(Number(button.dataset.channel));
    button.blur();
  });
  button.addEventListener('pointerenter',()=>audioManager.cue('hover'));
});
window.addEventListener('resize', () => { resizeDisplay(); game.scale.getParentBounds(); game.scale.refresh(); });
window.addEventListener('beforeunload', () => game.destroy(true));

// Read-only diagnostics are useful in production as well as dev. No setters,
// teleportation hooks, collision bypasses or test-specific behavior.
window.deadPixels = {
  switchChannel: selectChannel,
  getAudioState: () => audioManager.snapshot(),
  getState: () => game.scene.isActive('Game')
    ? (game.scene.getScene('Game') as GameScene).getSnapshot()
    : game.scene.isActive('Intro') ? (game.scene.getScene('Intro') as IntroScene).getSnapshot()
    : game.scene.isActive('Ending') ? (game.scene.getScene('Ending') as EndingScene).getSnapshot()
    : game.scene.isActive('Menu') ? (game.scene.getScene('Menu') as MenuScene).getSnapshot() : {mode:'boot' as const},
};

declare global {
  interface Window {
    __game?: Phaser.Game;
    deadPixels: { switchChannel: typeof selectChannel; getAudioState: () => ReturnType<typeof audioManager.snapshot>; getState: () => ReturnType<GameScene['getSnapshot']> | ReturnType<EndingScene['getSnapshot']> | ReturnType<MenuScene['getSnapshot']> | ReturnType<IntroScene['getSnapshot']> | {mode:'boot'} };
  }
}
