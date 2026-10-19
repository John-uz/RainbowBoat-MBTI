/**
 * Telegram Mini App (TMA) 交互与运行环境工具库
 */

declare global {
    interface Window {
        Telegram?: {
            WebApp?: any;
        };
    }
}

/**
 * 判断是否在 Telegram Mini App 环境中打开
 */
export function isTelegramMiniApp(): boolean {
    return typeof window !== 'undefined' && !!window.Telegram?.WebApp?.initData;
}

/**
 * 初始化 Telegram Mini App 环境设置
 */
export function initTelegramMiniApp() {
    if (!isTelegramMiniApp()) return;
    try {
        const tg = window.Telegram?.WebApp;
        if (tg) {
            tg.ready();
            tg.expand(); // 展开至全屏高度
            // 将 Telegram 主题颜色同步至页面
            if (tg.setHeaderColor) tg.setHeaderColor('#0f172a');
            if (tg.setBackgroundColor) tg.setBackgroundColor('#0f172a');
        }
    } catch (e) {
        console.warn('Failed to init Telegram WebApp', e);
    }
}

/**
 * 触发 Telegram 原生手机触觉震动反馈 (HapticFeedback)
 */
export function tgHaptic(type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' = 'medium') {
    if (!isTelegramMiniApp()) return;
    try {
        const haptic = window.Telegram?.WebApp?.HapticFeedback;
        if (!haptic) return;

        if (['light', 'medium', 'heavy'].includes(type)) {
            haptic.impactOccurred(type);
        } else if (['success', 'warning', 'error'].includes(type)) {
            haptic.notificationOccurred(type);
        }
    } catch (e) { }
}

/**
 * 将当前 Telegram 用户与 Cloudflare D1 档案无感鉴权同步
 */
export async function syncTelegramUser(): Promise<any | null> {
    if (!isTelegramMiniApp()) return null;
    try {
        const initData = window.Telegram?.WebApp?.initData;
        if (!initData) return null;

        const res = await fetch('/api/telegram/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ initData })
        });

        if (res.ok) {
            const data = await res.json();
            if (data.success) {
                return data.user;
            }
        }
    } catch (e) {
        console.warn('Telegram auth sync failed', e);
    }
    return null;
}
