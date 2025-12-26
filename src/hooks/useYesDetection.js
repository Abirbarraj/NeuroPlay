import { useEffect, useRef, useState } from 'react';

const YES_VARIANTS = {
  en: ['yes', 'yeah', 'yep', 'ya', 'yah', 'yea', 'yas', 'yaz', 'es'],
  fr: ['oui', 'ouai', 'ouais'],
};

const normalize = (text) =>
  text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/(.)\1{2,}/g, '$1')
    .trim();

export function useYesDetection({
  active = false,
  languages = ['en'],
  confidenceThreshold = 0.1,
  minYesHits = 1,
  cooldownMs = 1500,
}) {
  const [isListening, setIsListening] = useState(false);
  const [yesDetected, setYesDetected] = useState(false);

  const recognitionRef = useRef(null);
  const yesHitsRef = useRef(0);
  const lastTriggerRef = useRef(0);

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => setIsListening(true);

    recognition.onend = () => {
      setIsListening(false);
      if (active && !yesDetected) {
        try {
          recognition.start();
        } catch {}
      }
    };

    recognition.onresult = (event) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i][0];
        const isFinal = event.results[i].isFinal;
        const transcript = normalize(result.transcript);
        const confidence = result.confidence ?? (isFinal ? 0.8 : 0.5); // Higher default for final, lower for interim

        console.log(`${isFinal ? 'FINAL' : 'INTERIM'} transcript:`, transcript, 'confidence:', confidence);

        const words = transcript.split(/\s+/);
        const yesWords = languages.flatMap(
          (lang) => YES_VARIANTS[lang] || []
        );

        const isYes = words.some((w) => yesWords.includes(w));

        console.log('Words:', words, 'Yes detected:', isYes);

        // For interim results, be more lenient; for final, use normal threshold
        const effectiveThreshold = isFinal ? confidenceThreshold : Math.max(confidenceThreshold - 0.1, 0.1);

        if (
          isYes &&
          (confidence >= effectiveThreshold || confidence === 0) &&
          Date.now() - lastTriggerRef.current > cooldownMs
        ) {
          console.log(`${isFinal ? 'FINAL' : 'INTERIM'} yes confirmed! Confidence: ${confidence}, Threshold: ${effectiveThreshold}`);
          yesHitsRef.current += 1;

          if (yesHitsRef.current >= minYesHits) {
            lastTriggerRef.current = Date.now();
            setYesDetected(true);
            recognition.stop();
            return;
          }
        } else if (isYes) {
          console.log(`Yes detected but not triggered (${isFinal ? 'final' : 'interim'}) - confidence: ${confidence}, threshold: ${effectiveThreshold}, cooldown: ${Date.now() - lastTriggerRef.current}`);
        }
      }
    };

    recognitionRef.current = recognition;
  }, []);

  useEffect(() => {
    if (!recognitionRef.current) return;

    if (active && !yesDetected) {
      try {
        recognitionRef.current.start();
      } catch {}
    } else {
      recognitionRef.current.stop();
    }
  }, [active, yesDetected]);

  return {
    isListening,
    yesDetected,
    reset: () => {
      yesHitsRef.current = 0;
      setYesDetected(false);
    },
  };
}