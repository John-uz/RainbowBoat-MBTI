import type { D1Database } from '@cloudflare/workers-types';

export interface Env {
    // Cloudflare D1
    DB?: D1Database;

    // AI Provider Keys (隐藏在服务端 Secrets 中)
    GROQ_API_KEY?: string;
    GEMINI_API_KEY?: string;
    DEEPSEEK_API_KEY?: string;
    ZHIPU_API_KEY?: string;

    // Telegram Bot Token
    TELEGRAM_BOT_TOKEN?: string;

    // 飞书自建应用配置
    FEISHU_APP_ID?: string;
    FEISHU_APP_SECRET?: string;
    FEISHU_VERIFICATION_TOKEN?: string;

    // 平台模式
    DEFAULT_REGION_MODE?: string;
}
