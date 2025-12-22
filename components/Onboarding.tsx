
import React, { useState, useRef, useEffect } from 'react';
import { MBTI_TYPES, MBTI_GROUPS, GameMode } from '../types';
import { analyzePersonality, MBTIAnalysisResult, getAIConfig, SYSTEM_KEYS } from '../services/geminiService';
import { Anchor, Loader2, ArrowRight, Users, LayoutGrid, Plus, Trash2, User, Sparkles, Trophy, Camera, CircleHelp, Settings, Check, BookOpen, Sun, Moon, X, Monitor } from 'lucide-react';
import { motion } from 'framer-motion';
import AIConfigModal from './AIConfigModal';
import QuickTestReport from './QuickTestReport';

interface Props {
    onComplete: (players: { name: string, mbti: string, avatarImage?: string }[], mode: GameMode, botCount: number, targetScore: number) => void;
    isDarkMode: boolean;
    toggleTheme: () => void;
    initialStep?: 'setup' | 'quiz';
    isSoloTest?: boolean;
    onBackToHub?: () => void;
    onShowQuickReport?: (player: { name: string, mbti: string }, results: MBTIAnalysisResult[]) => void;
}

const QUESTIONS = [
    {
        id: 1,
        text: "社交狂欢结束回到家，你的电量...",
        left: "耗尽 (回血需独处)",
        right: "满格 (还能再嗨)",
        dimension: "E-I"
    },
    {
        id: 2,
        text: "做饭时，你通常...",
        left: "严格按食谱",
        right: "凭感觉‘适量’",
        dimension: "S-N"
    },
    {
        id: 3,
        text: "朋友哭着找你倾诉，你第一反应...",
        left: "理性分析给对策",
        right: "感性共情先抱抱",
        dimension: "T-F"
    },
    {
        id: 4,
        text: "关于旅行计划...",
        left: "Excel 精确到分钟",
        right: "说走就走看心情",
        dimension: "J-P"
    }
];

