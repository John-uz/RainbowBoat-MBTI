
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, RefreshCw, BrainCircuit, Sparkles, Mic, Video, VideoOff, CheckCircle, Star, ArrowRight, Target, Layers, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import { generateAllTaskOptions, analyzeSoloExecution, analyzeVisualAspect } from '../services/geminiService';
import { Player, TaskOption, TASK_CATEGORIES_CONFIG, MBTI_STACKS, JUNG_FUNCTIONS, MBTI_TYPES } from '../types';
import { startSpeechRecognition, stopSpeechRecognition, isSpeechRecognitionSupported } from '../utils/speechRecognition';
import { startAudioMonitoring, stopAudioMonitoring } from '../utils/audioAnalyzer';

interface Props {
    onBack: () => void;
    isMobile: boolean;
    isDarkMode: boolean;
}

const TaskSolo: React.FC<Props> = ({ onBack, isMobile, isDarkMode }) => {
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

    // Completed tasks tracking
    const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());

    // Mobile Carousel State
    const [carouselIndex, setCarouselIndex] = useState(0);

    // Camera States
    const [isCameraEnabled, setIsCameraEnabled] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

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
        position: 0, previousPosition: null, stackIndex: currentFunctionIndex, skipUsedCount: 0, color: 'teal'
    };

    const fetchTasks = async (funcId: string, type: string) => {
        setLoading(true);
        setCurrentTask(null);
        setPhase('SELECTING');
        setCompletedTasks(new Set());
        setCarouselIndex(0);
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
                startSpeechRecognition((text) => setTranscription(prev => prev + " " + text), () => setIsListening(false));
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
    };

    const handleCompleteTask = async () => {
        setPhase('FEEDBACK');
        setLoading(true);

        // Mark task as completed
        if (currentTask) {
            setCompletedTasks(prev => new Set([...prev, currentTask.category]));
        }

        let visualData = "";
        if (isCameraEnabled && videoRef.current && canvasRef.current && currentTask) {
            const ctx = canvasRef.current.getContext('2d');
            if (ctx) {
                ctx.drawImage(videoRef.current, 0, 0, 300, 300);
                visualData = canvasRef.current.toDataURL('image/jpeg');
            }
        }

        const result = await analyzeSoloExecution(mockPlayer, currentTask!, transcription, visualData);
        setAiResult(result);
        setLoading(false);
    };

    const retryCurrentFunction = () => {
        setAiResult(null);
        setCurrentTask(null);
        setPhase('SELECTING');
        setCarouselIndex(0);
    };

    const nextLevel = () => {
        const nextIdx = (currentFunctionIndex + 1) % stack.length;
        setCurrentFunctionIndex(nextIdx);
        setAiResult(null);
        setCurrentTask(null);
        setCompletedTasks(new Set());
        setPhase('SELECTING');
        setCarouselIndex(0);
    };

    const taskList = tasks ? Object.entries(tasks) : [];
    const availableTasks = taskList.filter(([cat]) => !completedTasks.has(cat));

    return (
        <div className="h-screen bg-stone-50 dark:bg-slate-950 text-slate-800 dark:text-white flex flex-col overflow-hidden transition-colors duration-300">
            {/* Background Glow */}
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/5 dark:bg-purple-500/10 rounded-full blur-[120px] pointer-events-none" />

            {/* Header */}
            <header className="shrink-0 flex items-center justify-between p-4 md:p-6 relative z-10">
                <button onClick={onBack} className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-teal-600 dark:hover:text-white transition group font-medium">
                    <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                    <span className={isMobile ? 'hidden' : ''}>返回 Hub</span>
                </button>

                <div className="flex items-center gap-2 md:gap-4 bg-white dark:bg-slate-900/50 p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center gap-2 px-2 md:px-3">
                        <Layers size={14} className="text-teal-500 dark:text-teal-400" />
                        <select
                            value={selectedType}
                            onChange={(e) => {
                                setSelectedType(e.target.value);
                                setCurrentFunctionIndex(0);
                            }}
                            className="bg-transparent text-sm font-black outline-none cursor-pointer text-slate-700 dark:text-slate-200"
                        >
                            {MBTI_TYPES.map(t => (
                                <option key={t} value={t} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white">{t}</option>
                            ))}
                        </select>
                    </div>
                    {!isMobile && (
                        <>
                            <div className="h-5 w-px bg-slate-200 dark:bg-slate-800" />
                            <button
                                onClick={() => setIsCameraEnabled(!isCameraEnabled)}
                                className={`p-1.5 rounded-lg transition-all ${isCameraEnabled ? 'bg-teal-500/10 dark:bg-teal-500/20 text-teal-600 dark:text-teal-400' : 'bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                            >
                                {isCameraEnabled ? <Video size={16} /> : <VideoOff size={16} />}
                            </button>
                        </>
                    )}
                    <button onClick={() => fetchTasks(currentFunction, selectedType)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition text-slate-400 dark:text-slate-500">
                        <RefreshCw size={16} className={loading && phase === 'SELECTING' ? 'animate-spin' : ''} />
                    </button>
                </div>
            </header>

            {/* Level Progress */}
            <div className="shrink-0 flex items-center justify-center gap-1 md:gap-2 px-4 pb-4 overflow-x-auto no-scrollbar relative z-10 transition-all">
                {stack.map((func, idx) => {
                    const isCurrent = idx === currentFunctionIndex;
                    const isCompleted = idx < currentFunctionIndex;
                    return (
                        <div key={func} className="flex items-center gap-1 md:gap-2">
                            <div
                                className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-[10px] md:text-xs font-black transition-all ${isCurrent ? 'bg-teal-500 text-white scale-110 shadow-lg shadow-teal-500/30' :
                                    isCompleted ? 'bg-teal-50 dark:bg-slate-800 text-teal-600 dark:text-teal-400 border border-teal-200 dark:border-teal-500/30' :
                                        'bg-white dark:bg-slate-900 text-slate-300 dark:text-slate-700 border border-slate-200 dark:border-slate-800'
                                    }`}
                            >
                                {func}
                            </div>
                            {idx < stack.length - 1 && (
                                <div className={`w-4 md:w-6 h-px ${idx < currentFunctionIndex ? 'bg-teal-500/50' : 'bg-slate-200 dark:bg-slate-800'}`} />
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Main Content */}
            <main className="flex-1 flex flex-col items-center justify-center px-4 overflow-hidden relative z-10">
                <AnimatePresence mode="wait">
                    {phase === 'SELECTING' && (
                        <motion.div
                            key="selecting"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="w-full max-w-4xl flex flex-col items-center"
                        >
                            {/* Title */}
                            <div className="text-center mb-6">
                                <span className="px-3 py-1 bg-teal-500/10 dark:bg-teal-500/10 border border-teal-200 dark:border-teal-500/20 rounded-full text-teal-600 dark:text-teal-400 text-[10px] md:text-xs font-black tracking-widest uppercase mb-2 inline-block">
                                    LEVEL {currentFunctionIndex + 1}: {functionInfo?.name}
                                </span>
                                <h2 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-black text-slate-800 dark:text-white`}>选择进阶挑战</h2>
                            </div>

                            {loading ? (
                                <div className={`${isMobile ? 'flex flex-col' : 'grid grid-cols-2'} gap-4 w-full h-[60vh]`}>
                                    {Array.from({ length: 4 }).map((_, i) => (
                                        <div key={i} className="flex-1 bg-white dark:bg-slate-900/50 rounded-3xl border border-slate-100 dark:border-slate-800 animate-pulse" />
                                    ))}
                                </div>
                            ) : (
                                <div className="w-full flex-1 flex flex-col justify-center">
                                    {isMobile ? (
                                        /* Mobile: Carousel - Center Single Card */
                                        <div className="w-full relative px-10">
                                            <div className="overflow-hidden py-10">
                                                <motion.div
                                                    className="flex"
                                                    animate={{ x: `-${carouselIndex * 100}%` }}
                                                    transition={{ type: 'spring', stiffness: 200, damping: 25 }}
                                                >
                                                    {taskList.map(([cat, task]) => {
                                                        const config = TASK_CATEGORIES_CONFIG[cat as keyof typeof TASK_CATEGORIES_CONFIG];
                                                        const isCompleted = completedTasks.has(cat);
                                                        return (
                                                            <div key={cat} className="w-full shrink-0 px-4">
                                                                <button
                                                                    onClick={() => !isCompleted && handleStartChallenge(task)}
                                                                    disabled={isCompleted}
                                                                    className={`w-full aspect-[4/5] p-8 rounded-[3rem] border-4 ${isCompleted ? 'border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40' : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 shadow-2xl'} text-left transition-all relative overflow-hidden flex flex-col justify-between`}
                                                                >
                                                                    <div className={`absolute inset-0 bg-white/60 dark:bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center z-10 transition-opacity duration-500 ${isCompleted ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                                                                        <div className="w-16 h-16 rounded-full bg-teal-500 text-white flex items-center justify-center mb-4 shadow-lg shadow-teal-500/20">
                                                                            <CheckCircle size={32} />
                                                                        </div>
                                                                        <span className="text-teal-600 dark:text-teal-400 font-black tracking-widest text-[10px]">已征服该领域</span>
                                                                    </div>

                                                                    <div className="relative z-10">
                                                                        <div className="text-5xl mb-6">{config.icon}</div>
                                                                        <div className="px-3 py-1 bg-slate-100 dark:bg-white/10 rounded-full text-[10px] font-black uppercase text-slate-500 dark:text-slate-300 tracking-[0.2em] mb-4 inline-block">{config.name}</div>
                                                                        <h3 className="text-2xl font-black mb-3 text-slate-800 dark:text-white leading-tight">{task.title}</h3>
                                                                        <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed font-bold opacity-80">{task.description}</p>
                                                                    </div>

                                                                    <div className="relative z-10 flex items-center gap-2 text-teal-500 font-black text-xs">
                                                                        START CHALLENGE <ArrowRight size={14} />
                                                                    </div>
                                                                </button>
                                                            </div>
                                                        );
                                                    })}
                                                </motion.div>
                                            </div>

                                            {/* Navigation Buttons */}
                                            <button
                                                onClick={() => setCarouselIndex(Math.max(0, carouselIndex - 1))}
                                                className={`absolute left-0 top-1/2 -translate-y-1/2 p-3 z-20 bg-white dark:bg-slate-800 rounded-full shadow-xl border border-slate-100 dark:border-slate-700 transition-all ${carouselIndex === 0 ? 'opacity-0 scale-50' : 'opacity-100 scale-100'}`}
                                            >
                                                <ChevronLeft size={24} />
                                            </button>
                                            <button
                                                onClick={() => setCarouselIndex(Math.min(taskList.length - 1, carouselIndex + 1))}
                                                className={`absolute right-0 top-1/2 -translate-y-1/2 p-3 z-20 bg-white dark:bg-slate-800 rounded-full shadow-xl border border-slate-100 dark:border-slate-700 transition-all ${carouselIndex === taskList.length - 1 ? 'opacity-0 scale-50' : 'opacity-100 scale-100'}`}
                                            >
                                                <ChevronRight size={24} />
                                            </button>

                                            <div className="flex justify-center gap-2 mt-2">
                                                {taskList.map((_, i) => (
                                                    <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === carouselIndex ? 'w-8 bg-teal-500' : 'w-1.5 bg-slate-200 dark:bg-slate-800'}`} />
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        /* Desktop: 2x2 Grid - Strict Single Screen */
                                        <div className="grid grid-cols-2 gap-8 w-full max-w-5xl mx-auto h-[60vh]">
                                            {taskList.map(([cat, task]) => {
                                                const config = TASK_CATEGORIES_CONFIG[cat as keyof typeof TASK_CATEGORIES_CONFIG];
                                                const isCompleted = completedTasks.has(cat);
                                                return (
                                                    <motion.button
                                                        key={cat}
                                                        whileHover={isCompleted ? {} : { scale: 1.02, y: -8, boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.15)' }}
                                                        onClick={() => !isCompleted && handleStartChallenge(task)}
                                                        disabled={isCompleted}
                                                        className={`p-10 rounded-[3.5rem] border-2 bg-white dark:bg-slate-900/50 text-left transition-all group relative overflow-hidden flex flex-col justify-between ${isCompleted ? 'border-slate-100 dark:border-slate-800 opacity-40 grayscale' : 'border-slate-200 dark:border-slate-800 hover:border-teal-500/50 shadow-lg hover:shadow-2xl active:scale-95'}`}
                                                    >
                                                        {isCompleted && (
                                                            <div className="absolute inset-0 bg-white/40 dark:bg-slate-950/60 backdrop-blur-sm flex flex-col items-center justify-center z-20">
                                                                <div className="w-16 h-16 rounded-full bg-teal-500 text-white flex items-center justify-center mb-2">
                                                                    <CheckCircle size={32} />
                                                                </div>
                                                                <span className="text-teal-600 dark:text-teal-400 font-black tracking-widest text-xs">已完成</span>
                                                            </div>
                                                        )}

                                                        <div className="relative z-10">
                                                            <div className="flex items-center gap-4 mb-6">
                                                                <div className="text-5xl group-hover:scale-125 transition-transform duration-500">{config.icon}</div>
                                                                <div className="px-3.5 py-1.5 bg-slate-100 dark:bg-white/5 rounded-full text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400 font-mono shadow-inner">{config.name}</div>
                                                            </div>
                                                            <h3 className="text-3xl font-black mb-4 text-slate-800 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors leading-tight">{task.title}</h3>
                                                            <p className="text-slate-500 dark:text-slate-400 text-lg leading-relaxed font-bold opacity-80 group-hover:opacity-100 transition-opacity line-clamp-3">{task.description}</p>
                                                        </div>

                                                        <div className="relative z-10 flex items-center gap-2 text-teal-500 font-black text-xs opacity-0 group-hover:opacity-100 transition-all translate-y-4 group-hover:translate-y-0">
                                                            START CHALLENGE <ArrowRight size={18} />
                                                        </div>

                                                        {/* Abstract background shape */}
                                                        <div className={`absolute -bottom-12 -right-12 w-48 h-48 rounded-full bg-gradient-to-br ${isCompleted ? 'from-slate-100 to-slate-200' : 'from-teal-500/5 to-blue-500/5'} blur-2xl group-hover:scale-150 transition-transform duration-700 pointer-events-none`} />
                                                    </motion.button>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}

                        </motion.div>
                    )}

                    {phase === 'EXECUTING' && currentTask && (
                        <motion.div
                            key="executing"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden p-6 md:p-10"
                        >
                            <div className="relative z-10">
                                <div className="flex justify-between items-start mb-4 md:mb-6">
                                    <div>
                                        <h2 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-black mb-2 text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-blue-600`}>
                                            {currentTask.title}
                                        </h2>
                                        <div className="flex gap-2 flex-wrap">
                                            <span className="px-3 py-1 bg-teal-50 dark:bg-teal-900/20 rounded-full text-[10px] font-black text-teal-600 dark:text-teal-400 flex items-center gap-1.5 border border-teal-100 dark:border-teal-500/20">
                                                <Target size={12} /> {functionInfo?.name}
                                            </span>
                                            <span className="px-3 py-1 bg-amber-50 dark:bg-amber-900/20 rounded-full text-[10px] font-black text-amber-600 dark:text-amber-400 flex items-center gap-1.5 border border-amber-100 dark:border-amber-500/20">
                                                <Sparkles size={12} /> {currentTask.scoreType}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 flex flex-col items-center justify-center shadow-inner">
                                        <span className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase">倒计时</span>
                                        <span className="text-xl md:text-2xl font-black text-slate-700 dark:text-slate-200">{timer}s</span>
                                    </div>
                                </div>

                                <p className={`${isMobile ? 'text-base' : 'text-lg'} text-slate-600 dark:text-slate-300 leading-relaxed italic mb-6 font-medium`}>
                                    "{currentTask.description}"
                                </p>

                                <div className="flex-1 flex flex-col gap-4 min-h-0">
                                    <div className="relative flex-1 bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 min-h-[120px] md:min-h-[150px] shadow-inner">
                                        {isListening && <div className="absolute top-4 right-4 flex items-center gap-1.5 text-red-500 animate-pulse text-[10px] font-black uppercase"><div className="w-1.5 h-1.5 bg-red-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.5)]" /> 正在录制</div>}
                                        <textarea
                                            className="w-full h-full bg-transparent resize-none outline-none text-base md:text-lg leading-relaxed placeholder:text-slate-300 dark:placeholder:text-slate-800 font-bold text-slate-700 dark:text-slate-200"
                                            placeholder="请开始表达..."
                                            value={transcription}
                                            onChange={(e) => setTranscription(e.target.value)}
                                        />
                                        <div className="absolute bottom-4 left-4 right-4 h-8 flex items-end gap-1 pointer-events-none">
                                            {Array.from({ length: 40 }).map((_, i) => (
                                                <div key={i} className="flex-1 bg-teal-500/30 dark:bg-teal-500/20 rounded-t-full transition-all duration-150" style={{ height: `${Math.random() * micVolume * 100}%` }} />
                                            ))}
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleCompleteTask}
                                        className="w-full py-4 md:py-5 bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700 rounded-2xl font-black text-white shadow-xl shadow-teal-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3 text-lg"
                                    >
                                        完成挑战 <ArrowRight size={22} className="group-hover:translate-x-1 transition-transform" />
                                    </button>
                                </div>
                            </div>

                            {/* Camera (Desktop Only) */}
                            {isCameraEnabled && !isMobile && (
                                <div className="absolute top-10 right-10 w-48 h-36 rounded-2xl border-2 border-white dark:border-slate-800 shadow-2xl overflow-hidden group">
                                    <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" />
                                    <div className="absolute inset-0 bg-teal-500/10 pointer-events-none" />
                                    <div className="absolute bottom-2 left-2 flex items-center gap-1.5 text-white font-black text-[8px] uppercase tracking-widest drop-shadow-md">
                                        <BrainCircuit size={10} /> AI 观测舱
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
                            className="w-full max-w-2xl overflow-hidden rounded-[3rem] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl"
                        >
                            {loading ? (
                                <div className="p-16 flex flex-col items-center justify-center text-center">
                                    <div className="w-16 h-16 mb-8 relative">
                                        <div className="absolute inset-0 border-4 border-teal-500/10 rounded-full"></div>
                                        <div className="absolute inset-0 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
                                    </div>
                                    <h2 className="text-2xl font-black mb-2 text-slate-800 dark:text-white">船长深度解析中...</h2>
                                    <p className="text-slate-500 dark:text-slate-400 font-medium">正在对你的认知功能表达进行人格共振分析</p>
                                </div>
                            ) : aiResult && (
                                <div className="flex flex-col">
                                    <div className={`${isMobile ? 'p-8' : 'p-12'} bg-gradient-to-br from-teal-500/5 to-blue-500/5 dark:from-teal-500/10 dark:to-blue-500/10 border-b border-slate-100 dark:border-slate-800 text-center relative overflow-hidden`}>
                                        <div className="flex justify-center mb-6">
                                            <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-3xl rotate-12 flex items-center justify-center shadow-xl border border-slate-100 dark:border-slate-700 scale-110">
                                                <div className="-rotate-12 bg-teal-500 rounded-xl p-2.5">
                                                    <CheckCircle size={24} className="text-white" />
                                                </div>
                                            </div>
                                        </div>
                                        <h2 className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-black mb-2 text-slate-800 dark:text-white tracking-tight`}>挑战大获成功！</h2>
                                        <p className="text-teal-600 dark:text-teal-400 font-black uppercase tracking-[0.3em] text-[10px]">Cognitive Evolution Achieved</p>
                                    </div>

                                    <div className={`${isMobile ? 'p-6' : 'p-10'}`}>
                                        {/* Scores */}
                                        <div className="grid grid-cols-3 gap-4 mb-8">
                                            {[
                                                { label: '信', score: aiResult.scores.trust, color: 'text-teal-500', fill: '#14b8a6' },
                                                { label: '觉', score: aiResult.scores.insight, color: 'text-purple-500', fill: '#a855f7' },
                                                { label: '表', score: aiResult.scores.expression, color: 'text-amber-500', fill: '#f59e0b' }
                                            ].map((s, idx) => (
                                                <div key={idx} className="bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60 p-4 rounded-2xl text-center shadow-sm">
                                                    <div className="text-[10px] font-black text-slate-400 dark:text-slate-500 mb-2 uppercase tracking-widest">{s.label}</div>
                                                    <div className="flex justify-center gap-1">
                                                        {Array.from({ length: 5 }).map((_, i) => (
                                                            <Star key={i} size={14} fill={i < s.score ? s.fill : "none"} stroke={i < s.score ? s.fill : "#cbd5e1"} strokeWidth={i < s.score ? 1 : 2} />
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Feedback */}
                                        <div className="p-6 md:p-8 bg-slate-50/80 dark:bg-slate-800/30 border border-slate-200/50 dark:border-slate-700/50 rounded-2xl mb-8 relative">
                                            <div className="absolute top-0 right-0 p-4 opacity-5 dark:opacity-10 pointer-events-none">
                                                <BrainCircuit size={64} />
                                            </div>
                                            <h4 className="text-slate-400 dark:text-teal-400/80 font-black mb-4 flex items-center gap-2 text-xs uppercase tracking-widest">
                                                <BrainCircuit size={16} /> 船长全方位观察
                                            </h4>
                                            <p className={`${isMobile ? 'text-sm' : 'text-base'} text-slate-700 dark:text-slate-200 leading-relaxed font-bold italic`}>
                                                "{aiResult.feedback}"
                                            </p>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex flex-col gap-4">
                                            {availableTasks.length > 0 && (
                                                <button
                                                    onClick={retryCurrentFunction}
                                                    className="w-full py-4 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-white rounded-2xl font-black transition-all flex items-center justify-center gap-3 border-2 border-slate-100 dark:border-slate-700 shadow-sm"
                                                >
                                                    <RotateCcw size={18} /> 继续挑战 {currentFunction} ({availableTasks.length}个可选)
                                                </button>
                                            )}
                                            <button
                                                onClick={nextLevel}
                                                className="w-full py-5 bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700 text-white rounded-2xl font-black shadow-xl shadow-teal-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3 text-lg"
                                            >
                                                进入下一阶段：{stack[(currentFunctionIndex + 1) % stack.length]} <ArrowRight size={22} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

            {/* Hidden Canvas for Frame Capture */}
            <canvas ref={canvasRef} width="300" height="300" className="hidden" />
        </div>
    );
};

export default TaskSolo;
