
import { GameEvent } from '../types';

export const STATIC_EVENTS: Record<string, GameEvent[]> = {
  'Te': [
    {
      title: '效率挑战 (Te)',
      description: '针对一个常见的俗语（例如：“早起的鸟儿有虫吃”），提出一个完全相反的观点，并给出理由。',
      type: 'dilemma',
      difficulty: 2,
      category: 'standard',
      options: [
        { label: '提出反直觉观点', value: 'A', impact: '展示了你的批判性思维' },
        { label: '难以反驳', value: 'B', impact: '你决定保留意见' }
      ]
    },
    {
      title: '流程优化 (Te)',
      description: '观察当前游戏的流程，提出一个具体能提高效率或公平性的新规则或改动。',
      type: 'cooperation',
      difficulty: 3,
      category: 'deep',
      options: [
        { label: '提出新规则', value: 'A', impact: '大家觉得你的建议很有建设性' },
        { label: '维持现状', value: 'B', impact: '游戏继续进行' }
      ]
    },
  ],
  'Ti': [
    {
      title: '深层含义 (Ti)',
      description: '从桌面上随机拿起一个物品，思考并分享它除了表面用途外，还能象征什么更深层次的含义。',
      type: 'reflection',
      difficulty: 2,
      category: 'deep',
      options: [
        { label: '分享哲学解读', value: 'A', impact: '你的洞察力让人惊讶' },
        { label: '仅描述外观', value: 'B', impact: '大家期待更深入的观点' }
      ]
    },
  ],
  'Fe': [
    {
      title: '夸奖时刻 (Fe)',
      description: '请夸奖左边的玩家三个优点，并说明理由。',
      type: 'cooperation',
      difficulty: 1,
      category: 'standard',
      options: [
        { label: '真诚赞美', value: 'A', impact: '建立了温暖的连接' },
        { label: '简单敷衍', value: 'B', impact: '略显尴尬' }
      ]
    },
  ],
  'Fi': [
    {
      title: '自我关键词 (Fi)',
      description: '用3个关键词描述自己的人格，并解释原因。',
      type: 'reflection',
      difficulty: 2,
      category: 'standard',
      options: [
        { label: '深情剖析', value: 'A', impact: '大家看到了真实的你' },
        { label: '保留隐私', value: 'B', impact: '你保持了神秘感' }
      ]
    },
  ],
  'Se': [
    {
      title: '现场解说 (Se)',
      description: '对当前游戏桌上的场景进行30秒的现场直播式解说，就像你在解说一场激动人心的体育比赛。',
      type: 'cooperation',
      difficulty: 1,
      category: 'fun',
      options: [
        { label: '激情解说', value: 'A', impact: '全场气氛被点燃' },
        { label: '拒绝表演', value: 'B', impact: '错失了活跃气氛的机会' }
      ]
    },
  ],
  'Si': [
    {
      title: '回忆礼物 (Si)',
      description: '分享一件你曾经收到过的，对你个人来说意义最特别的小礼物，并解释原因。',
      type: 'reflection',
      difficulty: 2,
      category: 'deep',
      options: [
        { label: '分享回忆', value: 'A', impact: '温馨的回忆感动了大家' },
        { label: '想不起来', value: 'B', impact: '记忆有些模糊' }
      ]
    },
  ],
  'Ne': [
    {
      title: '脑洞大开 (Ne)',
      description: '随机从桌上拿起一件物品，在10秒内尽可能多地说出它的非传统用途，越多越好。',
      type: 'cooperation',
      difficulty: 2,
      category: 'fun',
      options: [
        { label: '疯狂联想', value: 'A', impact: '你的创造力令人惊叹' },
        { label: '只想出一个', value: 'B', impact: '思维有些受限' }
      ]
    },
  ],
  'Ni': [
    {
      title: '规则反转 (Ni)',
      description: '想象一个日常生活中普遍存在的规则或现象突然反转了，简单描述会发生什么有趣或奇怪的后果。',
      type: 'reflection',
      difficulty: 3,
      category: 'deep',
      options: [
        { label: '深刻洞察', value: 'A', impact: '你的视角非常独特' },
        { label: '难以想象', value: 'B', impact: '现实感太强' }
      ]
    },
  ],
  '?': [
    {
      title: '神秘命运 (?)',
      description: '你来到了未知的中心。作为奖励，你可以选择模仿场上任意一名玩家的一个动作，或者跳过此回合。',
      type: 'dilemma',
      difficulty: 1,
      category: 'standard',
      options: [
        { label: '模仿他人', value: 'A', impact: '大家觉得很有趣' },
        { label: '静观其变', value: 'B', impact: '平稳度过' }
      ]
    }
  ]
};

export const getRandomStaticEvent = (functionId: string, categoryId?: string): GameEvent => {
    const key = Object.keys(STATIC_EVENTS).includes(functionId) ? functionId : '?';
    let list = STATIC_EVENTS[key];
    
    // Simple filter simulation
    // Since our hardcoded list is small, we fallback to random if specific category is empty
    // In a real app, we'd have full coverage.
    if (categoryId) {
        const filtered = list.filter(e => e.category === categoryId);
        if (filtered.length > 0) list = filtered;
    }
    
    // Fallback creator if list is empty or small
    if (list.length === 0) {
        return {
            title: `即兴互动 (${functionId})`,
            description: "请即兴邀请一名玩家进行互动，具体内容由你们决定。",
            type: "cooperation",
            difficulty: 1,
            category: categoryId || 'standard',
            options: [{label: '开始互动', value: 'A', impact: '增加了彼此的了解'}]
        };
    }

    return list[Math.floor(Math.random() * list.length)];
};
