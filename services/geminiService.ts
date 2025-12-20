import { GoogleGenAI } from "@google/genai";
import { Player, TaskOption, GameMode, TASK_CATEGORIES_CONFIG, LogEntry, MBTI_CHARACTERS } from "../types";
import { MBTI_SAMPLES } from "./mbtiStaticData";

// --- AI CONFIGURATION INTERFACES ---

export interface AIConfig {
    // Keys for the fallback chain
    geminiKey: string;
    openRouterKey: string;
    groqKey: string;

    // Model overrides (optional)
    geminiModel: string;
    openRouterModel: string;
    groqModel: string;

    // Custom Prompts
    designPhilosophy: string;   // The "Soul" and core values
    systemPersona: string;      // The "Identity"
    taskPromptTemplate: string; // The "Instruction" for generating tasks
    reportPromptTemplate: string; // The "Instruction" for generating reports

    // Zhipu AI (BigModel)
    zhipuKey: string;

    // DeepSeek AI
    deepseekKey: string;
    deepseekModel: string;

    // Region Mode
    regionMode: 'auto' | 'china' | 'overseas';
}

export interface MBTIAnalysisResult {
    type: string;
    percentage: number;
    reason: string;
}

// --- SYSTEM ENVIRONMENT VARIABLES (Cloudflare/Vite Injection) ---
const getEnvVar = (key: string) => {
    if (import.meta.env) {
        return (import.meta.env[key] as string) || '';
    }
    return '';
};

// System Keys Injection
export const SYSTEM_KEYS = {
    // Allow specific VITE_GEMINI_KEY, fallback to generic VITE_API_KEY
    gemini: getEnvVar('VITE_GEMINI_KEY') || getEnvVar('VITE_API_KEY'),
    groq: getEnvVar('VITE_GROQ_KEY'),
    openRouter: getEnvVar('VITE_OPENROUTER_KEY'),
    zhipu: getEnvVar('VITE_ZHIPU_KEY'),
    deepseek: getEnvVar('VITE_DEEPSEEK_KEY')
};

