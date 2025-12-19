import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Anchor, Sparkles, Heart, Brain, Zap, Users, Star, ArrowRight, Loader2, Quote } from 'lucide-react';
import { MBTI_CHARACTERS, MBTI_GROUPS, MBTI_STACKS, JUNG_FUNCTIONS } from '../types';
import { MBTIAnalysisResult, generateDetailedMBTIReport, MBTIDetailedReport } from '../services/geminiService';

interface Props {
    playerName: string;
    mbtiType: string;
    analysisResults: MBTIAnalysisResult[];
    onBackToHub: () => void;
    answers: { q: string, val: number }[];
}

// 内置的MBTI类型描述
const MBTI_DESCRIPTIONS: Record<string, {
    title: string;
    nickname: string;
    description: string;
    strengths: string[];
    growth: string[];
    socialTip: string;
}> = {
    'INTJ': {
        title: '策略家',
        nickname: '独立的战略思想家',
        description: '你拥有独特的洞察力和逻辑思维能力，善于制定长远计划并执行。你追求知识和能力的完善，对自己和他人都有很高的标准。',
        strengths: ['战略规划能力', '独立思考', '高效执行', '持续学习'],
        growth: ['学会表达情感', '接受不完美', '倾听他人意见'],
        socialTip: '尝试在社交中展现你温暖的一面，你的深度思考会吸引志同道合的人。'
    },
    'INTP': {
        title: '逻辑学家',
        nickname: '创新的思想实验者',
        description: '你是天生的哲学家和理论家，对复杂系统和抽象概念有着浓厚的兴趣。你追求真理，喜欢探索事物的本质。',
        strengths: ['逻辑分析', '创新思维', '问题解决', '客观公正'],
        growth: ['注意时间管理', '将想法付诸实践', '关注他人感受'],
        socialTip: '分享你独特的见解，但也要给别人表达的空间。你的智慧会照亮对话。'
    },
    'ENTJ': {
        title: '指挥官',
        nickname: '天生的领导者',
        description: '你具有强大的领导力和决断力，善于组织资源实现目标。你追求卓越，能够激励他人共同前进。',
        strengths: ['领导能力', '决策果断', '目标导向', '高效组织'],
        growth: ['学会耐心', '考虑他人感受', '接受不同节奏'],
        socialTip: '你的魅力和能量很有感染力，记得给团队成员成长的空间。'
    },
    'ENTP': {
        title: '辩论家',
        nickname: '聪明的创新者',
        description: '你思维敏捷，富有创造力，喜欢挑战传统观念。你能快速识别模式，善于从多角度看问题。',
        strengths: ['创意无限', '适应力强', '思维灵活', '善于辩论'],
        growth: ['坚持完成项目', '注意他人感受', '减少争论'],
        socialTip: '你的机智幽默让人愉快，但要注意不要过于尖锐。真诚的连接比赢得辩论更重要。'
    },
    'INFJ': {
        title: '提倡者',
        nickname: '神秘的理想主义者',
        description: '你是稀有的类型，拥有深刻的洞察力和强烈的价值观。你能理解他人的动机，致力于帮助人们实现潜能。',
        strengths: ['洞察人心', '坚守价值', '富有同理心', '远见卓识'],
        growth: ['学会放松', '照顾自己的需求', '接受不完美'],
        socialTip: '你的深度和真诚会吸引真正欣赏你的人。不要害怕展现脆弱的一面。'
    },
    'INFP': {
        title: '调停者',
        nickname: '诗意的理想主义者',
        description: '你内心丰富，追求真实和意义。你用独特的视角看世界，关心人类的情感和精神成长。',
        strengths: ['创造力', '同理心', '真诚', '理想主义'],
        growth: ['面对现实', '完成已开始的事', '学会说不'],
        socialTip: '你的温柔和理解力是珍贵的礼物。勇敢表达你的感受，世界需要你的声音。'
    },
    'ENFJ': {
        title: '主人公',
        nickname: '魅力四射的引导者',
        description: '你天生具有感染力，能够激励和引导他人。你关心社群的和谐，致力于帮助每个人发挥潜力。',
        strengths: ['感染力', '沟通能力', '组织协调', '关怀他人'],
        growth: ['关注自己的需求', '接受不能改变的事', '避免过度承诺'],
        socialTip: '你的热情和关怀让人感到温暖。记得也照顾好自己，你值得被爱护。'
    },
    'ENFP': {
        title: '竞选者',
        nickname: '热情的自由精灵',
        description: '你充满热情和创造力，能看到无限的可能性。你天生善于连接人们，为生活注入活力和乐趣。',
        strengths: ['创意无限', '热情感染', '适应力强', '善于激励'],
        growth: ['专注力', '完成承诺', '面对负面情绪'],
        socialTip: '你的阳光和创意让每个聚会都变得有趣。偶尔慢下来，深度的关系同样美好。'
    },
    'ISTJ': {
        title: '物流师',
        nickname: '可靠的守护者',
        description: '你是传统和秩序的守护者，以责任感和可靠性著称。你做事有条理，信守承诺。',
        strengths: ['责任心', '可靠', '组织能力', '实际务实'],
        growth: ['接受变化', '尝试新事物', '表达情感'],
        socialTip: '你的稳重让人安心。尝试分享你的内心世界，让亲近的人更了解你。'
    },
    'ISFJ': {
        title: '守卫者',
        nickname: '温暖的保护者',
        description: '你是最贴心的照顾者，默默为他人付出。你重视传统，珍惜与他人的深厚连接。',
        strengths: ['关怀备至', '耐心', '记忆力', '责任感'],
        growth: ['学会拒绝', '照顾自己', '接受变化'],
        socialTip: '你的善良和体贴无可替代。记得你的需求同样重要，允许自己被照顾。'
    },
    'ESTJ': {
        title: '总经理',
        nickname: '高效的管理者',
        description: '你是天生的组织者和管理者，善于建立秩序和高效完成目标。你重视传统和规则。',
        strengths: ['组织能力', '领导力', '责任心', '高效执行'],
        growth: ['灵活应变', '考虑感受', '接受不同观点'],
        socialTip: '你的可靠和效率让团队运转顺畅。偶尔放松规则，享受当下的乐趣。'
    },
    'ESFJ': {
        title: '执政官',
        nickname: '热心的照顾者',
        description: '你是社交的润滑剂，关心每个人的感受和需求。你创造和谐的环境，让每个人都感到被重视。',
        strengths: ['社交能力', '关怀他人', '组织协调', '实际支持'],
        growth: ['关注自己', '接受批评', '允许不和谐'],
        socialTip: '你的温暖让每个人都感到被欢迎。记得你的感受也同样重要。'
    },
    'ISTP': {
        title: '鉴赏家',
        nickname: '冷静的分析师',
        description: '你是务实的问题解决者，善于分析和操作复杂系统。你追求效率，喜欢动手实践。',
        strengths: ['动手能力', '冷静分析', '适应力', '高效解决问题'],
        growth: ['表达情感', '长期规划', '考虑他人感受'],
        socialTip: '你的冷静和能力让人信赖。分享你的想法，让更多人了解你的智慧。'
    },
    'ISFP': {
        title: '探险家',
        nickname: '敏感的艺术家',
        description: '你是温和的艺术家，用独特的方式感知和表达世界。你重视内心的和谐与真实。',
        strengths: ['艺术感知', '同理心', '适应力', '活在当下'],
        growth: ['长期规划', '表达需求', '面对冲突'],
        socialTip: '你的温柔和创造力让世界更美好。勇敢表达你独特的视角。'
    },
    'ESTP': {
        title: '企业家',
        nickname: '活力四射的行动派',
        description: '你是天生的冒险家，享受即兴和挑战。你善于抓住机会，在压力下表现出色。',
        strengths: ['行动力', '适应力', '魅力', '问题解决'],
        growth: ['长期思考', '考虑后果', '倾听他人'],
        socialTip: '你的能量和魅力很有吸引力。偶尔慢下来，深度的对话也很珍贵。'
    },
    'ESFP': {
        title: '表演者',
        nickname: '自发的娱乐家',
        description: '你是派对的灵魂，为生活注入快乐和活力。你活在当下，善于感染周围的人。',
        strengths: ['社交能力', '乐观', '适应力', '娱乐天赋'],
        growth: ['长期规划', '专注力', '面对负面情绪'],
        socialTip: '你的快乐是会传染的。在欢乐之余，也要珍惜安静的深度时刻。'
    }
};

