/**
 * Voice input (speech-to-text) via the Web Speech API.
 *
 * The SpeechRecognition interface has no lib.dom typings, so minimal
 * structural types are declared here. Recognition requires a secure context
 * (HTTPS or localhost) and is unavailable in some browsers (e.g. Firefox);
 * consumers must check `isSupported` and hide voice controls when false.
 */

import { useCallback, useEffect, useRef, useState } from 'react';

interface SpeechRecognitionAlternativeLike {
  transcript: string;
}

interface SpeechRecognitionResultLike {
  isFinal: boolean;
  0: SpeechRecognitionAlternativeLike;
}

interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: SpeechRecognitionResultLike;
  };
}

interface SpeechRecognitionErrorEventLike {
  error: string;
}

interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

function getSpeechRecognitionCtor(): SpeechRecognitionConstructor | null {
  if (typeof window === 'undefined' || !window.isSecureContext) return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

const ERROR_MESSAGES: Record<string, string> = {
  'not-allowed': 'Acesso ao microfone negado. Permite o microfone nas definições do browser.',
  'service-not-allowed': 'O reconhecimento de voz não está disponível neste browser.',
  'no-speech': 'Não ouvi nada. Tenta falar mais perto do microfone.',
  'audio-capture': 'Nenhum microfone encontrado. Liga um microfone e tenta de novo.',
  network: 'O reconhecimento de voz precisa de ligação à internet.',
};

const ERROR_DISPLAY_MS = 5000;

interface UseSpeechRecognitionOptions {
  /** Called once with the final transcript after the user stops speaking. */
  onFinal: (transcript: string) => void;
  lang?: string;
}

export function useSpeechRecognition({ onFinal, lang = 'pt-PT' }: UseSpeechRecognitionOptions) {
  const [isSupported] = useState(() => getSpeechRecognitionCtor() !== null);
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const errorTimerRef = useRef<number | null>(null);
  // Ref indirection keeps `start` stable even if the consumer passes a new
  // callback each render.
  const onFinalRef = useRef(onFinal);
  useEffect(() => {
    onFinalRef.current = onFinal;
  }, [onFinal]);

  const showError = useCallback((code: string) => {
    // "aborted" means the user cancelled — not an error worth surfacing
    if (code === 'aborted') return;
    setError(ERROR_MESSAGES[code] ?? 'Não consegui usar o microfone. Tenta novamente.');
    if (errorTimerRef.current) window.clearTimeout(errorTimerRef.current);
    errorTimerRef.current = window.setTimeout(() => setError(null), ERROR_DISPLAY_MS);
  }, []);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  const start = useCallback(() => {
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor || recognitionRef.current) return;

    setError(null);
    setInterimTranscript('');

    const recognition = new Ctor();
    recognition.lang = lang;
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.maxAlternatives = 1;

    let finalTranscript = '';
    recognition.onresult = (event) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) finalTranscript += result[0].transcript;
        else interim += result[0].transcript;
      }
      setInterimTranscript((finalTranscript + interim).trimStart());
    };
    recognition.onerror = (event) => showError(event.error);
    // onend fires on natural pause, manual stop() and after errors, so all
    // paths converge here
    recognition.onend = () => {
      recognitionRef.current = null;
      setIsListening(false);
      setInterimTranscript('');
      const finalText = finalTranscript.trim();
      if (finalText) onFinalRef.current(finalText);
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
      setIsListening(true);
    } catch {
      showError('service-not-allowed');
    }
  }, [lang, showError]);

  const toggle = useCallback(() => {
    if (recognitionRef.current) stop();
    else start();
  }, [start, stop]);

  // Abort in-flight recognition when the consuming component unmounts
  useEffect(
    () => () => {
      recognitionRef.current?.abort();
      if (errorTimerRef.current) window.clearTimeout(errorTimerRef.current);
    },
    [],
  );

  return { isSupported, isListening, interimTranscript, error, start, stop, toggle };
}
