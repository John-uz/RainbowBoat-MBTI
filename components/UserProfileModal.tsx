import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, X, Shield, Sparkles, Award, Link, Check, RefreshCw, Smartphone, Key } from 'lucide-react';
import { MBTI_TYPES } from '../types';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    currentUser: {
        id: string;
        nickname: string;
        primary_mbti?: string;
        platform_source?: string;
        avatar_url?: string;
        jung_radar?: Record<string, number>;
    };
    onUpdateUser: (updated: any) => void;
}

export const UserProfileModal: React.FC<Props> = ({ isOpen, onClose, currentUser, onUpdateUser }) => {
    const [nickname, setNickname] = useState(currentUser.nickname || '潜意识船员');
    const [mbti, setMbti] = useState(currentUser.primary_mbti || '');
    const [bindCode, setBindCode] = useState<string>('');
    const [inputPin, setInputPin] = useState<string>('');
    const [pinLoading, setPinLoading] = useState(false);
    const [pinError, setPinError] = useState('');
    const [saving, setSaving] = useState(false);
    const [bindStatus, setBindStatus] = useState<string>('');
    const [historyRecords, setHistoryRecords] = useState<any[]>([]);

    const handlePinLogin = async () => {
        if (inputPin.length !== 6) return;
        setPinLoading(true);
        setPinError('');
        try {
            const res = await fetch('/api/auth/pin_login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pin: inputPin })
            });
            const data = await res.json();
            if (data.success && data.user) {
                onUpdateUser(data.user);
                setNickname(data.user.nickname);
                if (data.user.primary_mbti) setMbti(data.user.primary_mbti);
                setBindStatus(`🎉 成功登入为：${data.user.nickname}`);
                setInputPin('');
            } else {
                setPinError(data.error || '登录失败');
            }
        } catch (e: any) {
            setPinError('请求失败: ' + e.message);
        } finally {
            setPinLoading(false);
        }
    };

    const handleLogout = () => {
        const guestId = 'web_' + Math.random().toString(36).substring(2, 10);
        const guestUser = { id: guestId, nickname: '潜意识船员', platform_source: 'web' };
        localStorage.setItem('RAINBOW_BOAT_USER', JSON.stringify(guestUser));
        onUpdateUser(guestUser);
        setNickname('潜意识船员');
        setMbti('');
        setBindStatus('已切换回访客身份');
    };

    useEffect(() => {
        if (!isOpen || !currentUser.id) return;
        // 获取云端完整历史
        fetch(`/api/profile/${currentUser.id}`)
            .then(res => res.json())
            .then(res => {
                if (res.success && res.data) {
                    if (res.data.primary_mbti && !mbti) setMbti(res.data.primary_mbti);
                    if (res.data.records) setHistoryRecords(res.data.records);
                }
            })
            .catch(() => { });

        // 生成或派生当前用户的 6 位连接码
        const derivedCode = Math.abs(
            currentUser.id.split('').reduce((acc, char) => acc * 31 + char.charCodeAt(0), 7)
        ).toString().slice(-6).padStart(6, '8');
        setBindCode(derivedCode);
    }, [isOpen, currentUser.id]);

    const handleSave = async () => {
        setSaving(true);
        try {
            const body = {
                id: currentUser.id,
                nickname: nickname.trim() || '潜意识船员',
                primary_mbti: mbti,
                platform_source: currentUser.platform_source || 'web'
            };
            await fetch('/api/profile/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            onUpdateUser(body);
            setBindStatus('档案已同步至 Cloudflare 边缘数据库');
            setTimeout(() => setBindStatus(''), 2500);
        } catch (e: any) {
            setBindStatus('保存失败，请稍后重试');
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl relative max-h-[90vh] overflow-y-auto"
            >
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 dark:hover:text-white transition"
                >
                    <X size={20} />
                </button>

                {/* Header */}
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-teal-500/20">
                        <User size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            船员档案中枢
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20 font-mono">
                                Cloudflare D1
                            </span>
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            ID: <span className="font-mono">{currentUser.id.slice(0, 16)}...</span>
                        </p>
                    </div>
                </div>

                {/* Form Section */}
                <div className="space-y-4 mb-6">
                    <div>
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 block">
                            船员代号 / 昵称
                        </label>
                        <input
                            type="text"
                            value={nickname}
                            onChange={(e) => setNickname(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-800 dark:text-white outline-none focus:border-teal-500 transition"
                            placeholder="输入您的昵称"
                        />
                    </div>

                    <div>
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 block">
                            当前主导 MBTI 类型
                        </label>
                        <select
                            value={mbti}
                            onChange={(e) => setMbti(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-800 dark:text-white outline-none focus:border-teal-500 transition"
                        >
                            <option value="">未测验 (点击下方快测测定)</option>
                            {MBTI_TYPES.map((t) => (
                                <option key={t} value={t}>
                                    {t}
                                </option>
                            ))}
                        </select>
                    </div>

                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="w-full py-3 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white rounded-xl font-bold text-sm shadow-md transition flex items-center justify-center gap-2"
                    >
                        {saving ? <RefreshCw className="animate-spin" size={16} /> : <Check size={16} />}
                        保存并同步云端档案
                    </button>
                    {bindStatus && <p className="text-xs text-center text-teal-500 font-bold">{bindStatus}</p>}
                </div>

                {/* PIN Code Quick Login from Telegram / Feishu */}
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 mb-6">
                    <div className="flex items-center gap-2 mb-1.5 text-amber-600 dark:text-amber-400 font-bold text-xs">
                        <Key size={14} /> Telegram 快速免密登入 / 切换账号
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed mb-3">
                        在 Telegram 给 <strong>@PsiMap_bot</strong> 发送 <code>/login</code> 或 <code>/admin</code> 获取 6 位登录 PIN 码：
                    </p>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            maxLength={6}
                            value={inputPin}
                            onChange={(e) => setInputPin(e.target.value.replace(/\D/g, ''))}
                            placeholder="输入 6 位数字 PIN"
                            className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-center font-mono font-bold text-sm tracking-widest text-slate-800 dark:text-white outline-none focus:border-amber-500 transition"
                        />
                        <button
                            onClick={handlePinLogin}
                            disabled={inputPin.length !== 6 || pinLoading}
                            className="px-4 bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition shadow-sm"
                        >
                            {pinLoading ? "验证中..." : "登入"}
                        </button>
                    </div>
                    {pinError && <p className="text-[10px] text-red-500 mt-1 font-bold">{pinError}</p>}
                </div>

                {/* Cross-Platform Binding Card */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 mb-6">
                    <div className="flex items-center gap-2 mb-2 text-indigo-600 dark:text-indigo-400 font-bold text-xs">
                        <Link size={14} /> 跨平台身份打通与绑定 (Telegram / 飞书)
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed mb-3">
                        想把网页端的测试记录同步到 Telegram 机器人？在 Telegram 中给 <strong>@PsiMap_bot</strong> 发送以下指令即可打通：
                    </p>
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono text-sm">
                        <span className="text-teal-600 dark:text-teal-400 font-bold">/bind {bindCode}</span>
                        <span className="text-[10px] text-slate-400">专属连接码</span>
                    </div>
                </div>

                {/* Logout Action */}
                <div className="mb-6 flex justify-between items-center text-xs">
                    <span className="text-slate-400">当前来源: {currentUser.platform_source || '网页'}</span>
                    <button
                        onClick={handleLogout}
                        className="text-red-500 hover:text-red-600 font-bold underline transition"
                    >
                        退出当前身份 (切回新访客)
                    </button>
                </div>

                {/* Recent History */}
                {historyRecords.length > 0 && (
                    <div>
                        <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1.5">
                            <Award size={14} /> 云端历史战绩 ({historyRecords.length})
                        </h4>
                        <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                            {historyRecords.map((rec, i) => (
                                <div
                                    key={i}
                                    className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/40 flex items-center justify-between text-xs"
                                >
                                    <div>
                                        <span className="font-bold text-slate-800 dark:text-white">
                                            {rec.game_mode === 'quick_test' ? '🧭 趣味快测' : '🚢 潜意识航行'}
                                        </span>
                                        <span className="text-[10px] text-slate-400 ml-2">{rec.created_at}</span>
                                    </div>
                                    <span className="text-teal-500 font-mono font-bold">#{rec.record_id}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </motion.div>
        </div>
    );
};
