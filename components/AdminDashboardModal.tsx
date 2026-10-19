import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, X, RefreshCw, Users, FileText, Ship, Trash2, CheckCircle2, Zap, Database } from 'lucide-react';

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

export const AdminDashboardModal: React.FC<Props> = ({ isOpen, onClose }) => {
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState({ userCount: 0, reportCount: 0, roomCount: 0 });
    const [rooms, setRooms] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [message, setMessage] = useState('');
    const [aiStatus, setAiStatus] = useState<string>('');

    const fetchAdminData = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/auth/admin_stats');
            const data = await res.json();
            if (data.success) {
                setStats(data.stats);
                setRooms(data.rooms || []);
                setUsers(data.users || []);
            }
        } catch (e: any) {
            setMessage('数据加载失败: ' + e.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchAdminData();
        }
    }, [isOpen]);

    const handleResetRoom = async (roomId: string) => {
        if (!confirm(`确认强制解散房间 ${roomId} 吗？`)) return;
        try {
            const res = await fetch('/api/auth/reset_room', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ roomId })
            });
            const data = await res.json();
            if (data.success) {
                setRooms(prev => prev.filter(r => r.room_id !== roomId));
                setMessage(`房间 ${roomId} 已成功重置`);
                setTimeout(() => setMessage(''), 3000);
            }
        } catch (e: any) {
            alert('操作失败: ' + e.message);
        }
    };

    const handleTestAiGateway = async () => {
        setAiStatus('正在探测 Cloudflare Edge AI 链路...');
        try {
            const res = await fetch('/api/ai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userPrompt: "请用一句话问好并返回合法JSON，key为 greeting",
                    systemPrompt: "返回合法的JSON格式",
                    skipCache: true
                })
            });
            const json = await res.json();
            if (json.success) {
                setAiStatus(`✅ 链路健康！响应通道: ${json.provider}`);
            } else {
                setAiStatus(`❌ 探测异常: ${json.error}`);
            }
        } catch (e: any) {
            setAiStatus(`❌ 请求失败: ${e.message}`);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white dark:bg-slate-900 border-2 border-amber-500/50 rounded-3xl p-6 md:p-8 max-w-2xl w-full shadow-2xl relative max-h-[90vh] overflow-y-auto"
            >
                {/* Close */}
                <button
                    onClick={onClose}
                    className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 dark:hover:text-white transition"
                >
                    <X size={22} />
                </button>

                {/* Header */}
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500 flex items-center justify-center text-white shadow-lg shadow-amber-500/20">
                        <ShieldAlert size={26} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                            彩虹船 · 超级管理员控制大屏
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/30 uppercase font-mono">
                                Master Access
                            </span>
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            Cloudflare Pages + D1 Database 全局运维中枢
                        </p>
                    </div>
                </div>

                {message && (
                    <div className="mb-4 p-3 bg-teal-500/10 border border-teal-500/30 rounded-xl text-teal-600 dark:text-teal-400 text-xs font-bold flex items-center gap-2">
                        <CheckCircle2 size={16} /> {message}
                    </div>
                )}

                {/* Stats Cards */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                    <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/60 text-center">
                        <Users className="mx-auto text-blue-500 mb-1" size={20} />
                        <div className="text-2xl font-black text-slate-900 dark:text-white">{stats.userCount}</div>
                        <div className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">总用户量</div>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/60 text-center">
                        <FileText className="mx-auto text-teal-500 mb-1" size={20} />
                        <div className="text-2xl font-black text-slate-900 dark:text-white">{stats.reportCount}</div>
                        <div className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">测验战报</div>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/60 text-center">
                        <Ship className="mx-auto text-purple-500 mb-1" size={20} />
                        <div className="text-2xl font-black text-slate-900 dark:text-white">{stats.roomCount}</div>
                        <div className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">进行中房间</div>
                    </div>
                </div>

                {/* AI Gateway Health Tester */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/50 mb-6">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-white">
                            <Zap size={16} className="text-amber-500" /> AI 边缘网关健康探测 (Groq / Gemini / DeepSeek)
                        </div>
                        <button
                            onClick={handleTestAiGateway}
                            className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold transition shadow-sm"
                        >
                            立刻探测
                        </button>
                    </div>
                    {aiStatus && (
                        <div className="text-xs font-mono p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                            {aiStatus}
                        </div>
                    )}
                </div>

                {/* Active Rooms */}
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                            <Ship size={14} /> 活跃游戏房间管理 ({rooms.length})
                        </h3>
                        <button onClick={fetchAdminData} className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-xs flex items-center gap-1">
                            <RefreshCw size={12} className={loading ? "animate-spin" : ""} /> 刷新
                        </button>
                    </div>
                    {rooms.length === 0 ? (
                        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/30 text-center text-xs text-slate-400">
                            当前没有进行中的群组房间
                        </div>
                    ) : (
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                            {rooms.map(room => (
                                <div
                                    key={room.room_id}
                                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between text-xs"
                                >
                                    <div>
                                        <span className="font-mono font-bold text-amber-500 mr-2">#{room.room_id}</span>
                                        <span className="text-slate-600 dark:text-slate-300 font-medium">状态: {room.status}</span>
                                        <span className="text-[10px] text-slate-400 ml-2">发起人: {room.host_user_id}</span>
                                    </div>
                                    <button
                                        onClick={() => handleResetRoom(room.room_id)}
                                        className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 transition"
                                        title="强制解散房间"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Recent Users */}
                <div>
                    <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <Database size={14} /> 最近注册与同步用户 ({users.length})
                    </h3>
                    <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                        {users.map((u, i) => (
                            <div key={i} className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/30 text-[11px] flex items-center justify-between border border-slate-100 dark:border-slate-800">
                                <div>
                                    <span className="font-bold text-slate-800 dark:text-slate-200 mr-2">{u.nickname}</span>
                                    {u.primary_mbti && <span className="px-1.5 py-0.2 rounded bg-teal-500/20 text-teal-500 font-mono text-[9px] mr-2">{u.primary_mbti}</span>}
                                    <span className="text-[9px] text-slate-400">来源: {u.platform_source}</span>
                                </div>
                                <span className="font-mono text-slate-400 text-[10px]">{u.updated_at}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </motion.div>
        </div>
    );
};
