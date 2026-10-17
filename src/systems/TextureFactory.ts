import type Phaser from 'phaser';

// The existing procedural font remains in PixelFont. Artwork is now local PNG.
export const TextureKeys = { BackgroundDots: 'bg-dots', ExitBars: 'exit-bars' } as const;

export const TextureFactory = {
  createAll(scene: Phaser.Scene): void {
    if (scene.textures.exists(TextureKeys.BackgroundDots)) return;
    const texture = scene.textures.createCanvas(TextureKeys.BackgroundDots, 64, 64);
    if (!texture) throw new Error('Failed to create signal dust texture');
    const ctx = texture.getContext();
    ctx.fillStyle = '#607783';
    for (const [x, y] of [[7, 11], [43, 37], [21, 54]]) ctx.fillRect(x, y, 1, 1);
    texture.refresh();
  },
};