const QuickTestReport: React.FC<Props> = ({ playerName, mbtiType, analysisResults, onBackToHub, answers }) => {
    const [currentType, setCurrentType] = useState(mbtiType);
    const [report, setReport] = useState<MBTIDetailedReport | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchReport = async () => {
            setLoading(true);
            try {
                // Initial short delay for smoother transition
                const data = await generateDetailedMBTIReport(currentType, answers);
                setReport(data);
            } catch (e) {
                console.error("Failed to fetch detailed AI report", e);
                // Fallback to static data if AI fails
                const staticInfo = MBTI_DESCRIPTIONS[currentType] || MBTI_DESCRIPTIONS['INTJ'];
                setReport({
                    type: currentType,
                    title: staticInfo.title,
                    nickname: staticInfo.nickname,
                    description: staticInfo.description,
                    strengths: staticInfo.strengths,
                    growth: staticInfo.growth,
                    socialTip: staticInfo.socialTip,
                    monologue: "探索中的灵魂，总会找到属于自己的答案。"
                });
            } finally {
                setLoading(false);
            }
        };
        fetchReport();
    }, [currentType]);

    // Derived values for UI
    const character = MBTI_CHARACTERS[currentType] || '秘密角色';
    const stack = MBTI_STACKS[currentType] || [];

    let groupName = '';
    let groupColor = '#14b8a6';
    Object.entries(MBTI_GROUPS).forEach(([name, data]) => {
        if (data.types.includes(currentType)) {
            groupName = name;
            groupColor = data.hexColor;
        }
    });

    return (
        <div className="min-h-screen bg-slate-950 text-white overflow-y-auto selection:bg-teal-500/30">
            {/* Dynamic Background */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        rotate: [0, 90, 0],
                    }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full blur-[120px] opacity-20"
                    style={{ backgroundColor: groupColor }}
                />
                <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[100px]" />
            </div>

            <div className="relative z-10 max-w-2xl mx-auto px-6 py-10">
                {/* Header Selector */}
                <div className="flex flex-col items-center mb-10">
                    <div className="inline-block px-4 py-2 bg-white/5 rounded-full border border-white/10 mb-6 backdrop-blur-md">
                        <span className="text-[10px] font-black tracking-[0.2em] text-teal-400 uppercase">人格可能性切换</span>
                    </div>

                    <div className="flex items-center gap-2 p-1.5 bg-white/5 backdrop-blur-2xl rounded-2xl border border-white/10 w-full max-w-sm">
                        {analysisResults.slice(0, 3).map((res) => (
                            <button
                                key={res.type}
                                onClick={() => setCurrentType(res.type)}
                                className={`flex-1 py-3 rounded-xl transition-all duration-300 relative ${currentType === res.type ? 'bg-white shadow-xl scale-105 z-10' : 'hover:bg-white/5'}`}
                            >
                                <div className={`text-sm font-black ${currentType === res.type ? 'text-slate-900' : 'text-slate-500'}`}>{res.type}</div>
                                <div className={`text-[9px] font-bold ${currentType === res.type ? 'text-teal-600' : 'text-slate-600'}`}>{res.percentage}%</div>
                                {currentType === res.type && (
                                    <motion.div layoutId="active-tab" className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-teal-500 rounded-full" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                <AnimatePresence mode="wait">
                    {loading ? (
                        <motion.div
                            key="loading"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex flex-col items-center justify-center py-20"
                        >
                            <Loader2 size={48} className="text-teal-500 animate-spin mb-6" />
                            <p className="text-slate-400 font-medium animate-pulse">AI 正在深度解析 {currentType} 的灵魂代码...</p>
                        </motion.div>
                    ) : (
                        report && (
                            <motion.div
                                key={currentType}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="space-y-8"
                            >
                                {/* Main Banner */}
                                <div className="text-center">
                                    <h1 className="text-4xl md:text-6xl font-black mb-4 tracking-tighter">
                                        {playerName} <span className="text-slate-500">x</span> <span style={{ color: groupColor }}>{currentType}</span>
                                    </h1>
                                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900 border border-white/10 text-xs font-bold shadow-inner">
                                        <Sparkles size={12} className="text-yellow-400" />
                                        {report.title}
                                    </div>
                                </div>

                                {/* Deep Insight Card */}
                                <div className="bg-slate-900/80 backdrop-blur-xl rounded-[2.5rem] border border-white/10 p-8 shadow-2xl relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-6 opacity-10">
                                        <Quote size={80} style={{ color: groupColor }} />
                                    </div>

                                    <div className="relative z-10">
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg rotate-3" style={{ backgroundColor: groupColor }}>
                                                {currentType[0]}
                                            </div>
                                            <div className="text-left">
                                                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">灵魂点评</div>
                                                <div className="text-sm font-bold text-slate-200">{report.nickname}</div>
                                            </div>
                                        </div>

                                        <p className="text-lg text-slate-300 leading-relaxed font-medium mb-8">
                                            {report.description}
                                        </p>

                                        {/* Inner Monologue */}
                                        <div className="p-6 bg-white/5 rounded-3xl border border-white/5 italic text-slate-400 text-sm leading-relaxed text-center quote-mark relative">
                                            <span className="text-2xl text-slate-600 absolute -top-2 left-4 opacity-50">“</span>
                                            {report.monologue}
                                            <span className="text-2xl text-slate-600 absolute -bottom-6 right-4 opacity-50">”</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Cognitive Stack Mini */}
                                <div className="grid grid-cols-4 gap-3">
                                    {stack.slice(0, 4).map((func, idx) => {
                                        const funcInfo = JUNG_FUNCTIONS.find(f => f.id === func);
                                        return (
                                            <div key={idx} className="bg-slate-900/50 backdrop-blur rounded-2xl border border-white/5 p-3 text-center group hover:bg-white/5 transition-colors">
                                                <div className="text-xs font-black mb-1" style={{ color: funcInfo?.color }}>{func}</div>
                                                <div className="text-[8px] text-slate-600 uppercase font-black">{['主导', '辅助', '第三', '劣势'][idx]}</div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Strengths & Growth */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="bg-teal-500/5 rounded-3xl border border-teal-500/10 p-6">
                                        <h3 className="text-teal-400 font-black text-sm uppercase tracking-widest mb-4 flex items-center gap-2">
                                            <Star size={16} /> 高光时刻
                                        </h3>
                                        <ul className="space-y-3">
                                            {report.strengths.map((s, i) => (
                                                <li key={i} className="flex items-start gap-2 text-sm text-slate-300 font-medium">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-teal-500 mt-1.5 shrink-0" />
                                                    {s}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div className="bg-amber-500/5 rounded-3xl border border-amber-500/10 p-6">
                                        <h3 className="text-amber-400 font-black text-sm uppercase tracking-widest mb-4 flex items-center gap-2">
                                            <Zap size={16} /> 升级指南
                                        </h3>
                                        <ul className="space-y-3">
                                            {report.growth.map((g, i) => (
                                                <li key={i} className="flex items-start gap-2 text-sm text-slate-300 font-medium">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                                                    {g}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>

                                {/* Character & Tip */}
                                <div className="flex flex-col md:flex-row gap-4">
                                    <div className="flex-1 bg-white/5 rounded-2xl p-4 flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-xl shadow-inner">
                                            🎭
                                        </div>
                                        <div>
                                            <div className="text-[10px] font-black text-slate-500 uppercase">代表角色</div>
                                            <div className="text-sm font-bold text-slate-300">{character}</div>
                                        </div>
                                    </div>
                                    <div className="flex-[2] bg-gradient-to-r from-teal-500/10 to-blue-500/10 rounded-2xl p-4 flex items-center gap-4 border border-white/5">
                                        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-teal-400">
                                            <Heart size={20} />
                                        </div>
                                        <div className="text-sm font-medium text-slate-300 italic">
                                            "{report.socialTip}"
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )
                    )}
                </AnimatePresence>

                {/* Footer Actions */}
                <div className="mt-12 pt-10 border-t border-white/5 flex flex-col gap-4">
                    <button
                        onClick={onBackToHub}
                        className="w-full py-4 bg-white text-slate-900 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-teal-400 transition-colors shadow-2xl flex items-center justify-center gap-2"
                    >
                        <Anchor size={18} />
                        返回 MBTI HUB
                    </button>
                    <p className="text-center text-slate-600 text-[10px] font-bold uppercase tracking-[0.3em]">
                        RAINBOW BOAT人格实验室 · ALPHA 0.2
                    </p>
                </div>
            </div>
        </div>
    );
};

export default QuickTestReport;