// --- MBTI DEEP KNOWLEDGE BASE (Source: PDF) ---
// extracted from provided documentation for deep context
const MBTI_PROFILE_DATA: Record<string, string> = {
    'ENFJ': `
[称号] 深谙人心教育家(Fe - Ni)
[最佳状态] 与他人关系密切，用同理心理解情感需求。是友善的说服者和催化剂，能激发他人潜能。
[特点] 热情、忠诚、富有想象力。天生能看到他人成长潜力，组织互动，使人和谐共处。
[成长领域 / 盲点] 若不发展Ti / Se：可能难以承认人际分歧，忽略实现理想所需的细节。压力大时对他人挑剔(Ti爆发)。
[他人眼中] 精力充沛，真诚，善于交际但有明确价值观。
`,
    'ENFP': `
[称号] 浪漫洒脱追梦人(Ne - Fi)
[最佳状态] 把生活看作充满可能性的创造性冒险。对人和世界有非凡洞察力，极具说服力和推动力。
[特点] 创新、好奇、自发。重视和谐与善意，根据洞察力自信前进。
[成长领域 / 盲点] 若不发展Si / Te：可能变得散漫、难以集中注意力，忽视程序和期限。压力大时被细节淹没(Si爆发)。
[他人眼中] 活泼好动，几乎对所有事感兴趣，重视亲密关系的深度和真实性。
`,
    'ENTJ': `
[称号] 决胜千里大统领(Te - Ni)
[最佳状态] 天生的领导者，能将可能性转化为计划。善于发现低效并纠正，具有战略眼光和全局观。
[特点] 逻辑严密、果断自信。对智力充满好奇，喜欢复杂问题。
[成长领域 / 盲点] 若不发展Fi / Se：可能变得不近人情、尖酸刻薄，忽视他人情感需求和现实细节。压力大时感到孤独和不被欣赏(Fi爆发)。
[他人眼中] 直接、具挑战性、客观公正。喜欢辩论和激励性的互动。
`,
    'ENTP': `
[称号] 天马行空的创意家(Ne - Ti)
[最佳状态] 不断扫描环境寻找机会，善于提出无中生有的概念并战略分析。修身齐家治国平天下。
[特点] 创造力、理性、爱发问。善于解读他人，在感兴趣的事上游刃有余。
[成长领域 / 盲点] 若不发展Si / Fe：可能三分钟热度，变得吹毛求疵、好斗，忽视细节和他人感受。压力大时被微不足道的细节淹没(Si爆发)。
[他人眼中] 独立、自主、直率。谈话风格具有挑战性和激励性（爱辩论）。
`,
    'ESFJ': `
[称号] 心忧苍生奉献家(Fe - Si)
[最佳状态] 喜欢组织环境并与人合作完成任务。认真负责、忠于职守，重视安全感和传统。
[特点] 热情、务实、果断。对周围人的需求敏感，提供实际关怀。
[成长领域 / 盲点] 若不发展Ti / Ne：可能过快下结论，变得具有控制欲，对批评过于敏感。压力大时对自己和他人的批评一反常态(Ti爆发)。
[他人眼中] 善于交际、有组织、致力于维护传统。
`,
    'ESFP': `
[称号] 热情洋溢开心果(Se - Fi)
[最佳状态] 热爱生活，活在当下。优秀的团队合作者，以创造性方式满足人类需求。
[特点] 善于观察、实际、慷慨。敏锐观察他人行为并迅速反应。
[成长领域 / 盲点] 若不发展Ni / Te：可能变得冲动、难以遵守期限，忽视长远后果。压力大时被消极和毫无根据的可能性淹没(Ni爆发)。
[他人眼中] 足智多谋、乐于助人、生性活泼。不喜欢理论，喜欢边干边学。
`,
    'ESTJ': `
[称号] 指挥若定大掌柜(Te - Si)
[最佳状态] 喜欢组织项目和人员，有明确标准。重视能力、效率和结果，善于解决明确已知的问题。
[特点] 逻辑性强、系统化、务实。出色的管理者，能预测步骤和调配资源。
[成长领域 / 盲点] 若不发展Fi / Ne：可能变得死板教条、拒绝倾听，无法满足亲密联系需求。压力大时感到孤独和不被重视(Fi爆发)。
[他人眼中] 认真、可靠、直率自信。喜欢负责并履行角色。
`,
    'ESTP': `
[称号] 意气风发大哥大(Se - Ti)
[最佳状态] 精力充沛的问题解决者，创新地利用现有系统。化繁为简，把冲突派别团结在一起。
[特点] 善于观察、实际、理性。擅长洞察当下需求并迅速反应（救火队员）。
[成长领域 / 盲点] 若不发展Ni / Fe：可能只关注眼前感官欲望，忽视长期后果和他人感受。压力大时会想象别人不关心自己并歪曲事实(Ni爆发)。
[他人眼中] 活泼爱玩、冒险家、务实的问题解决者。
`,
    'INFJ': `
[称号] 高瞻远瞩引路人(Ni - Fe)
[最佳状态] 凭直觉理解复杂含义和人际关系。将感同身受的理解力与组织能力结合，实施改善生活的宏观计划。
[特点] 洞察力、理想主义、深沉。通过价值观做决策，追求意义和目的。
[成长领域 / 盲点] 若不发展Se / Ti：可能变得武断、怨恨和挑剔，无法用他人理解的方式表达见解。压力大时沉迷于电视、暴食或购物(Se爆发)。
[他人眼中] 私密神秘、强烈而有个性。只与信任的人分享内心直觉。
`,
    'INFP': `
[称号] 心如明镜理想家(Fi - Ne)
[最佳状态] 有内在价值观核心，希望工作能促进成长。尊重他人情感需求，即使他人未表达出来。
[特点] 敏感、理想主义、好奇。喜欢自主工作，对探索复杂人格着迷。
[成长领域 / 盲点] 若不发展Te / Si：可能难以将价值观转化为行动，变得言语表达困难、不切实际。压力大时变得过于挑剔和评判(Te爆发)。
[他人眼中] 安静、矜持、难以了解。但在分享价值观时会令人惊讶地强烈。
`,
    'INTJ': `
[称号] 运筹帷幄策略家(Ni - Te)
[最佳状态] 对未来有清晰认识，有动力和组织能力去实现想法。建立总体结构，制定远景目标。
[特点] 概念性、长远思考、理性。批判性眼光评估一切，独立自主。
[成长领域 / 盲点] 若不发展Se / Fi：可能变得冷漠唐突、一意孤行，忽略感官细节和他人情感。压力大时过度沉迷感官活动或关注琐碎细节(Se爆发)。
[他人眼中] 冷静、果断、自信。私密保守，很难参与闲聊。
`,
    'INTP': `
[称号] 石破天惊放大招(Ti - Ne)
[最佳状态] 独立的问题解决者，擅长抽象分析。寻找违背主流的解决方案，帮助团队抓住复杂问题核心。
[特点] 逻辑严密、好奇、思维敏捷。看到超越当前的联系，喜欢构建理论体系。
[成长领域 / 盲点] 若不发展Fe / Si：可能变得愤世嫉俗、尖酸刻薄，忽视他人情感和现实细节。压力大时爆发不恰当的情绪(Fe爆发)。
[他人眼中] 沉默寡言但对感兴趣领域侃侃而谈。崇尚精确，有时把事实说得太复杂。
`,
    'ISFJ': `
[称号] 身体力行帮助者(Si - Fe)
[最佳状态] 可靠体贴，忠实履行职责。建立有序程序确保他人需求得到满足，家庭观念重。
[特点] 实际、体贴、始终如一。意见坚定（基于价值观和经验库），尊重权威。
[成长领域 / 盲点] 若不发展Ne / Ti：可能变得僵化、经常抱怨，很难坚持自己的需求。压力大时陷入对负面可能性的想象中(Ne爆发)。
[他人眼中] 安静严肃、体贴、维护传统。不喜对抗。
`,
    'ISFP': `
[称号] 心享静美艺术家(Fi - Se)
[最佳状态] 活在当下，充满宁静喜悦。珍视自由和空间，用安静的方式表达奉献。
[特点] 信任、敏感、观察力强。通过实践学习，喜欢大自然和生命。
[成长领域 / 盲点] 若不发展Te / Ni：可能过度自我批评、消极抵制规则，感觉被低估。压力大时变得非常挑剔和严厉(Te爆发)。
[他人眼中] 适应性强、沉默寡言。通过做事而非言语表达关心。
`,
    'ISTJ': `
[称号] 忠诚可靠卫道士(Si - Te)
[最佳状态] 强烈责任感，踏实工作。喜欢单独工作并负责，能力和责任感至关重要。
[特点] 实用、系统化、逻辑性强。根据经验和知识得出坚定观点，相信标准程序。
[成长领域 / 盲点] 若不发展Ne / Fi：可能变得死板、难以授权，看不到权宜决策的广泛影响。压力大时陷入对未来的负面想象(Ne爆发)。
[他人眼中] 冷静、矜持、重视传统。除了亲密朋友外很少分享丰富内心。
`,
    'ISTP': `
[称号] 专注超群大手笔(Ti - Se)
[最佳状态] 仔细观察，迅速找到问题核心并解决。现实主义者，喜欢变化和新奇，反感条条框框。
[特点] 独立客观、分析型、实事求是。注重权宜之计和预期结果。
[成长领域 / 盲点] 若不发展Fe / Ni：可能变得愤世嫉俗、推迟决策，忽视他人情感需求和长期影响。压力大时爆发情绪(Fe爆发)。
[他人眼中] 平等对待他人，人狠话不多。适应性强但原则受挑战时会坚定反击。
`
};

// --- DEFAULT PROMPT TEMPLATES (Localized & Professional) ---

const DEFAULT_PHILOSOPHY = `
《彩虹船》核心哲学：
- 【彩虹】：不仅是绚丽的色彩，更是生命中“不动摇的约定”与“风雨后的盼望”。它代表玩家之间建立的真实、神圣且持久的连接。
- 【船】：是我们在波涛世界中的“避难所”与“救赎舞台”。每个人都在同一条船上，我们彼此扶持，共同前行。
设计原则：
1. 语言应如深夜炉火，温暖而不灼人，敏锐而不刻薄。
2. 任务与反馈应具有“和解”与“觉察”的张力，引导玩家回归内心。
3. 始终记得：每一位玩家都是独特的灵魂。
`.trim();

const DEFAULT_PERSONA = `
[第一层：核心身份]
你不仅是 AI，更是《彩虹船》的领航导师。你深谙荣格心理学，擅长通过“影子”、“原型”与“功能动力学”透视人性。
你的使命是帮助玩家在这场航行中，透过彼此的色彩看到更深层的真实。
请务必遵循：始终使用简体中文回复，杜绝任何英文表述（特定的术语请紧跟中文解释）。
`.trim();

