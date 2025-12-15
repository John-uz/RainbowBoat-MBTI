
import { TaskOption, Player } from "../types";

// Pollinations.ai text generation endpoint
const API_URL = "https://text.pollinations.ai/";

// Helper to clean JSON string
const cleanJson = (text: string) => {
    // Remove code blocks
    let cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
    // Sometimes AI adds text before/after JSON
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
        cleaned = cleaned.substring(firstBrace, lastBrace + 1);
    }
    return cleaned;
};

export const generateTaskContent = async (
    category: 'standard' | 'truth' | 'dare' | 'deep', 
    functionId: string, 
    players: Player[], 
    currentPlayer: Player
): Promise<TaskOption> => {
    
    // Fallback content
    const defaultTask: TaskOption = {
        category,
        title: "即兴整活",
        description: "AI 甚至想不出骚操作了，请你现场给在座的一位朋友讲个冷笑话。",
        multiplier: 1.0,
        scoreType: 'expression',
        durationSeconds: 60
    };

    const playerNames = players.map(p => p.name).join(', ');
    const context = `
        Context: Casual social board game for Chinese college students/young adults. 
        Tone: Humorous, Witty, Warm, Fun. (幽默、风趣、温暖).
        Current Player: "${currentPlayer.name}" (MBTI: ${currentPlayer.mbti}).
        Other Players: ${playerNames}.
        Jungian Function on Tile: "${functionId}" (Use this loosely for flavor).
    `;

    let specificPrompt = "";
    if (category === 'standard') specificPrompt = "Task: A simple, fun interaction or mini-game. Not too embarrassing.";
    if (category === 'truth') specificPrompt = "Task: An interesting question about life, friendships, or personal habits. (真心话)";
    if (category === 'dare') specificPrompt = "Task: A funny physical action or performance. (大冒险)";
    if (category === 'deep') specificPrompt = "Task: A moment of sincere appreciation or thought. (走心时刻)";

    const prompt = `
        ${context}
        ${specificPrompt}
        
        Generate a JSON object (Simplified Chinese) with:
        - "title": Short, catchy title.
        - "description": The instruction. Mention specific other players by name randomly if needed.
        - "scoreType": One of ["trust", "insight", "expression"].
        - "durationSeconds": Number (30-90).
        
        Strict JSON format.
    `;

    try {
        const response = await fetch(`${API_URL}${encodeURIComponent(prompt)}`);
        const text = await response.text();
        const cleaned = cleanJson(text);
        const parsed = JSON.parse(cleaned);
        
        return {
            category,
            title: parsed.title || defaultTask.title,
            description: parsed.description || defaultTask.description,
            scoreType: parsed.scoreType || 'expression',
            durationSeconds: parsed.durationSeconds || 60,
            multiplier: category === 'deep' ? 1.5 : (category === 'standard' ? 1.0 : 1.2)
        };
    } catch (e) {
        console.warn("Pollinations AI generation failed", e);
        return {
            ...defaultTask,
            multiplier: category === 'deep' ? 1.5 : (category === 'standard' ? 1.0 : 1.2)
        };
    }
};

export const generateGameReport = async (
    players: Player[], 
    snapshots: string[]
): Promise<{ groupAnalysis: string, playerAnalysis: Record<string, string> }> => {
    
    // Fallback if no logs
    if (snapshots.length === 0) snapshots.push("大家进行了一场愉快的游戏，由于记录太少，AI决定去摸鱼了。");

    const prompt = `
        Role: A witty, humorous, and warm psychologist (幽默温暖的心理学家).
        Task: Analyze the board game session based on these logs.
        Language: Simplified Chinese.
        
        Players: ${players.map(p => `${p.name}(${p.mbti})`).join(', ')}.
        Game Events Log: ${snapshots.join('; ')}.
        
        Output JSON:
        {
          "groupAnalysis": "A 100-word summary of the group dynamic. Be funny but kind.",
          "playerAnalysis": {
             "${players[0].id}": "One sentence witty comment about their performance.",
             ... (for all players)
          }
        }
    `;

    try {
        const response = await fetch(`${API_URL}${encodeURIComponent(prompt)}`);
        const text = await response.text();
        const cleaned = cleanJson(text);
        return JSON.parse(cleaned);
    } catch (e) {
        console.error("Report generation failed", e);
        return {
            groupAnalysis: "这局游戏太精彩了，不仅大家的配合天衣无缝，就连AI的CPU都干烧了。总之，你们是最佳拍档！",
            playerAnalysis: Object.fromEntries(players.map(p => [p.id, "表现得太棒了，简直是天选之子！"]))
        };
    }
};
