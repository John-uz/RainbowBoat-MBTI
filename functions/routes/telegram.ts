import { Hono } from 'hono';
import type { Env } from '../types';

export const telegramRouter = new Hono<{ Bindings: Env }>();

/**
 * 校验 Telegram Mini App 的 initData 签名 (HMAC-SHA256)
 */
async function verifyTelegramWebAppData(initDataString: string, botToken: string): Promise<{ valid: boolean; user?: any }> {
    try {
        const urlParams = new URLSearchParams(initDataString);
        const hash = urlParams.get('hash');
        if (!hash) return { valid: false };

        urlParams.delete('hash');
        const params: string[] = [];
        for (const [key, value] of urlParams.entries()) {
            params.push(`${key}=${value}`);
        }
        params.sort();
        const dataCheckString = params.join('\n');

        const encoder = new TextEncoder();
        // 1. secret_key = HMAC_SHA256("WebAppData", botToken)
        const secretKeyRaw = await crypto.subtle.importKey(
            'raw',
            encoder.encode('WebAppData'),
            { name: 'HMAC', hash: 'SHA-256' },
            false,
            ['sign']
        );
        const secretKey = await crypto.subtle.sign('HMAC', secretKeyRaw, encoder.encode(botToken));

        // 2. signature = HMAC_SHA256(secretKey, dataCheckString)
        const key = await crypto.subtle.importKey(
            'raw',
            secretKey,
            { name: 'HMAC', hash: 'SHA-256' },
            false,
            ['sign']
        );
        const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(dataCheckString));
        const hexSignature = Array.from(new Uint8Array(signature)).map(b => b.toString(16).padStart(2, '0')).join('');

        if (hexSignature === hash) {
            const userStr = urlParams.get('user');
            const user = userStr ? JSON.parse(userStr) : null;
            return { valid: true, user };
        }
        return { valid: false };
    } catch (e) {
        return { valid: false };
    }
}

/**
 * 发送 Telegram 消息辅助函数
 */
async function sendTelegramMessage(botToken: string, chatId: number | string, text: string, replyMarkup?: any) {
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chat_id: chatId,
            text,
            parse_mode: 'HTML',
            reply_markup: replyMarkup
        })
    });
}

/**
 * POST /api/telegram/webhook
 * 接收 Telegram Bot 命令回调
 */
