
import React, { useState } from 'react';
import { Player, GameMode } from '../types';
import { Trophy, Star, TrendingUp, User, Activity, Download, Home, Music, Heart, Lock, Unlock, ChevronDown, Award, HeartHandshake, Lightbulb, Sparkles, Brain, Zap, QrCode, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeCanvas } from 'qrcode.react';
import LZString from 'lz-string';

interface Props {
    players: Player[];
    report: { groupAnalysis: string, playerAnalysis: Record<string, string> };
    onReturnHome: () => void;
    startTime: number;
    gameMode: GameMode;
}

// Reusable Static Card Component for Awards
// Optimized: Shorter height, Larger Avatar, Top-Left Icon, Larger Title
const AwardCard: React.FC<{
    title: string;
    icon: React.ReactNode;
    player: Player;
    gradientClass: string; // Background gradient
    borderColorClass: string;
    glowColor: string;
    desc: string;
}> = ({ title, icon, player, gradientClass, borderColorClass, glowColor, desc }) => {
    return (
        <div className={`relative w-full overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 border-t border-white/20 ${gradientClass} group`}>
            {/* Background Atmosphere */}
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-white opacity-10 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-full h-3/4 bg-gradient-to-t from-black/60 via-black/20 to-transparent pointer-events-none"></div>

            <div className="relative z-10 flex flex-col items-center p-5 text-center">
                {/* Header: Icon Top-Left & Title Center */}
                <div className="w-full flex justify-center items-center relative mb-4">
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 text-white/80 group-hover:text-white group-hover:scale-110 transition-all duration-500 filter drop-shadow-md">
                        {icon}
                    </div>
                    <h3 className="text-2xl font-black text-white tracking-wider drop-shadow-md">{title}</h3>
                </div>

                {/* Body: Avatar & Name */}
                <div className="flex-1 flex flex-col items-center justify-center w-full mb-3">
                    <div className="relative mb-3">
                        {/* Avatar Halo */}
                        <div className="absolute inset-0 bg-white/20 rounded-full blur-md transform scale-110 group-hover:scale-125 transition duration-700"></div>

                        {/* Larger Avatar */}
                        <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white/90 relative z-10 shadow-2xl bg-slate-200 dark:bg-slate-700">
                            {player.avatar.startsWith('data:') ? (
                                <img src={player.avatar} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center font-bold text-4xl text-slate-500">{player.name[0]}</div>
                            )}
                        </div>
                        {/* MBTI Badge */}
                        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-white text-slate-900 text-xs font-bold px-3 py-0.5 rounded-full shadow-lg z-20 border border-slate-200 whitespace-nowrap">
                            {player.mbti}
                        </div>
                    </div>

                    <div className="text-3xl font-bold text-white drop-shadow-md mt-2">{player.name}</div>
                </div>

                {/* Footer: Description */}
                <div className="w-full bg-black/20 backdrop-blur-md border border-white/10 rounded-xl p-2.5 flex items-center justify-center">
                    <p className="text-xs text-white/90 font-medium leading-snug">
                        {desc}
                    </p>
                </div>
            </div>
        </div>
    );
};

