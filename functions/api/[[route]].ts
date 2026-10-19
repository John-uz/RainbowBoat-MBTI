import { Hono } from 'hono';
import { handle } from 'hono/cloudflare-pages';
import { aiRouter } from '../routes/ai';
import { profileRouter } from '../routes/profile';
import { telegramRouter } from '../routes/telegram';
import { feishuRouter } from '../routes/feishu';
import type { Env } from '../types';

const app = new Hono<{ Bindings: Env }>().basePath('/api');

// 跨域支持 (CORS) - 允许前端开发模式与 Telegram/飞书 Webview
app.use('*', async (c, next) => {
    await next();
    c.res.headers.set('Access-Control-Allow-Origin', '*');
    c.res.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    c.res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
});

// 健康检查端点
app.get('/health', (c) => {
    return c.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'RainbowBoat Cloudflare Edge Hub'
    });
});

// 模块路由注册
app.route('/ai', aiRouter);
app.route('/profile', profileRouter);
app.route('/telegram', telegramRouter);
app.route('/feishu', feishuRouter);

export const onRequest = handle(app);
