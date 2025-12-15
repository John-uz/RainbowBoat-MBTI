
// Simple TTS Utility for Web Speech API

let voices: SpeechSynthesisVoice[] = [];

// Initialize voices
const loadVoices = () => {
    voices = window.speechSynthesis.getVoices().filter(v => v.lang.includes('zh') || v.lang.includes('CN'));
};

if (window.speechSynthesis.onvoiceschanged !== undefined) {
    window.speechSynthesis.onvoiceschanged = loadVoices;
}

export const speak = (text: string, seed: string = 'system') => {
    if (!window.speechSynthesis) return;
    
    // Cancel previous speech to prevent backlog
    window.speechSynthesis.cancel();

    // Ensure voices are loaded
    if (voices.length === 0) loadVoices();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.2; // Slightly faster for game pacing
    utterance.pitch = 1;

    // Deterministic voice selection based on seed (Player ID or Name)
    // This ensures the same bot always sounds roughly the same
    if (voices.length > 0) {
        if (seed === 'system') {
            // Use the first available voice for system
             utterance.voice = voices[0];
        } else {
            // Hash the seed to pick a voice index
            let hash = 0;
            for (let i = 0; i < seed.length; i++) {
                hash = seed.charCodeAt(i) + ((hash << 5) - hash);
            }
            const index = Math.abs(hash) % voices.length;
            utterance.voice = voices[index];
            
            // Variate pitch slightly based on seed for more distinct characters
            utterance.pitch = 0.8 + ((Math.abs(hash) % 5) / 10); // 0.8 - 1.2
        }
    }

    window.speechSynthesis.speak(utterance);
};
