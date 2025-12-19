
import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Trophy, Ship, ArrowRight, Info } from 'lucide-react';

interface Props {
    onSelectMode: (mode: 'test' | 'tasks' | 'party') => void;
}

const MBTIHub: React.FC<Props> = ({ onSelectMode }) => {
    const cards = [
        {
            id: 'test',
            title: 'AI 趣味快测',
            desc: '想快速了解自己的人格原型？让 AI 帮你深度扫描。',
            icon: <Sparkles className="text-teal-400" size={32} />,
            color: 'from-teal-600/20 to-emerald-600/20',
            borderColor: 'border-teal-500/30',
            tag: '推荐',
            tagColor: 'bg-teal-500'
        },
        {
            id: 'tasks',
            title: '任务挑战赛',
            desc: '单纯体验人格进阶任务，获取实时心理学分析结果。',
            icon: <Trophy className="text-amber-400" size={32} />,
            color: 'from-amber-600/20 to-orange-600/20',
            borderColor: 'border-amber-500/30',
            tag: '热门',
            tagColor: 'bg-amber-500'
        },
        {
            id: 'party',
            title: '上船开 Party',
            desc: '经典彩虹船博弈社交。建立信任，觉察自我，在大海上航行。',
            icon: <Ship className="text-blue-400" size={32} />,
            color: 'from-blue-600/20 to-indigo-600/20',
            borderColor: 'border-blue-500/30',
            tag: '多人',
            tagColor: 'bg-blue-500'
        }
    ];

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-y-auto">
            {/* Background Decorative Elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px]" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 rounded-full blur-[120px]" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-12 relative z-10"
            >
                <h1 className="text-5xl md:text-6xl font-black mb-4 tracking-tighter">
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-red-400 via-yellow-400 via-green-400 via-blue-400 to-purple-400">
                        MBTI Hub
                    </span>
                </h1>
                <p className="text-slate-400 text-lg md:text-xl font-medium">探索人格矩阵，启发多元表达</p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-6xl relative z-10">
                {cards.map((card, idx) => (
                    <motion.button
                        key={card.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.1 }}
                        whileHover={{ y: -8, scale: 1.02 }}
                        onClick={() => onSelectMode(card.id as any)}
                        className={`group relative flex flex-col text-left p-8 rounded-3xl border ${card.borderColor} bg-slate-900/40 backdrop-blur-xl overflow-hidden transition-all`}
                    >
                        {/* Gradient Hover Effect */}
                        <div className={`absolute inset-0 bg-gradient-to-br ${card.color} opacity-0 group-hover:opacity-100 transition-opacity`} />

                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-6">
                                <div className="p-4 bg-slate-800/50 rounded-2xl group-hover:scale-110 transition-transform">
                                    {card.icon}
                                </div>
                                <span className={`${card.tagColor} text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest`}>
                                    {card.tag}
                                </span>
                            </div>

                            <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-slate-400 transition-all">
                                {card.title}
                            </h3>
                            <p className="text-slate-400 text-sm leading-relaxed mb-8 min-h-[4rem]">
                                {card.desc}
                            </p>

                            <div className="flex items-center gap-2 text-sm font-bold text-slate-300 group-hover:text-white group-hover:gap-4 transition-all">
                                立即进入 <ArrowRight size={16} />
                            </div>
                        </div>
                    </motion.button>
                ))}
            </div>

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="mt-16 flex items-center gap-2 text-slate-500 text-sm bg-slate-800/20 px-6 py-3 rounded-full border border-slate-700/30"
            >
                <Info size={16} />
                <span>基于荣格八维理论（Jungian Functions）设计，优先保障桌面端沉浸体验</span>
            </motion.div>
        </div>
    );
};

export default MBTIHub;
