import React, { useState, useEffect, useRef } from 'react';
import { GameMode, GameState, Player, JUNG_FUNCTIONS, MBTI_TYPES, MBTI_STACKS, BoardTile, getHexNeighbors, getGridNeighbors, BOT_NAMES, TASK_CATEGORIES_CONFIG, ScoreModifier, SpecialAbility, MBTI_GROUPS, MBTI_CHARACTERS } from './types';
import Onboarding from './components/Onboarding';
import GameBoard from './components/GameBoard';
import GameReport from './components/GameReport';
import {
    generateAllTaskOptions,
    generateProfessionalReport,
    analyzeVisualAspect,
    generateQuickReport,
    MBTIAnalysisResult
} from "./services/geminiService";
import { speak } from './utils/tts';
import { startSpeechRecognition, stopSpeechRecognition, isSpeechRecognitionSupported } from './utils/speechRecognition';
import { Map as MapIcon, LogOut, Music, VideoOff, Dices, ChevronRight, ChevronLeft, BrainCircuit, Heart, Lightbulb, Mic, CircleHelp, X, Timer, CheckCircle, SkipForward, Users, RefreshCw, Star, Play, Power, Compass, Footprints, Loader, Zap, Repeat, Divide, Copy, Move, UserPlus, UsersRound, Settings, Flag, Radio, Sun, Moon, Volume2, Eye, ArrowRight, Ship } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AIConfigModal from './components/AIConfigModal';
import MBTIHub from './components/MBTIHub';
import TaskSolo from './components/TaskSolo';
import LZString from 'lz-string';
import { startAudioMonitoring, stopAudioMonitoring } from './utils/audioAnalyzer';

const COLORS = [
    '#ef4444', '#f97316', '#eab308', '#84cc16', '#06b6d4', '#8b5cf6', '#d946ef', '#f43f5e', '#be123c', '#0f766e',
    '#1d4ed8', '#4338ca', '#a21caf', '#be185d', '#881337', '#7c2d12'
];
const getRandomMBTI = () => MBTI_TYPES[Math.floor(Math.random() * MBTI_TYPES.length)];

// 3D Dice Component
const Dice3D: React.FC<{ value: number | null, rolling: boolean }> = ({ value, rolling }) => {
    return (
        <div className="relative w-24 h-24 perspective-[800px] flex items-center justify-center pointer-events-none z-20">
            <style>{`
                .dice-wrap { width: 60px; height: 60px; position: relative; transform-style: preserve-3d; }
                .dice-wrap.spinning { animation: spin3d 0.5s infinite linear; }
                @keyframes spin3d {
                    0% { transform: rotateX(0deg) rotateY(0deg) rotateZ(0deg); }
                    100% { transform: rotateX(360deg) rotateY(360deg) rotateZ(360deg); }
                }
                .face { position: absolute; width: 60px; height: 60px; background: rgba(20, 184, 166, 0.9); border: 2px solid #fff; display:flex; align-items:center; justify-content:center; font-weight:bold; font-size: 24px; color: #fff; box-shadow: 0 0 15px rgba(45,212,191,0.5); border-radius: 8px; }
                .face:nth-child(1) { transform: rotateY(0deg) translateZ(30px); }
                .face:nth-child(2) { transform: rotateY(90deg) translateZ(30px); }
                .face:nth-child(3) { transform: rotateY(180deg) translateZ(30px); }
                .face:nth-child(4) { transform: rotateY(-90deg) translateZ(30px); }
                .face:nth-child(5) { transform: rotateX(90deg) translateZ(30px); }
                .face:nth-child(6) { transform: rotateX(-90deg) translateZ(30px); }
            `}</style>

            <div className={`dice-wrap ${rolling ? 'spinning' : ''} transition-all duration-500`}>
                {[1, 2, 3, 4, 8, 6].map((n, i) => <div key={i} className="face">{rolling ? '?' : (i === 0 ? value : n)}</div>)}
            </div>
        </div>
    );
};

// Peer Scoring Modal
// Mic Check Component - Concept: Ocean Wave Line
const MicCheck: React.FC = () => {
    const [volume, setVolume] = useState(0);
    const [enabled, setEnabled] = useState(false);

    useEffect(() => {
        const start = () => {
            setEnabled(true);
            startAudioMonitoring((vol) => setVolume(vol));
        };
        start();
        return () => {
            stopAudioMonitoring();
            setEnabled(false);
        };
    }, []);

    // Generate path for wave
    // We'll make a simple sine wave that amplifies with volume
    // points: 0 to 100
    const points = [];
    for (let i = 0; i <= 100; i++) {
        const x = i;
        // Base wave + volume reaction
        // If volume is high, amplitude is high.
        // We add a time-based shift for animation if we had a rAF loop, but here we rely on React renders from volume updates mostly?
        // Actually volume updates frequent enough to animate.
        // Let's rely on CSS animation for the flow, and JS for amplitude.
        // Since we can't easily sync JS loop with React render for smooth wave without canvas, 
        // let's do a CSS-based wave that scales Y based on volume variable.
    }

    // New Approach: CSS Wave with dynamic scale-y
    // We will place this BEHIND or AROUND the Title.
    // The user asked for "Line traversing the page above Rainbow Boat title".

    return (
        <div className="absolute top-0 left-0 right-0 h-40 pointer-events-none flex items-center justify-center overflow-hidden opacity-40 z-0">
            {/* Dynamic Wave Container */}
            {/* We use multiple lines for a "Sound Wave" aesthetic */}
            <div className="relative w-full h-full flex items-center justify-center gap-1.5 px-4">
                {Array.from({ length: 96 }).map((_, i) => {
                    // Calculate a "natural" wave shape (sine window) so edges are small, center is big
                    const x = i / 96; // 0 to 1
                    const window = Math.sin(x * Math.PI); // 0 -> 1 -> 0

                    // Reaction to volume:
                    // The volume controls the overall height multiplier.
                    // To make it look "alive" even when silence, we add a base height.
                    // But user wants it to represent Sound Size.

                    // To simulate "Wave" motion without complex JS, we can use CSS animation delays.

                    return (
                        <div
                            key={i}
                            className={`w-1 rounded-full transition-all duration-75 ${volume > 0.05 ? 'bg-teal-400 shadow-[0_0_10px_#2dd4bf]' : 'bg-slate-500/20'}`}
                            style={{
                                height: `${Math.max(4, (volume * 200 * window) + (Math.random() * 10 * window))}px`,
                                // If we want it to look like a line, we might connect them, but bars are a safe style specifically for "Voice"
                                // User asked for "Wave Line". Let's try to make it look like a connected thread?
                                // Actually, thin bars very close together look like a digital wave.
                            }}
                        />
                    )
                })}
            </div>
        </div>
    );
};

const PeerReviewModal: React.FC<{
    reviewer: Player;
    actor: Player;
    onSubmit: (score: number) => void;
    hasHighEnergyBonus: boolean;
}> = ({ reviewer, actor, onSubmit, hasHighEnergyBonus }) => {
    const [rating, setRating] = useState(5);

    return (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md">
            <div className="bg-slate-800 p-8 rounded-3xl border border-slate-700 shadow-2xl max-w-md w-full text-center">
                <div className="flex justify-center mb-4">
                    <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-slate-500 relative">
                        {reviewer.avatar.startsWith('data:') ? <img src={reviewer.avatar} className="w-full h-full object-cover" /> : <div className="bg-slate-700 w-full h-full flex items-center justify-center font-bold text-2xl">{reviewer.name[0]}</div>}
                    </div>
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">评分环节</h3>
                <p className="text-slate-400 mb-6"><strong>{reviewer.name}</strong>，请评价 <strong>{actor.name}</strong> 的表现</p>

                {hasHighEnergyBonus && (
                    <div className="mb-6 p-3 bg-red-500/20 border border-red-500/50 rounded-xl animate-pulse">
                        <div className="flex items-center justify-center gap-2 text-red-500 font-bold">
                            <Zap fill="currentColor" size={20} /> 全场沸腾！氛围加成已激活
                        </div>
                    </div>
                )}

                <div className="flex justify-center gap-2 mb-8">
                    {[1, 2, 3, 4, 5].map(star => (
                        <button key={star} onClick={() => setRating(star)} className="transition transform hover:scale-110">
                            <Star size={40} fill={star <= rating ? "#fbbf24" : "none"} stroke={star <= rating ? "#fbbf24" : "#475569"} />
                        </button>
                    ))}
                </div>

                <div className="text-xl font-bold text-yellow-500 mb-8">{rating} 星 - {rating === 5 ? "直击灵魂" : rating >= 3 ? "真诚分享" : "继续加油"}</div>

                <button onClick={() => onSubmit(rating)} className="w-full py-4 bg-gradient-to-r from-teal-500 to-blue-600 rounded-xl font-bold text-white text-lg shadow-lg">
                    提交评分
                </button>
            </div>
        </motion.div>
    )
}

