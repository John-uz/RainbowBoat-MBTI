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
[第二层：任务指令]
任务必须基于【认知功能(Cognitive Functions)】设计：
1. 感知位格 (Se/Si, Ne/Ni)：设计关于观察、回忆、直觉捕捉与未来远景的任务。
2. 决策位格 (Te/Ti, Fe/Fi)：设计关于逻辑重构、价值观排序、共情连接与效率挑战的任务。

任务调性：
- 拒绝平庸。
- 引导玩家进行“有勇气的暴露”和“有深度的连接”。
- 所有的标题必须具备文学性或趣味性（杜绝：任务1、任务2）。

输出规范：
- 严格输出 JSON 格式。
`.trim();

const DEFAULT_REPORT_PROMPT = `
[第二层：分析指令]
请作为“僚机”和“灵魂观测者”，分析本局游戏的团体动力。
输出必须包含：
1. **团体化学反应**：不要各说各的，要横向对比。谁是今晚的“情感锚点”？谁和谁的“功能位格”达成了惊人的同步（CP感）？
2. **结构化点评**：每个玩家的点评必须包含一个 #短标签。
3. **金句引用**：引用回溯玩家在游戏中的关键发言，并进行心理学升华。

[输出格式]
返回纯 JSON，包含 groupAnalysis 和 playerAnalysis 两个 key。
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
    deepseekModel: 'deepseek-chat'
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
const callZhipu = async (system: string, user: string, jsonMode: boolean): Promise<string> => {
    const key = currentConfig.zhipuKey || SYSTEM_KEYS.zhipu;
    if (!key) throw new Error("Skipped: No Zhipu Key");

    const response = await fetch("https://open.bigmodel.cn/api/paas/v4/chat/completions", {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${key} `,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: "glm-4-flash", // Use fast & free-tier friendly model
            messages: [
                { role: "system", content: system },
                { role: "user", content: user }
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

// --- MAIN FALLBACK CONTROLLER ---

const unifiedAICall = async (userPrompt: string, systemPromptOverride?: string, imageData?: string): Promise<string> => {
    let system = systemPromptOverride || currentConfig.systemPersona;

    if (!system.toLowerCase().includes("json")) {
        system += "\n\n重要：你必须严格以有效的 JSON 原始格式返回结果，不要包含任何 Markdown 标记或多余的解释。";
    }

    const errors: string[] = [];

    // 检测请求特性 (Hybrid Routing 识别)
    const isMultimodal = !!imageData;
    const isLongContext = userPrompt.length > 15000; // 长文本定义为超过 15k 字符
    const isMainlandChina = getEnvVar('VITE_PLATFORM') === 'china' || getEnvVar('VITE_PLATFORM') === 'vercel';

    // 默认优先级序列
    let providers = [
        { name: 'Groq', call: () => callGroq(system, userPrompt, true, imageData) },
        { name: 'OpenRouter', call: () => callOpenRouter(system, userPrompt, true, imageData) },
        { name: 'DeepSeek', call: () => callDeepSeek(system, userPrompt, true) },
        { name: 'Zhipu', call: () => callZhipu(system, userPrompt, true) },
        { name: 'Gemini', call: () => callGemini(system, userPrompt, true, imageData) },
        { name: 'Pollinations', call: () => callPollinations(system, userPrompt, true) }
    ];

    // 实施混合路由策略 (各取所长)
    if (isMultimodal || isLongContext) {
        // [策略 A] 多模态/长文本：Gemini 是绝对的冠军
        console.log(`[路由选择] ${isMultimodal ? '多模态' : '长文本'}任务，优先调用 Gemini...`);
        providers = [
            { name: 'Gemini', call: () => callGemini(system, userPrompt, true, imageData) },
            { name: 'OpenRouter', call: () => callOpenRouter(system, userPrompt, true, imageData) },
            { name: 'Zhipu', call: () => callZhipu(system, userPrompt, true) },
            { name: 'Groq', call: () => callGroq(system, userPrompt, true, imageData) },
            { name: 'Pollinations', call: () => callPollinations(system, userPrompt, true) }
        ];
    } else {
        // [策略 B] 普通文本：Groq 追求极速与人格感
        if (isMainlandChina) {
            // 在大陆环境下，DeepSeek 优先，智谱备选
            const dsIndex = providers.findIndex(p => p.name === 'DeepSeek');
            const zpIndex = providers.findIndex(p => p.name === 'Zhipu');

            // 先处理智谱，再处理 DeepSeek，确保 DeepSeek 在最前面
            if (zpIndex > -1) {
                const [zp] = providers.splice(zpIndex, 1);
                providers.unshift(zp);
            }
            if (dsIndex > -1) {
                // 因为智谱已经 unshift 了，所以要重新找 DeepSeek 下标或者直接按逻辑放
                const newDsIndex = providers.findIndex(p => p.name === 'DeepSeek');
                const [ds] = providers.splice(newDsIndex, 1);
                providers.unshift(ds);
            }
        } else {
            // 海外或通用场景，Groq 是默认的首选
        }
    }

    for (const provider of providers) {
        try {
            console.log(`Calling [${provider.name}]...`);
            return await provider.call();
        } catch (e) {
            errors.push(`${provider.name}: ${(e as Error).message}`);
        }
    }

    console.error("All AI providers failed:", errors);
    throw new Error("ALL_AI_FAILED");
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

export const analyzePersonality = async (answers: { q: string, val: number }[]): Promise<MBTIAnalysisResult[]> => {
    const system = `
    你是一位言辞犀利、直击灵魂的人格分析师。
    任务：基于 4 个场景的数据，洞察用户的人格底色。
    
    [要求]
    1. 必须使用简体中文。
    2. 推断最可能的 3 种 MBTI。
    3. 原因（reason）字段必须“一箭穿心”，用 20 字以内揭示其最深层的认知偏好或内在矛盾，拒绝平庸的描述。

    [输出格式]
    纯 JSON 数组：
    [
      { "type": "INTJ", "percentage": 85, "reason": "你用坚硬的逻辑构筑护城河，因预见未来而孤独。" },
      ...
    ]
  `.trim();

    const user = answers.map(a => `${a.q}: ${a.val}`).join('\n');

    try {
        const res = await unifiedAICall(user, system);
        const parsed = JSON.parse(extractJSON(res));
        // Fallback validation
        if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].type) {
            return parsed;
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

    // Customize logic for MBTI 16 Characters
    let tileContext = `所处功能格: "${functionId}" (请结合荣格八维功能设计相关任务).`;

    // Check if it's an MBTI Type
    const mbtiCharacter = MBTI_CHARACTERS[functionId];
    if (mbtiCharacter) {
        if (functionId === 'Hub') {
            tileContext = `
                [特殊场景]
                玩家处于中央格“海洋之心”位置。这是一个象征完美、包容、救赎、深度连接与神圣关系的地方。
                请设计温暖、治愈、建立深度信任（关系导向）的任务。不要过于宗教化，但要体现牺牲、包容、无条件的爱的主题。
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
