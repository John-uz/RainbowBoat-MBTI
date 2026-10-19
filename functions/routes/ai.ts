import { Hono } from 'hono';
import type { Env } from '../types';

export const aiRouter = new Hono<{ Bindings: Env }>();

/**
 * 辅助计算 SHA-256 哈希作为缓存 Key
 */
async function getHash(str: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * 调用 Groq
 */
async function callGroqServer(key: string, model: string, system: string, user: string, imageData?: string): Promise<string> {
    let content: any = user;
    if (imageData) {
        content = [
            { type: "text", text: user },
            { type: "image_url", image_url: { url: imageData.startsWith('data:') ? imageData : `data:image/jpeg;base64,${imageData}` } }
        ];
    }

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${key}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: model || 'openai/gpt-oss-20b',
            messages: [
                { role: 'system', content: system },
                { role: 'user', content: content }
            ],
            response_format: { type: "json_object" }
        })
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Groq Error ${res.status}: ${text}`);
    }

    const data: any = await res.json();
    return data.choices?.[0]?.message?.content || "{}";
}

/**
 * 调用 Gemini
 */
async function callGeminiServer(key: string, model: string, system: string, user: string, imageData?: string): Promise<string> {
    const targetModel = model || 'gemini-flash-latest';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:generateContent?key=${key}`;

    const parts: any[] = [];
    if (imageData) {
        const cleanBase64 = imageData.includes(',') ? imageData.split(',')[1] : imageData;
        parts.push({
            inline_data: {
                mime_type: "image/jpeg",
                data: cleanBase64
            }
        });
    }
    parts.push({ text: user });

    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            system_instruction: { parts: [{ text: system }] },
            contents: [{ parts }],
            generationConfig: {
                response_mime_type: "application/json"
            }
        })
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Gemini Error ${res.status}: ${text}`);
    }

    const data: any = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
}

/**
 * 调用 DeepSeek
 */
async function callDeepSeekServer(key: string, model: string, system: string, user: string): Promise<string> {
    const res = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${key}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: model || 'deepseek-chat',
            messages: [
                { role: 'system', content: system },
                { role: 'user', content: user }
            ],
            response_format: { type: "json_object" }
        })
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(`DeepSeek Error ${res.status}: ${text}`);
    }

    const data: any = await res.json();
    return data.choices?.[0]?.message?.content || "{}";
}

/**
 * POST /api/ai/chat
 * 统一 AI 调用网关，负责多平台降级与密钥保护
 */
aiRouter.post('/chat', async (c) => {
    try {
        const body = await c.req.json();
        const {
            userPrompt,
            systemPrompt = "你是一名荣格心理学专家，请以合法的 JSON 格式返回分析。",
            imageData,
            preferredProvider,
            groqModel,
            geminiModel,
            deepseekModel,
            skipCache = false
        } = body;

        if (!userPrompt) {
            return c.json({ success: false, error: "userPrompt is required" }, 400);
        }

        // 缓存键计算 (仅针对无图纯文本)
        const cache = (caches as any).default;
        let cacheKeyUrl: URL | null = null;
        if (!imageData && !skipCache) {
            const hash = await getHash(`${systemPrompt}_${userPrompt}`);
            cacheKeyUrl = new URL(`https://cache.rainbowboat.internal/ai/${hash}`);
            const cachedRes = await cache.match(cacheKeyUrl.toString());
            if (cachedRes) {
                const cachedData = await cachedRes.json();
                return c.json({ success: true, data: cachedData, provider: "edge_cache" });
            }
        }

        // 密钥获取 (优先使用环境变量，支持客户端自定义 fallback 密钥)
        const groqKey = c.env.GROQ_API_KEY || body.clientGroqKey;
        const geminiKey = c.env.GEMINI_API_KEY || body.clientGeminiKey;
        const deepseekKey = c.env.DEEPSEEK_API_KEY || body.clientDeepseekKey;

        // 构建服务端 fallback 链
        const chain: { name: string; run: () => Promise<string> }[] = [];

        if (preferredProvider === 'deepseek' && deepseekKey && !imageData) {
            chain.push({ name: 'DeepSeek', run: () => callDeepSeekServer(deepseekKey, deepseekModel, systemPrompt, userPrompt) });
        }

        if (groqKey && !imageData) {
            chain.push({
                name: 'Groq',
                run: async () => {
                    // Groq 重试逻辑 (针对 429 配额错误重试 1 次)
                    try {
                        return await callGroqServer(groqKey, groqModel, systemPrompt, userPrompt, imageData);
                    } catch (err: any) {
                        if (err.message?.includes('429')) {
                            await new Promise(r => setTimeout(r, 600));
                            return await callGroqServer(groqKey, groqModel, systemPrompt, userPrompt, imageData);
                        }
                        throw err;
                    }
                }
            });
        }

        if (geminiKey) {
            chain.push({ name: 'Gemini', run: () => callGeminiServer(geminiKey, geminiModel, systemPrompt, userPrompt, imageData) });
        }

        if (deepseekKey && !imageData) {
            chain.push({ name: 'DeepSeek', run: () => callDeepSeekServer(deepseekKey, deepseekModel, systemPrompt, userPrompt) });
        }

        if (chain.length === 0) {
            return c.json({ success: false, error: "No AI provider keys configured on server." }, 500);
        }

        let lastError = null;
        for (const provider of chain) {
            try {
                const resultText = await provider.run();

                // 缓存成功的非多模态结果 (TTL: 24 小时)
                if (cacheKeyUrl) {
                    const cacheResponse = new Response(JSON.stringify(resultText), {
                        headers: {
                            'Content-Type': 'application/json',
                            'Cache-Control': 'public, max-age=86400'
                        }
                    });
                    c.executionCtx.waitUntil(cache.put(cacheKeyUrl.toString(), cacheResponse));
                }

                return c.json({
                    success: true,
                    data: resultText,
                    provider: provider.name
                });
            } catch (err: any) {
                lastError = err;
                console.warn(`[AI Gateway] ${provider.name} failed:`, err.message);
            }
        }

        return c.json({
            success: false,
            error: lastError ? lastError.message : "All AI providers failed"
        }, 502);

    } catch (e: any) {
        return c.json({ success: false, error: e.message }, 500);
    }
});