const CaptainManualModal: React.FC<{ onClose: () => void }> = ({ onClose }) => (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
        <div className="w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                <div className="flex items-center gap-2">
                    <BookOpen className="text-teal-600 dark:text-teal-400" />
                    <h2 className="text-lg font-bold text-slate-800 dark:text-white">彩虹船游戏手册 & 开发者指南</h2>
                </div>
                <button onClick={onClose} className="text-slate-500 hover:text-slate-800 dark:hover:text-white transition"><X size={24} /></button>
            </div>
            <div className="p-8 overflow-y-auto custom-scrollbar prose dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 space-y-8">

                {/* 游戏介绍部分 */}
                <div className="space-y-4">
                    <div className="p-6 rounded-2xl bg-gradient-to-br from-teal-50 to-blue-50 dark:from-teal-900/20 dark:to-blue-900/20 border border-teal-100 dark:border-teal-800/50">
                        <h3 className="mt-0 text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-600 to-blue-600 dark:from-teal-400 dark:to-blue-400">
                            🌊 彩虹船 (Rainbow Boat)
                        </h3>
                        <p className="font-bold text-slate-600 dark:text-slate-300">
                            一款结合 MBTI 荣格心理学与 AI 实时互动的桌面角色扮演游戏。
                        </p>
                        <p className="text-sm">
                            在这个游戏中，我们共同驾驶着一艘航行于潜意识海洋的“彩虹船”。每位玩家都是不可或缺的船员，你们的目标不是击败彼此，而是探索自我、理解伙伴，收集象征心灵共鸣的“共鸣水晶”。
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                            <h4 className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 mt-0"><Trophy size={18} /> 胜利目标</h4>
                            <p className="text-sm mb-0">
                                率先收集到目标数量的“共鸣水晶”（默认60分）。<br />
                                或在“无限模式”下，享受纯粹的探索乐趣直至船长宣布靠岸。
                            </p>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                            <h4 className="flex items-center gap-2 text-amber-600 dark:text-amber-400 mt-0"><LayoutGrid size={18} /> 核心机制</h4>
                            <p className="text-sm mb-0">
                                掷骰子移动 → 触发人格格位 → 选择挑战卡牌 → AI 实时观测表演 → 伙伴评分。
                            </p>
                        </div>
                    </div>
                </div>

                <hr className="border-slate-200 dark:border-slate-700" />

                {/* 详细规则 */}
                <div className="space-y-4">
                    <h3 className="flex items-center gap-2 mb-2"><BookOpen size={20} /> 航海法则</h3>

                    <h4 className="text-base font-bold text-slate-800 dark:text-white mt-2">1. 挑战与难度</h4>
                    <p className="text-sm">
                        当你停留在某个格子时，你不仅面临任务的挑战，还面临心理舒适区的挑战。
                    </p>
                    <ul className="text-sm list-disc pl-5 space-y-1">
                        <li><strong>舒适区 (x1.0)</strong>：任务如果是你的主导/辅助功能（例如 INTJ 做逻辑规划），你会觉得得心应手。</li>
                        <li><strong>成长区 (x1.2)</strong>：任务涉及你的第三功能，稍显生涩但充满乐趣。</li>
                        <li><strong>突破区</strong>：你的劣势功能（第四功能）<strong>x1.5</strong>，阴影人格（第五至八功能）<strong>x1.3</strong>。这是你最大的弱点，也是最大的得分机会！</li>
                    </ul>

                    <h4 className="text-base font-bold text-slate-800 dark:text-white mt-4">2. 任务类型系数</h4>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-emerald-100 dark:bg-emerald-900/30 p-2 rounded text-emerald-800 dark:text-emerald-300">🌱 暖身 (x1.0): 轻松的破冰问答</div>
                        <div className="bg-sky-100 dark:bg-sky-900/30 p-2 rounded text-sky-800 dark:text-sky-300">🕊️ 真心 (x1.2): 触及内心的自我披露</div>
                        <div className="bg-amber-100 dark:bg-amber-900/30 p-2 rounded text-amber-800 dark:text-amber-300">🔥 挑战 (x1.2): 需要勇气的整活大冒险</div>
                        <div className="bg-indigo-100 dark:bg-indigo-900/30 p-2 rounded text-indigo-800 dark:text-indigo-300">✨ 走心 (x1.5): 深度灵魂拷问与演绎</div>
                    </div>

                    <h4 className="text-base font-bold text-slate-800 dark:text-white mt-4">3. 评分系统</h4>
                    <p className="text-sm">
                        任务完成后，其他船员会根据你的真诚与投入程度给出 1-5 星评价。
                        <br />
                        <span className="text-slate-500 italic">注：如果不忍心打分或想弃权，可以滑到 0 星，系统会自动忽略该评分，不拉低平均分。</span>
                    </p>
                </div>

                <hr className="border-slate-200 dark:border-slate-700" />

                {/* 开发者指南 */}
                <div className="space-y-4">
                    <h3 className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-mono text-base bg-slate-100 dark:bg-slate-800 p-2 rounded-lg">
                        <Monitor size={16} /> Developer Guide / 开发者指南
                    </h3>

                    <div className="text-xs font-mono bg-slate-900 text-slate-300 p-4 rounded-xl overflow-x-auto">
                        <p className="text-teal-400 mb-2">// 技术栈 (Tech Stack)</p>
                        <ul className="list-disc pl-4 space-y-1 mb-4">
                            <li>前端 (Frontend): React 18, Vite, TailwindCSS, Framer Motion</li>
                            <li>AI 模型 (AI Integration): Google Gemini / Groq / Zhipu (通过 OpenAI 兼容接口)</li>
                            <li>语音与视觉 (Speech & Vision): Web Speech API, Canvas API, MediaDevices API</li>
                            <li>状态管理 (State): React Local State (基础玩法无需外部数据库)</li>
                        </ul>

                        <p className="text-teal-400 mb-2">// 关键配置 (Key Configuration)</p>
                        <p className="mb-2">
                            API 密钥在 <code>AIConfigModal</code> 中管理，并存储在 <code>localStorage</code> 中以持久化。
                            请确保网络能够访问 Google/Groq API，国内环境可切换至智谱 AI (Zhipu)。
                        </p>

                        <p className="text-teal-400 mb-2">// 自定义任务 (Customizing Tasks)</p>
                        <p>
                            任务由 <code>services/geminiService.ts</code> 中的 Prompt 动态生成。
                            你可以在 <code>data/MBTI_Tasks.csv</code> (若已启用) 中微调标准任务库，或修改 prompt 结构以改变游戏风格。
                        </p>
                    </div>
                </div>

            </div>
            <div className="p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex justify-end">
                <button onClick={onClose} className="px-6 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg font-bold">我已了解</button>
            </div>
        </div>
    </div>
);

