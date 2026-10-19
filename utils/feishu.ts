/**
 * 飞书 (Lark) 运行环境与免登工具库
 */

/**
 * 判断是否在飞书内置浏览器或工作台中打开
 */
export function isFeishu(): boolean {
    if (typeof navigator === 'undefined') return false;
    const ua = navigator.userAgent.toLowerCase();
    return ua.includes('lark') || ua.includes('feishu');
}

/**
 * 检查 URL 中是否有飞书 OAuth 免登 code，若有则调用 Worker 完成自动建档
 */
export async function syncFeishuUser(): Promise<any | null> {
    if (typeof window === 'undefined') return null;

    try {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        if (!code) return null;

        const res = await fetch('/api/feishu/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code })
        });

        if (res.ok) {
            const data = await res.json();
            if (data.success) {
                // 清理 URL 中的 code 参数避免重复请求
                urlParams.delete('code');
                const newQuery = urlParams.toString() ? `?${urlParams.toString()}` : '';
                window.history.replaceState({}, '', `${window.location.pathname}${newQuery}`);
                return data.user;
            }
        }
    } catch (e) {
        console.warn('Feishu auth sync failed', e);
    }
    return null;
}