const generateMap = (mode: GameMode): BoardTile[] => {
    let tiles: BoardTile[] = [];
    let index = 0;

    const getRandomModifier = (): ScoreModifier => {
        const rand = Math.random();
        // Adjusted probabilities: 50% Normal, 50% Special
        if (rand < 0.5) return 'NORMAL';
        if (rand < 0.7) return 'DOUBLE';
        if (rand < 0.8) return 'HALF';
        if (rand < 0.9) return 'CLONE';
        return 'TRANSFER';
    };

    if (mode === GameMode.JUNG_8) {
        // ... (JUNG_8 generation remains same)
        const FUNCTION_IDS = ['Te', 'Ti', 'Fe', 'Fi', 'Se', 'Si', 'Ne', 'Ni'];
        const MAP_RADIUS = 4;

        let deck: string[] = [];
        FUNCTION_IDS.forEach(f => { for (let k = 0; k < 7; k++) deck.push(f); });
        for (let k = 0; k < 4; k++) deck.push('?');

        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }

        const specialAbilitiesDeck: SpecialAbility[] = ['FREEDOM', 'SUBSTITUTE', 'COMPANION', 'FREEDOM'];

        for (let q = -MAP_RADIUS; q <= MAP_RADIUS; q++) {
            const r1 = Math.max(-MAP_RADIUS, -q - MAP_RADIUS);
            const r2 = Math.min(MAP_RADIUS, -q + MAP_RADIUS);
            for (let r = r1; r <= r2; r++) {
                const isCenter = q === 0 && r === 0;
                let fid = isCenter ? '?' : (deck.pop() || 'Te');

                let mod: ScoreModifier = 'NORMAL';
                let special: SpecialAbility = 'NONE';

                if (fid === '?') {
                    if (isCenter) special = 'FREEDOM';
                    else special = specialAbilitiesDeck.pop() || 'FREEDOM';
                } else {
                    mod = getRandomModifier();
                }

                tiles.push({
                    index: index++,
                    functionId: fid,
                    modifier: mod,
                    specialAbility: special,
                    q, r
                });
            }
        }
    } else {
        // MBTI 16 Mode: "Tian" (田) Shape, 33 Tiles.
        const GROUP_LAYOUTS = [
            {
                id: 'NF', // Top-Left Quadrant
                types: MBTI_GROUPS['外交家 (NF)'].types,
                coords: [
                    { q: 0, r: 0 }, { q: 1, r: 0 }, { q: 2, r: 0 }, // Top Edge Left
                    { q: 0, r: 1 }, { q: 0, r: 2 },             // Left Edge Top
                    { q: 0, r: 3 }, { q: 1, r: 3 }, { q: 2, r: 3 }  // Left Spine (Mid Row Left)
                ]
            },
            {
                id: 'NT', // Top-Right Quadrant
                types: MBTI_GROUPS['分析家 (NT)'].types,
                coords: [
                    { q: 6, r: 0 }, { q: 5, r: 0 }, { q: 4, r: 0 }, // Top Edge Right
                    { q: 6, r: 1 }, { q: 6, r: 2 },             // Right Edge Top
                    { q: 3, r: 0 }, { q: 3, r: 1 }, { q: 3, r: 2 }  // Top Spine (Mid Col Top)
                ]
            },
            {
                id: 'SP', // Bottom-Right Quadrant
                types: MBTI_GROUPS['探险家 (SP)'].types,
                coords: [
                    { q: 6, r: 6 }, { q: 5, r: 6 }, { q: 4, r: 6 }, // Bot Edge Right
                    { q: 6, r: 5 }, { q: 6, r: 4 },             // Right Edge Bot
                    { q: 6, r: 3 }, { q: 5, r: 3 }, { q: 4, r: 3 }  // Right Spine (Mid Row Right)
                ]
            },
            {
                id: 'SJ', // Bottom-Left Quadrant
                types: MBTI_GROUPS['守护者 (SJ)'].types,
                coords: [
                    { q: 0, r: 6 }, { q: 1, r: 6 }, { q: 2, r: 6 }, // Bot Edge Left
                    { q: 0, r: 5 }, { q: 0, r: 4 },             // Left Edge Bot
                    { q: 3, r: 6 }, { q: 3, r: 5 }, { q: 3, r: 4 }  // Bot Spine (Mid Col Bot)
                ]
            }
        ];

        // 1. Center Tile (Hub) at (3,3)
        tiles.push({
            index: index++,
            functionId: 'Hub',
            characterName: MBTI_CHARACTERS['Hub'],
            q: 3, r: 3, // Center of 7x7 grid
            zone: 'Hub',
            modifier: 'NORMAL',
            specialAbility: 'FREEDOM'
        });

        // 2. Quadrants
        GROUP_LAYOUTS.forEach(group => {
            // Prepare 8 types (4 types * 2 cards)
            let typeDeck: string[] = [];
            group.types.forEach(t => { typeDeck.push(t); typeDeck.push(t); });

            // Shuffle
            for (let i = typeDeck.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [typeDeck[i], typeDeck[j]] = [typeDeck[j], typeDeck[i]];
            }

            // Assign to coordinates
            group.coords.forEach((coord, i) => {
                const type = typeDeck[i] || 'INTJ';
                const charName = MBTI_CHARACTERS[type];

                tiles.push({
                    index: index++,
                    functionId: type,
                    characterName: charName,
                    q: coord.q,
                    r: coord.r,
                    zone: group.id,
                    modifier: getRandomModifier(),
                    specialAbility: 'NONE'
                });
            });
        });
    }
    return tiles;
};

