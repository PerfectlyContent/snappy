import { useState, useRef, useCallback } from 'react';

export function useVoice({ onComplete, onError } = {}) {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [supported] = useState(
    typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)
  );
  const recognitionRef = useRef(null);
  const transcriptRef = useRef('');
  const onCompleteRef = useRef(onComplete);
  const onErrorRef = useRef(onError);
  onCompleteRef.current = onComplete;
  onErrorRef.current = onError;

  const startListening = useCallback(() => {
    if (!supported) return;

    transcriptRef.current = '';
    setTranscript('');

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => setListening(true);

    recognition.onresult = (event) => {
      const current = Array.from(event.results)
        .map(r => r[0].transcript)
        .join('');
      setTranscript(current);
      transcriptRef.current = current;
    };

    recognition.onerror = (event) => {
      console.error('Speech error:', event.error);
      setListening(false);
      if (onErrorRef.current) {
        const messages = {
          'not-allowed': 'Microphone access denied. Please allow microphone permissions.',
          'no-speech': 'No speech detected. Please try again.',
          'network': 'Network error. Please check your connection.',
        };
        onErrorRef.current(messages[event.error] || `Voice error: ${event.error}`);
      }
    };

    recognition.onend = () => {
      setListening(false);
      const finalText = transcriptRef.current;
      if (finalText && onCompleteRef.current) {
        onCompleteRef.current(finalText);
      }
      setTranscript('');
      transcriptRef.current = '';
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch (err) {
      setListening(false);
      if (onErrorRef.current) {
        onErrorRef.current('Could not start voice input. Please try again.');
      }
    }
  }, [supported]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  }, []);

  return {
    listening,
    transcript,
    supported,
    startListening,
    stopListening,
  };
}
