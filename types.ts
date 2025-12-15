
export enum GameMode {
  MBTI_16 = 'MBTI_16',
  JUNG_8 = 'JUNG_8'
}

export type ActionCode = '1' | '2' | '3' | '1/2/3' | 'SWAP' | 'x2' | 'SKIP';

export type ScoreModifier = 'NORMAL' | 'DOUBLE' | 'HALF' | 'CLONE' | 'TRANSFER';

export type SpecialAbility = 'NONE' | 'FREEDOM' | 'SUBSTITUTE' | 'COMPANION';

export interface Player {
  id: string;
  name: string;
  isBot: boolean;
  mbti: string; 
  avatar: string;
  
  trustScore: number;    
  insightScore: number;  
  expressionScore: number; 
  totalRatingGiven: number; // New: Tracks total stars given to others
  
  color: string;
  position: number; 
  previousPosition: number | null; 
  stackIndex: number; 
  skipUsedCount: number; // For tracking skip cost
}

export interface GameState {
  players: Player[];
  currentPlayerIndex: number;
  gameMode: GameMode;
  turn: number;
  targetScore: number; 
  logs: LogEntry[];
  
  // Game Flow
  phase: 'SETUP' | 'LOADING' | 'PLAYING' | 'ANALYSIS' | 'ONBOARDING';
  
  // Event Data
  currentTile: BoardTile | null;
  selectedTask: TaskOption | null;
  activeModifier: ScoreModifier; 
  activeSpecialAbility: SpecialAbility; 
  
  // Movement & Steps
  remainingSteps: number; // New: Tracks steps left in current turn
  sightRange: number; // New: Tracks current visual radius (1 or 2)

  // Interaction
  helperId: string | null; 
  scoreTargetPlayerId: string | null; 
  sharedHelpUsedCount: number; 
  hasReselected: boolean; 
  
  // Peer Review State
  peerReviewQueue: string[]; 
  currentReviewerId: string | null;
  accumulatedRating: number;
  
  // Pre-generation Cache
  pregeneratedTasks: Record<string, TaskOption> | null;

  // States
  movementState: 'IDLE' | 'ROLLING' | 'MOVING_STEP' | 'TELEPORTING';
  subPhase: 'IDLE' | 'SELECTING_CARD' | 'VIEWING_TASK' | 'TASK_EXECUTION' | 'CHOOSING_HELPER' | 'PEER_REVIEW' | 'SELECTING_SCORE_TARGET' | 'SELECTING_SUBSTITUTE' | 'SELECTING_COMPANION';
  
  diceValue: number | null;
  highestScore: number; 
  
  // Metadata for Report
  snapshots: string[];
  startTime: number;
}

export interface LogEntry {
  id: string;
  text: string;
  type: 'system' | 'chat' | 'action';
  author?: string;
  timestamp: number;
  taskDetails?: string; 
}

export interface TaskOption {
  category: 'standard' | 'truth' | 'dare' | 'deep';
  title: string;
  description: string;
  multiplier: number;
  scoreType: 'trust' | 'insight' | 'expression';
  durationSeconds: number;
}

export interface GameEventOption {
  label: string;
  value: string;
  impact: string;
}

export interface GameEvent {
  title: string;
  description: string;
  type: string;
  difficulty: number;
  category: string;
  options: GameEventOption[];
}

export interface BoardTile {
  index: number;
  functionId: string; // Used for Type Name in MBTI mode
  characterName?: string; // New: For MBTI characters
  modifier: ScoreModifier; // For Function Tiles
  specialAbility: SpecialAbility; // For '?' Tiles
  q: number; 
  r: number; 
  zone?: string; 
}

export const TASK_CATEGORIES_CONFIG = {
    'standard': { name: '暖身', multiplier: 1.0, icon: '🌱', color: 'bg-emerald-600/90 border-emerald-400' },
    'truth': { name: '真心', multiplier: 1.2, icon: '🕊️', color: 'bg-sky-600/90 border-sky-400' },
    'dare': { name: '挑战', multiplier: 1.2, icon: '🔥', color: 'bg-amber-600/90 border-amber-400' },
    'deep': { name: '走心', multiplier: 1.5, icon: '✨', color: 'bg-indigo-600/90 border-indigo-400' },
};

export const MBTI_TYPES = [
  'INTJ', 'INTP', 'ENTJ', 'ENTP',
  'INFJ', 'INFP', 'ENFJ', 'ENFP',
  'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ',
  'ISTP', 'ISFP', 'ESTP', 'ESFP'
];