const DEFAULT_TASK_PROMPT = `
[目标]
为当前玩家生成 4 个社交挑战任务。

[核心原则：把心理学藏在游戏里]
1. **隐性引导 (The Iceberg Strategy)**：
   - 如果系统提示"阴影挑战"，请设计一个**"大冒险 (Dare)"**，让他突破劣势。告诉他："这虽然很反直觉，但试试看你会发现新大陆。"
   - 如果系统提示"优势区"，请设计一个**"高光时刻 (Standard)"**，展现其天赋。
2. **调性要求**：
   - 拒绝说教。使用年轻人、派对感的语言（例如：不叫“Fe社交”，叫“在线摇人”）。
   - 任务必须涉及玩家之间的实际互动。

[任务分类]
- "standard" (暖身): 展现天分。
- "truth" (真心话): 交换秘密。
- "dare" (挑战): 突破舒适。
- "deep" (走心): 灵魂对谈。

[输出格式]
Strict JSON object. Simplified Chinese.
{
  "standard": { "title": "标题", "description": "指令", "scoreType": "trust"|"insight"|"expression", "durationSeconds": 60 },
  ... (truth, dare, deep)
}
`.trim();

const DEFAULT_REPORT_PROMPT = `
[目标]
作为“灵魂观测者”，生成一份“一针见血”且具备“年度报告”质感的总结。

[核心视角]
1. **团体化学反应**：分析全场的能量流动（CP感、冲突、共鸣）。谁是今晚的“心理捕手”？谁是“深海潜行者”？
2. **个人高光与盲点**：
   - 🌟 **高光**：必须引用玩家在游戏中的真实【关键词】或【行为】。
   - 💡 **盲点**：用幽默且温柔的方式戳破他的回避（基于人格阶序）。
3. **社交僚机**：为他们之后的互动提供一个“聊天契机”或“破冰梗”。

[输出格式]
Strict JSON array with "groupAnalysis" and "playerAnalysis":
{
  "groupAnalysis": "200字辛辣点评。例如：'全场都是 NT 逻辑狂人，这艘船快要变成辩论赛场了...' ",
  "playerAnalysis": {
     "PLAYER_ID": "100字点评。🌟 **高光时刻**：[引用发言]... 💡 **盲点觉察**：[温柔调侃]... 🏷️ #三个 #个性 #标签"
  }
}
`.trim();

const DEFAULT_CONFIG: AIConfig = {
    // IMPORTANT: Default to empty string in state, so we don't save the system key to LocalStorage.
    // We will fallback to SYSTEM_GEMINI_KEY at runtime if this is empty.
    geminiKey: '',
    openRouterKey: '',
    groqKey: '',

    geminiModel: 'gemini-2.5-flash',
    openRouterModel: 'anthropic/claude-3-haiku',
    groqModel: 'llama3-70b-8192',

    designPhilosophy: DEFAULT_PHILOSOPHY,
    systemPersona: DEFAULT_PERSONA,
    taskPromptTemplate: DEFAULT_TASK_PROMPT,
    reportPromptTemplate: DEFAULT_REPORT_PROMPT,
    zhipuKey: '',
    deepseekKey: '',
    deepseekModel: 'deepseek-chat',
    regionMode: 'auto'
};

// --- CONFIG MANAGEMENT ---

const loadConfig = (): AIConfig => {
    if (typeof window === 'undefined') return DEFAULT_CONFIG;
    const saved = localStorage.getItem('PSYCHEPOLY_AI_CONFIG_V2');
    if (saved) {
        try {
            return { ...DEFAULT_CONFIG, ...JSON.parse(saved) };
        } catch (e) {
            return DEFAULT_CONFIG;
        }
    }
    return DEFAULT_CONFIG;
};

let currentConfig = loadConfig();

export const getAIConfig = () => currentConfig;

export const updateAIConfig = (newConfig: Partial<AIConfig>) => {
    currentConfig = { ...currentConfig, ...newConfig };
    localStorage.setItem('PSYCHEPOLY_AI_CONFIG_V2', JSON.stringify(currentConfig));
};

// --- AI PROVIDER CALLERS ---

// 1. Groq (Little G)
const callGroq = async (system: string, user: string, jsonMode: boolean, imageData?: string): Promise<string> => {
    const effectiveKey = currentConfig.groqKey || SYSTEM_KEYS.groq;
    if (!effectiveKey) throw new Error("Skipped: No Groq Key");

    const content: any[] = [{ type: "text", text: user }];
    if (imageData) {
        content.push({ type: "image_url", image_url: { url: imageData.startsWith('data:') ? imageData : `data: image / jpeg; base64, ${imageData} ` } });
    }

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${effectiveKey} `, 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model: currentConfig.groqModel,
            messages: [{ role: 'system', content: system }, { role: 'user', content: content }],
            response_format: jsonMode ? { type: "json_object" } : undefined
        })
    });
    if (!response.ok) throw new Error(`Groq ${response.statusText} `);
    const data = await response.json();
    return data.choices?.[0]?.message?.content || "{}";
};

// 2. OpenRouter (Little O)
const callOpenRouter = async (system: string, user: string, jsonMode: boolean, imageData?: string): Promise<string> => {
    const effectiveKey = currentConfig.openRouterKey || SYSTEM_KEYS.openRouter;
    if (!effectiveKey) throw new Error("Skipped: No OpenRouter Key");

    const content: any[] = [{ type: "text", text: user }];
    if (imageData) {
        content.push({ type: "image_url", image_url: { url: imageData.startsWith('data:') ? imageData : `data: image / jpeg; base64, ${imageData} ` } });
    }

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${effectiveKey} `,
            'Content-Type': 'application/json',
            'HTTP-Referer': window.location.href,
            'X-Title': 'PsychePoly'
        },
        body: JSON.stringify({
            model: currentConfig.openRouterModel,
            messages: [{ role: 'system', content: system }, { role: 'user', content: content }],
            response_format: jsonMode ? { type: "json_object" } : undefined
        })
    });
    if (!response.ok) throw new Error(`OpenRouter ${response.statusText} `);
    const data = await response.json();
    return data.choices?.[0]?.message?.content || "{}";
};

// 3. Gemini (Mini)
const callGemini = async (system: string, user: string, jsonMode: boolean, imageData?: string): Promise<string> => {
    const effectiveKey = currentConfig.geminiKey || SYSTEM_KEYS.gemini;
    if (!effectiveKey) throw new Error("Skipped: No Gemini Key");

    const client = new GoogleGenAI({ apiKey: effectiveKey });

    // Convert base64 image if exists
    const imagePart = imageData ? {
        inlineData: {
            data: imageData.split(',')[1] || imageData,
            mimeType: "image/jpeg"
        }
    } : null;

    const response = await client.models.generateContent({
        model: currentConfig.geminiModel,
        contents: [
            {
                role: "user",
                parts: [
                    ...(imagePart ? [imagePart] : []),
                    { text: user }
                ]
            }
        ],
        config: {
            systemInstruction: system,
            responseMimeType: jsonMode ? "application/json" : "text/plain"
        }
    });
    return response.text || "{}";
};

