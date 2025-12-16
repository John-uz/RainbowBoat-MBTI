
// Utility for browser-native Web Speech API
// Handles Speech-to-Text without server-side processing

let recognition: any = null;

export const isSpeechRecognitionSupported = () => {
  return 'webkitSpeechRecognition' in (window as any) || 'SpeechRecognition' in (window as any);
};

export const startSpeechRecognition = (
  onResult: (text: string) => void,
  onEnd: () => void
) => {
  if (!isSpeechRecognitionSupported()) return null;

  // Explicitly cast window to any to avoid TS build errors if types aren't fully shimmed
  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  recognition = new SpeechRecognition();

  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = 'zh-CN'; // Default to Chinese

  recognition.onresult = (event: any) => {
    let finalTranscript = '';
    for (let i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        finalTranscript += event.results[i][0].transcript;
      }
    }
    if (finalTranscript) {
        onResult(finalTranscript);
    }
  };

  recognition.onerror = (event: any) => {
    console.warn('Speech recognition error', event.error);
  };

  recognition.onend = () => {
    onEnd();
  };

  try {
    recognition.start();
  } catch (e) {
    console.warn("Speech recognition already started");
  }

  return recognition;
};

export const stopSpeechRecognition = () => {
  if (recognition) {
    recognition.stop();
    recognition = null;
  }
};
