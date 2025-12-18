
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, RefreshCw, BrainCircuit, Sparkles, Trophy, Mic, Video, VideoOff, Timer, CheckCircle, X, Volume2, Camera, Star, ArrowRight, Zap, Target, Layers } from 'lucide-react';
import { LOCAL_TASKS } from '../services/taskLibrary';
import { generateAllTaskOptions, analyzeSoloExecution, analyzeVisualAspect } from '../services/geminiService';
import { Player, TaskOption, GameMode, TASK_CATEGORIES_CONFIG, MBTI_STACKS, JUNG_FUNCTIONS, MBTI_TYPES } from '../types';
import { speak } from '../utils/tts';
import { startSpeechRecognition, stopSpeechRecognition, isSpeechRecognitionSupported } from '../utils/speechRecognition';
import { startAudioMonitoring, stopAudioMonitoring } from '../utils/audioAnalyzer';

interface Props {
    onBack: () => void;
}

const TaskSolo: React.FC<Props> = ({ onBack }) => {
    const [selectedType, setSelectedType] = useState<string>('INTJ');
    const [currentFunctionIndex, setCurrentFunctionIndex] = useState(0);
    const [tasks, setTasks] = useState<Record<string, TaskOption> | null>(null);
    const [loading, setLoading] = useState(false);
    const [currentTask, setCurrentTask] = useState<TaskOption | null>(null);

    // Execution States
    const [phase, setPhase] = useState<'SELECTING' | 'EXECUTING' | 'FEEDBACK'>('SELECTING');
    const [timer, setTimer] = useState(0);
    const [transcription, setTranscription] = useState("");
    const [isListening, setIsListening] = useState(false);
    const [micVolume, setMicVolume] = useState(0);

    // Camera States
    const [isCameraEnabled, setIsCameraEnabled] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [visualEvidence, setVisualEvidence] = useState<string>("");

    // Feedback State
    const [aiResult, setAiResult] = useState<{ feedback: string, scores: { trust: number, insight: number, expression: number } } | null>(null);

    const stack = MBTI_STACKS[selectedType] || [];
    const currentFunction = stack[currentFunctionIndex] || 'Te';
    const functionInfo = JUNG_FUNCTIONS.find(f => f.id === currentFunction);

    // Mock player for task generation
    const mockPlayer: Player = {
        id: 'solo-user',
        name: '探索者',
        mbti: selectedType,
        isBot: false,
        avatar: 'user',
        trustScore: 0, insightScore: 0, expressionScore: 0, totalRatingGiven: 0,
        position: 0, previousPosition: null, stackIndex: currentFunctionIndex, skipUsedCount: 0, color: '#teal'
    };

    const fetchTasks = async (funcId: string, type: string) => {
        setLoading(true);
        setCurrentTask(null);
        setPhase('SELECTING');
        try {
            const res = await generateAllTaskOptions(funcId, [mockPlayer], { ...mockPlayer, mbti: type });
            setTasks(res);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTasks(currentFunction, selectedType);
    }, [currentFunction, selectedType]);

    // Timer Logic
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (phase === 'EXECUTING' && timer > 0) {
            interval = setInterval(() => {
                setTimer(prev => prev - 1);
            }, 1000);
        } else if (timer === 0 && phase === 'EXECUTING') {
            handleCompleteTask();
        }
        return () => clearInterval(interval);
    }, [phase, timer]);

    // Mic Monitoring
    useEffect(() => {
        if (phase === 'EXECUTING') {
            startAudioMonitoring((vol) => setMicVolume(vol));
            if (isSpeechRecognitionSupported()) {
                setIsListening(true);
                startSpeechRecognition((text) => setTranscription(prev => prev + " " + text));
            }
        } else {
            stopAudioMonitoring();
            stopSpeechRecognition();
            setIsListening(false);
        }
    }, [phase]);

    // Camera Logic
    useEffect(() => {
        let stream: MediaStream | null = null;
        if (isCameraEnabled && (phase === 'SELECTING' || phase === 'EXECUTING')) {
            navigator.mediaDevices.getUserMedia({ video: true })
                .then(s => {
                    stream = s;
                    if (videoRef.current) videoRef.current.srcObject = s;
                })
                .catch(err => {
                    console.error("Camera error:", err);
                    setIsCameraEnabled(false);
                });
        }
        return () => {
            if (stream) stream.getTracks().forEach(t => t.stop());
        };
    }, [isCameraEnabled, phase]);

    const handleStartChallenge = (task: TaskOption) => {
        setCurrentTask(task);
        setTimer(task.durationSeconds);
        setTranscription("");
        setPhase('EXECUTING');
        speak(`开始挑战：${task.title}。${task.description}`, "船长");
    };

    const handleCompleteTask = async () => {
        setPhase('FEEDBACK');
        setLoading(true);

        let visualObservation = "";
        if (isCameraEnabled && videoRef.current && canvasRef.current && currentTask) {
            const ctx = canvasRef.current.getContext('2d');
            if (ctx) {
                ctx.drawImage(videoRef.current, 0, 0, 300, 300);
                const frame = canvasRef.current.toDataURL('image/jpeg');
                visualObservation = await analyzeVisualAspect(frame, currentTask.title);
            }
        }

        const result = await analyzeSoloExecution(mockPlayer, currentTask!, transcription, visualObservation);
        setAiResult(result);
        setLoading(false);
        speak(result.feedback, "船长");
    };

    const nextLevel = () => {
        const nextIdx = (currentFunctionIndex + 1) % stack.length;
        setCurrentFunctionIndex(nextIdx);
        setAiResult(null);
        setCurrentTask(null);
        setPhase('SELECTING');
    };

    return (
        <div className="min-h-screen bg-slate-950 text-white p-6 flex flex-col relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 rounded-full blur-[120px] pointer-events-none" />

            <div className="max-w-6xl mx-auto w-full flex-1 flex flex-col relative z-10">
                <header className="flex items-center justify-between mb-8 shrink-0">
                    <button onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-white transition group">
                        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" /> 返回 Hub
                    </button>

                    <div className="flex items-center gap-4 bg-slate-900/50 p-1.5 rounded-2xl border border-slate-800">
                        <div className="flex items-center gap-2 px-3">
                            <Layers size={16} className="text-teal-400" />
                            <select
                                value={selectedType}
                                onChange={(e) => {
                                    setSelectedType(e.target.value);
                                    setCurrentFunctionIndex(0);
                                }}
                                className="bg-transparent text-sm font-bold outline-none cursor-pointer"
                            >
                                {MBTI_TYPES.map(t => (
                                    <option key={t} value={t} className="bg-slate-900">{t}</option>
                                ))}
                            </select>
                        </div>
                        <div className="h-6 w-px bg-slate-800" />
                        <button
                            onClick={() => setIsCameraEnabled(!isCameraEnabled)}
                            className={`p-2 rounded-xl transition-all ${isCameraEnabled ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30' : 'bg-slate-800 text-slate-500 hover:bg-slate-700'}`}
                            title={isCameraEnabled ? "关闭观测舱" : "开启观测舱"}
                        >
                            {isCameraEnabled ? <Video size={18} /> : <VideoOff size={18} />}
                        </button>
                        <button onClick={() => fetchTasks(currentFunction, selectedType)} className="p-2 hover:bg-slate-800 rounded-xl transition" title="刷新挑战">
                            <RefreshCw size={18} className={loading && phase === 'SELECTING' ? 'animate-spin' : ''} />
                        </button>
                    </div>
                </header>

                {/* Level Progress Bar */}
                <div className="flex items-center gap-2 mb-10 overflow-x-auto no-scrollbar pb-2">
                    {stack.map((func, idx) => {
                        const isCurrent = idx === currentFunctionIndex;
                        const isCompleted = idx < currentFunctionIndex;
                        const info = JUNG_FUNCTIONS.find(f => f.id === func);
                        return (
                            <React.Fragment key={func}>
                                <div className="flex flex-col items-center gap-2 min-w-[70px]">
                                    <div
                                        className={`w-12 h-12 rounded-full flex items-center justify-center text-xs font-black transition-all duration-500 border-2 ${isCurrent ? 'bg-teal-500 border-white scale-110 shadow-[0_0_20px_rgba(20,184,166,0.5)]' :
                                                isCompleted ? 'bg-slate-800 border-teal-500/50 text-teal-400' :
                                                    'bg-slate-900 border-slate-800 text-slate-600'
                                            }`}
                                    >
                                        {func}
                                    </div>
                                    <span className={`text-[10px] font-bold ${isCurrent ? 'text-teal-400' : 'text-slate-600'}`}>{info?.name.slice(-2)}</span>
                                </div>
                                {idx < stack.length - 1 && (
                                    <div className={`h-px w-8 ${idx < currentFunctionIndex ? 'bg-teal-500/50' : 'bg-slate-800'}`} />
                                )}
                            </React.Fragment>
                        );
                    })}
                </div>

                <div className="flex-1 flex flex-col items-center justify-center min-h-0">
                    <AnimatePresence mode="wait">
                        {phase === 'SELECTING' && (
                            <motion.div
                                key="selecting"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="w-full"
                            >
                                <div className="text-center mb-8">
                                    <span className="px-4 py-1.5 bg-teal-500/10 border border-teal-500/20 rounded-full text-teal-400 text-xs font-bold tracking-widest uppercase mb-4 inline-block">
                                        LEVEL {currentFunctionIndex + 1}: {functionInfo?.name} 开发
                                    </span>
                                    <h2 className="text-3xl font-black mb-2">选择你的进阶挑战</h2>
                                    <p className="text-slate-400">针对你的 {currentFunction} 功能进行深度训练</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-5xl mx-auto">
                                    {loading ? (
                                        Array.from({ length: 4 }).map((_, i) => (
                                            <div key={i} className="h-44 bg-slate-900/50 rounded-3xl border border-slate-800 animate-pulse" />
                                        ))
                                    ) : (
                                        tasks && Object.entries(tasks).map(([cat, task]) => {
                                            const config = TASK_CATEGORIES_CONFIG[cat as keyof typeof TASK_CATEGORIES_CONFIG];
                                            return (
                                                <motion.button
                                                    key={cat}
                                                    whileHover={{ scale: 1.02, y: -4 }}
                                                    onClick={() => handleStartChallenge(task)}
                                                    className={`p-6 rounded-3xl border ${config.color} bg-opacity-5 hover:bg-opacity-10 text-left transition-all group relative overflow-hidden`}
                                                >
                                                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                                        <div className="text-8xl">{config.icon}</div>
                                                    </div>
                                                    <div className="relative z-10">
                                                        <div className="flex items-center gap-3 mb-4">
                                                            <div className="text-3xl">{config.icon}</div>
                                                            <div className="px-2 py-0.5 bg-white/10 rounded text-[10px] font-bold uppercase tracking-widest">{config.name}</div>
                                                        </div>
                                                        <h3 className="text-xl font-bold mb-2 group-hover:text-teal-400 transition-colors">{task.title}</h3>
                                                        <p className="text-slate-400 text-sm line-clamp-2 leading-relaxed">{task.description}</p>
                                                    </div>
                                                </motion.button>
                                            );
                                        })
                                    )}
                                </div>
                            </motion.div>
                        )}

                        {phase === 'EXECUTING' && currentTask && (
                            <motion.div
                                key="executing"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="w-full flex flex-col md:flex-row gap-8 items-stretch max-w-6xl"
                            >
                                {/* Left Side: Task Info */}
                                <div className="flex-1 bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-[2.5rem] p-8 md:p-12 flex flex-col shadow-2xl">
                                    <div className="flex justify-between items-start mb-8">
                                        <div>
                                            <h2 className="text-3xl font-black mb-2 text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-blue-500">
                                                正在挑战：{currentTask.title}
                                            </h2>
                                            <div className="flex gap-3">
                                                <span className="px-3 py-1 bg-white/5 rounded-full text-xs font-bold text-slate-400 flex items-center gap-1.5">
                                                    <Target size={14} className="text-teal-400" /> {functionInfo?.name}
                                                </span>
                                                <span className="px-3 py-1 bg-white/5 rounded-full text-xs font-bold text-slate-400 flex items-center gap-1.5">
                                                    <Sparkles size={14} className="text-amber-400" /> {currentTask.scoreType}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="w-20 h-20 rounded-2xl bg-slate-800 border-2 border-teal-500/30 flex flex-col items-center justify-center">
                                            <span className="text-xs font-bold text-teal-400 uppercase">倒计时</span>
                                            <span className="text-2xl font-black">{timer}s</span>
                                        </div>
                                    </div>

                                    <p className="text-2xl text-slate-200 leading-relaxed italic mb-12 text-center md:text-left">
                                        "{currentTask.description}"
                                    </p>

                                    <div className="flex-1 flex flex-col gap-6">
                                        <div className="relative flex-1 bg-black/40 border border-slate-800 rounded-3xl p-6 min-h-[200px]">
                                            {isListening && <div className="absolute top-4 right-4 flex items-center gap-2 text-red-500 animate-pulse text-xs font-bold"><div className="w-2 h-2 bg-red-500 rounded-full" /> 录制中</div>}
                                            <textarea
                                                className="w-full h-full bg-transparent resize-none outline-none text-xl leading-relaxed placeholder:text-slate-700 font-medium"
                                                placeholder="请开始你的表达，系统将实时转录..."
                                                value={transcription}
                                                onChange={(e) => setTranscription(e.target.value)}
                                            />

                                            {/* Audio Visualizer logic (Simplified bars) */}
                                            <div className="absolute bottom-6 left-6 right-6 h-8 flex items-end gap-1 pointer-events-none">
                                                {Array.from({ length: 40 }).map((_, i) => (
                                                    <div key={i} className="flex-1 bg-teal-500/20 rounded-t-sm" style={{ height: `${Math.random() * micVolume * 100}%` }} />
                                                ))}
                                            </div>
                                        </div>

                                        <button
                                            onClick={handleCompleteTask}
                                            className="w-full py-5 bg-gradient-to-r from-teal-500 to-blue-600 rounded-2xl font-black text-white text-xl shadow-lg hover:shadow-teal-500/20 transition-all flex items-center justify-center gap-3"
                                        >
                                            完成挑战 <ArrowRight size={24} />
                                        </button>
                                    </div>
                                </div>

                                {/* Right Side: Observation Ward (Optional) */}
                                {isCameraEnabled && (
                                    <div className="w-full md:w-80 flex flex-col gap-6">
                                        <div className="aspect-square md:aspect-auto md:flex-1 bg-black rounded-[2.5rem] border border-slate-800 overflow-hidden relative group">
                                            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 pointer-events-none border-[20px] border-transparent">
                                                <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-teal-500/50"></div>
                                                <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-teal-500/50"></div>
                                                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-teal-500/50"></div>
                                                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-teal-500/50"></div>
                                            </div>
                                            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                                                <div className="flex items-center gap-2 text-teal-400 font-bold text-xs uppercase tracking-widest">
                                                    <BrainCircuit size={14} /> AI 观测舱已开启
                                                </div>
                                            </div>
                                        </div>
                                        <div className="bg-slate-900/50 p-6 rounded-3xl border border-slate-800 text-xs text-slate-500 italic leading-relaxed">
                                            AI 船长正在通过摄像头观察你的神态波动，这能帮助它更深层次地洞察你的认知功能活跃度。
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {phase === 'FEEDBACK' && (
                            <motion.div
                                key="feedback"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="w-full max-w-3xl"
                            >
                                {loading ? (
                                    <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-16 flex flex-col items-center justify-center text-center">
                                        <div className="w-20 h-20 mb-8 relative">
                                            <div className="absolute inset-0 border-4 border-teal-500/20 rounded-full"></div>
                                            <div className="absolute inset-0 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
                                        </div>
                                        <h2 className="text-2xl font-bold mb-2">正在灵魂对齐...</h2>
                                        <p className="text-slate-500">AI 船长正在分析你的认知功能深度</p>
                                    </div>
                                ) : aiResult && (
                                    <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl">
                                        <div className="p-10 bg-gradient-to-br from-teal-500/20 to-blue-500/20 border-b border-slate-800 text-center relative">
                                            <div className="flex justify-center mb-6">
                                                <div className="w-20 h-20 bg-teal-500 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(20,184,166,0.5)]">
                                                    <CheckCircle size={40} className="text-white" />
                                                </div>
                                            </div>
                                            <h2 className="text-3xl font-black mb-1">完成进阶挑战！</h2>
                                            <p className="text-teal-400 font-bold uppercase tracking-widest text-sm">COGNITIVE EVOLUTION ACHIEVED</p>
                                        </div>

                                        <div className="p-10">
                                            {/* Scores */}
                                            <div className="grid grid-cols-3 gap-4 mb-10">
                                                <div className="bg-slate-800/50 p-4 rounded-2xl text-center">
                                                    <div className="text-xs font-bold text-slate-500 mb-1 uppercase">信 (Trust)</div>
                                                    <div className="flex justify-center gap-1">
                                                        {Array.from({ length: 5 }).map((_, i) => <Star key={i} size={14} fill={i < aiResult.scores.trust ? "#14b8a6" : "none"} stroke={i < aiResult.scores.trust ? "#14b8a6" : "#475569"} />)}
                                                    </div>
                                                </div>
                                                <div className="bg-slate-800/50 p-4 rounded-2xl text-center">
                                                    <div className="text-xs font-bold text-slate-500 mb-1 uppercase">觉 (Insight)</div>
                                                    <div className="flex justify-center gap-1">
                                                        {Array.from({ length: 5 }).map((_, i) => <Star key={i} size={14} fill={i < aiResult.scores.insight ? "#a855f7" : "none"} stroke={i < aiResult.scores.insight ? "#a855f7" : "#475569"} />)}
                                                    </div>
                                                </div>
                                                <div className="bg-slate-800/50 p-4 rounded-2xl text-center">
                                                    <div className="text-xs font-bold text-slate-500 mb-1 uppercase">表 (Exp)</div>
                                                    <div className="flex justify-center gap-1">
                                                        {Array.from({ length: 5 }).map((_, i) => <Star key={i} size={14} fill={i < aiResult.scores.expression ? "#f59e0b" : "none"} stroke={i < aiResult.scores.expression ? "#f59e0b" : "#475569"} />)}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="p-8 bg-slate-800/30 border border-slate-700/50 rounded-3xl mb-10 relative">
                                                <BrainCircuit className="absolute -top-4 -left-4 text-teal-400 opacity-20" size={48} />
                                                <h4 className="text-teal-400 font-black mb-4 flex items-center gap-2 italic uppercase tracking-tighter bg-teal-400/10 px-3 py-1 rounded-lg w-fit">
                                                    船长寄语 / Soul Feedback
                                                </h4>
                                                <p className="text-xl text-slate-200 leading-relaxed italic">
                                                    "{aiResult.feedback}"
                                                </p>
                                            </div>

                                            <button
                                                onClick={nextLevel}
                                                className="w-full py-5 bg-white text-slate-900 rounded-2xl font-black text-xl hover:bg-slate-200 transition-all flex items-center justify-center gap-3"
                                            >
                                                开启下一阶段：{stack[(currentFunctionIndex + 1) % stack.length]} <ArrowRight size={24} />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Hidden Canvas for Frame Capture */}
            <canvas ref={canvasRef} width="300" height="300" className="hidden" />
        </div>
    );
};

export default TaskSolo;