telegramRouter.post('/webhook', async (c) => {
    const botToken = c.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
        return c.text('Bot token not set', 500);
    }

    try {
        const update = await c.req.json();
        const message = update.message;

        if (message && message.text) {
            const chatId = message.chat.id;
            const text = message.text.trim();
            const from = message.from;

            // 获取当前 App 部署域名（从请求 host 自动派生，或回退到默认）
            const host = c.req.header('host') || 'mbti.jsc33.top';
            const webAppUrl = `https://${host}`;

            if (text === '/start' || text.startsWith('/test')) {
                const welcomeText = `🌊 <b>欢迎登上彩虹船 (Rainbow Boat)！</b>\n\n结合<b>荣格八维心理学</b>与<b>大富翁互动桌游</b>的沉浸式心理探索旅程。\n\n点击下方按钮，直接在 Telegram 内部启动小程序：`;

                const keyboard = {
                    inline_keyboard: [
                        [
                            {
                                text: "🚢 启航 / 登上彩虹船 (Mini App)",
                                web_app: { url: webAppUrl }
                            }
                        ],
                        [
                            {
                                text: "🧭 潜意识趣味快测",
                                web_app: { url: `${webAppUrl}?mode=test` }
                            },
                            {
                                text: "⛵ 发起群组局",
                                callback_data: "party_prompt"
                            }
                        ]
                    ]
                };

                await sendTelegramMessage(botToken, chatId, welcomeText, keyboard);
            } else if (text.startsWith('/party')) {
                // 船长组局模式：创建房间并区分权限
                const roomId = 'RM' + Math.floor(1000 + Math.random() * 9000);
                const hostId = String(from?.id || '');
                const hostName = from?.first_name || from?.username || '船长';

                if (c.env.DB) {
                    await c.env.DB.prepare(`
                        INSERT INTO game_rooms (room_id, chat_id, host_user_id, status)
                        VALUES (?, ?, ?, 'WAITING')
                    `).bind(roomId, String(chatId), hostId).run();
                }

                const partyText = `🚢 <b>【彩虹船·群潜意识航行】已开启！</b>\n\n👑 <b>船长 (发起人)：</b> ${hostName}\n🏷️ <b>房间代码：</b> <code>${roomId}</code>\n\n请群友点击下方按钮入座登船，满 2 人即可由船长发令启航：`;

                const keyboard = {
                    inline_keyboard: [
                        [
                            {
                                text: "🙋‍♂️ 我要登船入座 (船员)",
                                web_app: { url: `${webAppUrl}?room=${roomId}&role=player` }
                            }
                        ],
                        [
                            {
                                text: "👑 船长控制台 (发起人)",
                                web_app: { url: `${webAppUrl}?room=${roomId}&role=host` }
                            }
                        ]
                    ]
                };

                await sendTelegramMessage(botToken, chatId, partyText, keyboard);
            } else if (text.startsWith('/bind')) {
                // 跨平台身份打通：/bind <code>
                const parts = text.split(' ');
                const code = parts[1]?.trim();

                if (!code) {
                    await sendTelegramMessage(botToken, chatId, "💡 请在 /bind 后输入网页端显示的 6 位连接码，例如：<code>/bind 839201</code>");
                } else if (c.env.DB && from?.id) {
                    const tgUserId = String(from.id);
                    // 将 TG 用户映射绑定
                    const targetUserId = `user_${code}`;
                    await c.env.DB.prepare(`
                        INSERT INTO user_bindings (platform, platform_user_id, user_id)
                        VALUES ('telegram', ?, ?)
                        ON CONFLICT(platform, platform_user_id) DO UPDATE SET user_id = excluded.user_id
                    `).bind(tgUserId, targetUserId).run();

                    await sendTelegramMessage(botToken, chatId, `✅ <b>跨平台身份绑定成功！</b>\n\n您的 Telegram 账号已与连接码 <code>${code}</code> 关联，历史八维测评数据已合并同步。`);
                }
            } else if (text.startsWith('/claim_admin')) {
                // 超级管理员认领口令（只允许首次认领，已有管理员时立刻永久作废）
                if (c.env.DB) {
                    const existingAdmin: any = await c.env.DB.prepare('SELECT COUNT(*) as count FROM admins').first();
                    if (existingAdmin && existingAdmin.count > 0) {
                        await sendTelegramMessage(botToken, chatId, "⛔ <b>口令已永久作废</b>：系统已被管理员认领绑定，不再接受新的认领。");
                        return c.text('OK');
                    }
                }

                const parts = text.split(' ');
                const secret = parts[1]?.trim();
                const MASTER_SECRET = "RB_MASTER_8848";

                if (secret === MASTER_SECRET && c.env.DB && from?.id) {
                    const tgUserId = String(from.id);
                    const username = from.username || from.first_name || 'Admin';

                    await c.env.DB.prepare(`
                        INSERT INTO admins (telegram_user_id, username)
                        VALUES (?, ?)
                        ON CONFLICT(telegram_user_id) DO UPDATE SET username = excluded.username
                    `).bind(tgUserId, username).run();

                    const reply = `👑 <b>超级管理员认证成功！口令已自动永久作废。</b>\n\n欢迎，开发者 <b>${username}</b>！\n您的 Telegram ID (<code>${tgUserId}</code>) 已被正式授予全系统最高控制权。\n\n🛠️ <b>可用管理指令：</b>\n• /admin 或 /stats - 查看系统核心运行数据与网页直登入口\n• /rooms - 巡检当前所有活跃房间\n• /reset &lt;房间号&gt; - 强制清空卡死房间`;
                    await sendTelegramMessage(botToken, chatId, reply);
                } else {
                    await sendTelegramMessage(botToken, chatId, "❌ 口令无效或未提供正确认证口令。格式：<code>/claim_admin &lt;口令&gt;</code>");
                }
            } else if (text === '/admin' || text === '/stats' || text === '/login') {
                // 管理控制大屏 & 免密直登生成
                if (c.env.DB && from?.id) {
                    const isAdmin = await c.env.DB.prepare(
                        'SELECT * FROM admins WHERE telegram_user_id = ?'
                    ).bind(String(from.id)).first();

                    if (!isAdmin && (text === '/admin' || text === '/stats')) {
                        await sendTelegramMessage(botToken, chatId, "⛔ <b>无权访问</b>：该指令仅限超级管理员使用。");
                    } else {
                        // 生成 15 分钟有效的一次性登录 Token 与 6 位纯数字 PIN
                        const authToken = 'tk_' + crypto.randomUUID().replace(/-/g, '');
                        const loginPin = Math.floor(100000 + Math.random() * 900000).toString();
                        // 15分钟后过期
                        const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString().replace('T', ' ').substring(0, 19);

                        const adminUserData = JSON.stringify({
                            id: `tg_${from.id}`,
                            nickname: from.username ? `@${from.username}` : (from.first_name || '管理员'),
                            role: isAdmin ? 'admin' : 'player',
                            platform_source: 'telegram'
                        });

                        // 存入两个凭证：长 token (用于链接) 与 6 位数字 pin (用于网页直接输入)
                        await c.env.DB.prepare(`
                            INSERT INTO auth_tokens (token, telegram_user_id, user_data, expires_at)
                            VALUES (?, ?, ?, ?), (?, ?, ?, ?)
                        `).bind(
                            authToken, String(from.id), adminUserData, expiresAt,
                            `pin_${loginPin}`, String(from.id), adminUserData, expiresAt
                        ).run();

                        // 统计数据
                        const userStat: any = await c.env.DB.prepare('SELECT COUNT(*) as count FROM users').first();
                        const recordStat: any = await c.env.DB.prepare('SELECT COUNT(*) as count FROM game_records').first();
                        const roomStat: any = await c.env.DB.prepare("SELECT COUNT(*) as count FROM game_rooms WHERE status != 'FINISHED'").first();

                        const fullLoginUrl = `https://${host}?auth_token=${authToken}`;

                        const adminText = `🛠️ <b>彩虹船 · 管理员控制台 & 网页直登</b>\n\n📊 <b>系统实时运行数据：</b>\n• 注册/同步用户数：<b>${userStat?.count || 0}</b> 人\n• 测评与航行战报数：<b>${recordStat?.count || 0}</b> 份\n• 当前进行中房间：<b>${roomStat?.count || 0}</b> 个\n\n🔗 <b>网页端免密直登入口 (15分钟有效)：</b>\n👉 <a href="${fullLoginUrl}">点击直接在浏览器打开并自动登录</a>\n\n📋 <b>点击下方可一键复制链接 (粘贴至任意浏览器)：</b>\n<code>${fullLoginUrl}</code>\n\n🔢 <b>或在网页端【船员档案中枢】输入 6 位 PIN 码：</b>\n<code>${loginPin}</code>`;

                        const keyboard = {
                            inline_keyboard: [
                                [
                                    {
                                        text: "🌐 TG 内直接打开",
                                        web_app: { url: fullLoginUrl }
                                    },
                                    {
                                        text: "🚀 外部浏览器直登",
                                        url: fullLoginUrl
                                    }
                                ],
                                [
                                    {
                                        text: "📋 查看所有房间 (/rooms)",
                                        callback_data: "admin_rooms"
                                    }
                                ]
                            ]
                        };

                        await sendTelegramMessage(botToken, chatId, adminText, keyboard);
                    }
                }
            } else if (text === '/rooms') {
                // 查看所有活跃房间
                if (c.env.DB && from?.id) {
                    const isAdmin = await c.env.DB.prepare('SELECT * FROM admins WHERE telegram_user_id = ?').bind(String(from.id)).first();
                    if (!isAdmin) {
                        await sendTelegramMessage(botToken, chatId, "⛔ 无权访问。");
                    } else {
                        const rooms: any = await c.env.DB.prepare('SELECT * FROM game_rooms ORDER BY created_at DESC LIMIT 10').all();
                        if (!rooms.results || rooms.results.length === 0) {
                            await sendTelegramMessage(botToken, chatId, "目前没有正在进行中的航行房间。");
                        } else {
                            const list = rooms.results.map((r: any) => `• 房间 <code>${r.room_id}</code> | 状态: ${r.status} | 船长: <code>${r.host_user_id}</code>`).join('\n');
                            await sendTelegramMessage(botToken, chatId, `📋 <b>活跃房间列表 (最近10个)：</b>\n\n${list}\n\n若需清理某房间，请发送：<code>/reset &lt;房间号&gt;</code>`);
                        }
                    }
                }
            } else if (text.startsWith('/reset')) {
                // 清理房间
                const parts = text.split(' ');
                const targetRoomId = parts[1]?.trim();
                if (c.env.DB && from?.id) {
                    const isAdmin = await c.env.DB.prepare('SELECT * FROM admins WHERE telegram_user_id = ?').bind(String(from.id)).first();
                    if (!isAdmin) {
                        await sendTelegramMessage(botToken, chatId, "⛔ 无权访问。");
                    } else if (!targetRoomId) {
                        await sendTelegramMessage(botToken, chatId, "请指定要重置的房间号，例如：<code>/reset RM8848</code>");
                    } else {
                        await c.env.DB.prepare('DELETE FROM game_rooms WHERE room_id = ?').bind(targetRoomId).run();
                        await sendTelegramMessage(botToken, chatId, `✅ 房间 <code>${targetRoomId}</code> 已被强制清空重置。`);
                    }
                }
            } else if (text === '/my') {
                // 查询该 Telegram 用户的性格档案
                if (c.env.DB && from?.id) {
                    const binding: any = await c.env.DB.prepare(
                        'SELECT u.* FROM user_bindings b JOIN users u ON b.user_id = u.id WHERE b.platform = ? AND b.platform_user_id = ?'
                    ).bind('telegram', String(from.id)).first();

                    if (binding && binding.primary_mbti) {
                        const reply = `👤 <b>${binding.nickname} 的性格档案</b>\n\nMBTI 类型：<code>${binding.primary_mbti}</code>\n更新时间：${binding.updated_at}`;
                        await sendTelegramMessage(botToken, chatId, reply);
                    } else {
                        await sendTelegramMessage(botToken, chatId, "您尚未在彩虹船完成测试。点击 /start 立即启航！");
                    }
                }
            }
        }

        // 处理按钮回调点击
        if (update.callback_query) {
            const cb = update.callback_query;
            const cbChatId = cb.message?.chat?.id;
            const data = cb.data;
            if (data === 'party_prompt' && cbChatId) {
                await sendTelegramMessage(botToken, cbChatId, "💡 请直接在群聊发送 <code>/party</code> 即可开启群组局并成为船长！");
            }
        }

        return c.text('OK');
    } catch (e: any) {
        console.error('[Telegram Webhook Error]', e);
        return c.text('Error', 500);
    }
});

