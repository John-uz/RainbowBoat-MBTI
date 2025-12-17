
import React, { useState, useRef, useEffect } from 'react';
import { MBTI_TYPES, MBTI_GROUPS, GameMode } from '../types';
import { analyzePersonality, MBTIAnalysisResult } from '../services/geminiService';
import { Loader2, ArrowRight, Users, LayoutGrid, Plus, Trash2, User, Sparkles, Trophy, Camera, CircleHelp, Settings, Check, BookOpen, Sun, Moon, X, Monitor } from 'lucide-react';
import AIConfigModal from './AIConfigModal';

interface Props {
    onComplete: (players: { name: string, mbti: string, avatarImage?: string }[], mode: GameMode, botCount: number, targetScore: number) => void;
    isDarkMode: boolean;
    toggleTheme: () => void;
}

const QUESTIONS = [
    {
        id: 1,
        text: "社交狂欢结束回到家，你的电量...",
        left: "耗尽 (需独处回血)",
        right: "满格 (还想再嗨)",
        dimension: "E-I"
    },
    {
        id: 2,
        text: "做饭时，你通常...",
        left: "严格按食谱称重",
        right: "凭感觉‘适量’发挥",
        dimension: "S-N"
    },
    {
        id: 3,
        text: "朋友哭着找你倾诉，你第一反应...",
        left: "分析原因找对策",
        right: "先抱抱陪TA哭",
        dimension: "T-F"
    },
    {
        id: 4,
        text: "关于旅行计划...",
        left: "Excel精确到小时",
        right: "到了目的地再说",
        dimension: "J-P"
    }
];

const CaptainManualModal: React.FC<{ onClose: () => void }> = ({ onClose }) => (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
        <div className="w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                <div className="flex items-center gap-2">
                    <BookOpen className="text-teal-600 dark:text-teal-400" />
                    <h2 className="text-lg font-bold text-slate-800 dark:text-white">船长必读手册</h2>
                </div>
                <button onClick={onClose} className="text-slate-500 hover:text-slate-800 dark:hover:text-white transition"><X size={24} /></button>
            </div>
            <div className="p-8 overflow-y-auto custom-scrollbar prose dark:prose-invert max-w-none text-slate-700 dark:text-slate-300">
                <div className="bg-teal-50 dark:bg-teal-900/20 p-6 rounded-2xl border border-teal-100 dark:border-teal-800/50 mb-8">
                    <h3 className="mt-0 text-teal-800 dark:text-teal-200">⚓ 尊敬的船长</h3>
                    <p className="mb-0">作为《彩虹船》的现场主持人，你不仅是规则的维护者，更是“灵魂场域”的引导者。你的言语和节奏，将决定玩家能否在航行中实现深度的自我探索与同伴联结。</p>
                </div>

                <h4 className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400"><Monitor size={20} /> 1. 环境营造 (Set the Scene)</h4>
                <ul>
                    <li><strong>视觉聚焦</strong>：建议将画面投射在大屏幕上。光线应柔和但充足，特别是玩家的面部，这有助于 **Blue Water 3.0** 视觉感知系统提取精准的神态诊断证据。</li>
                    <li><strong>声音共振</strong>：开启背景音乐和语音播报。在安静或使用外接麦克风的环境下，AI 能更好地通过录音记录玩家的“灵魂对白”。</li>
                </ul>

                <h4 className="flex items-center gap-2 text-amber-600 dark:text-amber-400"><Sparkles size={20} /> 2. 现场引导 (Live Hosting)</h4>
                <ul>
                    <li><strong>人格入场</strong>：鼓励玩家拍摄真实的自拍照，并协助新手解释他们的 MBTI 测试结果。强调“每一种人格都是上帝精心的杰作”。</li>
                    <li><strong>共情式朗读</strong>：每当玩家抽中任务时，请以充满仪式感的语气朗读任务描述。当玩家遇到挑战卡壳时，温柔地鼓励他们“倾听内心的声音”。</li>
                    <li><strong>互评环节</strong>：这是游戏的高光时刻。引导玩家不仅仅是打分，更鼓励他们分享：“刚才那个瞬间最触动我的是什么”。</li>
                </ul>

                <h4 className="flex items-center gap-2 text-teal-600 dark:text-teal-400"><Settings size={20} /> 3. 运维秘籍 (Technical Tips)</h4>
                <ul>
                    <li><strong>AI 云端大脑</strong>：如果生成报告缓慢，点击右上角设置图标手动切换至 **Groq** (极速) 或 **Gemini** (全面)。</li>
                    <li><strong>蓝海协议 3.0</strong>：请告知玩家，系统正在通过语音、视觉和评分实时编织一份“三维诊断日志”。这不仅是游戏，更是一次科学的自我发现。</li>
                    <li><strong>赛博纪念</strong>：提醒玩家在结算页面扫码或下载纪念 HTML。扫码获取的专属报告是极佳的社交分享内容。</li>
                </ul>
            </div>
            <div className="p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex justify-end">
                <button onClick={onClose} className="px-6 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg font-bold">我已了解</button>
            </div>
        </div>
    </div>
);