export const MBTI_GROUPS = {
    '分析家 (NT)': {
        types: ['INTJ', 'INTP', 'ENTJ', 'ENTP'],
        color: 'bg-purple-100 dark:bg-purple-900/40 border-purple-200 dark:border-purple-500/50 text-purple-800 dark:text-purple-200',
        hexColor: '#a855f7'
    },
    '外交家 (NF)': {
        types: ['INFJ', 'INFP', 'ENFJ', 'ENFP'],
        color: 'bg-green-100 dark:bg-green-900/40 border-green-200 dark:border-green-500/50 text-green-800 dark:text-green-200',
        hexColor: '#22c55e'
    },
    '守护者 (SJ)': {
        types: ['ISTJ', 'ISFJ', 'ESTJ', 'ESFJ'],
        color: 'bg-blue-100 dark:bg-blue-900/40 border-blue-200 dark:border-blue-500/50 text-blue-800 dark:text-blue-200',
        hexColor: '#3b82f6'
    },
    '探险家 (SP)': {
        types: ['ISTP', 'ISFP', 'ESTP', 'ESFP'],
        color: 'bg-amber-100 dark:bg-yellow-900/40 border-amber-200 dark:border-yellow-500/50 text-amber-800 dark:text-yellow-200',
        hexColor: '#eab308'
    }
};

// MBTI Representative Characters (Modern Chinese College Student Context)
export const MBTI_CHARACTERS: Record<string, string> = {
    'INTJ': '章北海',   // 三体，绝对理智
    'INTP': '柯南',     // 真相只有一个
    'ENTJ': '顾里',     // 小时代，控场女王
    'ENTP': '钢铁侠',   // 聪明自负脑洞大
    'INFJ': '艾莎',     // Elsa, 内心丰富
    'INFP': '林黛玉',   // 经典情感
    'ENFJ': '朱迪警官', // 疯狂动物城，热血
    'ENFP': '路飞',     // 自由快乐
    'ISTJ': '甄嬛',     // 回宫后，步步为营
    'ISFJ': '大白',     // Baymax, 极致守护
    'ESTJ': '麦格教授', // 严厉公正
    'ESFJ': '佟湘玉',   // 武林外传，照顾大家
    'ISTP': '张起灵',   // 盗墓笔记，人狠话不多
    'ISFP': '李子柒',   // 动手能力强，田园
    'ESTP': '孙悟空',   // 行动派，大闹天宫
    'ESFP': '洪世贤',   // 搞笑梗王，明明白白
    'Hub': '海洋之心' 
};

export const BOT_NAMES: Record<string, string[]> = {
    'INTJ': ['策展人', '远见'], 'INTP': ['解构者', '逻辑'], 'ENTJ': ['领航员', '统帅'], 'ENTP': ['辩手', '火花'],
    'INFJ': ['引路人', '深海'], 'INFP': ['治愈者', '云端'], 'ENFJ': ['导师', '暖阳'], 'ENFP': ['追光者', '自由'],
    'ISTJ': ['基石', '守望'], 'ISFJ': ['港湾', '信鸽'], 'ESTJ': ['督导', '秩序'], 'ESFJ': ['纽带', '春风'],
    'ISTP': ['匠心', '行者'], 'ISFP': ['艺术家', '微风'], 'ESTP': ['破风', '甚至'], 'ESFP': ['聚光', '乐章'],
};

