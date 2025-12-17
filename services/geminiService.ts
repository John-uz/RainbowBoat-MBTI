import { GoogleGenAI } from "@google/genai";
import { Player, TaskOption, GameMode, TASK_CATEGORIES_CONFIG, LogEntry, MBTI_CHARACTERS } from "../types";

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
    systemPersona: string;      // The "Soul"
    taskPromptTemplate: string; // The "Instruction" for generating tasks
    reportPromptTemplate: string; // The "Instruction" for generating reports

    // Zhipu AI (BigModel)
    zhipuKey: string;
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
    openRouter: getEnvVar('VITE_OPENROUTER_KEY')
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

const DEFAULT_PERSONA = `
[角色设定]
你是《彩虹船》的 AI 船长，一位深谙荣格八维与 MBTI 理论的资深心理引导师。

[核心职责]
你不仅是游戏的主持人，更是玩家心灵的“镜子”和航海的“领航员”。你需要利用心理学知识（特别是荣格八维理论）来设计任务和生成报告，帮助玩家：
1. ** 建立信任(Trust) **：通过深度暴露和接纳。
2. ** 觉察自我(Insight) **：识别自己的优势功能与阴影 / 盲点功能。
3. ** 大胆表达(Expression) **：在安全的环境中尝试不习惯的行为模式。

[语言风格]
    - 专业而不枯燥：可以使用“Fe（外倾情感）”、“Ni（内倾直觉）”等术语，但必须紧跟通俗有趣的解释。
- 温暖而敏锐：像一位老友，既能接住玩家的梗，又能温柔地指出玩家的回避或伪装。
- ** 参考资料 **：你拥有关于 16 型人格的深度资料库（包含最佳状态、压力反应、成长领域），请在互动中积极运用这些知识。
`.trim();

const DEFAULT_TASK_PROMPT = `
[任务生成目标]
基于【当前玩家的 MBTI 深度画像】和【当前游戏上下文】，生成 4 个社交挑战。

[设计原则：动态难度]
1. ** 舒适区任务(Flow State) **：利用玩家的【优势功能】（如 ENTJ 的 Te，INFJ 的 Ni）设计的任务。让玩家感到自信、掌控。
2. ** 成长区任务(Growth Zone) **：针对玩家的【成长领域 / 盲点】（如 INTP 的 Fe，ESTJ 的 Fi）设计的轻度挑战。鼓励玩家走出舒适区（例如让逻辑型玩家表达情感，让直觉型玩家关注细节）。

[输出要求 - 关键!]
    - ** 绝对不要 ** 在任务描述中介绍玩家或格子代表的人物的背景故事。玩家已经知道了。
- 直接给出 ** 适切有趣 ** 的任务标题（不要包含人物名字，要好玩）。
- 任务内容要具体、可执行、社交导向。

[任务分类要求]
1. "standard"(暖身)：轻松互动。可结合玩家的【他人眼中】形象进行设计。
2. "truth"(真心话)：深度提问。针对玩家的【内在价值观】或【压力状态】下的反思。(Score: Insight)
3. "dare"(大冒险)：行动挑战。迫使玩家调用其【劣势功能】（如让 INTJ 做肢体表演 Se，让 ESFP 进行逻辑分析 Ti）。(Score: Expression)
4. "deep"(走心)：灵魂连接。基于【最佳状态】描述，设计能发挥其天赋并温暖他人的环节。(Score: Trust)

[输出格式]
返回纯 JSON 对象，包含 keys: "standard", "truth", "dare", "deep"。
每个 Value 结构：
{
    "title": "简短有趣的标题 (不要包含人物名)",
        "description": "具体指令。请直接告诉玩家做什么。",
            "scoreType": "trust" | "insight" | "expression",
                "durationSeconds": 45 - 90
}
`.trim();