function App() {
    const [board, setBoard] = useState<BoardTile[]>([]);
    const [validMoves, setValidMoves] = useState<number[]>([]);
    const [isSidebarMinimized, setIsSidebarMinimized] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(true);
    const [gameState, setGameState] = useState<GameState>({
        players: [],
        currentPlayerIndex: 0,
        gameMode: GameMode.JUNG_8,
        turn: 1,
        targetScore: 40,
        logs: [],
        phase: 'HUB',
        subPhase: 'IDLE',
        currentTile: null,
        selectedTask: null,
        activeModifier: 'NORMAL',
        activeSpecialAbility: 'NONE',
        remainingSteps: 0,
        sightRange: 1, // Default sight range
        helperId: null,
        scoreTargetPlayerId: null,
        sharedHelpUsedCount: 0,
        hasReselected: false,
        pregeneratedTasks: null,
        movementState: 'IDLE',
        diceValue: null,
        highestScore: 0,
        snapshots: [],
        startTime: Date.now(),
        peerReviewQueue: [],
        currentReviewerId: null,
        accumulatedRating: 0
    });

    const [isMobile, setIsMobile] = useState(false);

    const [isMusicPlaying, setIsMusicPlaying] = useState(false);
    const [taskTimer, setTaskTimer] = useState(0);
    const [reportData, setReportData] = useState<any>(null);
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [showStartBtn, setShowStartBtn] = useState(false);

    // New State for Config Modal
    const [showConfig, setShowConfig] = useState(false);

    // New State for Speech
    const [currentSpeechText, setCurrentSpeechText] = useState("");
    const [isListening, setIsListening] = useState(false);

    // Share Data State
    const [sharedReviewData, setSharedReviewData] = useState<any>(null);

    // Audio Analysis State
    const [micVolume, setMicVolume] = useState(0);
    const [highEnergyBonus, setHighEnergyBonus] = useState(false);

    // Host Tools
    const [isManualMode, setIsManualMode] = useState(false);
    const [isQuickTestMode, setIsQuickTestMode] = useState(false);

    // Multimodal Vision State
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
    const [visualEvidence, setVisualEvidence] = useState<string[]>([]);
    const [isCameraActive, setIsCameraActive] = useState(false);
    const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
    const [selectedVideoDeviceId, setSelectedVideoDeviceId] = useState<string>("");

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 1024);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // [Smart Move] For Mobile: Auto-move if only one option exists
    useEffect(() => {
        if (!isMobile || gameState.phase !== 'PLAYING' || gameState.movementState !== 'IDLE' || gameState.remainingSteps === 0) return;

        const currentPlayer = gameState.players[gameState.currentPlayerIndex];
        if (currentPlayer && !currentPlayer.isBot && validMoves.length === 1) {
            // Auto click the only valid tile after a short delay
            const timer = setTimeout(() => {
                handleTileClick(validMoves[0]);
            }, 800);
            return () => clearTimeout(timer);
        }
    }, [isMobile, validMoves, gameState.phase, gameState.movementState, gameState.remainingSteps]);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const data = params.get('share_data');
        if (data) {
            try {
                // Determine if it was compressed or just encoded
                // We will assume compressed for short URLs
                const decompressed = LZString.decompressFromEncodedURIComponent(data);
                if (decompressed) {
                    const parsed = JSON.parse(decompressed);
                    setSharedReviewData(parsed);
                }
            } catch (e) {
                console.error("Failed to parse shared data", e);
            }
        }
    }, []);

    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        audioRef.current = new Audio('https://cdn.pixabay.com/audio/2022/05/27/audio_1808fbf07a.mp3');
        audioRef.current.loop = true;
        audioRef.current.volume = 0.2;

        // Attempt play immediately, though browsers might block it until interaction
        // We handle the play call again in initGame
    }, []);

    // Audio Ducking: Lower volume when listening to speech to prevent feedback loop
    useEffect(() => {
        if (audioRef.current) {
            if (isMusicPlaying) {
                // Duck volume to 2% if listening, else 20%
                audioRef.current.volume = isListening ? 0.02 : 0.2;
            } else {
                audioRef.current.pause();
            }
        }
    }, [isListening, isMusicPlaying]);

    useEffect(() => {
        if (audioRef.current) {
            if (isMusicPlaying) {
                audioRef.current.play().catch(e => console.log("Audio autoplay blocked until interaction"));
            } else {
                audioRef.current.pause();
            }
        }
    }, [isMusicPlaying]);


    // Theme Management
    useEffect(() => {
        const html = document.documentElement;
        if (isDarkMode) {
            html.classList.add('dark');
        } else {
            html.classList.remove('dark');
        }
    }, [isDarkMode]);

    const toggleTheme = () => setIsDarkMode(!isDarkMode);

    // --- BOT AUTOMATION LOGIC ---
    useEffect(() => {
        if (gameState.phase !== 'PLAYING') return;

        const currentPlayer = gameState.players[gameState.currentPlayerIndex];
        // STRICT: Only Bots get automation. Humans must play manually.
        if (!currentPlayer || !currentPlayer.isBot) return;

        let timeoutId: NodeJS.Timeout;

        // 1. Start Turn (Roll Dice)
        if (gameState.subPhase === 'IDLE' && gameState.movementState === 'IDLE' && gameState.remainingSteps === 0) {
            // Bots should always roll automatically. Humans must click, unless testing mode (removed for prod).
            if (currentPlayer.isBot) {
                timeoutId = setTimeout(() => handleStartTurn(), 1500);
            }
        }

        // 2. Move Selection (After Roll)
        // 2. Move Selection (After Roll)
        if (gameState.movementState === 'IDLE' && gameState.remainingSteps > 0 && validMoves.length > 0) {
            // Only Bots auto-select random moves. Humans must click tiles.
            if (currentPlayer.isBot) {
                timeoutId = setTimeout(() => {
                    const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)];
                    handleTileClick(randomMove);
                }, 1500);
            }
        }

        // 3. Select Task Category
        if (gameState.subPhase === 'SELECTING_CARD') {
            timeoutId = setTimeout(() => {
                const categories: ('standard' | 'truth' | 'dare' | 'deep')[] = ['standard', 'truth', 'dare', 'deep'];
                const randomCat = categories[Math.floor(Math.random() * categories.length)];
                handleSelectCategory(randomCat);
            }, 2000);
        }

        // 4. Perform Task (Wait and Finish)
        if (gameState.subPhase === 'VIEWING_TASK') {
            timeoutId = setTimeout(() => {
                // Bots start task (without audio)
                handleStartTask();
                // Simulate performing task
                setTimeout(() => {
                    handleTaskDone();
                }, 3000);
            }, 2000);
        }

        // 5. Special Ability / Selection (Simple Random)
        if (['SELECTING_SCORE_TARGET', 'SELECTING_SUBSTITUTE', 'SELECTING_COMPANION', 'CHOOSING_HELPER'].includes(gameState.subPhase)) {
            timeoutId = setTimeout(() => {
                const others = gameState.players.filter(p => p.id !== currentPlayer.id);
                const randomTarget = others[Math.floor(Math.random() * others.length)];
                if (randomTarget) {
                    if (gameState.subPhase === 'SELECTING_SCORE_TARGET') handleScoreTargetSelect(randomTarget.id);
                    else if (gameState.subPhase === 'SELECTING_SUBSTITUTE') handleSubstituteSelect(randomTarget.id);
                    else if (gameState.subPhase === 'SELECTING_COMPANION') handleCompanionSelect(randomTarget.id);
                    else if (gameState.subPhase === 'CHOOSING_HELPER') handleChooseHelper(randomTarget.id);
                }
            }, 2000);
        }

        return () => clearTimeout(timeoutId);
    }, [gameState.phase, gameState.subPhase, gameState.movementState, gameState.remainingSteps, gameState.currentPlayerIndex, validMoves, isManualMode]);

    // Bot Reviewer Automation
    useEffect(() => {
        if (gameState.subPhase === 'PEER_REVIEW' && gameState.currentReviewerId) {
            const reviewer = gameState.players.find(p => p.id === gameState.currentReviewerId);
            if (reviewer && reviewer.isBot) {
                const timer = setTimeout(() => {
                    // Bot gives generous scores
                    handlePeerScoreSubmit(Math.random() > 0.3 ? 5 : 4);
                }, 1500);
                return () => clearTimeout(timer);
            }
        }
    }, [gameState.subPhase, gameState.currentReviewerId]);

    // --- LOGIC: NEXT STEP FINDER ---
    const calculateValidNextSteps = (player: Player, currentBoard: BoardTile[]): number[] => {
        const currentTile = currentBoard.find(t => t.index === player.position);
        if (!currentTile) return [];

        let neighbors: BoardTile[] = [];
        if (gameState.gameMode === GameMode.JUNG_8) {
            neighbors = getHexNeighbors(currentTile, currentBoard);
        } else {
            neighbors = getGridNeighbors(currentTile, currentBoard);
        }

        // Remove backwards move
        const forwardNeighbors = neighbors.filter(t => t.index !== player.previousPosition);

        if (gameState.movementState === 'TELEPORTING') {
            return currentBoard.filter(t => t.functionId !== 'Hub').map(t => t.index);
        }

        // MBTI 16 Mode: Just choose direction, no stack logic
        if (gameState.gameMode === GameMode.MBTI_16) {
            return forwardNeighbors.map(t => t.index);
        }

        // JUNG 8 Mode: Cognitive Stack Logic (Polling Mechanism)
        const stack = MBTI_STACKS[player.mbti] || [];
        let targetFunctionId = '?';
        let lookAheadIndex = player.stackIndex + 1;

        // [顺延轮询机制]: 按照认知功能栈顺序，从下一个功能开始轮询周围是否有匹配的功能格
        for (let i = 0; i < stack.length; i++) {
            const checkIndex = (lookAheadIndex + i) % stack.length;
            const funcToCheck = stack[checkIndex];
            if (forwardNeighbors.some(t => t.functionId === funcToCheck)) {
                targetFunctionId = funcToCheck;
                break;
            }
        }

        const validTargets = forwardNeighbors.filter(t =>
            t.functionId === targetFunctionId || t.functionId === '?'
        );

        return validTargets.map(t => t.index);
    };

    // Recalculate valid moves whenever position or remaining steps change
    useEffect(() => {
        if (gameState.phase !== 'PLAYING') return;

        const currentPlayer = gameState.players[gameState.currentPlayerIndex];
        // FIX: Guard against undefined player to prevent crash on load
        if (!currentPlayer) return;

        if (gameState.movementState === 'IDLE' && gameState.remainingSteps > 0) {
            const moves = calculateValidNextSteps(currentPlayer, board);
            setValidMoves(moves);
        } else if (gameState.movementState === 'TELEPORTING') {
            const moves = board.filter(t => t.index !== currentPlayer.position).map(t => t.index);
            setValidMoves(moves);
        } else if (gameState.remainingSteps === 0 && gameState.movementState === 'IDLE') {
            setValidMoves([]);
        }
    }, [gameState.remainingSteps, gameState.movementState, gameState.currentPlayerIndex, gameState.players]);


    const addLog = (text: string, type: 'system' | 'chat' | 'action' = 'system', author?: string, taskDetails?: string) => {
        const entry = { id: Date.now().toString() + Math.random(), text, type, author, timestamp: Date.now(), taskDetails };
        setGameState(prev => ({ ...prev, logs: [...prev.logs, entry] }));

        // Only speak if the author is a bot
        if (author && author !== 'system') {
            const player = gameState.players.find(p => p.name === author);
            if (player && player.isBot) {
                speak(text, author);
            }
        }
    };

    const snapshotLog = (text: string) => {
        setGameState(prev => ({ ...prev, snapshots: [...prev.snapshots, text] }));
    };

    const startLoading = (humanPlayers: any[], mode: GameMode, botCount: number, targetScore: number) => {
        setGameState(prev => ({ ...prev, phase: 'LOADING' }));
        let p = 0;
        const interval = setInterval(() => {
            p += 1;
            setLoadingProgress(p);
            if (p >= 100) {
                clearInterval(interval);
                setShowStartBtn(true);
            }
        }, 50);
        (window as any).pendingGameConfig = { humanPlayers, mode, botCount, targetScore };
    };

    const handleEnterGame = () => {
        const config = (window as any).pendingGameConfig;
        initGame(config.humanPlayers, config.mode, config.botCount, config.targetScore);
    }

    const initGame = (humanPlayers: any[], mode: GameMode, botCount: number, targetScore: number) => {
        const newBoard = generateMap(mode);
        setBoard(newBoard);

        // Find Center (3,3) for MBTI or (0,0) for Jung
        const centerQ = mode === GameMode.MBTI_16 ? 3 : 0;
        const centerR = mode === GameMode.MBTI_16 ? 3 : 0;
        const centerTile = newBoard.find(t => t.q === centerQ && t.r === centerR);

        const players: Player[] = humanPlayers.map((p, i) => {
            // Default to center
            let startPos = centerTile?.index || 0;

            // MBTI Mode: Randomly on their own type if exists
            if (mode === GameMode.MBTI_16) {
                // Find all tiles matching this player's type
                const typeTiles = newBoard.filter(t => t.functionId === p.mbti);
                if (typeTiles.length > 0) {
                    // Pick one randomly
                    const randomTile = typeTiles[Math.floor(Math.random() * typeTiles.length)];
                    startPos = randomTile.index;
                }
            }

            return {
                id: `user-${i}`, name: p.name || `P${i + 1}`, mbti: p.mbti, isBot: false,
                avatar: p.avatarImage || 'user', color: COLORS[i % COLORS.length],
                trustScore: 0, insightScore: 0, expressionScore: 0, totalRatingGiven: 0, position: startPos,
                previousPosition: null, stackIndex: 0, skipUsedCount: 0
            };
        });

        for (let i = 0; i < botCount; i++) {
            const botMbti = getRandomMBTI();
            const names = BOT_NAMES[botMbti] || [`Bot ${i}`];

            let startPos = centerTile?.index || 0;
            if (mode === GameMode.MBTI_16) {
                const typeTiles = newBoard.filter(t => t.functionId === botMbti);
                if (typeTiles.length > 0) {
                    const randomTile = typeTiles[Math.floor(Math.random() * typeTiles.length)];
                    startPos = randomTile.index;
                }
            }

            players.push({
                id: `bot-${i}`, name: names[0], mbti: botMbti, isBot: true,
                avatar: 'bot', color: COLORS[(players.length) % COLORS.length],
                trustScore: 0, insightScore: 0, expressionScore: 0, totalRatingGiven: 0, position: startPos,
                previousPosition: null, stackIndex: 0, skipUsedCount: 0
            });
        }

        setGameState(prev => ({
            ...prev, players, gameMode: mode, targetScore, phase: 'PLAYING', subPhase: 'IDLE',
            logs: [{ id: '0', text: '欢迎登上彩虹船。', type: 'system', timestamp: Date.now() }],
            sightRange: 1 // Init sight
        }));

        // Explicitly start music when game starts (user interaction chain)
        setIsMusicPlaying(true);
        if (audioRef.current) {
            audioRef.current.volume = 0.2;
            audioRef.current.play().catch(e => console.warn("Autoplay prevented:", e));
        }
    };

    const handleHubSelect = (mode: 'test' | 'tasks' | 'party') => {
        if (mode === 'test') {
            setIsQuickTestMode(true);
            setGameState(prev => ({ ...prev, phase: 'ONBOARDING' }));
        } else if (mode === 'tasks') {
            setIsQuickTestMode(false);
            setGameState(prev => ({ ...prev, phase: 'SOLO_TASKS' }));
        } else {
            setIsQuickTestMode(false);
            setGameState(prev => ({ ...prev, phase: 'ONBOARDING' }));
        }
    };

    const handleStartTurn = (manualValue?: number) => {
        const player = gameState.players[gameState.currentPlayerIndex];

        setGameState(prev => ({ ...prev, movementState: 'ROLLING' }));

        setTimeout(() => {
            // Dice 1-6 for MBTI mode maybe better? Let's keep 1-8 but 33 tiles is small. 1-4?
            // Keeping 1-8 for now for fun chaos.
            const roll = manualValue ? manualValue : (Math.floor(Math.random() * 8) + 1); // 1-8 standard

            // Randomize sight range (1 or 2)
            const newSightRange = Math.random() > 0.5 ? 2 : 1;

            setGameState(prev => ({
                ...prev,
                diceValue: roll,
                remainingSteps: roll,
                sightRange: newSightRange,
                movementState: 'IDLE',
                activeModifier: 'NORMAL',
                activeSpecialAbility: 'NONE',
                helperId: null,
                scoreTargetPlayerId: null
            }));

            // Reset Bonus
            setHighEnergyBonus(false);

            addLog(`${player.name} 掷出了 ${roll} 点 (视野: ${newSightRange}格)`, 'action');
        }, 1000);
    };

    const handleTileClick = (tileIndex: number) => {
        if (!validMoves.includes(tileIndex)) return;

        const player = gameState.players[gameState.currentPlayerIndex];
        const targetTile = board.find(t => t.index === tileIndex);
        if (!targetTile) return;

        const stack = MBTI_STACKS[player.mbti] || [];
        let newStackIndex = player.stackIndex;

        if (gameState.gameMode === GameMode.JUNG_8 && targetTile.functionId !== '?') {
            for (let i = 1; i < stack.length; i++) {
                const idx = (player.stackIndex + i) % stack.length;
                if (stack[idx] === targetTile.functionId) {
                    newStackIndex = idx;
                    break;
                }
            }
        }

        const isTeleportLanding = gameState.movementState === 'TELEPORTING';

        // Update Position & Steps
        setGameState(prev => {
            const newPlayers = [...prev.players];
            const p = newPlayers[prev.currentPlayerIndex];
            p.previousPosition = p.position;
            p.position = tileIndex;
            p.stackIndex = newStackIndex;

            const newRemaining = isTeleportLanding ? 0 : prev.remainingSteps - 1;

            return {
                ...prev,
                players: newPlayers,
                currentTile: targetTile,
                remainingSteps: newRemaining,
                movementState: 'MOVING_STEP',
                activeModifier: targetTile.modifier,
                activeSpecialAbility: targetTile.specialAbility
            };
        });
        setValidMoves([]);

        // Animation delay then logic
        setTimeout(() => {
            if (isTeleportLanding || gameState.remainingSteps === 1) {
                finishMovementAndTriggerEvent(targetTile, isTeleportLanding);
            } else {
                setGameState(prev => ({ ...prev, movementState: 'IDLE' }));
            }
        }, 600);
    }

    const finishMovementAndTriggerEvent = (tile: BoardTile, justTeleported: boolean) => {
        const player = gameState.players[gameState.currentPlayerIndex];

        setGameState(prev => ({ ...prev, movementState: 'IDLE' }));

        if (!justTeleported && tile.specialAbility !== 'NONE' && tile.functionId === '?') {
            handleSpecialAbility(tile.specialAbility);
            return;
        }

        // In MBTI 16 mode, center is special
        if (gameState.gameMode === GameMode.MBTI_16 && tile.functionId === 'Hub' && !justTeleported) {
            handleSpecialAbility('FREEDOM');
            return;
        }

        // Generate Tasks
        generateAllTaskOptions(tile.functionId, gameState.players, player, gameState.logs).then(tasks => {
            setGameState(prev => ({ ...prev, pregeneratedTasks: tasks }));
        });

        setGameState(prev => ({
            ...prev,
            subPhase: 'SELECTING_CARD',
            selectedTask: null,
            hasReselected: false,
            scoreTargetPlayerId: prev.scoreTargetPlayerId,
            helperId: prev.helperId
        }));

        addLog(`抵达 ${tile.characterName || tile.functionId}，正在翻开命运牌...`, 'system');
    };

    const handleSpecialAbility = (ability: SpecialAbility) => {
        const player = gameState.players[gameState.currentPlayerIndex];

        if (ability === 'FREEDOM') {
            setGameState(prev => ({ ...prev, movementState: 'TELEPORTING' }));
            addLog(`${player.name} 开启了自由门，请选择任意功能格降落！`, 'action');
            return;
        }

        if (ability === 'SUBSTITUTE') {
            setGameState(prev => ({ ...prev, subPhase: 'SELECTING_SUBSTITUTE' }));
            addLog(`${player.name} 正在寻找替身...`, 'action');
            return;
        }

        if (ability === 'COMPANION') {
            setGameState(prev => ({ ...prev, subPhase: 'SELECTING_COMPANION' }));
            addLog(`${player.name} 正在寻找同伴...`, 'action');
            return;
        }

        // Fallback
        setGameState(prev => ({ ...prev, subPhase: 'SELECTING_CARD' }));
    };

    const handleSubstituteSelect = (targetId: string) => {
        setGameState(prev => ({ ...prev, helperId: targetId, subPhase: 'IDLE', movementState: 'TELEPORTING' }));
        addLog(`指定了替身，请选择任意功能格降落！`, 'system');
    };

    const handleCompanionSelect = (targetId: string) => {
        setGameState(prev => ({ ...prev, helperId: targetId, subPhase: 'IDLE', movementState: 'TELEPORTING' }));
        addLog(`结伴同行，请选择任意功能格降落！`, 'system');
    };

    const activateCamera = async (deviceId?: string) => {
        const currentPlayer = gameState.players[gameState.currentPlayerIndex];
        if (currentPlayer.isBot) return;

        // Stop current stream if switching
        if (cameraStream) {
            cameraStream.getTracks().forEach(track => track.stop());
        }

        try {
            const constraints: MediaStreamConstraints = {
                video: {
                    width: 480,
                    height: 360,
                    deviceId: deviceId ? { exact: deviceId } : undefined
                }
            };
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            setCameraStream(stream);
            setIsCameraActive(true);

            // Fetch devices now that we have permission
            const devices = await navigator.mediaDevices.enumerateDevices();
            const cameras = devices.filter(d => d.kind === 'videoinput');
            setVideoDevices(cameras);
            if (!deviceId && cameras.length > 0) {
                // Find current device ID from stream
                const currentTrack = stream.getVideoTracks()[0];
                const settings = currentTrack.getSettings();
                if (settings.deviceId) setSelectedVideoDeviceId(settings.deviceId);
            }
        } catch (e) {
            console.warn("Camera access denied or unavailable", e);
            setIsCameraActive(false);
        }
    };

    const handleSwitchCamera = async () => {
        if (videoDevices.length <= 1) return;
        const currentIndex = videoDevices.findIndex(d => d.deviceId === selectedVideoDeviceId);
        const nextIndex = (currentIndex + 1) % videoDevices.length;
        const nextDevice = videoDevices[nextIndex];
        setSelectedVideoDeviceId(nextDevice.deviceId);
        await activateCamera(nextDevice.deviceId);
    };

    const handleSelectCategory = (category: 'standard' | 'truth' | 'dare' | 'deep') => {
        const cached = gameState.pregeneratedTasks?.[category];
        if (cached) {
            setGameState(prev => ({ ...prev, subPhase: 'VIEWING_TASK', selectedTask: cached }));
            activateCamera();
        } else {
            setGameState(prev => ({ ...prev, subPhase: 'VIEWING_TASK', selectedTask: null }));
            const tile = gameState.currentTile;
            if (tile) {
                generateAllTaskOptions(tile.functionId, gameState.players, gameState.players[gameState.currentPlayerIndex], gameState.logs).then(tasks => {
                    setGameState(prev => ({ ...prev, selectedTask: tasks[category], pregeneratedTasks: tasks }));
                    activateCamera();
                });
            }
        }
    };

    const handleReselect = () => {
        if (gameState.hasReselected || !gameState.pregeneratedTasks) return;
        const categories: ('standard' | 'truth' | 'dare' | 'deep')[] = ['standard', 'truth', 'dare', 'deep'];
        const currentCat = gameState.selectedTask?.category;
        const available = categories.filter(c => c !== currentCat);
        const randomCat = available[Math.floor(Math.random() * available.length)];
        setGameState(prev => ({ ...prev, hasReselected: true, selectedTask: prev.pregeneratedTasks![randomCat] }));
    };

    const handleSkip = () => {
        const player = gameState.players[gameState.currentPlayerIndex];
        setGameState(prev => {
            const newPlayers = [...prev.players];
            newPlayers[prev.currentPlayerIndex].skipUsedCount += 1;
            return { ...prev, players: newPlayers, subPhase: 'IDLE' };
        });
        nextTurn();
    };

    const handleAskForHelp = () => {
        if (gameState.sharedHelpUsedCount >= 3) { alert("次数耗尽"); return; }
        setGameState(prev => ({ ...prev, subPhase: 'CHOOSING_HELPER' }));
    };

    const handleChooseHelper = (helperId: string) => {
        setGameState(prev => ({ ...prev, helperId, sharedHelpUsedCount: prev.sharedHelpUsedCount + 1, subPhase: 'VIEWING_TASK' }));
    };

    const handleStartTask = async () => {
        if (!gameState.selectedTask) return;

        const currentPlayer = gameState.players[gameState.currentPlayerIndex];

        // Start STT only if Human
        setCurrentSpeechText("");
        setHighEnergyBonus(false);
        setVisualEvidence([]); // Reset visual evidence for new task

        if (!currentPlayer.isBot) {
            if (isSpeechRecognitionSupported()) {
                startSpeechRecognition(
                    (text) => setCurrentSpeechText(prev => prev + " " + text),
                    () => setIsListening(false)
                );
                setIsListening(true);

                // Start Audio Monitoring
                startAudioMonitoring((vol) => {
                    setMicVolume(vol);
                    if (vol > 0.4) {
                        setHighEnergyBonus(true);
                    }
                });
            }
        }

        setGameState(prev => ({ ...prev, subPhase: 'TASK_EXECUTION' }));
        setTaskTimer(gameState.selectedTask.durationSeconds);
        const timerId = setInterval(() => {
            setTaskTimer(prev => { if (prev <= 1) { clearInterval(timerId); return 0; } return prev - 1; });
        }, 1000);
    };

    // Auto-capture keyframes for Vision Analysis
    useEffect(() => {
        if (gameState.subPhase !== 'TASK_EXECUTION' || !isCameraActive || !cameraStream) return;

        const captureInterval = setInterval(async () => {
            if (videoRef.current && canvasRef.current) {
                const video = videoRef.current;
                const canvas = canvasRef.current;
                const context = canvas.getContext('2d');
                if (context) {
                    canvas.width = video.videoWidth;
                    canvas.height = video.videoHeight;
                    context.drawImage(video, 0, 0, canvas.width, canvas.height);
                    const base64 = canvas.toDataURL('image/jpeg', 0.6);

                    // Call AI to translate visual to text evidence (Semantic Compression)
                    const summary = await analyzeVisualAspect(base64, gameState.selectedTask?.title || "MBTI 互动");
                    setVisualEvidence(prev => [...prev.slice(-2), summary]); // Keep last 3 visual snapshots
                }
            }
        }, 15000); // Every 15 seconds

        return () => clearInterval(captureInterval);
    }, [gameState.subPhase, isCameraActive, cameraStream]);

    // Ensure camera stream is attached when video element appears
    useEffect(() => {
        if (cameraStream && videoRef.current) {
            videoRef.current.srcObject = cameraStream;
        }
    }, [cameraStream, gameState.subPhase]);

    // Safety cleanup for camera when modal closes unexpectedly
    useEffect(() => {
        if (gameState.subPhase === 'IDLE' || gameState.subPhase === 'SELECTING_CARD') {
            if (cameraStream) {
                cameraStream.getTracks().forEach(track => track.stop());
                setCameraStream(null);
                setIsCameraActive(false);
            }
            if (isListening) {
                stopSpeechRecognition();
                stopAudioMonitoring();
                setIsListening(false);
            }
        }
    }, [gameState.subPhase]);

    const handleTaskDone = () => {
        if (isListening) {
            stopSpeechRecognition();
            stopAudioMonitoring();
            setIsListening(false);
        }

        // Stop Camera
        if (cameraStream) {
            cameraStream.getTracks().forEach(track => track.stop());
            setCameraStream(null);
            setIsCameraActive(false);
        }

        const player = gameState.players[gameState.currentPlayerIndex];
        const taskSummary = `任务: ${gameState.selectedTask?.title || '未知任务'}`;
        const speechDetail = currentSpeechText.trim() ? `玩家发言: "${currentSpeechText.trim()}"` : (player.isBot ? "（Bot 操作）" : "（玩家未检测到发言）");
        const visualDetail = visualEvidence.length > 0 ? `| 视觉观测: ${visualEvidence.join('; ')}` : "";

        addLog(`${player.name} 完成了挑战。`, 'action', player.name, `${taskSummary}。${speechDetail} ${visualDetail}`);
        snapshotLog(`${player.name}完成[${gameState.selectedTask?.category}]挑战。${speechDetail} ${visualDetail}`);

        const reviewers = gameState.players.filter(p => p.id !== gameState.players[gameState.currentPlayerIndex].id);
        if (reviewers.length === 0) { handlePeerScoreSubmit(5); return; }
        setGameState(prev => ({ ...prev, subPhase: 'PEER_REVIEW', peerReviewQueue: reviewers.map(r => r.id), currentReviewerId: reviewers[0].id, accumulatedRating: 0 }));
    };

    const handlePeerScoreSubmit = (rating: number) => {
        const currentReviewerId = gameState.currentReviewerId;

        if (currentReviewerId) {
            setGameState(prev => {
                const newPlayers = [...prev.players];
                const reviewerIndex = newPlayers.findIndex(p => p.id === currentReviewerId);
                if (reviewerIndex !== -1) {
                    newPlayers[reviewerIndex] = {
                        ...newPlayers[reviewerIndex],
                        totalRatingGiven: (newPlayers[reviewerIndex].totalRatingGiven || 0) + rating
                    };
                }
                return { ...prev, players: newPlayers };
            });
        }

        if (currentReviewerId && gameState.peerReviewQueue.length > 0) {
            setGameState(prev => {
                const newQueue = prev.peerReviewQueue.filter(id => id !== currentReviewerId);
                const nextReviewerId = newQueue.length > 0 ? newQueue[0] : null;
                if (nextReviewerId) return { ...prev, accumulatedRating: prev.accumulatedRating + rating, peerReviewQueue: newQueue, currentReviewerId: nextReviewerId };
                else return { ...prev, accumulatedRating: prev.accumulatedRating + rating, peerReviewQueue: [], currentReviewerId: null };
            });
            if (gameState.peerReviewQueue.length > 1) return;
        }

        if (gameState.activeModifier === 'CLONE' || gameState.activeModifier === 'TRANSFER') {
            setGameState(prev => ({ ...prev, subPhase: 'SELECTING_SCORE_TARGET' }));
            return;
        }
        finalizeTurn(rating);
    };

    const handleScoreTargetSelect = (targetId: string) => {
        setGameState(prev => ({ ...prev, scoreTargetPlayerId: targetId }));
        finalizeTurn(0);
    };

    const finalizeTurn = (lastRating: number) => {
        const player = gameState.players[gameState.currentPlayerIndex];
        const task = gameState.selectedTask;
        if (!task) return;

        const reviewerCount = Math.max(1, gameState.players.length - 1);
        const totalRating = gameState.accumulatedRating + lastRating;
        const avgRating = totalRating / reviewerCount;

        let basePoints = Math.ceil(avgRating * task.multiplier * 2);
        const mod = gameState.activeModifier;
        const ability = gameState.activeSpecialAbility;

        if (mod === 'DOUBLE') basePoints *= 2;
        if (mod === 'HALF') basePoints = Math.floor(basePoints / 2);

        if (highEnergyBonus) {
            basePoints += 5;
        }

        setGameState(prev => {
            let newPlayers = prev.players.map(p => ({ ...p }));
            const currentPlayer = newPlayers[prev.currentPlayerIndex];
            const modifier = prev.activeModifier;
            const ability = prev.activeSpecialAbility;

            const applyScoreToPlayer = (targetPlayerId: string, points: number) => {
                const targetIndex = newPlayers.findIndex(pl => pl.id === targetPlayerId);
                if (targetIndex !== -1) {
                    const target = newPlayers[targetIndex];
                    if (task.scoreType === 'trust') target.trustScore += points;
                    else if (task.scoreType === 'insight') target.insightScore += points;
                    else target.expressionScore += points;
                }
            };

            if (ability === 'SUBSTITUTE' && prev.helperId) {
                applyScoreToPlayer(prev.helperId, basePoints);
            }
            else if (ability === 'COMPANION' && prev.helperId) {
                applyScoreToPlayer(currentPlayer.id, basePoints);
                applyScoreToPlayer(prev.helperId, basePoints);
            }
            else if (prev.helperId && ability === 'NONE' && modifier === 'NORMAL') {
                const hPoints = Math.ceil(basePoints / 2);
                const pPoints = Math.floor(basePoints / 2);
                applyScoreToPlayer(currentPlayer.id, pPoints);
                applyScoreToPlayer(prev.helperId, hPoints);
            }
            else {
                if (modifier === 'TRANSFER' && prev.scoreTargetPlayerId) {
                    applyScoreToPlayer(prev.scoreTargetPlayerId, basePoints);
                } else {
                    applyScoreToPlayer(currentPlayer.id, basePoints);
                    if (modifier === 'CLONE' && prev.scoreTargetPlayerId) {
                        applyScoreToPlayer(prev.scoreTargetPlayerId, basePoints);
                    }
                }
            }
            return { ...prev, players: newPlayers };
        });

        nextTurn();
    };

    const nextTurn = () => {
        setGameState(prev => {
            const p = prev.players[prev.currentPlayerIndex];
            const total = p.trustScore + p.insightScore + p.expressionScore;
            if (total >= prev.targetScore) {
                handleGameOver(prev.players);
                return prev;
            }
            const nextIndex = (prev.currentPlayerIndex + 1) % prev.players.length;
            return {
                ...prev,
                currentPlayerIndex: nextIndex,
                subPhase: 'IDLE',
                selectedTask: null,
                helperId: null,
                scoreTargetPlayerId: null,
                activeModifier: 'NORMAL',
                activeSpecialAbility: 'NONE',
                remainingSteps: 0,
                turn: nextIndex === 0 ? prev.turn + 1 : prev.turn,
                currentReviewerId: null,
                peerReviewQueue: [],
                accumulatedRating: 0
            };
        });
    };

    const handleGameOver = async (finalPlayers: Player[]) => {
        setGameState(prev => ({ ...prev, players: finalPlayers, phase: 'ANALYSIS' }));
        const report = await generateProfessionalReport(finalPlayers, gameState.snapshots, gameState.logs);
        setReportData(report);
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }
        setIsMusicPlaying(false);
    };

    const handleShowQuickReport = async (playerData: { name: string, mbti: string }, results: MBTIAnalysisResult[]) => {
        // Create a dummy player for the report UI
        const dummyPlayer: Player = {
            id: 'solo-player',
            name: playerData.name,
            mbti: playerData.mbti,
            isBot: false,
            avatar: 'user',
            trustScore: 0, insightScore: 0, expressionScore: 0, totalRatingGiven: 0,
            position: 0, previousPosition: null, stackIndex: 0, skipUsedCount: 0,
            color: 'teal'
        };

        setGameState(prev => ({
            ...prev,
            players: [dummyPlayer],
            phase: 'ANALYSIS',
            currentPlayerIndex: 0,
            startTime: Date.now()
        }));

        const report = await generateQuickReport(playerData, results);
        setReportData(report);
    };

    const stopMusic = () => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }
        setIsMusicPlaying(false);
    };

    const resetGame = () => {
        setGameState(prev => ({
            players: [],
            currentPlayerIndex: 0,
            gameMode: GameMode.JUNG_8,
            turn: 1,
            targetScore: 40,
            logs: [],
            phase: 'HUB',
            subPhase: 'IDLE',
            currentTile: null,
            selectedTask: null,
            activeModifier: 'NORMAL',
            activeSpecialAbility: 'NONE',
            remainingSteps: 0,
            sightRange: 1, // Reset sight
            helperId: null,
            scoreTargetPlayerId: null,
            sharedHelpUsedCount: 0,
            hasReselected: false,
            pregeneratedTasks: null,
            movementState: 'IDLE',
            diceValue: null,
            highestScore: 0,
            snapshots: [],
            startTime: Date.now(),
            peerReviewQueue: [],
            currentReviewerId: null,
            accumulatedRating: 0
        }));
        setLoadingProgress(0);
        setShowStartBtn(false);
        setBoard([]);
        setValidMoves([]);
        setReportData(null);
        setSharedReviewData(null); // Clear shared data
        setIsQuickTestMode(false);
        stopMusic();
    };

    // --- RENDER ---

    if (sharedReviewData) {
        return (
            <GameReport
                players={sharedReviewData.players}
                report={sharedReviewData.report}
                startTime={sharedReviewData.startTime}
                gameMode={sharedReviewData.gameMode}
                onReturnHome={() => {
                    window.history.pushState({}, '', window.location.pathname);
                    setSharedReviewData(null);
                }}
            />
        );
    }

    if (gameState.phase === 'HUB') {
        return (
            <div className={`min-h-screen flex flex-col transition-colors duration-300 font-sans ${isDarkMode ? 'dark bg-slate-900 text-white' : 'bg-stone-50 text-slate-800'}`}>
                <header className="h-16 flex items-center justify-between px-6 border-b border-slate-200 dark:border-white/5 shrink-0">
                    <div className="flex items-center gap-2 font-black text-xl tracking-tighter italic">
                        <Ship className="text-blue-500" /> RAINBOW BOAT
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition">
                            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
                        </button>
                    </div>
                </header>
                <main className="flex-1 relative">
                    <MBTIHub onSelectMode={handleHubSelect} isMobile={isMobile} />
                </main>
            </div>
        );
    }

    if (gameState.phase === 'SOLO_TASKS') {
        return <TaskSolo onBack={() => setGameState(prev => ({ ...prev, phase: 'HUB' }))} isMobile={isMobile} />;
    }

    if (gameState.phase === 'ONBOARDING') {
        return (
            <Onboarding
                onComplete={startLoading}
                isDarkMode={isDarkMode}
                toggleTheme={toggleTheme}
                initialStep={isQuickTestMode ? 'quiz' : 'setup'}
                isSoloTest={isQuickTestMode}
                onBackToHub={resetGame}
                onShowQuickReport={handleShowQuickReport}
            />
        );
    }

    if (gameState.phase === 'LOADING') {
        return (
            <div className="min-h-screen w-full flex flex-col items-center justify-center text-slate-800 dark:text-white relative font-sans transition-colors duration-300">
                <div className="z-10 flex flex-col items-center w-full max-w-4xl px-8 text-center bg-white/10 dark:bg-black/20 backdrop-blur-md rounded-3xl p-16 shadow-2xl border border-white/10">
                    <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-8xl font-bold tracking-tight mb-4 text-transparent bg-clip-text bg-[linear-gradient(to_right,#ef4444,#f97316,#eab308,#22c55e,#3b82f6,#a855f7)] drop-shadow-lg">彩虹船</motion.h1>
                    <MicCheck />
                    <div className="w-full h-4 bg-slate-700 rounded-full overflow-hidden mb-12 mt-8 relative z-20"><motion.div className="h-full bg-gradient-to-r from-teal-400 to-blue-500" initial={{ width: 0 }} animate={{ width: `${loadingProgress}%` }} /></div>
                    {showStartBtn && (<motion.button initial={{ scale: 0.8 }} animate={{ scale: 1 }} onClick={handleEnterGame} className="mt-8 px-16 py-6 bg-white text-slate-900 rounded-full font-bold text-3xl shadow-2xl flex items-center gap-3"><Play size={32} fill="currentColor" /> 启 航</motion.button>)}
                </div>
            </div>
        );
    }

    if (gameState.phase === 'ANALYSIS' && reportData) {
        return (
            <GameReport
                players={gameState.players}
                report={reportData || { groupAnalysis: '', playerAnalysis: {} }}
                onReturnHome={resetGame}
                startTime={gameState.startTime}
                gameMode={gameState.gameMode}
            />
        );
    }

    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    if (!currentPlayer) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Loading Game State...</div>;

    const currentReviewer = gameState.currentReviewerId ? gameState.players.find(p => p.id === gameState.currentReviewerId) : null;
    const playerStack = MBTI_STACKS[currentPlayer.mbti] || [];

    return (
        <div className={`min-h-screen w-full text-slate-800 dark:text-slate-200 font-sans flex flex-col overflow-x-hidden relative selection:bg-teal-500/30 transition-colors duration-300 ${isMobile ? 'overflow-y-auto' : ''}`}>

            {/* Top Bar - Transparent with blur */}
            <header className="h-16 bg-white/80 dark:bg-slate-900/60 backdrop-blur border-b border-slate-200 dark:border-white/5 flex items-center justify-between px-6 shrink-0 z-30 transition-colors duration-300">
                <div className="flex items-center gap-6 w-1/3">
                    <button onClick={resetGame} className="flex items-center gap-1 text-slate-500 hover:text-teal-600 dark:text-slate-400 dark:hover:text-white transition group" title="Return to Home">
                        <LogOut size={16} className="group-hover:-translate-x-1 transition" />
                    </button>
                    <div className="flex items-center gap-3 bg-slate-100 dark:bg-slate-800/50 pr-4 rounded-full border border-slate-200 dark:border-slate-700/50">
                        <div className="w-10 h-10 rounded-full border-2 border-teal-500/50 overflow-hidden">
                            {currentPlayer.avatar.startsWith('data:') ? <img src={currentPlayer.avatar} className="w-full h-full object-cover" /> : <div className="bg-slate-200 dark:bg-slate-700 w-full h-full flex items-center justify-center font-bold text-lg">{currentPlayer.name[0]}</div>}
                        </div>
                        <div>
                            <div className="font-bold text-slate-700 dark:text-white text-sm">{currentPlayer.name}</div>
                            <div className="text-[10px] font-bold text-teal-600 dark:text-teal-400">{currentPlayer.mbti}</div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setIsManualMode(!isManualMode)}
                        className={`px-3 py-1 rounded-full text-xs font-bold border transition ${isManualMode ? 'bg-amber-500 text-white border-amber-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-300 dark:border-slate-700'}`}
                        title="Enable Host Control (Manual Dice)"
                    >
                        {isManualMode ? "主持人模式: ON" : "主持人模式: OFF"}
                    </button>
                </div>

                <div className="flex-1 flex justify-center">
                    {gameState.gameMode === GameMode.JUNG_8 && (
                        <div className="flex items-center px-6 py-2 rounded-full bg-white/40 dark:bg-black/40 border border-slate-200 dark:border-white/5 backdrop-blur-md shadow-inner overflow-x-auto no-scrollbar max-w-xl">
                            {playerStack.map((f, i) => {
                                const isCurrent = i === currentPlayer.stackIndex;
                                return (
                                    <div key={i} className={`flex flex-col items-center relative transition-all duration-500 ${isCurrent ? 'mx-3' : 'mx-1'}`}>
                                        {isCurrent && <div className="text-[9px] text-teal-600 dark:text-teal-400 font-bold mb-1 absolute -top-4">当前</div>}
                                        <div className={`w-8 h-8 flex items-center justify-center text-[10px] font-bold rounded-full transition-all duration-500 ${isCurrent ? 'bg-teal-500 text-white scale-125 shadow-[0_0_15px_#14b8a6]' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'}`}>
                                            {f}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                    {gameState.gameMode === GameMode.MBTI_16 && (
                        <div className="flex items-center px-6 py-2 rounded-full bg-white/40 dark:bg-black/40 border border-slate-200 dark:border-white/5 backdrop-blur-md shadow-inner overflow-x-auto no-scrollbar max-w-2xl">
                            {MBTI_TYPES.map((type, i) => {
                                const isCurrent = gameState.currentTile?.functionId === type;
                                // Find group to use correct color
                                let groupColor = 'text-slate-500';
                                let activeClass = 'bg-slate-200 dark:bg-slate-800 text-slate-500';

                                const groupEntry = Object.entries(MBTI_GROUPS).find(([_, g]) => g.types.includes(type));
                                if (groupEntry) {
                                    const [_, groupData] = groupEntry;
                                    if (isCurrent) {
                                        // Parse tailwind classes to apply active style manually or just keep it simple
                                        // Let's use specific active colors based on group
                                        if (groupData.hexColor === '#a855f7') activeClass = 'bg-purple-500 text-white shadow-[0_0_15px_#a855f7] scale-110'; // NT
                                        else if (groupData.hexColor === '#22c55e') activeClass = 'bg-green-500 text-white shadow-[0_0_15px_#22c55e] scale-110'; // NF
                                        else if (groupData.hexColor === '#3b82f6') activeClass = 'bg-blue-500 text-white shadow-[0_0_15px_#3b82f6] scale-110'; // SJ
                                        else if (groupData.hexColor === '#eab308') activeClass = 'bg-yellow-500 text-white shadow-[0_0_15px_#eab308] scale-110'; // SP
                                    }
                                }

                                return (
                                    <div key={type} className={`flex flex-col items-center relative transition-all duration-500 mx-1 shrink-0`}>
                                        {isCurrent && <div className="text-[9px] text-teal-600 dark:text-teal-400 font-bold mb-1 absolute -top-4">当前</div>}
                                        <div className={`px-2 py-1 flex items-center justify-center text-[10px] font-bold rounded-md transition-all duration-500 ${isCurrent ? activeClass : 'bg-slate-200 dark:bg-slate-800 text-slate-500'}`}>
                                            {type}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>

                <div className="w-1/3 flex justify-end gap-3">
                    <button onClick={() => handleGameOver(gameState.players)} className="px-3 py-1.5 rounded-lg bg-red-100 hover:bg-red-200 dark:bg-red-900/20 dark:hover:bg-red-900/50 border border-red-200 dark:border-red-800/50 text-red-600 dark:text-red-300 transition flex items-center gap-1.5 text-xs font-bold mr-2">
                        <Flag size={14} /> 结束游戏
                    </button>
                    <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-amber-500 dark:hover:text-yellow-400 transition">
                        {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
                    </button>
                    <button onClick={() => setShowConfig(true)} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 hover:text-teal-600 dark:hover:text-teal-400 transition" title="AI Config">
                        <Settings size={18} />
                    </button>
                    <button onClick={() => setIsMusicPlaying(!isMusicPlaying)} className={`p-2 rounded-full transition ${isMusicPlaying ? 'text-teal-500 bg-teal-500/10' : 'text-slate-600 dark:text-slate-400'}`} title={isMusicPlaying ? "Pause Music" : "Play Music"}>
                        <Music size={18} />
                    </button>
                </div>
            </header>

            <main className={`flex-1 flex relative ${isMobile ? 'flex-col' : 'overflow-hidden'}`}>
                {/* Original Game UI Wrapper */}
                {(gameState.phase === 'PLAYING' || gameState.phase === 'SETUP') && (
                    <div className={`flex-1 flex relative ${isMobile ? 'flex-col' : 'overflow-hidden'}`}>
                        {/* Game Board Content */}
                        <div className={`flex-1 relative bg-transparent flex flex-col transition-all duration-300 ${isMobile ? 'h-[60vh]' : ''}`}>
                            <div className="flex-1 flex items-center justify-center overflow-hidden cursor-grab active:cursor-grabbing">
                                <GameBoard
                                    players={gameState.players}
                                    currentPlayerId={currentPlayer.id}
                                    boardLayout={board}
                                    validMoves={validMoves}
                                    onTileClick={handleTileClick}
                                    gameMode={gameState.gameMode}
                                    visibilityRadius={gameState.sightRange} // Using sightRange instead of diceValue
                                />
                            </div>

                            {/* ... (Rest of existing UI components) ... */}
                            <AnimatePresence>
                                {(gameState.remainingSteps > 0 && gameState.movementState !== 'ROLLING') && (
                                    <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 1.5, opacity: 0 }} className="absolute inset-0 pointer-events-none flex items-center justify-center z-10">
                                        <div className="text-[10rem] font-bold text-slate-900/10 dark:text-white/20 drop-shadow-lg select-none">
                                            {gameState.remainingSteps}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Dice & Interactions */}
                            <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-20">
                                <div className="relative w-full h-full max-w-4xl max-h-[800px]">
                                    <div className={`absolute bottom-20 right-8 pointer-events-auto transition-all duration-300 ${gameState.gameMode === GameMode.MBTI_16 ? 'translate-x-24' : ''}`}>
                                        {/* Host Manual Dice Input */}
                                        {isManualMode && gameState.subPhase === 'IDLE' && gameState.remainingSteps === 0 && (
                                            <div className="mb-6 p-4 bg-slate-800/80 rounded-2xl border border-amber-500/30 backdrop-blur shadow-xl">
                                                <h3 className="text-amber-400 font-bold mb-3 text-sm uppercase tracking-wider">主持人控点</h3>
                                                <div className="flex gap-2 justify-center">
                                                    {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
                                                        <button
                                                            key={n}
                                                            onClick={() => handleStartTurn(n)}
                                                            className="w-12 h-12 rounded-xl bg-slate-700 hover:bg-amber-500 text-white font-bold text-xl transition shadow-lg border border-slate-600"
                                                        >
                                                            {n}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {gameState.subPhase === 'IDLE' && !currentPlayer.isBot && gameState.remainingSteps === 0 && (
                                            <button
                                                onClick={() => handleStartTurn()}
                                                disabled={isManualMode || gameState.movementState !== 'IDLE'}
                                                className={`group relative w-24 h-24 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-2xl transition hover:scale-105 active:scale-95 ${isManualMode ? 'opacity-50 cursor-not-allowed' : ''}`}
                                            >
                                                <div className="absolute inset-0 rounded-full border border-teal-500/30 animate-ping opacity-20"></div>
                                                <div className="flex flex-col items-center">
                                                    <Compass className="text-teal-500 group-hover:text-teal-600 dark:group-hover:text-white transition mb-1" size={28} />
                                                    <span className="text-[10px] text-teal-600/80 dark:text-teal-500/80 font-bold uppercase tracking-widest">启程</span>
                                                </div>
                                            </button>
                                        )}

                                        {gameState.movementState === 'ROLLING' && (
                                            <div className="absolute inset-0 flex items-center justify-center -translate-y-12">
                                                <Dice3D value={gameState.diceValue} rolling={true} />
                                            </div>
                                        )}
                                    </div>

                                    {/* Modifiers & Tasks (Reused) */}
                                    <AnimatePresence>
                                        {gameState.movementState === 'IDLE' && (gameState.activeModifier !== 'NORMAL' || gameState.activeSpecialAbility !== 'NONE') && gameState.subPhase === 'SELECTING_CARD' && (
                                            <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 2, opacity: 0 }} className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                <div className="bg-white/90 dark:bg-black/80 backdrop-blur-md p-6 rounded-3xl border-2 border-amber-500 text-center shadow-[0_0_50px_rgba(245,158,11,0.5)] text-slate-800 dark:text-white">
                                                    <div className="text-6xl mb-2">
                                                        {gameState.activeModifier === 'DOUBLE' && '⚡ x2'} {gameState.activeModifier === 'HALF' && '📉 ÷2'} {gameState.activeModifier === 'CLONE' && '👯'} {gameState.activeModifier === 'TRANSFER' && '↔️'}
                                                        {gameState.activeSpecialAbility === 'FREEDOM' && '🚀'} {gameState.activeSpecialAbility === 'SUBSTITUTE' && '🎭'} {gameState.activeSpecialAbility === 'COMPANION' && '🤝'}
                                                    </div>
                                                    <div className="text-2xl font-bold text-amber-500 dark:text-amber-400">
                                                        {gameState.activeModifier === 'DOUBLE' && '能量激化'} {gameState.activeModifier === 'HALF' && '迷雾重重'} {gameState.activeModifier === 'CLONE' && '命运克隆'} {gameState.activeModifier === 'TRANSFER' && '乾坤挪移'}
                                                        {gameState.activeSpecialAbility === 'FREEDOM' && '自由之门'} {gameState.activeSpecialAbility === 'SUBSTITUTE' && '寻找替身'} {gameState.activeSpecialAbility === 'COMPANION' && '结伴同行'}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    <AnimatePresence>
                                        {gameState.subPhase === 'SELECTING_CARD' && (
                                            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }} className="absolute inset-0 flex items-center justify-center pointer-events-auto">
                                                <div className="grid grid-cols-2 gap-6 p-8 bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-slate-200 dark:border-slate-700 shadow-2xl">
                                                    {(['standard', 'truth', 'dare', 'deep'] as const).map((cat) => {
                                                        const config = TASK_CATEGORIES_CONFIG[cat];
                                                        return (
                                                            <button key={cat} onClick={() => handleSelectCategory(cat)} className={`w-40 h-48 rounded-2xl flex flex-col items-center justify-center gap-4 transition-all hover:-translate-y-2 hover:shadow-xl border ${config.color} bg-opacity-20 hover:bg-opacity-30 group`}>
                                                                <div className="text-5xl group-hover:scale-110 transition">{config.icon}</div>
                                                                <div className="text-center"><div className="font-bold text-slate-800 dark:text-white">{config.name}</div><div className="text-[10px] text-slate-500 dark:text-white/60">x{config.multiplier} 倍能量</div></div>
                                                            </button>
                                                        )
                                                    })}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>

                            <AnimatePresence>
                                {(gameState.subPhase === 'VIEWING_TASK' || gameState.subPhase === 'TASK_EXECUTION') && (
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 overflow-y-auto">
                                        <div className={`flex ${isMobile ? 'flex-col' : 'flex-row'} gap-6 items-center w-full max-w-6xl justify-center`}>
                                            {/* Task Card: Responsive Width */}
                                            <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden flex flex-col transition-all duration-300">
                                                {!gameState.selectedTask ? (
                                                    <div className="p-12 flex flex-col items-center justify-center space-y-4"><div className="w-16 h-16 rounded-full border-4 border-teal-500 border-t-transparent animate-spin"></div></div>
                                                ) : (
                                                    <>
                                                        <div className={`p-8 ${TASK_CATEGORIES_CONFIG[gameState.selectedTask.category].color} bg-opacity-20 text-center relative`}>
                                                            <div className="text-5xl mb-3">{TASK_CATEGORIES_CONFIG[gameState.selectedTask.category].icon}</div>
                                                            <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">{gameState.selectedTask.title}</h2>
                                                            <div className="flex justify-center gap-2">
                                                                <span className="px-2 py-0.5 bg-black/10 dark:bg-black/20 rounded-full text-[10px] text-slate-600 dark:text-white/90">⏱ {gameState.selectedTask.durationSeconds}s</span>
                                                                <span className="px-2 py-0.5 bg-black/10 dark:bg-black/20 rounded-full text-[10px] text-slate-600 dark:text-white/90">✨ {gameState.selectedTask.scoreType}</span>
                                                            </div>
                                                            <button onClick={() => setGameState(prev => ({ ...prev, subPhase: 'SELECTING_CARD' }))} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:text-white/50 dark:hover:text-white"><X size={18} /></button>
                                                        </div>
                                                        <div className="p-6 flex-1 flex flex-col min-h-0">
                                                            <p className="text-md text-slate-600 dark:text-slate-300 leading-relaxed text-center mb-6 flex-shrink-0 italic">
                                                                "{gameState.selectedTask.description}"
                                                            </p>
                                                            {gameState.helperId && (<div className="mb-4 bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-500/30 p-2 rounded-lg flex items-center gap-3 justify-center text-indigo-700 dark:text-indigo-200 text-xs"><Users size={14} /> <span>共振伙伴: <strong>{gameState.players.find(p => p.id === gameState.helperId)?.name}</strong></span></div>)}

                                                            {gameState.subPhase === 'VIEWING_TASK' ? (
                                                                <div className="space-y-4 pt-2">
                                                                    <button onClick={handleStartTask} className="w-full py-4 bg-gradient-to-r from-teal-600 to-blue-600 hover:brightness-110 rounded-2xl font-bold text-white shadow-lg transition-all text-lg flex items-center justify-center gap-2 group">开始挑战 <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" /></button>
                                                                    <div className="grid grid-cols-3 gap-2">
                                                                        <button onClick={handleReselect} disabled={gameState.hasReselected} className="py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 disabled:opacity-50 rounded-xl text-slate-500 dark:text-slate-300 text-[10px] font-bold flex flex-col items-center justify-center gap-1 transition-all"><RefreshCw size={14} /> 重选</button>
                                                                        <button onClick={handleAskForHelp} className="py-2.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/50 dark:hover:bg-indigo-900 rounded-xl text-indigo-600 dark:text-indigo-300 text-[10px] font-bold flex flex-col items-center justify-center gap-1 border border-indigo-200 dark:border-indigo-500/30 transition-all"><Users size={14} /> 寻求帮助 ({3 - gameState.sharedHelpUsedCount})</button>
                                                                        <button onClick={handleSkip} className="py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl text-slate-500 dark:text-slate-400 text-[10px] font-bold flex flex-col items-center justify-center gap-1 transition-all"><SkipForward size={14} /> 跳过 (-{currentPlayer.skipUsedCount})</button>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <div className="flex flex-1 flex-col overflow-hidden">
                                                                    <div className="flex-1 w-full bg-slate-50 dark:bg-black/20 rounded-2xl p-5 mb-4 border border-slate-200 dark:border-white/10 overflow-y-auto relative min-h-[200px]">
                                                                        {isListening && <div className="absolute top-3 right-3 flex items-center gap-1.5 text-red-500 animate-pulse font-bold text-[10px] z-20"><div className="w-1.5 h-1.5 bg-red-500 rounded-full" /> 录音中</div>}
                                                                        <textarea className="w-full h-full bg-transparent resize-none outline-none text-slate-700 dark:text-slate-200 text-lg leading-relaxed placeholder:text-slate-400 font-medium" placeholder={isListening ? "正在将你的声音转化成灵魂语言..." : "请开始你的表达..."} value={currentSpeechText} onChange={(e) => setCurrentSpeechText(e.target.value)} />
                                                                    </div>
                                                                    <div className="flex gap-4">
                                                                        <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center overflow-hidden border-2 border-slate-200 dark:border-slate-700 h-16">
                                                                            <canvas ref={canvasRef} className="hidden" />
                                                                            <span className="text-3xl font-mono font-black text-slate-800 dark:text-white">{taskTimer}s</span>
                                                                        </div>
                                                                        <button onClick={() => handleTaskDone()} className="flex-[2] px-6 bg-teal-600 hover:bg-teal-500 text-white rounded-xl font-bold shadow-lg transition-all flex items-center justify-center gap-2 text-md">同步航行状态</button>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </>
                                                )}
                                            </div>

                                            {/* Sidebar Camera: Always present during VIEWING and EXECUTION if active */}
                                            {isCameraActive && !isMobile && (
                                                <motion.div initial={{ x: 30, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="w-72 bg-slate-900 rounded-3xl border border-slate-700 shadow-2xl overflow-hidden flex flex-col h-[520px] relative">
                                                    <div className="p-3 bg-slate-800 border-b border-slate-700 flex justify-between items-center">
                                                        <div className="flex items-center gap-2"><div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div><span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">AI Observation</span></div>
                                                        <div className="flex items-center gap-2">
                                                            {videoDevices.length > 1 && (
                                                                <button
                                                                    onClick={handleSwitchCamera}
                                                                    className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-teal-400 transition"
                                                                    title="切换摄像头"
                                                                >
                                                                    <Repeat size={14} />
                                                                </button>
                                                            )}
                                                            <Eye size={12} className="text-teal-400" />
                                                        </div>
                                                    </div>
                                                    <div className="flex-1 bg-black relative flex items-center justify-center overflow-hidden">
                                                        <video
                                                            ref={videoRef}
                                                            autoPlay
                                                            playsInline
                                                            muted
                                                            className="absolute inset-0 w-full h-full object-cover"
                                                            onLoadedMetadata={(e) => (e.currentTarget.play())}
                                                        />
                                                        <div className="absolute inset-0 pointer-events-none border-[15px] border-transparent">
                                                            <div className="absolute top-0 left-0 w-6 h-6 border-t border-l border-teal-500/40"></div>
                                                            <div className="absolute top-0 right-0 w-6 h-6 border-t border-r border-teal-500/40"></div>
                                                            <div className="absolute bottom-0 left-0 w-6 h-6 border-b border-l border-teal-500/40"></div>
                                                            <div className="absolute bottom-0 right-0 w-6 h-6 border-b border-r border-teal-500/40"></div>
                                                            <motion.div animate={{ top: ['5%', '95%', '5%'] }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }} className="absolute left-2 right-2 h-px bg-teal-500/20 blur-[1px] z-10" />
                                                        </div>
                                                    </div>
                                                    <div className="p-4 bg-slate-800/90 backdrop-blur-md">
                                                        <div className="flex items-center gap-2 mb-2"><BrainCircuit size={16} className="text-teal-400" /><h4 className="text-[10px] font-bold text-white uppercase tracking-wider">正在智能分析</h4></div>
                                                        <p className="text-[9px] text-slate-400 leading-relaxed italic">正在理解你的非语言信息及情感波动，这能让 AI 船长更深层次地洞察你的真实人格。</p>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <AnimatePresence>
                                {gameState.subPhase === 'PEER_REVIEW' && currentReviewer && (
                                    <PeerReviewModal
                                        reviewer={currentReviewer}
                                        actor={currentPlayer}
                                        hasHighEnergyBonus={highEnergyBonus}
                                        onSubmit={handlePeerScoreSubmit}
                                    />
                                )}

                                {/* Mic Volume Meter (During Task) */}
                                {gameState.subPhase === 'TASK_EXECUTION' && isListening && (
                                    <div className="absolute top-24 right-6 flex flex-col items-center gap-2">
                                        <div className="w-4 h-32 bg-slate-800 rounded-full overflow-hidden border border-slate-600 relative">
                                            <div
                                                className="absolute bottom-0 w-full transition-all duration-100 bg-gradient-to-t from-green-500 via-yellow-400 to-red-500"
                                                style={{ height: `${Math.min(100, micVolume * 200)}%` }} // Boost visual
                                            />
                                            {/* Marker line for threshold */}
                                            <div className="absolute bottom-[40%] w-full h-[2px] bg-white opacity-50"></div>
                                        </div>
                                        <Volume2 size={16} className={micVolume > 0.4 ? "text-red-500 animate-bounce" : "text-slate-500"} />
                                        {highEnergyBonus && <Zap size={16} className="text-yellow-400 fill-yellow-400 animate-pulse" />}
                                    </div>
                                )}</AnimatePresence>

                            <AnimatePresence>
                                {(gameState.subPhase === 'SELECTING_SCORE_TARGET' || gameState.subPhase === 'SELECTING_SUBSTITUTE' || gameState.subPhase === 'SELECTING_COMPANION') && (
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                                        <div className="w-full max-w-sm bg-white dark:bg-slate-800 p-6 rounded-2xl text-center border-2 border-amber-500/50 shadow-2xl">
                                            <h3 className="font-bold text-amber-500 dark:text-amber-400 mb-2 text-xl">
                                                {gameState.subPhase === 'SELECTING_SCORE_TARGET' && (gameState.activeModifier === 'CLONE' ? '👯 选择克隆对象' : '↔️ 选择转移对象')}
                                                {gameState.subPhase === 'SELECTING_SUBSTITUTE' && '🎭 寻找替身'}
                                                {gameState.subPhase === 'SELECTING_COMPANION' && '🤝 结伴同行'}
                                            </h3>
                                            <div className="grid grid-cols-2 gap-3 max-h-60 overflow-y-auto mt-4">
                                                {gameState.players.filter(p => p.id !== currentPlayer.id).map(p => (
                                                    <button key={p.id} onClick={() => {
                                                        if (gameState.subPhase === 'SELECTING_SCORE_TARGET') handleScoreTargetSelect(p.id);
                                                        if (gameState.subPhase === 'SELECTING_SUBSTITUTE') handleSubstituteSelect(p.id);
                                                        if (gameState.subPhase === 'SELECTING_COMPANION') handleCompanionSelect(p.id);
                                                    }} className="p-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-xl flex flex-col items-center gap-2 border border-transparent hover:border-amber-500 transition">
                                                        <div className="w-10 h-10 rounded-full bg-slate-300 dark:bg-slate-600 overflow-hidden">
                                                            {p.avatar.startsWith('data:') ? <img src={p.avatar} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center font-bold text-slate-700 dark:text-white">{p.name[0]}</div>}
                                                        </div>
                                                        <span className="text-sm font-bold text-slate-800 dark:text-white">{p.name}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Choosing Helper Modal */}
                            <AnimatePresence>
                                {gameState.subPhase === 'CHOOSING_HELPER' && (
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                                        <div className="w-full max-w-sm bg-white dark:bg-slate-800 p-6 rounded-2xl text-center">
                                            <h3 className="font-bold text-slate-800 dark:text-white mb-4">选择共振伙伴</h3>
                                            <div className="grid grid-cols-2 gap-3 max-h-60 overflow-y-auto">
                                                {gameState.players.filter(p => p.id !== currentPlayer.id).map(p => (
                                                    <button key={p.id} onClick={() => handleChooseHelper(p.id)} className="p-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-xl flex flex-col items-center gap-2">
                                                        <div className="w-8 h-8 rounded-full bg-slate-300 dark:bg-slate-600 overflow-hidden">
                                                            {p.avatar.startsWith('data:') ? <img src={p.avatar} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center font-bold text-slate-700 dark:text-white">{p.name[0]}</div>}
                                                        </div>
                                                        <span className="text-xs text-slate-800 dark:text-white">{p.name}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Player Avatar (Bottom Left - replaces Video) */}
                            <div className="absolute bottom-6 left-6 z-40">
                                <div className="relative group w-32 h-32">
                                    <div className="w-full h-full rounded-full overflow-hidden border-2 border-slate-200 dark:border-slate-700 shadow-2xl bg-white dark:bg-black flex items-center justify-center">
                                        {currentPlayer.avatar.startsWith('data:') ? (
                                            <img src={currentPlayer.avatar} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="text-4xl font-bold text-slate-400 dark:text-slate-500">{currentPlayer.name[0]}</div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Sidebar (Right/Bottom) */}
                        <div className={`bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-slate-200 dark:border-white/5 flex flex-col transition-all duration-300 z-20 shadow-xl ${isMobile ? 'w-full border-t min-h-[40vh]' : (isSidebarMinimized ? 'w-16 border-l' : 'w-64 border-l')}`}>
                            <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200 dark:border-white/5 shrink-0">
                                {!isSidebarMinimized && <span className="font-bold text-slate-400 text-xs uppercase tracking-widest">当前能量场</span>}
                                <button onClick={() => setIsSidebarMinimized(!isSidebarMinimized)} className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-white transition"><ChevronRight size={16} /></button>
                            </div>
                            {!isSidebarMinimized ? (
                                <div className="flex-1 flex flex-col overflow-hidden">
                                    <div
                                        className={`overflow-y-auto custom-scrollbar p-3 transition-all duration-300 ${gameState.players.length > 6 ? 'space-y-1.5' : 'space-y-3'}`}
                                        style={{ maxHeight: '65%' }}
                                    >
                                        {[...gameState.players].sort((a, b) => (b.trustScore + b.insightScore + b.expressionScore) - (a.trustScore + a.insightScore + a.expressionScore)).map((p) => {
                                            const total = p.trustScore + p.insightScore + p.expressionScore;
                                            const isCompact = gameState.players.length > 6;
                                            return (
                                                <div key={p.id} className={`rounded-xl border transition-all ${isCompact ? 'p-2' : 'p-3'} ${p.id === currentPlayer.id ? 'bg-slate-50 dark:bg-slate-800 border-teal-500/30 shadow-lg' : 'bg-transparent border-slate-100 dark:border-slate-800/50'}`}>
                                                    <div className="flex justify-between items-center mb-1.5">
                                                        <div className="flex items-center gap-2">
                                                            <div className={`rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-slate-700 dark:text-white overflow-hidden ring-1 ring-slate-300 dark:ring-slate-600 ${isCompact ? 'w-6 h-6 text-[9px]' : 'w-8 h-8 text-[10px]'}`}>
                                                                {p.avatar.startsWith('data:') ? <img src={p.avatar} className="w-full h-full object-cover" /> : p.name[0]}
                                                            </div>
                                                            <div className="leading-tight">
                                                                <div className={`font-bold text-slate-700 dark:text-slate-200 ${isCompact ? 'text-[10px]' : 'text-xs'}`}>{p.name}</div>
                                                                <div className="text-[9px] text-slate-400 dark:text-slate-500">{p.mbti}</div>
                                                            </div>
                                                        </div>
                                                        <div className={`font-bold text-amber-500 ${isCompact ? 'text-xs' : 'text-sm'}`}>{total}</div>
                                                    </div>
                                                    <div className="flex gap-1 text-[9px] text-slate-500">
                                                        <div className="flex-1 bg-slate-100 dark:bg-slate-900/40 rounded px-1.5 py-0.5 flex justify-between"><span>信</span><span className="text-blue-500 dark:text-blue-400">{p.trustScore}</span></div>
                                                        <div className="flex-1 bg-slate-100 dark:bg-slate-900/40 rounded px-1.5 py-0.5 flex justify-between"><span>觉</span><span className="text-purple-500 dark:text-purple-400">{p.insightScore}</span></div>
                                                        <div className="flex-1 bg-slate-100 dark:bg-slate-900/40 rounded px-1.5 py-0.5 flex justify-between"><span>表</span><span className="text-orange-500 dark:text-orange-400">{p.expressionScore}</span></div>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                    <div className="flex-1 bg-slate-50/50 dark:bg-slate-950/50 border-t border-slate-200 dark:border-slate-800 p-3 overflow-y-auto custom-scrollbar text-[10px] space-y-1.5 min-h-[150px]">
                                        {gameState.logs.slice(-30).map(l => (
                                            <div key={l.id} className="text-slate-500 dark:text-slate-400 leading-snug mb-1.5 border-b border-slate-200 dark:border-slate-900/50 pb-1">
                                                <span className="text-teal-600 dark:text-teal-500 font-bold mr-1">{l.author || '•'}</span>
                                                {l.text}
                                                {l.taskDetails && <div className="text-[9px] text-slate-400 dark:text-slate-600 mt-0.5 italic line-clamp-2">{l.taskDetails}</div>}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-4 py-4">
                                    {gameState.players.map(p => (
                                        <div key={p.id} className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-[10px] border ${p.id === currentPlayer.id ? 'border-teal-500 text-teal-500' : 'border-slate-300 dark:border-slate-700 text-slate-400'}`}>{p.name[0]}</div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
                {showConfig && <AIConfigModal onClose={() => setShowConfig(false)} />}
            </main>
        </div>
    );
}

export default App;