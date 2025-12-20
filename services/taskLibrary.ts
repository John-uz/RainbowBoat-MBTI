
import { TaskOption } from '../types';

export interface LocalTask {
    title: string;
    description: string;
    functionId: string;
}

export const LOCAL_TASKS: LocalTask[] = [
    { title: "效率大师", description: "如果你能给地球上的每一个人一个“任务”，你会给他们什么任务？这个任务的目标是什么？", functionId: "Te" },
    { title: "规则进化", description: "观察当前游戏的流程，提出一个具体能提高效率或公平性的新规则或改动。", functionId: "Te" },
    { title: "象征之眼", description: "从桌面上随机拿起一个物品，思考并分享它除了表面用途外，还能象征什么更深层次的含义。", functionId: "Ti" },
    { title: "逻辑思辨", description: "“人多力量大”和“厨子多了煮坏汤”，请快速分析在什么具体条件下前一个观点成立。", functionId: "Te" },
    { title: "认知连接线", description: "主持人说出两个看似不相关的词语（例如：“云”和“算法”），请你尝试构建一个逻辑链条，将它们关联起来。", functionId: "Ti" },
    { title: "流程优化", description: "想象一个日常生活中重复性很高但效率不高的小事情（例如：早晨出门准备），你会如何设计一个更高效的流程来完成它？", functionId: "Te" },
    { title: "技能安利", description: "用30秒的时间，向大家清晰地介绍一个你最近了解到的实用技巧或生活小窍门，确保大家能理解并应用。", functionId: "Te" },
    { title: "派对执行官", description: "如果你们要在一个月内组织一场小型聚会，你会如何制定一个简单的三步计划？", functionId: "Te" },
    { title: "救援队长", description: "假设你们被困在一个封闭的房间，只有一把钥匙藏在房间某处。你会如何组织大家，用最快最有效的方式找到它？", functionId: "Te" },
    { title: "叛逆观点", description: "针对一个常见的俗语（例如：“早起的鸟儿有虫吃”），提出一个完全相反的观点，并给出理由。", functionId: "Te" },
    { title: "交流港湾", description: "你最喜欢在什么环境下与朋友进行面对面的交流？描述一下那种让你感到充满活力的氛围。", functionId: "Fe" },
    { title: "真相快问", description: "思考一个关于“选择”或“真相”的简单问题，并用一句话总结你的核心观点。", functionId: "Ti" },
    { title: "图书管理员", description: "如果让你为图书馆里的所有书籍设计一个全新的、最完美的分类系统，你会依据什么原则来分类？", functionId: "Ti" },
    { title: "哲学拷问", description: "提出一个简单的、引人思考的小问题或小矛盾（例如：“如果谎言能带来快乐，说谎是好是坏？”）。", functionId: "Ti" },
    { title: "情绪共振", description: "观察在座某位玩家此刻可能流流出的一个细微情绪（非语言表达），尝试用一句话说出你认为他/她此刻的感受，并表示理解或关心。", functionId: "Fe" },
    { title: "全体连线", description: "请发起一个能让所有玩家都参与进来的简单小互动（比如：让大家轮流用一个词形容当前心情）。", functionId: "Fe" },
    { title: "夸夸教主", description: "请夸奖左边的玩家三个优点，并说明理由。", functionId: "Fe" },
    { title: "造词专家", description: "如果你能发明一个全新的词语来描述一种目前没有被准确表达的情绪或思想，你会创造什么词？它代表什么？", functionId: "Ti" },
    { title: "拆解者", description: "随机拿一个日常用品（如笔），尝试解释它的基本工作原理和构造。", functionId: "Ti" },
    { title: "隐形规则", description: "在你玩过的某个游戏中，有没有一条虽然没有写在规则书上，但大家普遍默认并遵守的“隐形规则”？请描述并解释它的逻辑。", functionId: "Ti" },
    { title: "自我抉择", description: "假设你必须在“所有人都快乐但我内心不认同”和“我忠于自我但可能令部分人不快”之间做选择，你会选择哪一个？为什么？", functionId: "Fi" },
    { title: "信念宣讲", description: "想象你有一个机会向世界宣布一个你个人深信不疑的价值观，请用一句简短的话语表达它。", functionId: "Fi" },
    { title: "角色辩论", description: "与一位玩家进行一分钟角色扮演辩论（如机器人vs人类）。", functionId: "Fe" },
    { title: "共鸣时刻", description: "分享一部电影、一本书或一首歌中，哪个片段或哪一句歌词曾让你产生强烈的共鸣，并简要说明原因。", functionId: "Fi" },
    { title: "人格素描", description: "用3个关键词描述自己的人格，并解释原因。", functionId: "Fi" },
    { title: "无形礼赠", description: "如果你想送一份“无形的礼物”（如：勇气、平静、一段快乐的回忆）给你左边的玩家，你会送什么？为什么觉得他/她需要这个？", functionId: "Fi" },
    { title: "气氛组长", description: "观察此刻游戏的气氛，并说出一句话或做一个动作，让气氛变得更活跃或更轻松。", functionId: "Fe" },
    { title: "治愈寄语", description: "请用一句话安慰一个“因为丢掉了比赛而非常沮丧”的人。", functionId: "Fe" },
    { title: "破冰行动", description: "假设你正在参加一个大家都比较拘谨的派对，你会说或做些什么来迅速打破僵局，让大家放松下来？", functionId: "Fe" },
    { title: "价值排序", description: "在“真诚、智慧、自由、公平、慈悲”中，快速选出对你而言最重要的一项，并简述原因。", functionId: "Fi" },
    { title: "细节猎人", description: "在10秒内，找出房间里你以前从未注意过的3个小细节，并指出来。", functionId: "Se" },
    { title: "记忆回溯", description: "凭借记忆复述出场上某一位玩家从开始游戏至今，分别走到过哪些格子。", functionId: "Si" },
    { title: "情感存封", description: "分享一件你曾经收到过的、对你个人来说意义最特别的小礼物，并解释原因。", functionId: "Si" },
    { title: "瞬间模仿", description: "观察某位玩家一个微小的动作（如摸鼻子），然后立即模仿出来，让大家猜模仿的是谁。", functionId: "Se" },
    { title: "触感表达", description: "随机触摸桌面上不同材质的物品（例如：木头、塑料、布料），然后用一个词形容每种材质带给你的感受。", functionId: "Se" },
    { title: "心情比喻", description: "用一个比喻来描述你当下的心情或状态（例如：“我感觉像一本被翻到一半的书，正在寻找下一个精彩的章节”）。", functionId: "Fi" },
    { title: "肢体密语", description: "不说话，只用肢体动作，给另一位玩家一个简单的指令（例如：“帮我拿那边的骰子”），看他能否理解。", functionId: "Se" },
    { title: "内心抉择", description: "分享一个你曾面临艰难选择，最终依据自己的内心感受做出决定的经历。", functionId: "Fi" },
    { title: "热血解说", description: "对当前游戏桌上的场景进行30秒的现场直播式解说，就像你在解说一场激动人心的体育比赛。", functionId: "Se" },
    { title: "细节消失", description: "观察周围10秒钟，然后闭眼，主持人改变一个物品的位置，睁眼后说出哪个物品被改变。", functionId: "Se" },
    { title: "影帝时刻", description: "模仿一个电影角色进行一分钟的表演。", functionId: "Se" },
    { title: "动物猜猜看", description: "随机模仿一个你熟悉的动物或卡通人物的标志性动作或表情，让大家猜。", functionId: "Se" },
    { title: "脑洞大开", description: "为一部众所周知的童话或故事（如：《三只小猪》）设想一个完全不同的、脑洞大开的结局。", functionId: "Ne" },
    { title: "记忆拼贴", description: "在桌面上找到几件小物件（例如：硬币、卡牌、骰子等），用它们摆出一个图案或小场景，来代表你童年时期最珍贵的记忆。", functionId: "Si" },
    { title: "奇妙联系", description: "请用不超过三句话，在“洗衣机”和“外星人”之间建立合理的联系。", functionId: "Ne" },
    { title: "变废为宝", description: "选一个桌上的普通物品（如水杯），提出两个让它瞬间变得很“酷”的点子。", functionId: "Ne" },
    { title: "感官瞬间", description: "你最近一次被某个环境的细节（例如：一束光、一个声音、一种气味）深深吸引是什么时候？描述一下那个瞬间。", functionId: "Si" },
    { title: "疯狂规则", description: "针对正在玩的桌游，设计一条全新的、能带来有趣变化的“疯狂”规则，并简单说明它的影响。", functionId: "Ne" },
    { title: "归属港湾", description: "请说出一个让你感到特别有归属感的地方，描述一下那里让你感到熟悉和温暖的细节。", functionId: "Si" },
    { title: "怀旧氛围", description: "你最喜欢回忆的某个特定时间或季节是什么？描述一下那个时刻的氛围和细节，以及它带给你的感受。", functionId: "Si" },
    { title: "安心仪式", description: "描述一个你每天都做的、让你感到安心或舒服的小习惯，并告诉大家为什么它对你很重要。", functionId: "Si" },
    { title: "盲盒触感", description: "闭着眼睛，从一堆随机的物品中触摸并挑选出你感觉最熟悉或最能带来舒适感的一件，然后用一种简单的动作表达你的喜爱。", functionId: "Si" },
    { title: "故事接龙", description: "给出故事的开头（例如：“今早醒来发现......”），然后让下一位玩家继续接龙，接完一圈后给出故事结尾，使整个故事首尾呼应。", functionId: "Ne" },
    { title: "梦境解读", description: "描述一个你曾做过的、让你印象深刻的梦，并尝试解读它可能代表的深层含义。", functionId: "Ni" },
    { title: "人生比喻", description: "如果将“人生”比喻成一种我们桌游中的行为（如：掷骰子、抽卡），你认为最贴切的是哪一种？为什么？", functionId: "Ni" },
    { title: "物语者", description: "随机指定一个非生命物体（如：一杯水、一把椅子、一块橡皮），请你想象它如果能说话，最想对人类表达什么。", functionId: "Ni" },
    { title: "三日魔法", description: "如果你拥有三天魔法，你会施展哪三种魔法来让这个世界变得更有趣？", functionId: "Ne" },
    { title: "维度目标", description: "抛开游戏规则定的胜利条件，为你自己设定一个在本局游戏中更高层次的“个人胜利”目标（例如：成功实施某个复杂组合技，即使输了也满足）。", functionId: "Ni" },
    { title: "万物归一", description: "请快速说出云朵和剪刀之间的三个共同点。", functionId: "Ne" },
    { title: "预示符号", description: "随机从桌上选择一个符号或图案（如扑克牌上的花色），说出它在你眼中可能代表的深层或预示性含义。", functionId: "Ni" },
    { title: "创世节日", description: "如果你能立刻创建一个全新的节日，你会命名它为什么？这个节日会庆祝什么？有什么特别的活动？", functionId: "Ne" },
    { title: "谎言机器", description: "假设你发明了一个能读懂思想的机器，但它只能读出谎言。请你构思一个有趣的场景，描述你会用这个机器来做什么，以及它会带来什么意想不到的后果。", functionId: "Ni" },
    { title: "时间管理大师", description: "请分享一个你在日常生活中用来高效管理时间的技巧或工具。", functionId: "Te" },
    { title: "逻辑谜题", description: "给出一个简短的逻辑谜题，让其他玩家尝试解答。", functionId: "Ti" },
    { title: "情感共鸣", description: "描述最近一次让你感动的情景，并说出你的感受。", functionId: "Fe" },
    { title: "价值观探讨", description: "说出你最看重的一个价值观，并解释其对你的意义。", functionId: "Fi" },
    { title: "感官体验", description: "闭上眼睛，描述你现在感受到的最强烈的一个感官刺激（如声音、气味）。", functionId: "Se" },
    { title: "记忆碎片", description: "回忆起童年里的一件小事，详细描述当时的情景。", functionId: "Si" },
    { title: "创意联想", description: "随机选取两个无关的词语，尝试把它们联系起来并讲述一个小故事。", functionId: "Ne" },
    { title: "未来愿景", description: "描述你对未来十年生活的一个大胆设想。", functionId: "Ni" },
];

export const getTasksByFunction = (functionId: string, count: number = 4): TaskOption[] => {
    // Basic mapping of function to standard/truth/dare/deep
    // This is a simplification but helps distribute the tasks
    const matched = LOCAL_TASKS.filter(t => t.functionId === functionId);

    // If not enough tasks for the requested count, fallback to generic pool
    const fallbackPool = LOCAL_TASKS.filter(t => t.functionId !== functionId);
    const combined = matched.length >= count ? matched : [...matched, ...fallbackPool];

    // Shuffle the combined pool to ensure randomness
    const shuffled = combined.sort(() => Math.random() - 0.5);

    // Slice the required number of tasks and assign categories in a round‑robin fashion
    return shuffled.slice(0, count).map((t, i) => ({
        category: (['standard', 'truth', 'dare', 'deep'] as const)[i % 4],
        title: t.title,
        description: t.description,
        multiplier: [1.0, 1.2, 1.2, 1.5][i % 4],
        scoreType: ['expression', 'insight', 'expression', 'trust'][i % 4] as any,
        durationSeconds: 60,
    }));
};
