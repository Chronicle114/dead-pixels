export type MusicId = 'menu' | 'intro' | 'level-1' | 'level-2' | 'level-3' | 'level-4' | 'level-5' | 'level-6' | 'level-7' | 'ending';
const local=(id:MusicId)=>`${import.meta.env.BASE_URL}assets/audio/${id}.wav`;
export const MUSIC:Record<MusicId,string> = {
  menu:local('menu'),intro:local('intro'),'level-1':local('level-1'),'level-2':local('level-2'),
  'level-3':local('level-3'),'level-4':local('level-4'),'level-5':local('level-5'),
  'level-6':local('level-6'),'level-7':local('level-7'),ending:local('ending'),
};
