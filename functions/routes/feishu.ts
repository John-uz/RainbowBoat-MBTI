import { Hono } from 'hono';
import type { Env } from '../types';

export const feishuRouter = new Hono<{ Bindings: Env }>();

/**
 * 获取飞书租户凭据 tenant_access_token
 */
async function getTenantAccessToken(appId: string, appSecret: string): Promise<string> {
    const res = await fetch('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ app_id: appId, app_secret: appSecret })
    });
    const data: any = await res.json();
    if (data.code !== 0) {
        throw new Error(`Feishu token error: ${data.msg}`);
    }
    return data.tenant_access_token;
}

/**
 * 发送飞书交互卡片消息
 */
async function sendFeishuCardMessage(token: string, receiveId: string, receiveIdType: string, cardContent: any) {
    const url = `https://open.feishu.cn/open-apis/im/v1/messages?receive_id_type=${receiveIdType}`;
    await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            receive_id: receiveId,
            msg_type: 'interactive',
            content: JSON.stringify(cardContent)
        })
    });
}

/**
 * POST /api/feishu/webhook
 * 处理飞书事件订阅 (包括配置时的 URL Challenge 校验与消息通知)
 */
feishuRouter.post('/webhook', async (c) => {
    try {
        const body = await c.req.json();

        // 1. 飞书首次配置 Webhook 时的 URL 挑战校验 (Challenge Verification)
        if (body.type === 'url_verification') {
            return c.json({ challenge: body.challenge });
        }

        const appId = c.env.FEISHU_APP_ID;
        const appSecret = c.env.FEISHU_APP_SECRET;

        // 2. 接收消息事件
        if (body.header?.event_type === 'im.message.receive_v1' && appId && appSecret) {
            const event = body.event;
            const message = event.message;
            const chatId = message.chat_id;
            const host = c.req.header('host') || 'mbti.jsc33.top';
            const appUrl = `https://${host}`;

            const token = await getTenantAccessToken(appId, appSecret);

            // 构造飞书高颜值交互卡片 (Interactive Message Card)
            const card = {
                config: { wide_screen_mode: true },
                header: {
                    title: {
                        tag: "plain_text",
                        content: "🌊 彩虹船潜意识航行 (Rainbow Boat)"
                    },
                    template: "blue"
                },
                elements: [
                    {
                        tag: "div",
                        text: {
                            tag: "lark_md",
                            content: "结合 **荣格八维心理学** 与 **大富翁社交互动** 的潜意识探索桌游。\n不管是团队新人破冰，还是日常搭档默契测评，一键轻松开启！"
                        }
                    },
                    {
                        tag: "hr"
                    },
                    {
                        tag: "action",
                        actions: [
                            {
                                tag: "button",
                                text: { tag: "plain_text", content: "🚀 快速测一测 (快测模式)" },
                                type: "primary",
                                url: `${appUrl}?mode=test`
                            },
                            {
                                tag: "button",
                                text: { tag: "plain_text", content: "🚢 发起上船组局 (派对模式)" },
                                type: "default",
                                url: `${appUrl}?mode=party`
                            }
                        ]
                    },
                    {
                        tag: "note",
                        elements: [
                            {
                                tag: "plain_text",
                                content: "💡 支持随时查看个人八维雷达与合拍伙伴推荐"
                            }
                        ]
                    }
                ]
            };

            c.executionCtx.waitUntil(
                sendFeishuCardMessage(token, chatId, 'chat_id', card)
            );
        }

        return c.json({ code: 0 });
    } catch (e: any) {
        console.error('[Feishu Webhook Error]', e);
        return c.json({ code: -1, msg: e.message }, 500);
    }
});

/**
 * POST /api/feishu/auth
 * 飞书免登授权回调：通过临时 code 换取飞书用户信息并在 D1 同步档案
 */
feishuRouter.post('/auth', async (c) => {
    const appId = c.env.FEISHU_APP_ID;
    const appSecret = c.env.FEISHU_APP_SECRET;

    if (!appId || !appSecret) {
        return c.json({ success: false, error: "Feishu credentials not set" }, 500);
    }

    try {
        const { code } = await c.req.json();
        if (!code) {
            return c.json({ success: false, error: "Code is required" }, 400);
        }

        const appAccessToken = await getTenantAccessToken(appId, appSecret);

        // 换取用户 user_access_token & open_id
        const userRes = await fetch('https://open.feishu.cn/open-apis/authen/v1/access_token', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${appAccessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                grant_type: 'authorization_code',
                code
            })
        });

        const userData: any = await userRes.json();
        if (userData.code !== 0) {
            return c.json({ success: false, error: userData.msg }, 400);
        }

        const openId = userData.data.open_id;
        const nickname = userData.data.name || '飞书船员';
        const avatarUrl = userData.data.avatar_url || '';

        // 同步至 D1 数据库
        if (c.env.DB) {
            let existingBinding: any = await c.env.DB.prepare(
                'SELECT user_id FROM user_bindings WHERE platform = ? AND platform_user_id = ?'
            ).bind('feishu', openId).first();

            let userId = existingBinding?.user_id;

            if (!userId) {
                userId = `feishu_${openId.slice(-8)}`;
                await c.env.DB.prepare(
                    'INSERT INTO users (id, nickname, avatar_url, platform_source) VALUES (?, ?, ?, ?)'
                ).bind(userId, nickname, avatarUrl, 'feishu').run();

                await c.env.DB.prepare(
                    'INSERT INTO user_bindings (platform, platform_user_id, user_id) VALUES (?, ?, ?)'
                ).bind('feishu', openId, userId).run();
            }

            const fullUser: any = await c.env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(userId).first();
            return c.json({ success: true, user: fullUser });
        }

        return c.json({ success: true, openId, nickname, avatarUrl });
    } catch (e: any) {
        return c.json({ success: false, error: e.message }, 500);
    }
});