/**
 * POST /api/telegram/auth
 * TMA 前端调用：校验 Telegram initData 并自动同步用户档案
 */
telegramRouter.post('/auth', async (c) => {
    const botToken = c.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
        return c.json({ success: false, error: "Telegram bot token is not configured on server" }, 500);
    }

    try {
        const body = await c.req.json();
        const { initData } = body;

        if (!initData) {
            return c.json({ success: false, error: "Missing initData" }, 400);
        }

        const { valid, user } = await verifyTelegramWebAppData(initData, botToken);
        if (!valid || !user) {
            return c.json({ success: false, error: "Invalid Telegram signature" }, 401);
        }

        // 若绑定了 D1，自动做用户创建/映射
        if (c.env.DB) {
            const tgUserId = String(user.id);
            const nickname = [user.first_name, user.last_name].filter(Boolean).join(' ') || user.username || `TG_User_${tgUserId.slice(-4)}`;
            const avatarUrl = user.photo_url || '';

            // 查询是否已有对应系统用户
            let existingBinding: any = await c.env.DB.prepare(
                'SELECT user_id FROM user_bindings WHERE platform = ? AND platform_user_id = ?'
            ).bind('telegram', tgUserId).first();

            let userId = existingBinding?.user_id;

            if (!userId) {
                // 创建全新系统用户
                userId = `tg_${tgUserId}`;
                await c.env.DB.prepare(
                    'INSERT INTO users (id, nickname, avatar_url, platform_source) VALUES (?, ?, ?, ?)'
                ).bind(userId, nickname, avatarUrl, 'telegram').run();

                await c.env.DB.prepare(
                    'INSERT INTO user_bindings (platform, platform_user_id, user_id) VALUES (?, ?, ?)'
                ).bind('telegram', tgUserId, userId).run();
            }

            const fullUser: any = await c.env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(userId).first();

            return c.json({
                success: true,
                user: {
                    ...fullUser,
                    jung_radar: typeof fullUser.jung_radar === 'string' ? JSON.parse(fullUser.jung_radar) : fullUser.jung_radar
                }
            });
        }

        return c.json({ success: true, user });
    } catch (e: any) {
        return c.json({ success: false, error: e.message }, 500);
    }
});
