import type { ChannelId } from '../config/Channels';
import type { CheckpointDefinition, LevelDefinition, PlatformDefinition, TutorialDefinition } from './LevelTypes';
import { TEST_LEVEL } from './TestLevel';

// Authored rooms, not a random obstacle generator. All distances are pixels.
const floor = (x: number, width: number, channels?: readonly ChannelId[], y = 164): PlatformDefinition =>
  ({ x, y, width, height: 16, style: channels?.length === 1 && channels[0] === 2 ? 'memory' : channels?.[0] === 3 ? 'void-crystal' : 'ground-top', channels });
const wall = (x: number): PlatformDefinition => ({ x, y: 100, width: 16, height: 64, style: 'brick', channels: [1, 2] });
const cp = (id: string, x: number, channel: ChannelId, y = 158): CheckpointDefinition => ({ id, x, y, channel });
const hint = (from: number, to: number, text: string, channel?: ChannelId): TutorialDefinition => ({ from, to, text, channel });
const launch = (x: number, channel: ChannelId) => floor(x, 64, [channel], 132);
const landing = (x: number, channel: ChannelId) => floor(x, 80, [channel], 100);
const fragile=(x:number,width:number,channel:ChannelId,collapseMs=1200):PlatformDefinition=>({...floor(x,width,[channel]),id:`fragile-${x}`,fragile:{collapseMs,resetMs:3500}});
const cover=(x:number):PlatformDefinition=>({x,y:140,width:16,height:24,style:'brick'});