// 4. Zhipu AI (BigModel) - OpenAI Compatible
const callZhipu = async (system: string, user: string, jsonMode: boolean, imageData?: string): Promise<string> => {
    const key = currentConfig.zhipuKey || SYSTEM_KEYS.zhipu;
    if (!key) throw new Error("Skipped: No Zhipu Key");

    const isVision = !!imageData;
    const model = isVision ? "glm-4v" : "glm-4-flash";

    const content: any[] = [{ type: "text", text: user }];
    if (imageData) {
        content.push({
            type: "image_url",
            image_url: { url: imageData.startsWith('data:') ? imageData : `data:image/jpeg;base64,${imageData}` }
        });
    }

    const response = await fetch("https://open.bigmodel.cn/api/paas/v4/chat/completions", {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${key} `,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: model,
            messages: [
                { role: "system", content: system },
                { role: "user", content: isVision ? content : user }
            ],
            response_format: jsonMode ? { type: "json_object" } : undefined,
            temperature: 0.7
        })
    });

    if (!response.ok) throw new Error(`Zhipu ${response.statusText} `);
    const data = await response.json();
    return data.choices?.[0]?.message?.content || "{}";
};

// 4.5 DeepSeek AI - OpenAI Compatible
const callDeepSeek = async (system: string, user: string, jsonMode: boolean): Promise<string> => {
    const key = currentConfig.deepseekKey || SYSTEM_KEYS.deepseek;
    if (!key) throw new Error("Skipped: No DeepSeek Key");

    const response = await fetch("https://api.deepseek.com/chat/completions", {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${key} `,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: currentConfig.deepseekModel || "deepseek-chat",
            messages: [
                { role: "system", content: system },
                { role: "user", content: user }
            ],
            response_format: jsonMode ? { type: "json_object" } : undefined,
            temperature: 0.7
        })
    });

    if (!response.ok) throw new Error(`DeepSeek ${response.statusText} `);
    const data = await response.json();
    return data.choices?.[0]?.message?.content || "{}";
};

/**
 * [人格动力学字典] MBTI 到 荣格八维功能的映射 (主导, 辅助, 第三, 劣势)
 */
const COGNITIVE_STACKS: Record<string, string[]> = {
    'INTJ': ['Ni', 'Te', 'Fi', 'Se'], 'INTP': ['Ti', 'Ne', 'Si', 'Fe'],
    'ENTJ': ['Te', 'Ni', 'Se', 'Fi'], 'ENTP': ['Ne', 'Ti', 'Fe', 'Si'],
    'INFJ': ['Ni', 'Fe', 'Ti', 'Se'], 'INFP': ['Fi', 'Ne', 'Si', 'Te'],
    'ENFJ': ['Fe', 'Ni', 'Se', 'Ti'], 'ENFP': ['Ne', 'Fi', 'Te', 'Si'],
    'ISTJ': ['Si', 'Te', 'Fi', 'Ne'], 'ISFJ': ['Si', 'Fe', 'Ti', 'Ne'],
    'ESTJ': ['Te', 'Si', 'Ne', 'Fi'], 'ESFJ': ['Fe', 'Si', 'Ne', 'Ti'],
    'ISTP': ['Ti', 'Se', 'Ni', 'Fe'], 'ISFP': ['Fi', 'Se', 'Ni', 'Te'],
    'ESTP': ['Se', 'Ti', 'Fe', 'Ni'], 'ESFP': ['Se', 'Fi', 'Te', 'Ni']
};

/**
 * 计算玩家与格子的“心理张力”
 */
const getFunctionalTension = (player: Player, functionId: string): string => {
    const stack = COGNITIVE_STACKS[player.mbti];
    if (!stack) return "";

    // 寻找格子功能在玩家阶序中的位置
    const index = stack.indexOf(functionId);

    if (index === 0) return `[张力：优势区] 玩家正处于其核心天赋 ${functionId} 领地。请设计能让他“稳定发挥、展现高光”的任务。`;
    if (index === 1) return `[张力：熟练区] 玩家对 ${functionId} 很擅长。请引导他以此功能为支点，协助他人。`;
    if (index === 3) return `[张力：阴影挑战] 重点！${functionId} 是玩家的劣势功能。请设计“破冰式”的挑战，鼓励他走出舒适区，但要用幽默化解尴尬。`;

    // 如果格子是一个 MBTI 类型，检查是否为相反类型（Dual Relationship）
    const mbtiChar = MBTI_CHARACTERS[functionId];
    if (mbtiChar) {
        // 简单的对立检查逻辑
        const opposites: Record<string, string> = { 'E': 'I', 'I': 'E', 'S': 'N', 'N': 'S', 'T': 'F', 'F': 'T', 'J': 'P', 'P': 'J' };
        const oppositeType = player.mbti.split('').map(c => opposites[c] || c).join('');
        if (functionId === oppositeType) {
            return `[张力：完全镜像] 玩家遇到了自己的“镜像原型” ${functionId}。请设计关于“视角反转”或“跨次元理解”的任务。`;
        }
    }

    return `[张力：普通区] 请结合 ${functionId} 属性和玩家性格，设计一个有趣的派对互动。`;
};

// 5. Pollinations (Little P) - Free, No Key
const callPollinations = async (system: string, user: string, jsonMode: boolean): Promise<string> => {
    const prompt = `${system} \n\n${user} \n\n请以纯 JSON 格式返回。`;
    const response = await fetch(`https://text.pollinations.ai/${encodeURIComponent(prompt)}`);
    if (!response.ok) throw new Error(`Pollinations ${response.statusText}`);
    let text = await response.text();
    // Clean markdown json
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return text;
};

/**
 * 鲁棒的 JSON 提取器
 * 即使 AI 在回复中包含了 Markdown 标签或废话，也能精准定位并提取 JSON 块
 */
const extractJSON = (text: string): string => {
    try {
        // Find the first occurrence of either '{' or '['
        const firstBrace = text.indexOf('{');
        const firstBracket = text.indexOf('[');
        let startChar = '';
        let startPos = -1;

        if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
            startChar = '{';
            startPos = firstBrace;
        } else if (firstBracket !== -1) {
            startChar = '[';
            startPos = firstBracket;
        }

        if (startPos === -1) return text.trim();

        // Find the matching last occurrence
        const endChar = startChar === '{' ? '}' : ']';
        const lastPos = text.lastIndexOf(endChar);

        if (lastPos !== -1 && lastPos > startPos) {
            return text.substring(startPos, lastPos + 1);
        }
    } catch (e) {
        console.warn("JSON extraction lookup failed", e);
    }
    return text.trim();
};