const Onboarding: React.FC<Props> = ({ onComplete, isDarkMode, toggleTheme, initialStep = 'setup', isSoloTest = false, onBackToHub, onShowQuickReport }) => {
    const [step, setStep] = useState<'setup' | 'quiz' | 'analyzing' | 'results'>(initialStep);
    const [humanPlayers, setHumanPlayers] = useState<{ id: string, name: string, mbti: string, avatarImage?: string }[]>([
        { id: 'p1', name: '', mbti: '' }
    ]);
    const [currentPlayerConfigIndex, setCurrentPlayerConfigIndex] = useState(0);
    const [cameraActiveIndex, setCameraActiveIndex] = useState<number | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [answers, setAnswers] = useState<{ [key: number]: number }>({ 1: 50, 2: 50, 3: 50, 4: 50 });
    const [analysisResults, setAnalysisResults] = useState<MBTIAnalysisResult[]>([]);
    const [playerHistory, setPlayerHistory] = useState<Record<number, { count: number, summary: string }>>({});

    const [selectedMode, setSelectedMode] = useState<GameMode>(GameMode.JUNG_8);
    const [botCount, setBotCount] = useState<number>(0);
    const [targetScore, setTargetScore] = useState<number>(60);
    const [isInfiniteMode, setIsInfiniteMode] = useState(false);

    // New State for Config Modal
    const [showConfig, setShowConfig] = useState(false);
    const [showManual, setShowManual] = useState(false);

    // State for Quick Test Report
    const [showQuickReport, setShowQuickReport] = useState(false);
    const [selectedMbtiForReport, setSelectedMbtiForReport] = useState<string>('');

    useEffect(() => {
        let stream: MediaStream | null = null;
        if (cameraActiveIndex !== null) {
            navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 300 }, height: { ideal: 300 } } })
                .then(s => {
                    stream = s;
                    if (videoRef.current) {
                        videoRef.current.srcObject = stream;
                        videoRef.current.play();
                    }
                })
                .catch(err => {
                    console.error("Camera error:", err);
                    setCameraActiveIndex(null);
                    alert("无法访问摄像头，请检查权限。");
                });
        }
        return () => {
            if (stream) stream.getTracks().forEach(t => t.stop());
        };
    }, [cameraActiveIndex]);

    const capturePhoto = (index: number) => {
        if (videoRef.current && canvasRef.current) {
            const context = canvasRef.current.getContext('2d');
            if (context) {
                const size = Math.min(videoRef.current.videoWidth, videoRef.current.videoHeight);
                const startX = (videoRef.current.videoWidth - size) / 2;
                const startY = (videoRef.current.videoHeight - size) / 2;
                context.drawImage(videoRef.current, startX, startY, size, size, 0, 0, 300, 300);
                const dataUrl = canvasRef.current.toDataURL('image/jpeg');
                const newPlayers = [...humanPlayers];
                newPlayers[index].avatarImage = dataUrl;
                setHumanPlayers(newPlayers);
                setCameraActiveIndex(null);
            }
        }
    };

    const checkHistory = async (index: number, name: string, mbti: string) => {
        if ((window as any).nativeGetHistory && name && mbti) {
            try {
                const res = await (window as any).nativeGetHistory(name, mbti);
                const data = JSON.parse(res);
                if (data.exists) {
                    setPlayerHistory(prev => ({
                        ...prev,
                        [index]: { count: data.count, summary: data.summary }
                    }));
                } else {
                    setPlayerHistory(prev => {
                        const next = { ...prev };
                        delete next[index];
                        return next;
                    });
                }
            } catch (e) {
                console.error("History check failed", e);
            }
        }
    };

    const addHumanPlayer = () => { if (humanPlayers.length < 16) setHumanPlayers([...humanPlayers, { id: `p${Date.now()}`, name: '', mbti: '' }]); };
    const removeHumanPlayer = (index: number) => { if (humanPlayers.length > 1) { const newPlayers = [...humanPlayers]; newPlayers.splice(index, 1); setHumanPlayers(newPlayers); } };

    const updatePlayerName = (index: number, name: string) => {
        const newPlayers = [...humanPlayers];
        newPlayers[index].name = name;
        setHumanPlayers(newPlayers);
        checkHistory(index, name, newPlayers[index].mbti);
    };

    const updatePlayerMbti = (index: number, mbti: string) => {
        const newPlayers = [...humanPlayers];
        newPlayers[index].mbti = mbti;
        setHumanPlayers(newPlayers);
        checkHistory(index, newPlayers[index].name, mbti);
    };

    const startQuizForPlayer = (index: number) => { setCurrentPlayerConfigIndex(index); setAnswers({ 1: 50, 2: 50, 3: 50, 4: 50 }); setStep('quiz'); };

    const handleSelectResult = (mbti: string) => {
        if (isSoloTest) {
            // In Solo Test mode, clicking a result card shows the detailed report
            setSelectedMbtiForReport(mbti);
            setShowQuickReport(true);
        } else {
            // In Game Setup mode, clicking a result card selects it for the player
            updatePlayerMbti(currentPlayerConfigIndex, mbti);
            setStep('setup');
        }
    }

    const isSetupValid = () => humanPlayers.every(p => p.name.trim() !== '' && p.mbti !== '');
    const handleFinalStart = () => { if (isSetupValid()) onComplete(humanPlayers, selectedMode, botCount, isInfiniteMode ? 9999 : targetScore); };

    // --- DYNAMIC AI NAME & LOADING TEXT ---
    const aiConfig = getAIConfig();
    let initialAiName = "AI";

    // Helper to check if a key exists in Config OR System Env
    const hasKey = (configKey: string | undefined, systemKey: string) => {
        return (configKey && configKey.length > 0) || (systemKey && systemKey.length > 0);
    };

    // Determine nickname based on backend priority (Text Mode)
    if (aiConfig.regionMode === 'china') {
        if (hasKey(aiConfig.deepseekKey, SYSTEM_KEYS.deepseek)) initialAiName = "小D";
        else if (hasKey(aiConfig.zhipuKey, SYSTEM_KEYS.zhipu)) initialAiName = "小Z";
        else initialAiName = "小D";
    } else {
        if (hasKey(aiConfig.groqKey, SYSTEM_KEYS.groq)) initialAiName = "小G";
        else if (hasKey(aiConfig.geminiKey, SYSTEM_KEYS.gemini)) initialAiName = "小F";
        else if (hasKey(aiConfig.openRouterKey, SYSTEM_KEYS.openRouter)) initialAiName = "小O";
        else initialAiName = "小P";
    }

    const [aiStatus, setAiStatus] = useState(initialAiName);

    const handleQuizSubmit = async () => {
        setStep('analyzing');
        const formattedAnswers = QUESTIONS.map(q => ({ q: q.text, val: answers[q.id] }));
        // Pass the callback to update UI based on actual AI being called
        const results = await analyzePersonality(formattedAnswers, (currentAiName) => {
            setAiStatus(currentAiName);
        });
        setAnalysisResults(results);
        setStep('results');
    };

    if (step === 'analyzing') return (
        <div className="flex flex-col items-center justify-center h-full">
            <Loader2 size={48} className="text-teal-500 animate-spin mb-4" />
            <p className="text-xl text-slate-600 dark:text-slate-300 font-medium animate-pulse">
                {aiStatus} 正在对话你的潜意识...
            </p>
        </div>
    );

    // Show Quick Test Report if triggered
    if (showQuickReport && selectedMbtiForReport) {
        return (
            <QuickTestReport
                playerName={humanPlayers[currentPlayerConfigIndex]?.name || '探索者'}
                mbtiType={selectedMbtiForReport}
                analysisResults={analysisResults}
                onBackToHub={() => {
                    setShowQuickReport(false);
                    if (onBackToHub) onBackToHub();
                }}
            />
        );
    }

    if (step === 'quiz') return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-4 animate-in fade-in zoom-in-95 duration-300">
            <div className="w-full max-w-2xl bg-white dark:bg-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-200 dark:border-slate-700">
                <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                    <div>
                        <h3 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
                            <Sparkles className="text-teal-500" />
                            {isSoloTest ? "AI 趣味快测" : "人格原型扫描"}
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">
                            {isSoloTest ? "请直觉作答，无需纠结" : `正在分析: ${humanPlayers[currentPlayerConfigIndex]?.name || '玩家'}`}
                        </p>
                    </div>
                    <button
                        onClick={() => {
                            if (isSoloTest && onBackToHub) onBackToHub();
                            else setStep('setup');
                        }}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 custom-scrollbar">
                    {QUESTIONS.map((q) => (
                        <div key={q.id} className="space-y-4 animate-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: `${q.id * 100}ms` }}>
                            <div className="flex justify-between items-center">
                                <h4 className="font-bold text-slate-700 dark:text-slate-200 text-lg">
                                    <span className="text-teal-500 mr-2">0{q.id}.</span>
                                    {q.text}
                                </h4>
                                <span className="text-[10px] font-black uppercase text-slate-300 dark:text-slate-600 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                                    {q.dimension}
                                </span>
                            </div>

                            <div className="relative pt-6 pb-2">
                                {/* Track */}
                                <div className="absolute top-1/2 left-0 right-0 h-2 bg-slate-100 dark:bg-slate-700 rounded-full -translate-y-1/2" />

                                {/* Range Input */}
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    step="10"
                                    value={answers[q.id]}
                                    onChange={(e) => setAnswers({ ...answers, [q.id]: parseInt(e.target.value) })}
                                    className="relative z-10 w-full h-8 opacity-0 cursor-pointer"
                                />

                                {/* Custom Thumb & Progress */}
                                <div
                                    className="absolute top-1/2 left-0 h-2 bg-gradient-to-r from-teal-400 to-blue-500 rounded-full -translate-y-1/2 transition-all duration-150 pointer-events-none"
                                    style={{ width: `${answers[q.id]}%` }}
                                />
                                <div
                                    className="absolute top-1/2 w-6 h-6 bg-white dark:bg-slate-800 border-2 border-teal-500 rounded-full shadow-lg -translate-y-1/2 -translate-x-1/2 transition-all duration-150 pointer-events-none flex items-center justify-center z-20"
                                    style={{ left: `${answers[q.id]}%` }}
                                >
                                    <div className="w-2 h-2 bg-teal-500 rounded-full" />
                                </div>

                                {/* Labels */}
                                <div className="flex justify-between mt-2 text-xs font-bold text-slate-400 dark:text-slate-500 select-none">
                                    <span className={`transition-colors ${answers[q.id] < 50 ? 'text-teal-600 dark:text-teal-400 scale-105' : ''}`}>{q.left}</span>
                                    <span className={`transition-colors ${answers[q.id] > 50 ? 'text-blue-600 dark:text-blue-400 scale-105' : ''}`}>{q.right}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="p-6 border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
                    <button
                        onClick={handleQuizSubmit}
                        className="w-full py-4 bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700 text-white rounded-xl font-black text-lg shadow-lg shadow-teal-500/20 hover:shadow-teal-500/30 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                        <Sparkles size={20} />
                        呼唤 AI 对话心灵
                    </button>
                </div>
            </div>
        </div>
    );

    if (step === 'results') return (
        <div className="flex flex-col items-center justify-center h-full p-4 overflow-y-auto">
            <div className="w-full max-w-xl bg-white dark:bg-slate-800/90 backdrop-blur p-8 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl">
                <h3 className="text-xl font-bold mb-2 text-center text-slate-800 dark:text-white">分析完成</h3>
                <p className="text-center text-slate-500 dark:text-slate-400 mb-6 text-sm">虽然 AI 觉得你像这些类型，但最终决定权在你。</p>

                <div className="space-y-4">
                    {analysisResults.map((result, idx) => (
                        <button
                            key={result.type}
                            onClick={() => handleSelectResult(result.type)}
                            className="w-full p-4 bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-600 hover:border-teal-500 transition text-left group relative overflow-hidden"
                        >
                            <div className="flex justify-between items-end mb-2 relative z-10">
                                <span className="text-2xl font-bold text-slate-800 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-300">{result.type}</span>
                                <span className="text-lg font-mono font-bold text-teal-600 dark:text-teal-400">{result.percentage}%</span>
                            </div>
                            {/* Progress Bar Background */}
                            <div className="absolute bottom-0 left-0 h-1 bg-teal-500/20 w-full">
                                <div className="h-full bg-teal-500" style={{ width: `${result.percentage}%` }}></div>
                            </div>
                            <p className="text-sm text-slate-600 dark:text-slate-300 relative z-10">{result.reason}</p>
                        </button>
                    ))}
                </div>

                <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700 text-center flex flex-col gap-3">
                    {isSoloTest && (
                        <>
                            <button
                                onClick={() => {
                                    // Use the top result as default, or let user choose
                                    const topResult = analysisResults[0]?.type || 'INTJ';
                                    setSelectedMbtiForReport(topResult);
                                    setShowQuickReport(true);
                                }}
                                className="w-full py-4 bg-gradient-to-r from-teal-600 to-indigo-600 text-white rounded-xl font-bold hover:brightness-110 shadow-lg shadow-teal-500/20 flex items-center justify-center gap-2 transition"
                            >
                                <Sparkles size={20} /> 查看深度解析报告
                            </button>
                            <button onClick={() => onBackToHub && onBackToHub()} className="w-full py-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-white rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-600 transition">
                                完成测试，返回主页
                            </button>
                        </>
                    )}
                    <button onClick={() => setStep('setup')} className="text-slate-500 hover:text-slate-800 dark:hover:text-white text-sm">
                        {isSoloTest ? '都不准？去游戏手动选择' : '都不准？手动选择'}
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="flex flex-col items-center min-h-screen p-4 overflow-y-auto bg-slate-50 dark:bg-slate-900 transition-colors duration-300 gpu-accelerated">
            <div className="w-full max-w-6xl bg-white dark:bg-slate-800 p-6 md:p-8 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl my-4 relative gpu-accelerated">

                {/* Top Controls */}
                <div className="absolute top-6 right-6 flex gap-3 z-10">
                    <button
                        onClick={() => setShowManual(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300 text-xs font-bold transition"
                    >
                        <BookOpen size={16} /> 船长必读
                    </button>
                    <button
                        onClick={toggleTheme}
                        className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 hover:text-amber-500 dark:hover:text-yellow-400 transition"
                    >
                        {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
                    </button>
                    <button
                        onClick={() => setShowConfig(true)}
                        className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 transition"
                        title="AI Settings"
                    >
                        <Settings size={18} />
                    </button>
                </div>

                <div className="text-center mb-6 pt-2">
                    <h2 className="text-3xl font-bold mb-2 text-transparent bg-clip-text bg-[linear-gradient(to_right,#ef4444,#f97316,#eab308,#22c55e,#3b82f6,#a855f7)] tracking-tight">彩虹船</h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">构建多元人格的社交体验</p>
                </div>
                <div className="flex flex-col gap-8">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between"><h4 className="text-teal-600 dark:text-teal-400 font-bold flex items-center gap-2"><Users size={18} /> 玩家配置 ({humanPlayers.length}/16)</h4>{humanPlayers.length < 16 && (<button onClick={addHumanPlayer} className="text-xs bg-teal-50 hover:bg-teal-100 dark:bg-teal-900/50 dark:hover:bg-teal-900 text-teal-700 dark:text-teal-200 px-3 py-1.5 rounded-full flex items-center gap-1 transition"><Plus size={12} /> 添加玩家</button>)}</div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                            {humanPlayers.map((player, idx) => (
                                <div key={player.id} className={`bg-slate-100/60 dark:bg-slate-900/50 p-4 rounded-xl border relative transition hover:border-slate-400 dark:hover:border-slate-600 flex gap-4 items-start ${playerHistory[idx] ? 'border-amber-400 dark:border-amber-600 shadow-[0_0_10px_rgba(251,191,36,0.2)]' : 'border-slate-200 dark:border-slate-700'}`}>
                                    {playerHistory[idx] && (
                                        <div className="absolute -top-3 left-4 bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-700/50 shadow-sm flex items-center gap-1 animate-in slide-in-from-bottom-2 z-20">
                                            <Trophy size={10} /> 老船员 (Lv.{playerHistory[idx].count})
                                        </div>
                                    )}
                                    {humanPlayers.length > 1 && (<button onClick={() => removeHumanPlayer(idx)} className="absolute top-2 right-2 text-slate-400 hover:text-red-500 dark:text-slate-600 dark:hover:text-red-400 transition"><Trash2 size={14} /></button>)}
                                    <div className="shrink-0 flex flex-col items-center gap-2">
                                        <div className="w-16 h-16 rounded-full bg-slate-200 dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 overflow-hidden flex items-center justify-center relative group">
                                            {player.avatarImage ? (<img src={player.avatarImage} alt="Avatar" className="w-full h-full object-cover" />) : (<User size={32} className="text-slate-400 dark:text-slate-500" />)}
                                            {cameraActiveIndex === idx ? (
                                                <div className="absolute inset-0 bg-black z-10 flex flex-col items-center justify-center">
                                                    <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover opacity-50" autoPlay playsInline muted />
                                                    <button onClick={() => capturePhoto(idx)} className="relative z-20 bg-white/20 p-1 rounded-full animate-pulse hover:bg-white/40"><Camera size={16} /></button>
                                                    <canvas ref={canvasRef} width="300" height="300" className="hidden" />
                                                </div>
                                            ) : (<button onClick={() => setCameraActiveIndex(idx)} className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition"><Camera size={20} className="text-white" /></button>)}
                                        </div>
                                        {player.avatarImage && (<button onClick={() => { const newPlayers = [...humanPlayers]; newPlayers[idx].avatarImage = undefined; setHumanPlayers(newPlayers); }} className="text-[10px] text-red-500 dark:text-red-400 hover:underline">清除</button>)}
                                    </div>
                                    <div className="flex flex-col gap-3 flex-1">
                                        <div><label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">昵称</label><input type="text" value={player.name} onChange={(e) => updatePlayerName(idx, e.target.value)} className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-800 dark:text-white text-sm focus:ring-1 focus:ring-teal-500 outline-none" placeholder={`玩家 ${idx + 1}`} /></div>
                                        <div>
                                            <div className="flex justify-between items-center mb-2"><label className="text-[10px] text-slate-500 font-bold uppercase">人格类型 (MBTI)</label>{!player.mbti && (<button onClick={() => startQuizForPlayer(idx)} className="text-[10px] text-teal-600 dark:text-teal-400 hover:text-teal-500 dark:hover:text-teal-300 flex items-center gap-1"><Sparkles size={10} /> AI 帮我测</button>)}</div>
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                                {Object.entries(MBTI_GROUPS).map(([groupName, groupData]) => (
                                                    <div key={groupName} className={`rounded-lg p-2 border ${groupData.color} flex flex-col gap-1`}>
                                                        <div className="text-[10px] font-bold opacity-80 uppercase tracking-wide text-center mb-1 text-slate-700 dark:text-slate-300">{groupName.split(' ')[0]}</div>
                                                        <div className="grid grid-cols-2 gap-1">
                                                            {groupData.types.map(type => (<button key={type} onClick={() => updatePlayerMbti(idx, type)} className={`text-[10px] py-1 rounded font-bold transition ${player.mbti === type ? 'bg-slate-800 text-white dark:bg-white dark:text-slate-900 shadow-md transform scale-105' : 'bg-black/5 hover:bg-black/10 dark:bg-black/20 dark:hover:bg-black/40 text-slate-600 dark:text-inherit'}`}>{type}</button>))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-slate-200 dark:border-slate-700/50">
                        <div><h4 className="text-blue-500 dark:text-blue-400 font-bold mb-3 flex items-center gap-2 text-sm"><LayoutGrid size={16} /> 游戏模式</h4>
                            <div className="flex flex-col gap-2">
                                <button onClick={() => setSelectedMode(GameMode.JUNG_8)} className={`px-3 py-2 rounded-lg border text-left transition text-sm ${selectedMode === GameMode.JUNG_8 ? 'bg-blue-100 border-blue-500 text-blue-800 dark:bg-blue-600/20 dark:text-white' : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400'}`}><span className="font-bold">荣格八维模式</span></button>
                                <button onClick={() => setSelectedMode(GameMode.MBTI_16)} className={`px-3 py-2 rounded-lg border text-left transition text-sm ${selectedMode === GameMode.MBTI_16 ? 'bg-purple-100 border-purple-500 text-purple-800 dark:bg-purple-600/20 dark:text-white' : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400'}`}><span className="font-bold">MBTI 十六型模式</span></button>
                            </div>
                        </div>
                        <div><h4 className="text-orange-500 dark:text-orange-400 font-bold mb-3 flex items-center gap-2 text-sm"><User size={16} /> 电脑玩家: {botCount}</h4><input type="range" min="0" max="5" value={botCount} onChange={(e) => setBotCount(parseInt(e.target.value))} className="w-full h-1.5 bg-slate-300 dark:bg-slate-600 rounded-lg appearance-none cursor-pointer accent-orange-500" /><div className="flex justify-between text-[10px] text-slate-500 mt-2"><span>无 Bot</span><span>5 Bots</span></div></div>
                        <div>
                            <div className="flex justify-between items-center mb-3">
                                <h4 className="text-yellow-500 dark:text-yellow-400 font-bold flex items-center gap-2 text-sm"><Trophy size={16} /> 目标分数: {isInfiniteMode ? '∞' : targetScore}</h4>
                                <button
                                    onClick={() => setIsInfiniteMode(!isInfiniteMode)}
                                    className={`text-[10px] px-2 py-1 rounded border transition ${isInfiniteMode ? 'bg-yellow-500 text-white border-yellow-600' : 'bg-transparent text-slate-400 border-slate-300'}`}
                                >
                                    {isInfiniteMode ? '已开启无限' : '开启无限模式'}
                                </button>
                            </div>
                            <input
                                type="range"
                                min="40"
                                max="120"
                                step="10"
                                value={targetScore}
                                disabled={isInfiniteMode}
                                onChange={(e) => setTargetScore(parseInt(e.target.value))}
                                className={`w-full h-1.5 rounded-lg appearance-none cursor-pointer ${isInfiniteMode ? 'bg-slate-200 dark:bg-slate-700 accent-slate-400' : 'bg-slate-300 dark:bg-slate-600 accent-yellow-500'}`}
                            />
                            <div className="flex justify-between text-[10px] text-slate-500 mt-2">
                                <span>快节奏 (40)</span>
                                <span>深度游 (120)</span>
                            </div>
                        </div>
                    </div>
                </div>
                <button onClick={handleFinalStart} disabled={!isSetupValid()} className="w-full mt-8 py-3.5 bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-500 hover:to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-bold text-white text-lg transition shadow-lg hover:shadow-teal-500/20 flex items-center justify-center gap-2">踏上彩虹船 <ArrowRight size={20} /></button>

                <div className="flex justify-center mt-8">
                    <motion.button
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                            console.log("Anchor clicked - returning to hub");
                            if (onBackToHub) onBackToHub();
                        }}
                        className="flex items-center gap-2 px-6 py-2.5 text-slate-400 hover:text-teal-600 dark:text-slate-500 dark:hover:text-teal-400 transition-all duration-300 text-sm font-bold group bg-slate-100/50 dark:bg-slate-800/30 hover:bg-white dark:hover:bg-slate-800 rounded-full border border-transparent hover:border-teal-500/30 shadow-sm hover:shadow-md"
                    >
                        <Anchor size={16} className="group-hover:rotate-[20deg] group-hover:scale-110 transition-transform duration-300" />
                        重返码头
                    </motion.button>
                </div>
            </div>

            {showConfig && <AIConfigModal onClose={() => setShowConfig(false)} />}
            {showManual && <CaptainManualModal onClose={() => setShowManual(false)} />}
        </div>
    );
};

export default Onboarding;
