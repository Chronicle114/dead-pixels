export type MusicId = 'menu' | 'intro' | 'level-1' | 'level-2' | 'level-3' | 'level-4' | 'level-5' | 'level-6' | 'level-7' | 'ending';
/** Populated by the soundtrack milestone; no placeholder network requests. */
export const MUSIC: Partial<Record<MusicId,string>> = {};
