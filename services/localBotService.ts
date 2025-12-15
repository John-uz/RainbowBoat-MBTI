
import { Player, GameEvent } from "../types";

// Personality Traits mapping
const TRAITS: Record<string, { focus: string[], style: string }> = {
    'INTJ': { focus: ['efficiency', 'future', 'logic'], style: '冷静、直接、略带傲娇' },
    'INTP': { focus: ['logic', 'possibility', 'truth'], style: '理性、好奇、有时候会跑题' },
    'ENTJ': { focus: ['efficiency', 'control', 'goal'], style: '霸气、果断、以结果为导向' },
    'ENTP': { focus: ['possibility', 'debate', 'chaos'], style: '调皮、爱抬杠、脑洞大' },
    'INFJ': { focus: ['harmony', 'future', 'meaning'], style: '温柔、神秘、富有哲理' },
    'INFP': { focus: ['values', 'emotion', 'authenticity'], style: '感性、真诚、富有诗意' },
    'ENFJ': { focus: ['harmony', 'people', 'growth'], style: '热情、鼓励、像个大家长' },
    'ENFP': { focus: ['possibility', 'people', 'joy'], style: '快乐、跳脱、甚至有点吵' },
    'ISTJ': { focus: ['detail', 'duty', 'past'], style: '严谨、靠谱、有些刻板' },
    'ISFJ': { focus: ['detail', 'harmony', 'care'], style: '温暖、体贴、关注细节' },
    'ESTJ': { focus: ['efficiency', 'rule', 'fact'], style: '强势、务实、守规矩' },
    'ESFJ': { focus: ['harmony', 'people', 'tradition'], style: '热心、八卦、照顾周全' },
    'ISTP': { focus: ['logic', 'action', 'present'], style: '酷、话少、一针见血' },
    'ISFP': { focus: ['values', 'action', 'beauty'], style: '随性、温和、有艺术感' },
    'ESTP': { focus: ['action', 'present', 'impact'], style: '大胆、爱冒险、乐子人' },
    'ESFP': { focus: ['people', 'action', 'joy'], style: '爱演、戏精、气氛组' }
};

const GENERIC_COMMENTS = [
    "这就很有意思了。", "我再想想...", "不仅如此，还得考虑更多。", "真的吗？我不这么认为。", "哈哈，太真实了。", "这让我想起了一件事。"
];

// Helper to determine choice based on MBTI preferences
const getPreferredChoiceIndex = (mbti: string, event: GameEvent): number => {
    const trait = TRAITS[mbti];
    
    // Simple Heuristics based on event type and MBTI letters
    if (event.type === 'dilemma') {
        // T types prefer 'A' if it sounds logical/bold (assuming A is usually the active/bold choice in our data)
        // F types prefer 'A' if it sounds emotional/connected
        // This is a simplification for speed.
        if (mbti.includes('T') && Math.random() > 0.3) return 0;
        if (mbti.includes('F') && Math.random() > 0.3) return 0;
    }
    
    if (event.type === 'cooperation') {
        // E types are more likely to cooperate enthusiastically (Option A usually)
        if (mbti.includes('E')) return 0;
        // I types might hesitate (Option B)
        if (mbti.includes('I') && Math.random() > 0.4) return 1;
    }

    return Math.random() > 0.5 ? 0 : 1; // Fallback random
};

export const getInstantBotDecision = (bot: Player, event: GameEvent): { choiceIndex: number, comment: string } => {
    const choiceIndex = getPreferredChoiceIndex(bot.mbti, event);
    const trait = TRAITS[bot.mbti];
    const optionLabel = event.options[choiceIndex].label;

    // Generate a pseudo-comment template
    const templates = [
        `作为一个${bot.mbti}，我肯定选“${optionLabel}”。`,
        `这就不用想了，“${optionLabel}”才符合我的风格。`,
        `虽然有点纠结，但“${optionLabel}”更合理。`,
        `直接冲，“${optionLabel}”！`,
        `如果是为了${trait.focus[0]}，那必须是“${optionLabel}”。`
    ];

    const comment = templates[Math.floor(Math.random() * templates.length)];
    return { choiceIndex, comment };
};

export const getInstantBotReaction = (reactor: Player, actor: Player, actionLabel: string): string | null => {
    // 30% chance to react, otherwise silence to keep game fast
    if (Math.random() > 0.4) return null;

    const templates = [
        `不愧是你啊，${actor.name}！`,
        `哈？竟然选这个？`,
        `我也想选那个！`,
        `典型${actor.mbti}的操作。`,
        `确实，这很合理。`,
        `这波操作我看懂了。`,
        `有点东西。`
    ];
    
    // Add some MBTI flavor
    if (reactor.mbti.includes('ENTP')) return `笑死，${actor.name}你认真的吗？`;
    if (reactor.mbti.includes('INTJ')) return `符合预期。`;
    if (reactor.mbti.includes('ENFP')) return `好耶！我也想玩这个！`;
    if (reactor.mbti.includes('ISTJ')) return `嗯，按规矩是该这样。`;
    if (reactor.mbti.includes('INFJ')) return `我懂你为什么这么选...`;

    return templates[Math.floor(Math.random() * templates.length)];
};