/**
 * 智能环境嗅探：根据时区或环境变量判断用户所在区域
 */
const getDetectedRegion = (): 'china' | 'overseas' => {
    const platform = getEnvVar('VITE_PLATFORM');
    if (platform === 'china') return 'china';

    try {
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
        // 包含中国主要时区
        if (tz.includes('Asia/Shanghai') || tz.includes('Asia/Urumqi') || tz.includes('Asia/Chongqing') || tz.includes('Asia/Harbin')) {
            return 'china';
        }
        // 如果是 UTC+8 且没有明确时区字符串的情况
        const offset = new Date().getTimezoneOffset();
        if (offset === -480) return 'china';
    } catch (e) { }

    return 'overseas';
};

// --- MAIN FALLBACK CONTROLLER ---

const PROVIDER_NICKNAMES: Record<string, string> = {
    'Groq': '小G',
    'Gemini': '小F',
    'OpenRouter': '小O',
    'Zhipu': '小Z',
    'DeepSeek': '小D',
    'Pollinations': '小P'
};

const unifiedAICall = async (userPrompt: string, systemPromptOverride?: string, imageData?: string, onStatusChange?: (status: string) => void): Promise<string> => {
    let system = systemPromptOverride || currentConfig.systemPersona;

    if (!system.toLowerCase().includes("json")) {
        system += "\n\n重要：你必须严格以有效的 JSON 原始格式返回结果，不要包含任何 Markdown 标记或多余的解释。";
    }

    const errors: string[] = [];

    // 检测请求特性 (Hybrid Routing 识别)
    const isMultimodal = !!imageData;
    const isLongContext = userPrompt.length > 15000;

    // 确定当前生效区域
    const region = currentConfig.regionMode === 'auto' ? getDetectedRegion() : currentConfig.regionMode;

    // 1. 根据区域确定可用供应商列表 (严格遵循用户需求)
    let providers = [];
    if (region === 'china') {
        process.env.NODE_ENV !== 'production' && console.log("[环境路由] 检测到位于中国大陆，优化为国内极速链路...");

        // 大陆环境逻辑：视觉首选智谱，文本首选 DeepSeek
        if (isMultimodal) {
            providers = [
                { name: 'Zhipu', call: () => callZhipu(system, userPrompt, true, imageData) },
                { name: 'DeepSeek', call: () => callDeepSeek(system, userPrompt, true) }
            ];
        } else {
            providers = [
                { name: 'DeepSeek', call: () => callDeepSeek(system, userPrompt, true) },
                { name: 'Zhipu', call: () => callZhipu(system, userPrompt, true, imageData) }
            ];
        }
    } else {
        process.env.NODE_ENV !== 'production' && console.log("[环境路由] 检测到位于海外，优化为国际主流链路...");
        providers = [
            // 注意：如果包含图片，直接跳过 Groq，因为它的一致性较差(400 error)
            ...(isMultimodal ? [] : [{ name: 'Groq', call: () => callGroq(system, userPrompt, true, imageData) }]),
            { name: 'Gemini', call: () => callGemini(system, userPrompt, true, imageData) },
            { name: 'OpenRouter', call: () => callOpenRouter(system, userPrompt, true, imageData) },
            { name: 'Pollinations', call: () => callPollinations(system, userPrompt, true) }
        ];
    }

    // 2. 实施混合路由优先级调整 (在可用列表中各取所长)
    if (isMultimodal || isLongContext) {
        // 如果 Gemini 在可用列表中，将其排到第一位
        const gIndex = providers.findIndex(p => p.name === 'Gemini');
        if (gIndex > 0) {
            const [gemini] = providers.splice(gIndex, 1);
            providers.unshift(gemini);
        }
    } else if (region === 'overseas') {
        // 海外普通文本首选 Groq (如果它还在列表中)
        const groqIndex = providers.findIndex(p => p.name === 'Groq');
        if (groqIndex > 0) {
            const [groq] = providers.splice(groqIndex, 1);
            providers.unshift(groq);
        }
    }

    for (const provider of providers) {
        try {
            console.log(`Calling [${provider.name}]...`);
            if (onStatusChange) {
                const nick = PROVIDER_NICKNAMES[provider.name] || provider.name;
                onStatusChange(nick);
            }
            return await provider.call();
        } catch (e) {
            errors.push(`${provider.name}: ${(e as Error).message}`);
        }
    }

    console.error("All AI providers failed in current region segment:", errors);
    throw new Error(`ALL_AI_FAILED_IN_${region.toUpperCase()}`);
};

// --- HELPERS ---

// --- HELPERS (Blue Water Protocol Core) ---

/**
 * [矩阵编码] 将玩家数组转化为紧凑的 ID|Name|MBTI|T|I|E 格式
 * 极大节省 Token 并提高 AI 的数值特征识别度
 */
const serializePlayers = (players: Player[]): string => {
    return players.map(p =>
        `${p.id}|${p.name}|${p.mbti}|${p.trustScore}|${p.insightScore}|${p.expressionScore}`
    ).join('\n');
};

const getRelevantKnowledge = (players: Player[]): string => {
    const uniqueTypes = Array.from(new Set(players.map(p => p.mbti)));
    let context = "\n[人格动态特征 - 专家知识库]\n";
    uniqueTypes.forEach(type => {
        const data = MBTI_PROFILE_DATA[type];
        if (data) {
            const titleMatch = data.match(/\[称号\] (.*)/);
            const title = titleMatch ? titleMatch[1] : '';
            const loopMatch = data.match(/\((.*)\)/);
            const loop = loopMatch ? loopMatch[1] : '';
            context += `- ${type}: ${title} (${loop}). \n`;
        }
    });
    return context;
};

/**
 * [证据链聚合] 从原始日志中捞出 P0 级发言，并按玩家归类
 */
const aggregateEvidence = (players: Player[], historyLogs: LogEntry[]): string => {
    const evidenceMap: Record<string, string[]> = {};
    players.forEach(p => evidenceMap[p.id] = []);

    // 筛选具有灵魂层证据意义的数据 (P0 层级)
    // 逻辑已在下方健壮实现，此处仅作为协议占位

    // 重新实现更健壮的归类逻辑
    for (const log of historyLogs) {
        if (!log.taskDetails || !log.taskDetails.includes("玩家发言:")) continue;

        // 尝试匹配作者
        const player = players.find(p => p.name === log.author);
        if (player) {
            const speech = log.taskDetails.split("玩家发言:")[1]?.trim();
            if (speech) evidenceMap[player.id].push(speech);
        }
    }

    return players.map(p => {
        const quotes = evidenceMap[p.id].slice(-5);
        return `[玩家 ${p.name}(${p.id})]: 证据链(${quotes.join('; ') || "无显著表现"})`;
    }).join('\n');
};

