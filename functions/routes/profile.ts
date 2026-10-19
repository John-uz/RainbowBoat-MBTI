import { Hono } from 'hono';
import type { Env } from '../types';

export const profileRouter = new Hono<{ Bindings: Env }>();

/**
 * 生成 6 位随机短码用于分享链接
 */
function generateShortCode(): string {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    let result = '';
    const randomBytes = new Uint8Array(6);
    crypto.getRandomValues(randomBytes);
    for (let i = 0; i < 6; i++) {
        result += chars[randomBytes[i] % chars.length];
    }
    return result;
}

/**
 * POST /api/profile/sync
 * 创建或同步用户档案
 */
profileRouter.post('/sync', async (c) => {
    if (!c.env.DB) {
        return c.json({ success: false, error: "D1 database is not bound" }, 503);
    }

    try {
        const body = await c.req.json();
        const {
            id,
            nickname = '航海探险者',
            avatar_url = '',
            primary_mbti = '',
            jung_radar = {},
            platform_source = 'web'
        } = body;

        if (!id) {
            return c.json({ success: false, error: "User ID is required" }, 400);
        }

        const radarJson = typeof jung_radar === 'string' ? jung_radar : JSON.stringify(jung_radar);

        // 使用 Upsert 语法保存/更新
        await c.env.DB.prepare(`
            INSERT INTO users (id, nickname, avatar_url, primary_mbti, jung_radar, platform_source, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(id) DO UPDATE SET
                nickname = excluded.nickname,
                avatar_url = excluded.avatar_url,
                primary_mbti = excluded.primary_mbti,
                jung_radar = excluded.jung_radar,
                updated_at = CURRENT_TIMESTAMP
        `).bind(id, nickname, avatar_url, primary_mbti, radarJson, platform_source).run();

        return c.json({ success: true, message: "Profile synchronized" });
    } catch (e: any) {
        return c.json({ success: false, error: e.message }, 500);
    }
});

/**
 * GET /api/profile/:id
 * 获取用户档案及历史测验战绩
 */
profileRouter.get('/:id', async (c) => {
    if (!c.env.DB) {
        return c.json({ success: false, error: "D1 database is not bound" }, 503);
    }

    try {
        const id = c.req.param('id');
        const user = await c.env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(id).first();

        if (!user) {
            return c.json({ success: false, error: "User not found" }, 404);
        }

        // 获取最近 5 次游戏/测验记录
        const records = await c.env.DB.prepare(`
            SELECT record_id, game_mode, score_summary, view_count, created_at
            FROM game_records
            WHERE user_id = ?
            ORDER BY created_at DESC
            LIMIT 5
        `).bind(id).all();

        return c.json({
            success: true,
            data: {
                ...user,
                jung_radar: typeof user.jung_radar === 'string' ? JSON.parse(user.jung_radar) : user.jung_radar,
                records: records.results
            }
        });
    } catch (e: any) {
        return c.json({ success: false, error: e.message }, 500);
    }
});

/**
 * POST /api/profile/record
 * 保存测试/航行报告并生成 6 位短链
 */
profileRouter.post('/record', async (c) => {
    if (!c.env.DB) {
        return c.json({ success: false, error: "D1 database is not bound" }, 503);
    }

    try {
        const body = await c.req.json();
        const {
            userId = 'guest',
            gameMode = 'quick_test',
            scoreSummary = {},
            reportContent = ''
        } = body;

        const recordId = generateShortCode();
        const scoreJson = typeof scoreSummary === 'string' ? scoreSummary : JSON.stringify(scoreSummary);

        await c.env.DB.prepare(`
            INSERT INTO game_records (record_id, user_id, game_mode, score_summary, report_content)
            VALUES (?, ?, ?, ?, ?)
        `).bind(recordId, userId, gameMode, scoreJson, reportContent).run();

        return c.json({
            success: true,
            data: {
                shortCode: recordId,
                shortUrl: `/r/${recordId}`
            }
        });
    } catch (e: any) {
        return c.json({ success: false, error: e.message }, 500);
    }
});

/**
 * GET /api/profile/record/:shortCode
 * 通过 6 位短码提取完整报告（带点击阅读计数）
 */
profileRouter.get('/record/:shortCode', async (c) => {
    if (!c.env.DB) {
        return c.json({ success: false, error: "D1 database is not bound" }, 503);
    }

    try {
        const shortCode = c.req.param('shortCode');
        const record: any = await c.env.DB.prepare(`
            SELECT r.*, u.nickname, u.avatar_url, u.primary_mbti
            FROM game_records r
            LEFT JOIN users u ON r.user_id = u.id
            WHERE r.record_id = ?
        `).bind(shortCode).first();

        if (!record) {
            return c.json({ success: false, error: "Report not found or expired" }, 404);
        }

        // 异步递增阅读次数
        c.executionCtx.waitUntil(
            c.env.DB.prepare('UPDATE game_records SET view_count = view_count + 1 WHERE record_id = ?').bind(shortCode).run()
        );

        return c.json({
            success: true,
            data: {
                ...record,
                score_summary: typeof record.score_summary === 'string' ? JSON.parse(record.score_summary) : record.score_summary
            }
        });
    } catch (e: any) {
        return c.json({ success: false, error: e.message }, 500);
    }
});
