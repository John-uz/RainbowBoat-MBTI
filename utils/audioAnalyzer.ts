
let audioContext: AudioContext | null = null;
let mediaStreamSource: MediaStreamAudioSourceNode | null = null;
let analyser: AnalyserNode | null = null;
let stream: MediaStream | null = null;
let animationFrame: number;

export const startAudioMonitoring = async (onVolume: (volume: number) => void) => {
    try {
        // We need a separate stream usually to get raw audio data
        // Note: ensuring we don't conflict if SpeechRecognition is running might depend on browser
        stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });

        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        mediaStreamSource = audioContext.createMediaStreamSource(stream);
        mediaStreamSource.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        const checkVolume = () => {
            if (!analyser) return;
            analyser.getByteFrequencyData(dataArray);

            // Calculate RMS or average
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
                sum += dataArray[i];
            }
            const average = sum / dataArray.length; // 0 - 255
            const normalized = average / 255;

            onVolume(normalized);
            animationFrame = requestAnimationFrame(checkVolume);
        }
        checkVolume();
    } catch (e) {
        console.error("Audio monitoring failed", e);
    }
};

export const stopAudioMonitoring = () => {
    if (animationFrame) {
        cancelAnimationFrame(animationFrame);
    }
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        stream = null;
    }
    if (audioContext) {
        audioContext.close();
        audioContext = null;
    }
};