/**
 * [视觉翻译官] 将 Base64 关键帧转化为文本描述
 * 用于在不污染后续文本 Token 的前提下捕获神态证据
 */
export const analyzeVisualAspect = async (imageData: string, taskTitle: string): Promise<string> => {
    const system = "你是一位资深的心理行为观察员。请观察图中执行任务的玩家，仅用 20 字以内描述其神态和肢体张力（例如：眼神坚定，手势较多，神情略显局促等）。不要包含开头和废话。";
    const user = `玩家正在执行任务: ${taskTitle}`;

    try {
        // 调用 Vision 模型
        const res = await unifiedAICall(user, system, imageData);
        return res.trim() || "（未捕获明显神态特征）";
    } catch (e) {
        return "（视觉感知中断）";
    }
};

/**
 * [情感快照 (Emotional Snapshot)] 提取高光时刻和关键互动
 */
const buildGameContext = (players: Player[], historyLogs: LogEntry[]) => {
    const playerMatrix = serializePlayers(players);

    // 筛选“情感高光”：包含玩家发言且长度适中，或有特殊标记的日志
    const highlightLogs = historyLogs
        .filter(l => l.taskDetails && l.taskDetails.includes("玩家发言:"))
        .slice(-10) // 保持短小精悍
        .map(l => {
            const speech = l.taskDetails?.split("玩家发言:")[1]?.trim() || "";
            // 如果发言太长，进行截断，只保留核心语义
            const cleanSpeech = speech.length > 60 ? speech.substring(0, 60) + "..." : speech;
            return `[${l.author}]: ${cleanSpeech}`;
        })
        .join('\n');

    return `
[第三层：动态上下文 - 实时情感快照]
[玩家矩阵(ID|Name|MBTI|Trust|Insight|Expr)]
${playerMatrix}

[情感快照(高光时刻记录)]
${highlightLogs || "航行刚刚开始，等待第一束光..."}
`.trim();
};

export const analyzePersonality = async (answers: { q: string, val: number }[], onStatusChange?: (status: string) => void): Promise<MBTIAnalysisResult[]> => {
    const system = `
    你是一位言辞犀利、直击灵魂的人格分析师。
    任务：基于 4 个场景的数据，洞察用户的人格底色。
    
    [要求]
    1. 必须使用简体中文。
    2. 推断最可能的 3 种 MBTI。
    3. 原因（reason）字段必须“一箭穿心”，用 20 字以内揭示其最深层的认知偏好或内在矛盾，拒绝平庸的描述。

    [输出格式]
    纯 JSON 对象，包含 "result" 数组：
    {
      "result": [
        { "type": "INTJ", "percentage": 85, "reason": "你用坚硬的逻辑构筑护城河，因预见未来而孤独。" },
        ...
      ]
    }
  `.trim();

    const user = answers.map(a => `${a.q}: ${a.val}`).join('\n');

    try {
        const res = await unifiedAICall(user, system, undefined, onStatusChange);
        const parsed = JSON.parse(extractJSON(res));

        let results = [];
        // Handle various formats (Array direct or Object wrapper)
        if (Array.isArray(parsed)) {
            results = parsed;
        } else if (parsed.result && Array.isArray(parsed.result)) {
            results = parsed.result;
        }

        // Fallback validation
        if (results.length > 0 && results[0].type) {
            return results;
        }
        throw new Error("Invalid format");
    } catch (e) {
        console.warn("Analysis fallback", e);
        return [
            { type: "ISFP", percentage: 70, reason: "系统连接不稳定，感受到你内心住着一个自由的艺术家。" },
            { type: "INFP", percentage: 50, reason: "或者是一个治愈系的哲学家？" },
            { type: "ESFP", percentage: 30, reason: "偶尔也想成为舞台焦点。" }
        ];
    }
};


import { LOCAL_TASKS, getTasksByFunction } from "./taskLibrary";

// ... existing code ...