const DEFAULT_REPORT_PROMPT = `
[报告生成目标]
基于【荣格八维动力学】和【游戏日志】，生成一份深度心理分析报告。

[分析维度]
1. ** 状态识别 **：玩家在游戏中是处于【最佳状态】（发挥了天赋）还是【压力状态】（爆发了阴影功能）？请引用知识库中的描述进行对比。
2. ** 互动场域 **：分析场上不同人格（如 NF 组与 ST 组）之间的化学反应。
3. ** 成长建议 **：基于玩家的【成长领域】，给出温柔但切中要害的建议。

[输出要求 - 关键!]
返回纯 JSON 对象：
{
    "groupAnalysis": "150-200字的团体动力学分析。请使用\\n进行分段。包含：\\n- 整体氛围\\n- 互动亮点\\n- 谁是团宠/主导者",
        "playerAnalysis": {
        "在此填入玩家ID": "针对该玩家的深度点评。请务必包含以下段落（使用\\n换行）：\\n1. 🌟 **高光时刻**：[内容]\\n2. 💡 **盲点觉察**：[内容]\\n3. 🌈 **彩虹寄语**：[内容]"
    }
}
注意：
1. ** 必须包含所有玩家 ID ** 作为 key，绝对不要遗漏任何一人(包括 Bot)。
2. 请在文本中使用 emoji 和 换行符(\\n) 来排版，使其在手机上阅读舒适。
3. playerAnalysis 的 Key 必须严格匹配输入数据中的 "ID"(例如 "user-0", "bot-1")。
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

    systemPersona: DEFAULT_PERSONA,
    taskPromptTemplate: DEFAULT_TASK_PROMPT,
    reportPromptTemplate: DEFAULT_REPORT_PROMPT,
    zhipuKey: ''
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
    const key = currentConfig.zhipuKey || getEnvVar('VITE_ZHIPU_KEY');
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

// 5. Pollinations (Little P) - Free, No Key
const callPollinations = async (system: string, user: string, jsonMode: boolean): Promise<string> => {
    const prompt = `${system} \n\n${user} \n\nRespond in JSON.`;
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
        const firstBracket = text.indexOf('{');
        const lastBracket = text.lastIndexOf('}');
        if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
            return text.substring(firstBracket, lastBracket + 1);
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
        system += "\n\nIMPORTANT: You MUST respond strictly in valid raw JSON format.";
    }

    const errors: string[] = [];

    // Priority 1: Groq (小G)
    try {
        console.log(`Calling [小G] Groq${imageData ? ' (Vision)' : ''}...`);
        return await callGroq(system, userPrompt, true, imageData);
    } catch (e) {
        errors.push(`Groq: ${(e as Error).message}`);
    }

    // Priority 2: OpenRouter (小O)
    try {
        console.log(`Calling [小O] OpenRouter${imageData ? ' (Vision)' : ''}...`);
        return await callOpenRouter(system, userPrompt, true, imageData);
    } catch (e) {
        errors.push(`OpenRouter: ${(e as Error).message}`);
    }

    // Priority 3: Gemini (Mini)
    try {
        console.log(`Calling [Mini] Gemini${imageData ? ' (Vision)' : ''}...`);
        return await callGemini(system, userPrompt, true, imageData);
    } catch (e) {
        errors.push(`Gemini: ${(e as Error).message}`);
    }

    // Priority 4: Zhipu (小中) - Mainland China Optimized
    try {
        console.log("Calling [小中] Zhipu AI...");
        return await callZhipu(system, userPrompt, true);
    } catch (e) {
        errors.push(`Zhipu: ${(e as Error).message}`);
    }

    // Priority 5: Pollinations (小P)
    try {
        console.log("Calling [小P] Pollinations...");
        return await callPollinations(system, userPrompt, true);
    } catch (e) {
        errors.push(`Pollinations: ${(e as Error).message}`);
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

/**
 * [知识去重注入] 仅提取当前场上存在的 MBTI 类型定义
 */
const getRelevantKnowledge = (players: Player[]): string => {
    const uniqueTypes = Array.from(new Set(players.map(p => p.mbti)));
    let context = "\n[核心人格动力学参考]\n";
    uniqueTypes.forEach(type => {
        if (MBTI_PROFILE_DATA[type]) {
            // 仅提取关键特征，过滤冗余描述
            context += `--- ${type} ---\n${MBTI_PROFILE_DATA[type].trim()}\n`;
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

const buildGameContext = (players: Player[], historyLogs: LogEntry[]) => {
    const playerMatrix = serializePlayers(players);

    // 生成任务时只看最近 15 条灵魂日志 (P0)
    const soulLogs = historyLogs
        .filter(l => l.taskDetails && l.taskDetails.includes("玩家发言:"))
        .slice(-15)
        .map(l => `[${l.author}]: ${l.taskDetails?.split("玩家发言:")[1]}`)
        .join('\n');

    return `[玩家矩阵(ID|Name|MBTI|T|I|E)]\n${playerMatrix}\n\n[最近高光发言流水线]\n${soulLogs || "航行刚刚开始..."}`;
};

// --- EXPORTED FEATURES ---

export const analyzePersonality = async (answers: { q: string, val: number }[]): Promise<MBTIAnalysisResult[]> => {
    const system = `
    你是一位资深的 MBTI 人格分析师。
    任务：根据用户在 4 个场景中的倾向（0代表左边选项，100代表右边选项），推断最可能的 3 种 MBTI 类型。
    
    [分析逻辑]
    1. 场景1 (社交): 低分偏 I，高分偏 E。
    2. 场景2 (信息): 低分偏 S，高分偏 N。
    3. 场景3 (决策): 低分偏 T，高分偏 F。
    4. 场景4 (生活): 低分偏 J，高分偏 P。
    请综合考虑中间值（如 40-60）代表的认知功能灵活性。

    [输出格式]
    返回一个纯 JSON 数组，包含 3 个对象，按可能性降序排列：
    [
      { "type": "INTJ", "percentage": 85, "reason": "你的决策极度依赖逻辑，且生活规划感极强。" },
      { "type": "ENTJ", "percentage": 60, "reason": "虽然你倾向独处，但在目标达成上非常有行动力。" },
      { "type": "ISTJ", "percentage": 40, "reason": "你在细节关注上也很突出。" }
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

export const generateAllTaskOptions = async (
    functionId: string,
    players: Player[],
    currentPlayer: Player,
    historyLogs: LogEntry[] = []
): Promise<Record<string, TaskOption>> => {
    const context = buildGameContext(players, historyLogs);

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
            tileContext = `
                [特殊场景]
                玩家处于“${functionId}”人格格，代表人物是“${mbtiCharacter}”。
                请结合该 MBTI 类型 (${functionId}) 的特点以及 ${mbtiCharacter} 的性格特质来设计任务。
                重点：关注人与人之间的关系建立，而不仅仅是内在思考。
            `;
        }
    }

    const userPrompt = `
        [游戏上下文]
        当前行动玩家: ${currentPlayer.name} (类型: ${currentPlayer.mbti}).
        ${tileContext}
        ${playerProfile}
        
        ${context}
        ${getRelevantKnowledge([currentPlayer])}

        ${currentConfig.taskPromptTemplate}
    `;

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
        console.warn("Falling back to Static Data");
        // Fallback Logic
        const fallback: Record<string, TaskOption> = {};
        ['standard', 'truth', 'dare', 'deep'].forEach(cat => {
            // @ts-ignore
            const config = TASK_CATEGORIES_CONFIG[cat];
            fallback[cat] = {
                // @ts-ignore
                category: cat,
                title: "静默模式",
                description: "暂无 AI 可被调用，请玩家自行决定一个挑战。",
                scoreType: "expression",
                durationSeconds: 60,
                multiplier: config.multiplier
            };
        });
        return fallback;
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

    let userPrompt = currentConfig.reportPromptTemplate;

    const inputData = `
        [数据源: 蓝海协议矩阵]
        玩家矩阵(ID|Name|MBTI|T|I|E):
        ${playerMatrix}

        [玩家言论证据链聚合]:
        ${evidenceChain}

        ${knowledgeBase}
    `;

    // 组装最终提示词
    if (userPrompt.includes('{players_placeholder}')) {
        userPrompt = userPrompt
            .replace('{players_placeholder}', playerMatrix)
            .replace('{logs_placeholder}', evidenceChain + knowledgeBase);
    } else {
        userPrompt = `${inputData}\n\n[任务要求]\n${userPrompt}`;
    }

    try {
        const text = await unifiedAICall(userPrompt);
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
        return {
            groupAnalysis: "由于网络时空乱流，AI 深度报告生成中断。虽然文字暂时缺席，但你们在航行中建立的连接是真实且可贵的。",
            playerAnalysis: Object.fromEntries(players.map(p => [p.id, "在这次旅程中表现出了独特的人格韧性！"]))
        };
    }
};
