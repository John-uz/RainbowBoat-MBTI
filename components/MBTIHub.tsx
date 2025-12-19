
import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Trophy, Ship, Settings, Info, ArrowRight } from 'lucide-react';

interface Props {
    onSelectMode: (mode: 'test' | 'tasks' | 'party') => void;
    onOpenConfig: () => void;
    isMobile: boolean;
}

const MBTIHub: React.FC<Props> = ({ onSelectMode, onOpenConfig, isMobile }) => {
    const cards = [
        {
            id: 'test',
            title: 'AI 趣味快测',
            desc: '让 AI 帮你深度扫描人格原型',
            icon: <Sparkles className="text-teal-400" size={isMobile ? 28 : 32} />,
            color: 'from-teal-600/20 to-emerald-600/20',
            borderColor: 'border-teal-500/30',
            tag: '体验',
            tagColor: 'bg-teal-500'
        },
        {
            id: 'tasks',
            title: '任务挑战赛',
            desc: '体验人格进阶任务与心理分析',
            icon: <Trophy className="text-amber-400" size={isMobile ? 28 : 32} />,
            color: 'from-amber-600/20 to-orange-600/20',
            borderColor: 'border-amber-500/30',
            tag: '闯关',
            tagColor: 'bg-amber-500'
        },
        {
            id: 'party',
            title: '上船开 Party',
            desc: '彩虹船深度社交AI伴行',
            icon: <Ship className="text-blue-400" size={isMobile ? 28 : 32} />,
            color: 'from-blue-600/20 to-indigo-600/20',
            borderColor: 'border-blue-500/30',
            tag: '多人',
            tagColor: 'bg-blue-500'
        }
    ];

    return (
        <div className={`h-screen flex flex-col items-center justify-center px-4 md:px-6 relative overflow-hidden`}>
            {/* Background Decorative Elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 rounded-full blur-[120px] pointer-events-none" />

            {/* AI Config Button - Top Right */}
            <button
                onClick={onOpenConfig}
                className="absolute top-4 right-4 md:top-6 md:right-6 p-2.5 md:p-3 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 backdrop-blur-sm rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-teal-600 dark:hover:text-white transition-all z-20 shadow-sm"
                title="AI 配置"
            >
                <Settings size={isMobile ? 18 : 20} />
            </button>

            {/* Title */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-6 md:mb-10 relative z-10"
            >
                <h1 className={`${isMobile ? 'text-4xl' : 'text-5xl md:text-6xl'} font-black mb-2 tracking-tighter`}>
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500">
                        MBTI Hub
                    </span>
                </h1>
                <p className={`text-slate-500 dark:text-slate-400 ${isMobile ? 'text-sm' : 'text-lg md:text-xl'} font-medium`}>探索人格矩阵，启发多元表达</p>
            </motion.div>

            {/* Cards Grid - Responsive */}
            <div className={`${isMobile ? 'flex flex-col gap-3 w-full max-w-sm' : 'flex flex-row gap-6 w-full max-w-6xl'} h-auto max-h-[70vh] relative z-10`}>
                {cards.map((card, idx) => (
                    <motion.button
                        key={card.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.1 }}
                        whileHover={isMobile ? { scale: 1.02 } : { y: -12, scale: 1.05 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => onSelectMode(card.id as any)}
                        className={`group relative flex-1 flex ${isMobile ? 'flex-row items-center gap-4 p-4 min-h-[100px]' : 'flex-col text-left p-8 min-h-[320px] justify-between'} rounded-[2rem] border-2 ${card.borderColor} bg-white dark:bg-slate-900/40 shadow-xl hover:shadow-2xl dark:shadow-none backdrop-blur-xl overflow-hidden transition-all cursor-pointer`}
                    >
                        {/* Gradient Hover Effect */}
                        <div className={`absolute inset-0 bg-gradient-to-br ${card.color} opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none duration-500`} />
                        <div className="absolute inset-0 bg-white/40 dark:bg-slate-900/40 group-hover:opacity-0 transition-opacity pointer-events-none duration-500" />

                        {/* Icon */}
                        <div className={`relative z-10 ${isMobile ? 'p-3' : 'p-5 mb-4 w-fit'} bg-white dark:bg-slate-800 rounded-2xl group-hover:scale-110 group-hover:rotate-6 transition-all shadow-md group-hover:shadow-lg`}>
                            {card.icon}
                        </div>

                        {/* Content */}
                        <div className="relative z-10 flex-1 flex flex-col justify-center">
                            <div className="flex items-center gap-2 mb-2">
                                <h3 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-black text-slate-800 dark:text-white group-hover:scale-105 transition-transform origin-left`}>
                                    {card.title}
                                </h3>
                                <span className={`${card.tagColor} text-white text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest shadow-sm`}>
                                    {card.tag}
                                </span>
                            </div>
                            <p className={`text-slate-500 dark:text-slate-400 ${isMobile ? 'text-xs' : 'text-base'} leading-relaxed font-bold opacity-80 group-hover:opacity-100 transition-opacity`}>
                                {card.desc}
                            </p>
                        </div>

                        {!isMobile && (
                            <div className="relative z-10 flex items-center gap-2 text-slate-400 group-hover:text-white font-black text-sm uppercase tracking-tighter self-end mt-4">
                                Enter <ArrowRight size={16} />
                            </div>
                        )}
                    </motion.button>
                ))}
            </div>

            {/* Footer Info */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className={`mt-6 md:mt-10 flex items-center gap-2 text-slate-400 dark:text-slate-500 ${isMobile ? 'text-[10px]' : 'text-xs'} bg-slate-100 dark:bg-slate-800/20 px-4 py-2 rounded-full border border-slate-200 dark:border-slate-700/30`}
            >
                <Info size={isMobile ? 12 : 14} />
                <span>基于荣格八维理论设计</span>
            </motion.div>
        </div>
    );
};

export default MBTIHub;
