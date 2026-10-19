-- Cloudflare D1 Database Schema for RainbowBoat-MBTI

-- 1. 用户核心档案表
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,                       -- 统一用户 UUID
    nickname TEXT NOT NULL,
    avatar_url TEXT DEFAULT '',
    primary_mbti TEXT DEFAULT '',             -- 用户当前认同或测得的 MBTI 类型
    jung_radar TEXT DEFAULT '{}',              -- 八维雷达评分 JSON: {"Te":0,"Ti":0,...}
    platform_source TEXT DEFAULT 'web',        -- 来源: 'web' | 'telegram' | 'feishu'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. 跨平台身份绑定表 (将 Telegram ID 或 飞书 open_id 映射到统一 users.id)
CREATE TABLE IF NOT EXISTS user_bindings (
    platform TEXT NOT NULL,                    -- 'telegram' | 'feishu'
    platform_user_id TEXT NOT NULL,            -- TG user ID (数字转文本) 或 飞书 open_id (ou_xxx)
    user_id TEXT NOT NULL,                     -- 对应的 users.id
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (platform, platform_user_id)
);

-- 3. 游戏与测试记录表 (支持生成短链分享)
CREATE TABLE IF NOT EXISTS game_records (
    record_id TEXT PRIMARY KEY,                -- 6位或8位短代码，如 8xK2qA
    user_id TEXT NOT NULL,
    game_mode TEXT NOT NULL,                   -- 'quick_test' | 'jung_8' | 'mbti_16' | 'solo'
    score_summary TEXT DEFAULT '{}',           -- 得分及各维度明细 (JSON)
    report_content TEXT DEFAULT '',            -- AI 深度心理剖析报告
    view_count INTEGER DEFAULT 0,              -- 被查看裂变次数
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 4. 群游戏房间表 (支持权限体系：船长、船员、围观者)
CREATE TABLE IF NOT EXISTS game_rooms (
    room_id TEXT PRIMARY KEY,                  -- 房间短号，如 RM8848
    chat_id TEXT NOT NULL,                     -- Telegram 群组 ID
    host_user_id TEXT NOT NULL,                -- 船长 (发起人) 的 Telegram User ID
    status TEXT DEFAULT 'WAITING',             -- 'WAITING' | 'PLAYING' | 'FINISHED'
    settings TEXT DEFAULT '{}',                -- 房间规则配置 (JSON)
    crew_members TEXT DEFAULT '[]',            -- 已登船船员列表 (JSON 数组)
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 5. 跨平台互联临时绑定码 (用于打通同一人在 Telegram 与 飞书的档案)
CREATE TABLE IF NOT EXISTS bind_codes (
    code TEXT PRIMARY KEY,                     -- 6位连接码，如 839201
    user_id TEXT NOT NULL,                     -- 关联的 users.id
    expires_at DATETIME NOT NULL
);

-- 索引加速
CREATE INDEX IF NOT EXISTS idx_records_user ON game_records(user_id);
CREATE INDEX IF NOT EXISTS idx_bindings_user ON user_bindings(user_id);
CREATE INDEX IF NOT EXISTS idx_rooms_chat ON game_rooms(chat_id);