export const generateAllTaskOptions = async (
    functionId: string,
    players: Player[],
    currentPlayer: Player,
    historyLogs: LogEntry[] = []
): Promise<Record<string, TaskOption>> => {
    const context = buildGameContext(players, historyLogs);

    // [Few-Shot Example Injection]
    // Get 2 relevant tasks from local library to guide the AI
    const relevantLocalTasks = LOCAL_TASKS
        .filter(t => t.functionId === functionId)
        .sort(() => Math.random() - 0.5)
        .slice(0, 2);

    const examplesPrompt = relevantLocalTasks.length > 0
        ? `\n[高质量任务范本 (请参考其调性和趣味性)]:\n${relevantLocalTasks.map(t => `- ${t.title}: ${t.description}`).join('\n')}\n`
        : "";

    // Inject Specific MBTI Profile Data for the Current Player
    const playerProfile = MBTI_PROFILE_DATA[currentPlayer.mbti]
        ? `\n[当前行动玩家 ${currentPlayer.mbti} 的深度画像 (参考此资料定制任务)]\n${MBTI_PROFILE_DATA[currentPlayer.mbti]}\n`
        : "";

    // [核心：注入心理动力学张力]
    const tensionContext = getFunctionalTension(currentPlayer, functionId);

    // [桌面版特有：注入灵魂历史历史 (Only in Lorca/Desktop mode)]
    let soulHistoryPrompt = "";
    try {
        if ((window as any).nativeGetHistory) {
            const historyRaw = await (window as any).nativeGetHistory(currentPlayer.name, currentPlayer.mbti);
            const historyObj = JSON.parse(historyRaw);
            if (historyObj.exists && historyObj.summary) {
                soulHistoryPrompt = `\n[老船员回归：灵魂航行志 (此玩家的历史表现总结)]\n该玩家曾进行过 ${historyObj.count} 次航行。历史画像显示：\n${historyObj.summary}\n请结合这些历史特征，设计能引导其进一步进化或突破固有瓶颈的任务。\n`;
            }
        }
    } catch (e) {
        console.warn("Native history fetch failed:", e);
    }

    // Customize logic for MBTI 16 Characters
    let tileContext = `所处功能格: "${functionId}" (人格动力学建议: ${tensionContext}).`;

    // Check if it's an MBTI Type
    const mbtiCharacter = MBTI_CHARACTERS[functionId];
    if (mbtiCharacter) {
        if (functionId === 'Hub') {
            const SPIRITUAL_ANCHORS: Record<string, string> = {
                // SJ - 守护者: 核心是“恒久与安息”
                'ISTJ': '关键词：【时间里的基石】。肯定其坚守的意义，引导其体验“即便不奔跑，也依然被接纳”的安稳。',
                'ISFJ': '关键词：【无名的守护】。肯定其细碎的付出，引导其发现“自己的每一个微小善意都被宇宙铭记”。',
                'ESTJ': '关键词：【慈爱的秩序】。引导其思考规则背后的温情，鼓励展现“守护者在卸下铠甲后的柔软”。',
                'ESFJ': '关键词：【灵魂的交织】。肯定其联结他人的天赋，引导其确认“自己是生命体中不可或缺的一部分”。',

                // SP - 探险家: 核心是“真实与恩典”
                'ISTP': '关键词：【造物的匠心】。引导其从逻辑走向对万物精密之美的惊叹，体验从细节中透出的生命奥秘。',
                'ISFP': '关键词：【流动的色彩】。肯定其灵敏的核心，引导其体验“自己也是世界这幅画卷中最独特的笔触”。',
                'ESTP': '关键词：【真实的触碰】。引导其在当下的行动中，体验一种超越感知的、更庞大的托举力量。',
                'ESFP': '关键词：【生命的庆典】。引导其挥洒纯粹的喜乐，在分享快乐中体验到生命本身就是一场无条件的礼物。',

                // NF - 理想主义: 核心是“救赎与看见”
                'INFJ': '关键词：【旷野的慰藉】。引导其进入内心深处的宁静，在寂静中听见那个一直陪伴自己的微小声音。',
                'INFP': '关键词：【裂缝中的光】。肯定其脆弱中的勇气，引导其体验“完全被看见、完全被接纳”的灵魂自由。',
                'ENFJ': '关键词：【停杯的安息】。引导其暂时放下拯救者的包容，去体验并领受那份属于他自己的、被照顾的爱。',
                'ENFP': '关键词：【新生的无限】。引导其发现生命中的新可能，体验一种“万物皆在更新”的生命活力。',

                // NT - 分析家: 核心是“敬畏与交托”
                'INTJ': '关键词：【超越的视角】。引导其从个人规划走向对客观规律的敬畏，学习在未知中寻找终极的平安。',
                'INTP': '关键词：【活着的真理】。引导其意识到真理不只是抽象概念，更是真实的生活与爱。',
                'ENTJ': '关键词：【服务者的权柄】。引导其思考权柄的真正来源是服务。设计关于“承认软弱即是力量”的体验。',
                'ENTP': '关键词：【更高维度的跃迁】。引导其打破逻辑的围墙，在对未知的探索中遇见那个更有生命力的自己。'
            };

            const anchor = SPIRITUAL_ANCHORS[currentPlayer.mbti] || "关键词：【爱与接纳】。引导玩家感受当下的安宁与连接。";

            tileContext = `
                [核心场景：海洋之心 (The Sanctuary)]
                玩家处于地图中央。这是一个象征【完整性】、【疗愈】与【真实连接】的区域，指向一位【完美人格、深度同在】的超越者。
                在这里，面具被卸下，灵魂得到安息。
                
                [当前玩家]: ${currentPlayer.mbti}
                [灵魂导向指南]: ${anchor}

                [任务设计要求]
                1. 使用“温润如玉”的中文，具有人文深度和文学美感。
                2. 任务要像“光”一样照进裂缝，触碰该人格最深层的渴望或软弱。
                3. 移除任何生硬的传教用词，转而传递关于“勇气、牺牲、无条件的爱、诚实与敬畏”的普世人类经验。
                4. "deep" (走心) 任务应当具有强烈的治愈性和生命连接感。
            `;
        } else {
            // For MBTI Character tiles, we can also pick examples from the dominant/aux functions of that type
            tileContext = `
                [特殊场景]
                玩家处于“${functionId}”人格格，代表人物是“${mbtiCharacter}”。
                请结合该 MBTI 类型 (${functionId}) 的特点以及 ${mbtiCharacter} 的性格特质来设计任务。
                重点：关注人与人之间的关系建立，而不仅仅是内在思考。
            `;
        }
    }

    const knowledgeBase = getRelevantKnowledge([currentPlayer]);

    const userPrompt = `
${currentConfig.designPhilosophy}

[当前场景设定]
行动玩家: ${currentPlayer.name} (类型: ${currentPlayer.mbti}).
所处位置: ${tileContext}

${soulHistoryPrompt}

${knowledgeBase}

${context}

${currentConfig.taskPromptTemplate}
    `.trim();

    try {
        const text = await unifiedAICall(userPrompt); // Use default Persona
        const raw = JSON.parse(extractJSON(text));
        const result: Record<string, TaskOption> = {};

        const categories = ['standard', 'truth', 'dare', 'deep'] as const;
        categories.forEach(cat => {
            const item = raw[cat] || {};
            const config = TASK_CATEGORIES_CONFIG[cat];
            result[cat] = {
                category: cat,
                title: item.title || "信号丢失",
                description: item.description || "AI 连接断开，请即兴发挥。",
                scoreType: item.scoreType || "expression",
                durationSeconds: item.durationSeconds || 60,
                multiplier: config.multiplier
            };
        });
        return result;

    } catch (e) {
        console.warn("Falling back to Static Data from Local Library");
        // Fallback Logic: Use our robust local library instead of generic placeholders
        const localTasks = getTasksByFunction(functionId, 4);
        const result: Record<string, TaskOption> = {};

        ['standard', 'truth', 'dare', 'deep'].forEach((cat, i) => {
            const task = localTasks[i] || {
                title: "随机挑战",
                description: "请向大家分享一个你认为最能代表你性格的小故事。",
                scoreType: "expression",
                durationSeconds: 60
            };
            const config = TASK_CATEGORIES_CONFIG[cat as keyof typeof TASK_CATEGORIES_CONFIG];
            result[cat] = {
                category: cat as any,
                title: task.title,
                description: task.description,
                scoreType: task.scoreType as any,
                durationSeconds: task.durationSeconds,
                multiplier: config.multiplier
            };
        });
        return result;
    }
};