export const MBTI_STACKS: Record<string, string[]> = {
  'INTJ': ['Ni', 'Te', 'Fi', 'Se', 'Ne', 'Ti', 'Fe', 'Si'],
  'INTP': ['Ti', 'Ne', 'Si', 'Fe', 'Te', 'Ni', 'Se', 'Fi'],
  'ENTJ': ['Te', 'Ni', 'Se', 'Fi', 'Ti', 'Ne', 'Si', 'Fe'],
  'ENTP': ['Ne', 'Ti', 'Fe', 'Si', 'Ni', 'Te', 'Fi', 'Se'],
  'INFJ': ['Ni', 'Fe', 'Ti', 'Se', 'Ne', 'Fi', 'Te', 'Si'],
  'INFP': ['Fi', 'Ne', 'Si', 'Te', 'Fe', 'Ni', 'Se', 'Ti'],
  'ENFJ': ['Fe', 'Ni', 'Se', 'Ti', 'Fi', 'Ne', 'Si', 'Te'],
  'ENFP': ['Ne', 'Fi', 'Te', 'Si', 'Ni', 'Fe', 'Ti', 'Se'],
  'ISTJ': ['Si', 'Te', 'Fi', 'Ne', 'Se', 'Ti', 'Fe', 'Ni'],
  'ISFJ': ['Si', 'Fe', 'Ti', 'Ne', 'Se', 'Fi', 'Te', 'Ni'],
  'ESTJ': ['Te', 'Si', 'Ne', 'Fi', 'Ti', 'Se', 'Ni', 'Fe'],
  'ESFJ': ['Fe', 'Si', 'Ne', 'Ti', 'Fi', 'Se', 'Ni', 'Te'],
  'ISTP': ['Ti', 'Se', 'Ni', 'Fe', 'Te', 'Si', 'Ne', 'Fi'],
  'ISFP': ['Fi', 'Se', 'Ni', 'Te', 'Fe', 'Si', 'Ne', 'Ti'],
  'ESTP': ['Se', 'Ti', 'Fe', 'Ni', 'Si', 'Te', 'Fi', 'Ne'],
  'ESFP': ['Se', 'Fi', 'Te', 'Ni', 'Si', 'Fe', 'Ti', 'Ne'],
};

export const JUNG_FUNCTIONS = [
  { id: 'Te', name: '外倾思考', color: '#3b82f6', desc: '执行与规划', textColor: 'text-blue-100', borderColor: 'border-blue-500', bgColor: 'bg-blue-600' }, 
  { id: 'Ti', name: '内倾思考', color: '#0ea5e9', desc: '分析与本质', textColor: 'text-sky-100', borderColor: 'border-sky-500', bgColor: 'bg-sky-600' }, 
  { id: 'Fe', name: '外倾情感', color: '#ec4899', desc: '共情与连接', textColor: 'text-pink-100', borderColor: 'border-pink-500', bgColor: 'bg-pink-600' }, 
  { id: 'Fi', name: '内倾情感', color: '#f43f5e', desc: '真诚与价值', textColor: 'text-rose-100', borderColor: 'border-rose-500', bgColor: 'bg-rose-600' }, 
  { id: 'Se', name: '外倾感觉', color: '#eab308', desc: '当下与体验', textColor: 'text-yellow-100', borderColor: 'border-yellow-500', bgColor: 'bg-yellow-600' }, 
  { id: 'Si', name: '内倾感觉', color: '#f97316', desc: '积淀与细节', textColor: 'text-orange-100', borderColor: 'border-orange-500', bgColor: 'bg-orange-600' }, 
  { id: 'Ne', name: '外倾直觉', color: '#a855f7', desc: '探索与可能', textColor: 'text-purple-100', borderColor: 'border-purple-500', bgColor: 'bg-purple-600' }, 
  { id: 'Ni', name: '内倾直觉', color: '#6366f1', desc: '洞见与愿景', textColor: 'text-indigo-100', borderColor: 'border-indigo-500', bgColor: 'bg-indigo-600' }, 
  { id: '?', name: '灵镜中心', color: '#ffffff', desc: '未知与命运', textColor: 'text-slate-900', borderColor: 'border-white', bgColor: 'bg-white' },
];

// Helper to check neighbors in Grid (Square)
export const getGridNeighbors = (currentTile: BoardTile, allTiles: BoardTile[]): BoardTile[] => {
    const directions = [
        { q: 1, r: 0 }, { q: -1, r: 0 }, // Right, Left
        { q: 0, r: 1 }, { q: 0, r: -1 }  // Up, Down
    ];
    return directions.map(d => 
        allTiles.find(t => t.q === currentTile.q + d.q && t.r === currentTile.r + d.r)
    ).filter((t): t is BoardTile => t !== undefined);
};

export const getHexNeighbors = (currentTile: BoardTile, allTiles: BoardTile[]): BoardTile[] => {
    const directions = [
        { q: 1, r: 0 }, { q: -1, r: 0 },
        { q: 0, r: 1 }, { q: 0, r: -1 },
        { q: 1, r: -1 }, { q: -1, r: 1 }
    ];
    return directions.map(d => 
        allTiles.find(t => t.q === currentTile.q + d.q && t.r === currentTile.r + d.r)
    ).filter((t): t is BoardTile => t !== undefined);
};