const Onboarding: React.FC<Props> = ({ onComplete, isDarkMode, toggleTheme }) => {
    const [step, setStep] = useState<'setup' | 'quiz' | 'analyzing' | 'results'>('setup');
    const [humanPlayers, setHumanPlayers] = useState<{ id: string, name: string, mbti: string, avatarImage?: string }[]>([
        { id: 'p1', name: '', mbti: '' }
    ]);
    const [currentPlayerConfigIndex, setCurrentPlayerConfigIndex] = useState(0);
    const [cameraActiveIndex, setCameraActiveIndex] = useState<number | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [answers, setAnswers] = useState<{ [key: number]: number }>({ 1: 50, 2: 50, 3: 50, 4: 50 });
    const [analysisResults, setAnalysisResults] = useState<MBTIAnalysisResult[]>([]);

    const [selectedMode, setSelectedMode] = useState<GameMode>(GameMode.JUNG_8);
    const [botCount, setBotCount] = useState<number>(0);
    const [targetScore, setTargetScore] = useState<number>(40);

    // New State for Config Modal
    const [showConfig, setShowConfig] = useState(false);
    const [showManual, setShowManual] = useState(false);

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

    const addHumanPlayer = () => { if (humanPlayers.length < 16) setHumanPlayers([...humanPlayers, { id: `p${Date.now()}`, name: '', mbti: '' }]); };
    const removeHumanPlayer = (index: number) => { if (humanPlayers.length > 1) { const newPlayers = [...humanPlayers]; newPlayers.splice(index, 1); setHumanPlayers(newPlayers); } };
    const updatePlayerName = (index: number, name: string) => { const newPlayers = [...humanPlayers]; newPlayers[index].name = name; setHumanPlayers(newPlayers); };
    const updatePlayerMbti = (index: number, mbti: string) => { const newPlayers = [...humanPlayers]; newPlayers[index].mbti = mbti; setHumanPlayers(newPlayers); };

    const startQuizForPlayer = (index: number) => { setCurrentPlayerConfigIndex(index); setAnswers({ 1: 50, 2: 50, 3: 50, 4: 50 }); setStep('quiz'); };

    const handleQuizSubmit = async () => {
        setStep('analyzing');
        const formattedAnswers = QUESTIONS.map(q => ({ q: q.text, val: answers[q.id] }));
        const results = await analyzePersonality(formattedAnswers);
        setAnalysisResults(results);
        setStep('results');
    };

    const handleSelectResult = (mbti: string) => {
        updatePlayerMbti(currentPlayerConfigIndex, mbti);
        setStep('setup');
    }

    const isSetupValid = () => humanPlayers.every(p => p.name.trim() !== '' && p.mbti !== '');
    const handleFinalStart = () => { if (isSetupValid()) onComplete(humanPlayers, selectedMode, botCount, targetScore); };

    // --- SUB-RENDERERS ---

    if (step === 'quiz') return (
        <div className="flex flex-col items-center justify-center h-full p-4 overflow-y-auto">
            <div className="w-full max-w-xl bg-white dark:bg-slate-800/90 backdrop-blur p-8 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl">
                <h3 className="text-xl font-bold mb-6 text-center text-teal-600 dark:text-teal-300">{humanPlayers[currentPlayerConfigIndex].name || '玩家'} 的趣味测评</h3>
                <div className="space-y-8">
                    {QUESTIONS.map((q) => (
                        <div key={q.id} className="space-y-3">
                            <div className="text-slate-800 dark:text-white font-medium text-lg">{q.text}</div>
                            <div className="relative pt-1">
                                <input type="range" min="0" max="100" value={answers[q.id]} onChange={(e) => setAnswers({ ...answers, [q.id]: parseInt(e.target.value) })} className="w-full h-2 bg-slate-200 dark:bg-slate-600 rounded-lg appearance-none cursor-pointer accent-teal-500 relative z-10" />
                                <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 font-bold mt-2">
                                    <span>{q.left}</span>
                                    <span>{q.right}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="flex gap-4 mt-10"><button onClick={() => setStep('setup')} className="flex-1 py-3 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-700/50 rounded-xl">取消</button><button onClick={handleQuizSubmit} className="flex-1 py-3 bg-teal-600 rounded-xl font-bold text-white hover:bg-teal-500 shadow-lg shadow-teal-500/20">生成画像</button></div>
            </div>
        </div>
    );

    if (step === 'analyzing') return (<div className="flex flex-col items-center justify-center h-full"><Loader2 size={48} className="text-teal-500 animate-spin mb-4" /><p className="text-xl text-slate-600 dark:text-slate-300">AI 正在连接你的潜意识...</p></div>);

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

                <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700 text-center">
                    <button onClick={() => setStep('setup')} className="text-slate-500 hover:text-slate-800 dark:hover:text-white text-sm">都不准？手动选择</button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="flex flex-col items-center h-full p-4 overflow-y-auto bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
            <div className="w-full max-w-6xl bg-white dark:bg-slate-800 p-6 md:p-8 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl my-4 relative">

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
                                <div key={player.id} className="bg-slate-100/60 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 relative transition hover:border-slate-400 dark:hover:border-slate-600 flex gap-4 items-start">
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
                        <div><h4 className="text-yellow-500 dark:text-yellow-400 font-bold mb-3 flex items-center gap-2 text-sm"><Trophy size={16} /> 目标分数: {targetScore}</h4><input type="range" min="20" max="100" step="10" value={targetScore} onChange={(e) => setTargetScore(parseInt(e.target.value))} className="w-full h-1.5 bg-slate-300 dark:bg-slate-600 rounded-lg appearance-none cursor-pointer accent-yellow-500" /><div className="flex justify-between text-[10px] text-slate-500 mt-2"><span>快节奏 (20)</span><span>深度游 (100)</span></div></div>
                    </div>
                </div>
                <button onClick={handleFinalStart} disabled={!isSetupValid()} className="w-full mt-8 py-3.5 bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-500 hover:to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-bold text-white text-lg transition shadow-lg hover:shadow-teal-500/20 flex items-center justify-center gap-2">踏上彩虹船 <ArrowRight size={20} /></button>
            </div>

            {showConfig && <AIConfigModal onClose={() => setShowConfig(false)} />}
            {showManual && <CaptainManualModal onClose={() => setShowManual(false)} />}
        </div>
    );
};

export default Onboarding;