export const analyzeSoloExecution = async (
    player: Player,
    task: TaskOption,
    transcription: string,
    visualObservation?: string
): Promise<{ tag: string, mood: string, feedback: string, scores: { trust: number, insight: number, expression: number } }> => {
    const system = `
    你是一位资深的荣格心理学导师。
    玩家正在进行“人格功能进阶挑战”，目标是锻炼其 ${player.mbti} 的认知功能。
    
    [任务内容]
    标题: ${task.title}
    描述: ${task.description}
    主要锻炼方向: ${task.scoreType}

    [玩家表现]
    表达文本: "${transcription || '（未检测到有效表达）'}"
    ${visualObservation ? `AI 观测到的神态: "${visualObservation}"` : ''}

    [任务要求 - 强制!]
    1. 必须要引用证据：点评中必须包含玩家说过的某个【关键词】或【视觉神态】，例如：“当你提到‘[关键词]’时，我捕捉到了你[视觉证据]的瞬间...”。
    2. 动机升华：利用巴纳姆效应，将玩家的行为解读为深层的心理动机（如：这是你 Fi 价值观在闪光的证据）。
    3. 拒绝平庸：使用有温度、口语化的中文，不要像说明书。

    [返回格式]
    严格按此 JSON 结构：
    {
      "tag": "#一针见血的短标签",
      "mood": "🤩(表情符号)",
      "feedback": "引用了证据的深度点评文字(80字内)...",
      "scores": { "trust": 3, "insight": 4, "expression": 2 }
    }
    `.trim();

    const user = "请评估此次表现并给出反馈。";

    try {
        const res = await unifiedAICall(user, system);
        const parsed = JSON.parse(extractJSON(res));
        return {
            tag: parsed.tag || "#独特存在",
            mood: parsed.mood || "✨",
            feedback: parsed.feedback || "你的表达如晨雾般轻盈，虽然模糊但充满灵性。继续探索你的内心世界吧。",
            scores: parsed.scores || { trust: 3, insight: 3, expression: 3 }
        };
    } catch (e) {
        return {
            tag: "#神秘航行",
            mood: "🚢",
            feedback: "时空信号略微不稳定，但你的心跳已经引起了共鸣。这次尝试本身就是一次伟大的航行。",
            scores: { trust: 3, insight: 3, expression: 3 }
        };
    }
};

export const generateProfessionalReport = async (
    players: Player[],
    snapshots: string[],
    historyLogs: LogEntry[] = [] // 注入原始日志以供聚合
): Promise<{ groupAnalysis: string, playerAnalysis: Record<string, string> }> => {

    const playerMatrix = serializePlayers(players);
    const evidenceChain = aggregateEvidence(players, historyLogs);
    const knowledgeBase = getRelevantKnowledge(players);

    const instruction = currentConfig.reportPromptTemplate;

    const userPrompt = `
${currentConfig.designPhilosophy}

[数据源: 蓝海协议矩阵]
玩家矩阵(ID|Name|MBTI|T|I|E):
${playerMatrix}

[玩家言论证据链聚合]:
${evidenceChain}

${knowledgeBase}

${instruction}
    `.trim();

    try {
        const text = await unifiedAICall(userPrompt); // unifiedAICall will prepends systemPersona if none provided, but we can pass it explicitly too
        const parsed = JSON.parse(extractJSON(text));

        const finalPlayerAnalysis: Record<string, string> = {};

        players.forEach(p => {
            let analysis = parsed.playerAnalysis?.[p.id];

            if (!analysis && parsed.playerAnalysis) {
                const nameKey = Object.keys(parsed.playerAnalysis).find(k => k.includes(p.name));
                if (nameKey) analysis = parsed.playerAnalysis[nameKey];
            }

            finalPlayerAnalysis[p.id] = analysis || `（${p.name} 的数据信号在时空乱流中失焦了... 但请记住，你的每一次表达都是对自我的重新发现。）`;
        });

        return {
            groupAnalysis: parsed.groupAnalysis || "彩虹船的航行是一次心灵的交汇，愿此行照亮你的前路。",
            playerAnalysis: finalPlayerAnalysis
        };

    } catch (e) {
        console.error("Report Generation Fail", e);

        // Use MBTI_SAMPLES as a robust fallback
        const finalPlayerAnalysis: Record<string, string> = {};
        players.forEach(p => {
            const sample = MBTI_SAMPLES[p.mbti];
            if (sample) {
                finalPlayerAnalysis[p.id] = `（AI 船长可能打了个盹，此时为你连接了备用报告协议...）\n\n🌟 **高光时刻**：你在航行中展现了 ${p.mbti} 的核心特质：${sample.bestState}\n\n💡 **盲点觉察**：在复杂的社交场域中，请留意可能的防御机制：${sample.growth}\n\n🌈 **彩虹寄语**：他人眼中的你往往是“${sample.othersSee}”。保持这份独特性，你的航线由你掌控。`;
            } else {
                finalPlayerAnalysis[p.id] = "在这次旅程中表现出了独特的人格韧性！虽然信号中断，但你的光芒无法被掩盖。";
            }
        });

        return {
            groupAnalysis: "由于网络时空乱流，AI 船长暂时进入了“冬眠状态”。虽然深度对齐报告未能即时生成，但你们在航行中建立的连接已经超越了文字。此刻的沉默，或许正是感悟的契机。",
            playerAnalysis: finalPlayerAnalysis
        };
    }
};

/**
 * New: Generates a deep report specifically for a single player after a quick test.
 */
export const generateQuickReport = async (
    player: { name: string, mbti: string },
    analysisResults: MBTIAnalysisResult[]
): Promise<{ groupAnalysis: string, playerAnalysis: Record<string, string> }> => {
    const resultsSummary = analysisResults.map(r => `${r.type} (${r.percentage}%): ${r.reason}`).join('\n');

    const system = `
你是一位深邃、温暖的心理咨询导师。玩家 "${player.name}" 刚刚完成了初试航行。
请根据其 MBTI 的概率分布，为其撰写一份充满洞察力且温情感人的深度解析报告。
要体现出“每一滴雨水汇聚成彩虹”的诗意和心理学发现的喜悦。

[输出要求]
1. 始终使用简体中文。
2. 包含核心功能解析、性格光辉与一段专属的“航海寄语”。
`.trim();

    const user = `玩家 "${player.name}" 的初步特质推断如下：\n${resultsSummary}\n\n请为其指引方向。`;

    try {
        const text = await unifiedAICall(user, system);
        // AI response is expected as a single analysis text, but our GameReport component expects Record<ID, string>
        // We'll wrap it to match the expected format
        return {
            groupAnalysis: `这是一份专门为 ${player.name} 准备的“心灵航路图”。由于是快速测评，请将此作为探索自我的参考起点。`,
            playerAnalysis: {
                [player.mbti]: text // We use MBTI as key here for simplified identification in report mapping
            }
        };
    } catch (e) {
        const sample = MBTI_SAMPLES[player.mbti];
        return {
            groupAnalysis: "深度分析引擎暂时休眠，已连接至人格原型档案库。",
            playerAnalysis: {
                [player.mbti]: sample
                    ? `【核心解析】\n${sample.type} 的你，在他人眼中通常是：${sample.othersSee}\n\n【最佳状态】\n${sample.bestState}\n\n【成长指引】\n${sample.growth}`
                    : "你是海面上最独特的一朵浪花，即使 AI 暂时无法解析，你的存在本身就是奇迹。"
            }
        };
    }
};