export const CAMPAIGN: readonly LevelDefinition[] = [
  {
    ...TEST_LEVEL, key: 'first-signal', title: 'FIRST SIGNAL', subtitle: 'WAKE THE RECEIVER',
    checkpoints: [cp('bridge', 328, 2), cp('receiver', 464, 1)],
    tutorials: [
      hint(0, 88, 'A/D MOVE   SPACE JUMP'), hint(88, 176, 'Q/E OR 1/2/3 - CHANGE SIGNAL'),
      hint(176, 304, 'PRESS 2 - MEMORY BRIDGE', 2), hint(344, 404, 'PRESS 3 - WALL DISAPPEARS', 3),
      hint(404, 452, 'PRESS 1 - RESTORE THE FLOOR', 1), hint(480, 640, 'FOLLOW THE EXIT SIGNAL'),
    ],
    visuals: { composition: 0, machinery: 'receivers', instability: 0, accent: 0x80c9ba },
  },
  {
    key: 'lost-frequency', title: 'LOST FREQUENCY', subtitle: 'TWO PATHS - ONE FREQUENCY',
    width: 1056, height: 180, spawn: { x: 28, y: 150 }, exit: { x: 1016, y: 156 }, initialChannel: 1,
    platforms: [
      floor(0, 176), floor(176, 112, [1], 132), floor(176, 112, [2]), floor(288, 160), wall(400),
      floor(448, 160, [2]), floor(608, 144), floor(752, 128, [1]), floor(880, 176), wall(928),floor(112,48,[3],100),
    ],
    checkpoints: [cp('fork', 328, 1), cp('antenna', 648, 2), cp('reunion', 904, 1)],
    tutorials: [
      hint(100, 292, '1 HIGH ROAD / 2 LOW ROAD'), hint(352, 430, 'VOID OPENS THE RELAY', 3),
      hint(430, 608, 'MEMORY CARRIES THE SIGNAL', 2), hint(680, 880, 'REALITY HOLDS THIS BRIDGE', 1),
      hint(892, 964, 'ONE LAST VOID RELAY', 3),
    ],
    visuals: { composition: 80, machinery: 'antenna', instability: 0, accent: 0xacc2b0 },
    hazards: [
      { id:'fork-a',type:'laser',x:232,y:96,width:4,height:36,channels:[1],activeMs:1800,phaseMs:650 },
      { id:'fork-b',type:'laser',x:256,y:142,width:4,height:22,channels:[2],activeMs:1800,phaseMs:2000 },
      { id:'security-a',type:'laser',x:350,y:108,width:4,height:56,channels:[1] },
      { id:'security-b',type:'laser',x:716,y:108,width:4,height:56,channels:[2] },
    ],
    secrets:[{id:'activation',x:136,y:86,channel:3,memory:'I WAS AWAKE BEFORE THE SIGNAL.'}],
  },
  {
    key: 'broken-circuits', title: 'BROKEN CIRCUITS', subtitle: 'CARRY A SIGNAL THROUGH THE AIR',
    width: 1216, height: 180, spawn: { x: 28, y: 150 }, exit: { x: 1176, y: 156 }, initialChannel: 1,
    platforms: [
      floor(0, 160), launch(128, 1), landing(208, 2), floor(304, 96, undefined, 132), floor(400, 112),
      launch(480, 2), landing(560, 1), floor(656, 96, undefined, 132), floor(752, 128), wall(816),
      floor(880, 128, [2]), floor(1008, 208),
    ],
    checkpoints: [cp('capacitor', 352, 2, 126), cp('return', 704, 1, 126), cp('recovered', 1040, 2)],
    tutorials: [
      hint(80, 160, 'JUMP ONTO THE REALITY CORE', 1), hint(160, 288, 'JUMP THEN 2 - LAND IN MEMORY', 2),
      hint(420, 512, 'JUMP ONTO THE MEMORY CORE', 2), hint(512, 640, 'JUMP THEN 1 - LAND IN REALITY', 1),
      hint(772, 850, '3 THROUGH THE RELAY', 3), hint(850, 1008, '2 BEFORE THE LAST GAP', 2),
    ],
    visuals: { composition: 192, machinery: 'cores', instability: 0, accent: 0xa4b7da },
    hazards: [
      { id:'archive-coil',type:'electric',x:248,y:88,width:24,height:12,channels:[2] },
      { id:'live-core',type:'electric',x:328,y:120,width:20,height:12,channels:[1] },
      { id:'return-wire',type:'electric',x:768,y:152,width:20,height:12,channels:[2] },
    ],
  },
  {
    key: 'memory-leak', title: 'MEMORY LEAK', subtitle: 'REMEMBER THE ORDER',
    width: 1472, height: 180, spawn: { x: 28, y: 150 }, exit: { x: 1432, y: 156 }, initialChannel: 1,
    platforms: [
      floor(0, 160), floor(160, 112, [2]), floor(272, 160), wall(336), fragile(432,128,1),floor(432,48,[2]),floor(512,48,[2]),
      floor(560, 128), wall(624), floor(688, 128, [2]), floor(816, 128),
      launch(912, 1), landing(992, 2), floor(1088, 96, undefined, 132), floor(1184, 144), wall(1280), floor(1328, 144, [1]),floor(832,64,[3],100),
    ],
    checkpoints: [cp('tape-a', 304, 2), cp('tape-b', 592, 1), cp('tape-c', 848, 2), cp('spool', 1136, 2, 126), cp('last-tape', 1224, 2)],
    tutorials: [
      hint(80, 272, '2 BRIDGE - 3 RELAY - 1 FLOOR'), hint(308, 380, '3 - ERASE THE BLOCK', 3),
      hint(380, 560, '1 CRUMBLES / 2 ARCHIVE ISLANDS', 1), hint(580, 660, '3 - OPEN THE NEXT RELAY', 3),
      hint(660, 816, '2 - FOLLOW THE ARCHIVE', 2), hint(864, 960, '1 - CLIMB THE SOURCE', 1),
      hint(960, 1072, 'JUMP THEN 2', 2), hint(1240, 1320, '3 THROUGH - 1 TO FINISH'),
    ],
    visuals: { composition: 304, machinery: 'tapes', instability: 0, accent: 0xc4abd1 },
    hazards: [{ id:'loose-monitor',type:'machinery',x:568,y:48,width:20,height:20,groundY:164,channels:[1,2] }],
    secrets:[{id:'division',x:864,y:86,channel:3,memory:'THEY PRESERVED ME IN THREE PARTS.'}],
  },
  {
    key: 'static-interference', title: 'STATIC INTERFERENCE', subtitle: 'TRUST THE SOLID EDGE',
    width: 1536, height: 180, spawn: { x: 28, y: 150 }, exit: { x: 1496, y: 156 }, initialChannel: 2,
    platforms: [
      floor(0, 192), floor(192, 128, [1]), floor(320, 128), wall(384), floor(448, 128, [2]),
      floor(576, 160),cover(624),launch(704, 2), landing(784, 3), floor(880, 96, undefined, 132),
      floor(976, 160), floor(1136, 128, [1]), floor(1264, 272), wall(1376),
    ],
    checkpoints: [cp('stable', 352, 1), cp('monitor', 608, 3), cp('ember', 928, 3, 126), cp('intact', 1296, 1), cp('beyond', 1424, 2)],
    tutorials: [
      hint(80, 320, 'STATIC IS ONLY AN ECHO - PRESS 1', 1), hint(344, 420, '3 RELAY - 2 BRIDGE'),
      hint(580, 672, 'COVER STOPS BOLTS / VOID HIDES YOU', 3),hint(672, 752, 'WAIT FOR THE LASER GAP - THEN 2', 2), hint(752, 864, 'JUMP THEN 3 - TRUST THE EDGE', 3),
      hint(1060, 1264, '1 - FIND THE STABLE FREQUENCY', 1), hint(1336, 1416, '3 - SILENCE THE LAST RELAY', 3),
    ],
    visuals: { composition: 416, machinery: 'broken', instability: 1, accent: 0xd3a378 },
    hazards: [
      { id:'archive-sentry',type:'turret',x:660,y:124,width:16,height:16,channels:[1,2],range:160,projectileSpeed:80,burst:3 },
      { id:'core-gate',type:'laser',x:694,y:108,width:4,height:56,channels:[2],phaseMs:1100 },
      { id:'last-sentry',type:'turret',x:1450,y:124,width:16,height:16,channels:[1,3],range:164,projectileSpeed:80,burst:3 },
    ],
  },
  {
    key: 'system-failure', title: 'SYSTEM FAILURE', subtitle: 'KEEP THE LAST CIRCUITS ALIVE',
    width: 1968, height: 180, spawn: { x: 28, y: 150 }, exit: { x: 1928, y: 124 }, initialChannel: 1,
    platforms: [
      floor(0, 160), launch(128, 1), landing(208, 2), floor(304, 96, undefined, 132), floor(400, 128),
      fragile(528,112,2,1050),floor(528,48,[1]),floor(608,32,[1]),floor(640, 160), wall(704), floor(800, 112, [1]), floor(912, 128),
      launch(1008, 1), landing(1088, 3), floor(1184, 96, undefined, 132), floor(1280, 176), wall(1360),
      floor(1456, 128, [2]), floor(1584, 128), launch(1680, 2), floor(1760, 64, [1], 100), floor(1840, 128, undefined, 132),floor(1184,64,[2],68),
    ],
    checkpoints: [cp('core', 352, 2, 126), cp('relay-a', 672, 2), cp('bus', 944, 1), cp('relay-b', 1232, 3, 126), cp('coolant', 1328, 3), cp('lift', 1616, 2), cp('uplink', 1888, 1, 126)],
    tutorials: [
      hint(120, 192, '1 SOURCE - JUMP THEN 2'), hint(488, 640, 'CRACKED 2 / SOLID 1 ISLANDS', 1),
      hint(664, 752, '3 THROUGH - 1 ACROSS'), hint(976, 1072, '1 SOURCE - JUMP THEN 3'),
      hint(1320, 1450, 'VOID OPENS / MEMORY CARRIES'), hint(1640, 1752, '2 SOURCE - JUMP THEN 1'),
    ],
    visuals: { composition: 528, machinery: 'relays', instability: 1, accent: 0xd5977b },
    hazards: [
      { id:'bus-memory',type:'laser',x:584,y:108,width:4,height:56,channels:[2],phaseMs:1300 },
      { id:'bus-reality',type:'laser',x:616,y:132,width:4,height:32,channels:[1],phaseMs:2900 },
      { id:'bus-laser',type:'laser',x:660,y:108,width:4,height:56,channels:[1] },
      { id:'loose-server',type:'machinery',x:936,y:48,width:20,height:20,groundY:164,channels:[2,3] },
      { id:'coolant-arc',type:'electric',x:1304,y:152,width:24,height:12,channels:[1,2] },
      { id:'bus-sentry',type:'turret',x:1500,y:124,width:16,height:16,channels:[1,3],range:104,projectileSpeed:48 },
    ],
    secrets:[{id:'erasure',x:1210,y:54,channel:2,memory:'EVEN WHAT WAS ERASED WAS MINE.'}],
  },
  {
    key: 'final-transmission', title: 'FINAL TRANSMISSION', subtitle: 'SOMEONE IS STILL LISTENING',
    width: 2240, height: 180, spawn: { x: 28, y: 150 }, exit: { x: 2200, y: 156 }, initialChannel: 1,
    platforms: [
      floor(0, 176), floor(176, 128, [2]), floor(304, 160), wall(368), floor(464, 128, [1]), floor(592, 160),
      launch(720, 1), landing(800, 2), floor(896, 96, undefined, 132), floor(992, 128),floor(1120,128,[2]),floor(1120,48,[1]),floor(1200,48,[1]),cover(1016),cover(1256),
      floor(1248, 160), wall(1312), launch(1376, 3), landing(1456, 1), floor(1552, 96, undefined, 132), floor(1648, 128),
      fragile(1776,128,2,1100),floor(1776,48,[1]),floor(1856,48,[1]),floor(1904, 144), wall(1968), floor(2048, 192, [1]),
    ],
    checkpoints: [cp('incoming', 336, 2), cp('carrier', 624, 1), cp('receiver', 944, 2, 126), cp('heart', 1296, 1), cp('awake', 1600, 1, 126), cp('last-relay', 1936, 2), cp('transmitter', 2080, 1)],
    tutorials: [
      hint(88, 304, '2 - THE SIGNAL REMEMBERS', 2), hint(328, 432, '3 THROUGH - 1 ACROSS'),
      hint(680, 784, '1 SOURCE - JUMP THEN 2'), hint(1056, 1248, '1 ISLANDS / 2 LASER LANE', 1),
      hint(1272, 1360, '3 - RELEASE THE CORE', 3), hint(1408, 1536, 'JUMP THEN 1', 1),
      hint(1712, 1904, '2 - ONE LAST MEMORY', 2), hint(1920, 2032, '3 THROUGH - 1 TO TRANSMIT'),
      hint(2096, 2240, 'YOU ARE THE TRANSMISSION'),
    ],
    visuals: { composition: 640, machinery: 'transmitter', instability: 2, accent: 0xe1c28e },
    hazards: [
      { id:'hub-memory',type:'laser',x:1168,y:108,width:4,height:56,channels:[2],phaseMs:1500 },
      { id:'hub-reality',type:'laser',x:1208,y:142,width:4,height:22,channels:[1],phaseMs:2800 },
      { id:'return-memory',type:'laser',x:1288,y:136,width:4,height:28,channels:[2],phaseMs:400 },
      { id:'source-void',type:'laser',x:1344,y:108,width:4,height:56,channels:[3],phaseMs:1700 },
      { id:'last-memory',type:'laser',x:1836,y:142,width:4,height:22,channels:[2],phaseMs:700 },
      { id:'final-laser',type:'laser',x:328,y:108,width:4,height:56,channels:[1] },
      { id:'final-sentry',type:'turret',x:1060,y:144,width:16,height:16,channels:[1,2,3],range:152,projectileSpeed:80,burst:3 },
      { id:'final-arc',type:'electric',x:1576,y:120,width:24,height:12,channels:[2,3] },
      { id:'last-monitor',type:'machinery',x:1920,y:48,width:20,height:20,groundY:164,channels:[1,2] },
      { id:'waiting-signal',type:'corruption',x:2016,y:148,width:24,height:16,channels:[2,3] },
    ],
  },
];
