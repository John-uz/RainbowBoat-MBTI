import { Hono } from 'hono';
import type { Env } from '../types';

export const authRouter = new Hono<{ Bindings: Env }>();

/**
 * POST /api/auth/verify
 * 消费 Telegram 传过来的一次性免密登录 Token (auth_token)
 */
authRouter.post('/verify', async (c) => {
    if (!c.env.DB) {
        return c.json({ success: false, error: "Database not connected" }, 503);
    }

    try {
        const { token } = await c.req.json();
        if (!token) {
            return c.json({ success: false, error: "Token is required" }, 400);
        }

        // 查询未过期的有效登录 Token
        const record: any = await c.env.DB.prepare(`
            SELECT * FROM auth_tokens 
            WHERE token = ? AND expires_at > datetime('now')
        `).bind(token).first();

        if (!record) {
            return c.json({ success: false, error: "登录链接已失效或已过期，请重新在 Telegram 获取" }, 401);
        }

        const userData = typeof record.user_data === 'string' ? JSON.parse(record.user_data) : record.user_data;

        // 检查用户是否在 admins 表中
        const adminCheck = await c.env.DB.prepare(
            'SELECT * FROM admins WHERE telegram_user_id = ?'
        ).bind(record.telegram_user_id).first();

        if (adminCheck) {
            userData.role = 'admin';
        }

        // 消费后立即删除（单次有效，确保安全）
        await c.env.DB.prepare('DELETE FROM auth_tokens WHERE token = ?').bind(token).run().catch(() => {});

        return c.json({
            success: true,
            user: userData
        });
    } catch (e: any) {
        return c.json({ success: false, error: e.message }, 500);
    }
});

/**
 * POST /api/auth/pin_login
 * 网页端通过 Telegram 生成的 6 位数字 PIN 码快速登入
 */
authRouter.post('/pin_login', async (c) => {
    if (!c.env.DB) {
        return c.json({ success: false, error: "Database not connected" }, 503);
    }

    try {
        const { pin } = await c.req.json();
        if (!pin) {
            return c.json({ success: false, error: "PIN 码不能为空" }, 400);
        }

        const record: any = await c.env.DB.prepare(`
            SELECT * FROM auth_tokens 
            WHERE token = ? AND expires_at > datetime('now')
        `).bind(`pin_${pin}`).first();

        if (!record) {
            return c.json({ success: false, error: "PIN 码无效或已过期，请在 Telegram 发送 /login 获取" }, 401);
        }

        const userData = typeof record.user_data === 'string' ? JSON.parse(record.user_data) : record.user_data;

        // 检查管理员身份
        const adminCheck = await c.env.DB.prepare(
            'SELECT * FROM admins WHERE telegram_user_id = ?'
        ).bind(record.telegram_user_id).first();

        if (adminCheck) {
            userData.role = 'admin';
        }

        // 消费 PIN
        await c.env.DB.prepare('DELETE FROM auth_tokens WHERE token = ?').bind(`pin_${pin}`).run().catch(() => {});

        return c.json({
            success: true,
            user: userData
        });
    } catch (e: any) {
        return c.json({ success: false, error: e.message }, 500);
    }
});

/**
 * GET /api/auth/admin_stats
 * 网页端管理员控制台专用：获取全局运行数据
 */
authRouter.get('/admin_stats', async (c) => {
    if (!c.env.DB) return c.json({ success: false }, 503);

    try {
        const userStat: any = await c.env.DB.prepare('SELECT COUNT(*) as count FROM users').first();
        const recordStat: any = await c.env.DB.prepare('SELECT COUNT(*) as count FROM game_records').first();
        const roomStat: any = await c.env.DB.prepare("SELECT COUNT(*) as count FROM game_rooms WHERE status != 'FINISHED'").first();
        const activeRooms: any = await c.env.DB.prepare('SELECT * FROM game_rooms ORDER BY created_at DESC LIMIT 20').all();
        const recentUsers: any = await c.env.DB.prepare('SELECT id, nickname, primary_mbti, platform_source, updated_at FROM users ORDER BY updated_at DESC LIMIT 15').all();

        return c.json({
            success: true,
            stats: {
                userCount: userStat?.count || 0,
                reportCount: recordStat?.count || 0,
                roomCount: roomStat?.count || 0,
            },
            rooms: activeRooms.results || [],
            users: recentUsers.results || []
        });
    } catch (e: any) {
        return c.json({ success: false, error: e.message }, 500);
    }
});

/**
 * POST /api/auth/reset_room
 * 管理员在网页端一键强制解散/重置指定房间
 */
authRouter.post('/reset_room', async (c) => {
    if (!c.env.DB) return c.json({ success: false }, 503);

    try {
        const { roomId } = await c.req.json();
        if (!roomId) return c.json({ success: false, error: "Room ID required" }, 400);

        await c.env.DB.prepare('DELETE FROM game_rooms WHERE room_id = ?').bind(roomId).run();
        return c.json({ success: true, message: `Room ${roomId} has been reset` });
    } catch (e: any) {
        return c.json({ success: false, error: e.message }, 500);
    }
});
