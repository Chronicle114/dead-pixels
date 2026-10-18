import type { Box } from './HazardTypes';

export function intersects(a: Box, b: Box): boolean {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

/** Slab segment/AABB test. Used for swept projectile contacts and wall blocking. */
export function segmentHitsBox(x0: number, y0: number, x1: number, y1: number, b: Box, pad = 0): boolean {
  let near = 0, far = 1;
  const dx = x1 - x0, dy = y1 - y0;
  if (dx === 0) { if (x0 < b.x - pad || x0 > b.x + b.width + pad) return false; }
  else {
    const a = (b.x - pad - x0) / dx, c = (b.x + b.width + pad - x0) / dx;
    near = Math.max(near, Math.min(a, c)); far = Math.min(far, Math.max(a, c));
  }
  if (dy === 0) { if (y0 < b.y - pad || y0 > b.y + b.height + pad) return false; }
  else {
    const a = (b.y - pad - y0) / dy, c = (b.y + b.height + pad - y0) / dy;
    near = Math.max(near, Math.min(a, c)); far = Math.min(far, Math.max(a, c));
  }
  return near <= far;
}

export function cycleState(elapsed: number, idle: number, warning: number, active: number, cooldown: number): 'IDLE' | 'WARNING' | 'ACTIVE' | 'COOLDOWN' {
  const t = elapsed % (idle + warning + active + cooldown);
  return t < idle ? 'IDLE' : t < idle + warning ? 'WARNING' : t < idle + warning + active ? 'ACTIVE' : 'COOLDOWN';
}
