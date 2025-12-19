
import React, { useState, useRef } from 'react';
import { X, Save, RotateCcw, Cpu, Key, MessageSquare, AlertTriangle, PlayCircle, Download, Upload, ShieldCheck, Flag, Globe } from 'lucide-react';
import { getAIConfig, updateAIConfig, AIConfig, SYSTEM_KEYS } from '../services/geminiService';

interface Props {
    onClose: () => void;
}

const AIConfigModal: React.FC<Props> = ({ onClose }) => {
    const [activeTab, setActiveTab] = useState<'keys' | 'prompts'>('keys');
    const [config, setConfig] = useState<AIConfig>(getAIConfig());
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleSave = () => {
        updateAIConfig(config);
        onClose();
        const regionDesc = config.regionMode === 'china' ? "中国大陆 (DeepSeek/Zhipu)" : (config.regionMode === 'overseas' ? "国际海外 (Groq/Gemini)" : "智能感知");
        alert(`AI 配置已保存！\n当前航路: ${regionDesc}`);
    };

    const handleReset = () => {
        if (confirm("确定重置所有 prompt 为默认值吗？")) {
            localStorage.removeItem('PSYCHEPOLY_AI_CONFIG_V2');
            // Reload from service to get the hardcoded defaults
            window.location.reload();
        }
    };

    const handleExport = () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(config, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "psychepoly_ai_config.json");
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const text = event.target?.result as string;
                const importedConfig = JSON.parse(text);
                // Basic validation
                if (importedConfig.geminiModel || importedConfig.systemPersona) {
                    setConfig({ ...config, ...importedConfig });
                    alert("配置导入成功！请点击“保存”以生效。");
                } else {
                    alert("无效的配置文件格式。");
                }
            } catch (err) {
                alert("JSON 解析失败，请检查文件。");
            }
        };
        reader.readAsText(file);
        // Reset input so same file can be selected again if needed
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const renderKeyInput = (
        label: string,
        colorClass: string,
        value: string,
        onChange: (val: string) => void,
        systemKeyAvailable: boolean,
        modelValue: string,
        onModelChange: (val: string) => void,
        placeholderKey: string
    ) => (
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
            <div className="flex justify-between items-center mb-2">
                <label className={`text-xs font-bold ${colorClass} flex items-center gap-1`}>{label}</label>
                <input type="text" value={modelValue} onChange={e => onModelChange(e.target.value)} className="bg-slate-900 border border-slate-700 rounded px-2 py-0.5 text-[10px] text-slate-400 w-32 text-right" placeholder="Model ID" />
            </div>
            <div className="relative">
                <input
                    type="password"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className={`w-full bg-slate-900 border rounded-lg px-3 py-2 text-sm text-white outline-none font-mono ${value ? 'border-slate-700' : (systemKeyAvailable ? 'border-teal-500/50' : 'border-slate-800')}`}
                    placeholder={systemKeyAvailable ? "已预装默认 Key (可直接使用，或输入覆盖)" : placeholderKey}
                />
                {!value && systemKeyAvailable && (
                    <div className="absolute right-3 top-2.5 flex items-center gap-1 text-[10px] text-teal-500 pointer-events-none">
                        <ShieldCheck size={12} /> 系统托管
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-2xl bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="flex justify-between items-center p-5 border-b border-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-teal-500/20 rounded-lg text-teal-400"><Cpu size={24} /></div>
                        <div>
                            <h2 className="text-lg font-bold text-white">AI 神经中枢</h2>
                            <p className="text-[10px] text-slate-400">灾备调用顺序: Groq &gt; OpenRouter &gt; Zhipu &gt; Gemini &gt; 小P</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-slate-500 hover:text-white transition"><X size={24} /></button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-800">
                    <button
                        onClick={() => setActiveTab('keys')}
                        className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition ${activeTab === 'keys' ? 'border-teal-500 text-teal-400 bg-slate-800/50' : 'border-transparent text-slate-500 hover:text-white'}`}
                    >
                        <Key size={16} /> API 密钥 & 模型
                    </button>
                    <button
                        onClick={() => setActiveTab('prompts')}
                        className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition ${activeTab === 'prompts' ? 'border-teal-500 text-teal-400 bg-slate-800/50' : 'border-transparent text-slate-500 hover:text-white'}`}
                    >
                        <MessageSquare size={16} /> Prompt 设定
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6 overflow-y-auto flex-1 custom-scrollbar">

                    {activeTab === 'keys' && (
                        <div className="space-y-6">
                            {/* Region Selection */}
                            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                                <div className="flex justify-between items-center">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                        <Globe size={14} className="text-teal-400" /> 航行区域配置 (Region Mode)
                                    </label>
                                    <div className="text-[10px] text-slate-500 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                                        {config.regionMode === 'auto' ? '自动探测中...' : '手动锁定'}
                                    </div>
                                </div>
                                <div className="flex bg-slate-900 p-1 rounded-xl">
                                    {[
                                        { id: 'auto', label: '智能感知', icon: <Cpu size={14} /> },
                                        { id: 'china', label: '中国大陆', icon: <Flag size={14} /> },
                                        { id: 'overseas', label: '国际海外', icon: <Globe size={14} /> }
                                    ].map(mode => (
                                        <button
                                            key={mode.id}
                                            onClick={() => setConfig({ ...config, regionMode: mode.id as any })}
                                            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${config.regionMode === mode.id ? 'bg-teal-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                                        >
                                            {mode.icon}
                                            {mode.label}
                                        </button>
                                    ))}
                                </div>
                                <p className="text-[10px] text-slate-500 leading-relaxed px-1">
                                    {config.regionMode === 'china'
                                        ? '已优化：DeepSeek & 智谱 极速链路。跳过海外模型以防网络超时。'
                                        : config.regionMode === 'overseas'
                                            ? '已优化：Groq & Gemini 国际主流链路。跳过国内节点。'
                                            : '智能探测：将根据您的时区和 VITE_PLATFORM 自动切换最佳航路。'}
                                </p>
                            </div>
                            {/* GROQ */}
                            {renderKeyInput(
                                "1. Groq (小G) - 极速推荐",
                                "text-orange-400",
                                config.groqKey,
                                (v) => setConfig({ ...config, groqKey: v }),
                                !!SYSTEM_KEYS.groq,
                                config.groqModel,
                                (v) => setConfig({ ...config, groqModel: v }),
                                "gsk_..."
                            )}

                            {/* OpenRouter */}
                            {renderKeyInput(
                                "2. OpenRouter (小O) - 聚合兼容",
                                "text-blue-400",
                                config.openRouterKey,
                                (v) => setConfig({ ...config, openRouterKey: v }),
                                !!SYSTEM_KEYS.openRouter,
                                config.openRouterModel,
                                (v) => setConfig({ ...config, openRouterModel: v }),
                                "sk-or-..."
                            )}

                            {/* DeepSeek AI */}
                            {renderKeyInput(
                                "3. DeepSeek - 大陆极速推荐",
                                "text-cyan-400",
                                config.deepseekKey,
                                (v) => setConfig({ ...config, deepseekKey: v }),
                                !!SYSTEM_KEYS.deepseek,
                                config.deepseekModel, // 'deepseek-chat'
                                (v) => setConfig({ ...config, deepseekModel: v }),
                                "sk-..."
                            )}

                            {/* Zhipu AI */}
                            {renderKeyInput(
                                "4. Zhipu (智谱) - 极速备选",
                                "text-red-400",
                                config.zhipuKey,
                                (v) => setConfig({ ...config, zhipuKey: v }),
                                !!SYSTEM_KEYS.zhipu,
                                "glm-4-flash",
                                (v) => { }, // GLM-4 is free-tier friendly
                                "输入智谱 API Key..."
                            )}

                            {/* Gemini */}
                            {renderKeyInput(
                                "5. Gemini (Flash 2.0) - 全球通用",
                                "text-teal-400",
                                config.geminiKey,
                                (v) => setConfig({ ...config, geminiKey: v }),
                                !!SYSTEM_KEYS.gemini,
                                config.geminiModel,
                                (v) => setConfig({ ...config, geminiModel: v }),
                                "AIza..."
                            )}

                            <div className="bg-slate-800/50 p-3 rounded-lg flex items-center gap-3 text-xs text-slate-400">
                                <PlayCircle size={16} />
                                <span>如果上述 Key 均未配置或调用失败，系统将尝试免费的 <strong>Pollinations.ai (小P)</strong>，最后回退到本地题库。</span>
                            </div>
                        </div>
                    )}

                    {activeTab === 'prompts' && (
                        <div className="space-y-6">
                            {/* Design Philosophy */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-teal-400 uppercase tracking-wider flex items-center gap-1">
                                    游戏哲学与最高指令 (Soul)
                                </label>
                                <textarea
                                    value={config.designPhilosophy}
                                    onChange={(e) => setConfig({ ...config, designPhilosophy: e.target.value })}
                                    className="w-full h-28 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-300 focus:border-teal-500 outline-none resize-none font-mono leading-relaxed"
                                    placeholder="游戏的灵魂..."
                                />
                                <p className="text-[10px] text-slate-500">定义应用的核心价值观，用于指导 AI 生成内容的温度和方向。</p>
                            </div>

                            {/* Persona */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1">
                                    核心人设 (Identity)
                                </label>
                                <textarea
                                    value={config.systemPersona}
                                    onChange={(e) => setConfig({ ...config, systemPersona: e.target.value })}
                                    className="w-full h-32 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-300 focus:border-purple-500 outline-none resize-none font-mono leading-relaxed"
                                    placeholder="[角色设定]... [语气]..."
                                />
                                <p className="text-[10px] text-slate-500">建议定义 AI 的语气、风格及核心目标。</p>
                            </div>

                            {/* Task Gen */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-green-400 uppercase tracking-wider flex items-center gap-1">
                                    任务生成指令 (Instruction)
                                </label>
                                <textarea
                                    value={config.taskPromptTemplate}
                                    onChange={(e) => setConfig({ ...config, taskPromptTemplate: e.target.value })}
                                    className="w-full h-40 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-300 focus:border-green-500 outline-none resize-none font-mono"
                                />
                                <p className="text-[10px] text-slate-500">必须包含 JSON 输出格式要求 (keys: standard, truth, dare, deep)，否则游戏无法解析。</p>
                            </div>

                            {/* Report Gen */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-yellow-400 uppercase tracking-wider flex items-center gap-1">
                                    结算与深度分析 (Logic)
                                </label>
                                <textarea
                                    value={config.reportPromptTemplate}
                                    onChange={(e) => setConfig({ ...config, reportPromptTemplate: e.target.value })}
                                    className="w-full h-40 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-300 focus:border-yellow-500 outline-none resize-none font-mono"
                                />
                                <p className="text-[10px] text-slate-500">建议结合荣格八维（Te, Ti, Fe等）和原型（英雄、阴影）进行深度分析。</p>
                            </div>
                        </div>
                    )}

                </div>

                {/* Footer */}
                <div className="p-5 border-t border-slate-800 flex flex-wrap gap-3 bg-slate-900/50 rounded-b-2xl">
                    {/* File Input for Import */}
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept=".json"
                        onChange={handleFileChange}
                    />

                    <div className="flex gap-2">
                        <button onClick={handleImportClick} className="px-3 py-2 bg-slate-800 text-slate-400 rounded-lg text-xs font-bold hover:bg-slate-700 hover:text-white flex items-center gap-1 transition" title="导入配置">
                            <Upload size={14} /> 导入
                        </button>
                        <button onClick={handleExport} className="px-3 py-2 bg-slate-800 text-slate-400 rounded-lg text-xs font-bold hover:bg-slate-700 hover:text-white flex items-center gap-1 transition" title="备份配置">
                            <Download size={14} /> 备份
                        </button>
                    </div>

                    <div className="flex-1" />

                    <button onClick={handleReset} className="px-4 py-2 bg-slate-800 text-slate-400 rounded-lg text-sm font-bold hover:text-white flex items-center gap-2 transition">
                        <RotateCcw size={16} /> 恢复默认
                    </button>
                    <button onClick={handleSave} className="px-6 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-sm font-bold flex items-center justify-center gap-2 shadow-lg transition">
                        <Save size={16} /> 保存
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AIConfigModal;