const GameReport: React.FC<Props> = ({ players, report, onReturnHome, startTime, gameMode }) => {
    const [revealedSections, setRevealedSections] = useState<Record<string, boolean>>({
        'awards': true,
        'group': false,
        'winner': false
    });
    const [revealedPlayers, setRevealedPlayers] = useState<Record<string, boolean>>({});
    const [showQR, setShowQR] = useState(false);

    const shareUrl = `${window.location.origin}${window.location.pathname}?share_data=${LZString.compressToEncodedURIComponent(
        JSON.stringify({ players, report, startTime, gameMode })
    )}`;

    const sortedPlayers = [...players].sort((a, b) =>
        (b.trustScore + b.insightScore + b.expressionScore) - (a.trustScore + a.insightScore + a.expressionScore)
    );

    const winner = sortedPlayers[0];
    const getWinner = (key: 'trustScore' | 'insightScore' | 'expressionScore') =>
        [...players].sort((a, b) => b[key] - a[key])[0];

    const niceGuy = [...players].sort((a, b) => b.totalRatingGiven - a.totalRatingGiven)[0];

    const toggleSection = (key: string) => {
        setRevealedSections(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const togglePlayer = (id: string) => {
        setRevealedPlayers(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const downloadCyberArchive = () => {
        const dateStr = new Date(startTime).toLocaleString('zh-CN');
        const duration = Math.floor((Date.now() - startTime) / 60000);

        const content = `
        <!DOCTYPE html>
        <html lang="zh-CN">
        <head>
            <meta charset="UTF-8">
            <title>彩虹船 - 航行档案 (${dateStr})</title>
            <style>
                body { font-family: sans-serif; background: #0f172a; color: #e2e8f0; padding: 40px; max-width: 800px; margin: 0 auto; }
                h1, h2 { color: #2dd4bf; border-bottom: 1px solid #334155; padding-bottom: 10px; }
                .card { background: #1e293b; padding: 20px; margin-bottom: 20px; border-radius: 12px; border: 1px solid #334155; }
                .highlight { color: #f59e0b; font-weight: bold; }
                .player-row { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; padding: 10px; background: #0f172a; border-radius: 8px; }
                .tag { font-size: 0.8em; padding: 2px 8px; border-radius: 12px; background: #334155; }
            </style>
        </head>
        <body>
            <h1>🌈 彩虹船 - 航行日志</h1>
            <div class="card">
                <p><strong>起航时间:</strong> ${dateStr}</p>
                <p><strong>航行时长:</strong> ${duration} 分钟</p>
                <p><strong>海域模式:</strong> ${gameMode}</p>
                <p><strong>船员人数:</strong> ${players.length} 人</p>
            </div>

            <h2>🏆 荣誉殿堂</h2>
            <div class="card">
                <p>👑 <strong>天选之子 (总分第一):</strong> ${winner.name}</p>
                <p>🤝 <strong>最佳盟友奖 (信任最高):</strong> ${getWinner('trustScore').name}</p>
                <p>🧠 <strong>人间清醒奖 (觉察最高):</strong> ${getWinner('insightScore').name}</p>
                <p>🎭 <strong>戏精本精奖 (表现最高):</strong> ${getWinner('expressionScore').name}</p>
                <p>💖 <strong>温暖守护奖 (评分最慷慨):</strong> ${niceGuy.name}</p>
            </div>

            <h2>🌊 群体共振</h2>
            <div class="card">
                <p>${report.groupAnalysis}</p>
            </div>

            <h2>👤 船员深度档案</h2>
            ${sortedPlayers.map(p => `
                <div class="card">
                    <div class="player-row">
                        <strong>${p.name}</strong> <span class="tag">${p.mbti}</span>
                        <span style="margin-left:auto" class="highlight">总分: ${p.trustScore + p.insightScore + p.expressionScore}</span>
                    </div>
                    <p><em>"${report.playerAnalysis[p.id] || '数据迷失在星辰大海...'}"</em></p>
                    <p style="font-size: 0.9em; opacity: 0.8">
                        信任: ${p.trustScore} | 觉察: ${p.insightScore} | 表现: ${p.expressionScore}
                    </p>
                </div>
            `).join('')}
            
            <footer style="text-align: center; margin-top: 40px; color: #64748b; font-size: 0.8em;">
                Generated by Rainbow Boat
            </footer>
        </body>
        </html>
      `;

        const blob = new Blob([content], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `彩虹船_航行档案_${new Date().toISOString().slice(0, 10)}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="h-full w-full overflow-y-auto p-8 bg-slate-50/80 dark:bg-slate-900/80 text-slate-800 dark:text-white custom-scrollbar transition-colors duration-300 backdrop-blur-sm">
            <div className="max-w-6xl mx-auto space-y-8 pb-20">

                {/* Header */}
                <div className="text-center space-y-2">
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="inline-block p-4 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full shadow-lg mb-4">
                        <Trophy size={48} className="text-white" />
                    </motion.div>
                    <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-[linear-gradient(to_right,#ef4444,#f97316,#eab308,#22c55e,#3b82f6,#a855f7)]">彩虹归港 · 顺利抵达</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-lg font-light tracking-wide">彩虹船 · 航行日志</p>
                </div>

                {/* Section: Awards Grid */}
                <div className="space-y-6">
                    <div className="flex items-center gap-2 px-2">
                        <Award className="text-teal-600 dark:text-teal-400" />
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">荣誉殿堂</h2>
                    </div>

                    <AnimatePresence>
                        {revealedSections['awards'] && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                <AwardCard
                                    title="最佳盟友奖"
                                    icon={<HeartHandshake size={32} />}
                                    player={getWinner('trustScore')}
                                    gradientClass="bg-gradient-to-br from-blue-400 to-blue-600"
                                    borderColorClass="border-blue-300"
                                    glowColor="#60a5fa"
                                    desc={`信任分: ${getWinner('trustScore').trustScore} - 能够让人卸下防备的温暖港湾。`}
                                />
                                <AwardCard
                                    title="人间清醒奖"
                                    icon={<Lightbulb size={32} />}
                                    player={getWinner('insightScore')}
                                    gradientClass="bg-gradient-to-br from-purple-400 to-purple-600"
                                    borderColorClass="border-purple-300"
                                    glowColor="#a855f7"
                                    desc={`觉察分: ${getWinner('insightScore').insightScore} - 拥有穿透迷雾的深刻洞察力。`}
                                />
                                <AwardCard
                                    title="戏精本精奖"
                                    icon={<Sparkles size={32} />}
                                    player={getWinner('expressionScore')}
                                    gradientClass="bg-gradient-to-br from-orange-400 to-red-500"
                                    borderColorClass="border-orange-300"
                                    glowColor="#f97316"
                                    desc={`表现分: ${getWinner('expressionScore').expressionScore} - 舞台光芒无法被掩盖的灵魂。`}
                                />
                                <AwardCard
                                    title="温暖守护奖"
                                    icon={<Heart size={32} />}
                                    player={niceGuy}
                                    gradientClass="bg-gradient-to-br from-pink-400 to-rose-600"
                                    borderColorClass="border-pink-300"
                                    glowColor="#ec4899"
                                    desc={`慷慨给予: ${niceGuy.totalRatingGiven}星 - 总是对他人的闪光点不吝赞美。`}
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Grand Winner - Full Width Card */}
                    <div className="mt-12 flex justify-center">
                        <button onClick={() => toggleSection('winner')} className="relative group w-full max-w-3xl">
                            <div className={`w-full p-1 rounded-3xl transition-all duration-500 transform hover:scale-[1.02] ${revealedSections['winner'] ? 'bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-300 animate-pulse' : 'bg-slate-200 dark:bg-slate-700'}`}>
                                <div className={`w-full h-full p-8 rounded-[22px] border-2 flex flex-col items-center shadow-2xl relative overflow-hidden ${revealedSections['winner'] ? 'bg-slate-50 dark:bg-slate-900 border-transparent' : 'bg-slate-100 dark:bg-slate-800 border-dashed border-slate-300 dark:border-slate-600'}`}>

                                    {!revealedSections['winner'] ? (
                                        <div className="py-8 flex flex-col items-center text-slate-500 dark:text-slate-400">
                                            <Lock size={48} className="mb-4 text-slate-400 dark:text-slate-500" />
                                            <span className="font-bold text-xl">点击揭晓：天选之子</span>
                                        </div>
                                    ) : (
                                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative z-10 flex flex-col md:flex-row items-center gap-10 w-full justify-center">
                                            {/* Winner Glow */}
                                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-yellow-500/20 rounded-full blur-3xl -z-10"></div>

                                            <div className="relative">
                                                <div className="w-40 h-40 rounded-full overflow-hidden border-[6px] border-yellow-400 shadow-[0_0_30px_rgba(251,191,36,0.6)]">
                                                    {winner.avatar.startsWith('data:') ? <img src={winner.avatar} className="w-full h-full object-cover" /> : <div className="bg-slate-200 dark:bg-slate-700 w-full h-full flex items-center justify-center font-bold text-5xl">{winner.name[0]}</div>}
                                                </div>
                                                <div className="absolute -top-6 -right-6 text-7xl drop-shadow-lg filter animate-bounce">👑</div>
                                            </div>
                                            <div className="text-center md:text-left">
                                                <div className="text-amber-500 dark:text-amber-400 font-black text-2xl mb-2 uppercase tracking-[0.2em]">天选之子</div>
                                                <div className="text-5xl font-black text-slate-900 dark:text-white mb-4 drop-shadow-sm">{winner.name}</div>

                                                <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                                                    <div className="bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700">
                                                        <span className="text-lg font-bold text-slate-800 dark:text-white">{winner.mbti}</span>
                                                    </div>
                                                    <div className="bg-yellow-50 dark:bg-yellow-900/20 px-4 py-2 rounded-lg border border-yellow-200 dark:border-yellow-700">
                                                        <span className="text-sm text-yellow-600 dark:text-yellow-500 mr-2">总能量</span>
                                                        <span className="text-2xl font-black text-yellow-600 dark:text-yellow-400">{winner.trustScore + winner.insightScore + winner.expressionScore}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </div>
                            </div>
                        </button>
                    </div>
                </div>

                {/* Section: Group Analysis */}
                <div className="space-y-4 pt-8 border-t border-slate-200 dark:border-slate-700/50">
                    <button onClick={() => toggleSection('group')} className="w-full flex items-center justify-between p-6 bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 hover:border-teal-500 transition group">
                        <span className="font-bold text-xl flex items-center gap-3 text-teal-600 dark:text-teal-400 group-hover:scale-105 transition-transform"><Activity /> 群体画像</span>
                        {revealedSections['group'] ? <ChevronDown /> : <Lock size={18} className="text-slate-400" />}
                    </button>
                    <AnimatePresence>
                        {revealedSections['group'] && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                                <div className="text-slate-700 dark:text-slate-200 leading-relaxed text-lg bg-slate-50 dark:bg-slate-900/80 p-8 rounded-2xl border border-slate-200 dark:border-slate-700/50 shadow-inner whitespace-pre-wrap">
                                    {report.groupAnalysis || "AI 正在疯狂计算你们的友谊..."}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Section: Player Analysis */}
                <div className="space-y-4 pt-4">
                    <h2 className="text-xl font-bold flex items-center gap-2 text-blue-600 dark:text-blue-400 px-2"><User /> 船员深度档案 (点击查看)</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {sortedPlayers.map((p, i) => (
                            <motion.div key={p.id} className={`bg-white dark:bg-slate-800/60 backdrop-blur rounded-xl border transition-all duration-300 ${revealedPlayers[p.id] ? 'border-teal-500 shadow-lg ring-1 ring-teal-500/20' : 'border-slate-200 dark:border-slate-700 hover:border-slate-400'}`}>
                                <button onClick={() => togglePlayer(p.id)} className="w-full p-4 flex items-center gap-4 text-left">
                                    <div className="w-14 h-14 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 shrink-0 shadow-sm">
                                        {p.avatar.startsWith('data:') ? <img src={p.avatar} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center font-bold text-xl">{p.name[0]}</div>}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="font-bold text-lg text-slate-800 dark:text-white">{p.name}</span>
                                            <span className="text-xs bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 px-2 py-1 rounded-full font-mono border border-slate-200 dark:border-slate-700">{p.mbti}</span>
                                        </div>
                                        <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                            {!revealedPlayers[p.id] ? <><Lock size={12} /> 点击揭晓深度分析...</> : <><Unlock size={12} className="text-teal-500" /> 档案已解密</>}
                                        </div>
                                    </div>
                                </button>

                                <AnimatePresence>
                                    {revealedPlayers[p.id] && (
                                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden px-4 pb-4 border-t border-slate-100 dark:border-slate-700/50">
                                            <div className="pt-4">
                                                <p className="text-sm text-slate-700 dark:text-slate-300 italic mb-4 bg-slate-50 dark:bg-slate-900/30 p-4 rounded-lg border-l-4 border-teal-500 whitespace-pre-wrap leading-relaxed">
                                                    "{report.playerAnalysis[p.id] || "AI 觉得你深不可测..."}"
                                                </p>
                                                <div className="flex gap-2 text-xs font-mono opacity-90">
                                                    <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">信任: {p.trustScore}</span>
                                                    <span className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-1 rounded">觉察: {p.insightScore}</span>
                                                    <span className="bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 px-2 py-1 rounded">表现: {p.expressionScore}</span>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        ))}
                    </div>
                </div>

                <div className="flex justify-center pt-8 gap-4">
                    <button onClick={downloadCyberArchive} className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 text-white px-6 py-3 rounded-full font-bold transition shadow-lg border border-slate-600">
                        <Download size={20} /> 赛博珍藏
                    </button>
                    <button onClick={() => setShowQR(true)} className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white px-6 py-3 rounded-full font-bold transition shadow-lg border border-purple-400">
                        <QrCode size={20} /> 手机带走
                    </button>
                    <button onClick={onReturnHome} className="flex items-center gap-2 bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-500 hover:to-blue-500 text-white px-8 py-3 rounded-full font-bold transition shadow-lg transform hover:scale-105">
                        <Home size={20} /> 返回主页
                    </button>
                </div>
                {showQR && (
                    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-900/95 backdrop-blur-md p-4 animate-in fade-in duration-300">
                        <div className="w-full max-w-5xl h-[85vh] flex flex-col bg-slate-800 rounded-3xl overflow-hidden shadow-2xl border border-slate-700">

                            {/* Header */}
                            <div className="p-6 border-b border-slate-700 flex justify-between items-center bg-slate-800 z-10">
                                <div>
                                    <h3 className="text-2xl font-bold text-white flex items-center gap-2"><QrCode className="text-purple-500" /> 船票分发 · 赛博珍藏</h3>
                                    <p className="text-slate-400 text-sm mt-1">请每位船员扫描属于自己的船票，获取专属航行分析。</p>
                                </div>
                                <button onClick={() => setShowQR(false)} className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-full font-bold transition">
                                    <X size={20} /> 关闭
                                </button>
                            </div>

                            {/* Scrollable Content */}
                            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {sortedPlayers.map((p) => {
                                        // Generate Per-Player Data
                                        // Filter report to only include Group + This Player
                                        const personalData = {
                                            players: [p], // Only this player
                                            report: {
                                                groupAnalysis: report.groupAnalysis, // Keep Group
                                                playerAnalysis: { [p.id]: report.playerAnalysis[p.id] } // Only their analysis
                                            },
                                            startTime,
                                            gameMode
                                        };
                                        const personalUrl = `${window.location.origin}${window.location.pathname}?share_data=${LZString.compressToEncodedURIComponent(JSON.stringify(personalData))}`;

                                        return (
                                            <div key={p.id} className="bg-slate-900 rounded-2xl p-6 border border-slate-700 flex flex-col items-center gap-4 hover:border-purple-500 transition-colors group">
                                                <div className="flex items-center gap-4 w-full">
                                                    <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-800 border border-slate-600">
                                                        {p.avatar.startsWith('data:') ? <img src={p.avatar} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center font-bold text-lg text-white">{p.name[0]}</div>}
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="font-bold text-white text-lg">{p.name}</div>
                                                        <div className="text-xs text-purple-400 font-mono">{p.mbti}</div>
                                                    </div>
                                                </div>

                                                <div className="p-3 bg-white rounded-xl shadow-inner mt-2">
                                                    <QRCodeCanvas value={personalUrl} size={160} level={"M"} includeMargin={false} />
                                                </div>

                                                <p className="text-xs text-slate-500 text-center">
                                                    扫码获取<br /><span className="text-purple-400">"{p.name}"</span> 的专属报告
                                                </p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default GameReport;
