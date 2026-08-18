"use client";

import { useRef, useState } from "react";

type SpeechRecognitionEventLike = {
  results: ArrayLike<ArrayLike<{ transcript: string }>>;
  resultIndex: number;
  isFinal: boolean;
};

type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  start: () => void;
  stop: () => void;
};

function findSpeechRecognition(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === "undefined") return null;
  const candidate = (window as unknown as { SpeechRecognition?: new () => SpeechRecognitionLike; webkitSpeechRecognition?: new () => SpeechRecognitionLike }).SpeechRecognition;
  if (candidate) return candidate;
  const webkitCandidate = (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognitionLike }).webkitSpeechRecognition;
  return webkitCandidate ?? null;
}

export function useVoiceDictation(appendText: (text: string, isFinal: boolean) => void) {
  const [isRecording, setIsRecording] = useState(false);
  const [unsupported, setUnsupported] = useState(() => !findSpeechRecognition());
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null as SpeechRecognitionLike | null);
  const appendedRef = useRef(new Set<string>());

  const startRecording = () => {
    if (isRecording) return;
    const Recognition = findSpeechRecognition();
    if (!Recognition) {
      setUnsupported(true);
      return;
    }
    try {
      const recognition: SpeechRecognitionLike = new Recognition();
      recognition.lang = "en-US";
      recognition.continuous = true;
      recognition.interimResults = true;
      appendedRef.current.clear();
      recognition.onresult = event => {
        let draft = "";
        for (let index = event.resultIndex; index < event.results.length; index += 1) {
          const result = event.results[index];
          const transcript = result[0]?.transcript ?? "";
          if (!transcript) continue;
          if (event.isFinal || index < event.results.length - 1) {
            if (!event.isFinal && appendedRef.current.has(transcript)) continue;
            appendedRef.current.add(transcript);
          }
          draft += transcript;
        }
        if (draft.trim()) appendText(draft.trim(), event.isFinal);
      };
      recognition.onend = () => {
        setIsRecording(false);
        recognitionRef.current = null;
      };
      recognition.onerror = () => {
        setIsRecording(false);
        recognitionRef.current = null;
      };
      recognition.start();
      recognitionRef.current = recognition;
      setIsRecording(true);
    } catch {
      setUnsupported(true);
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (!isRecording) return;
    const recognition = recognitionRef.current;
    if (recognition) {
      try {
        recognition.stop();
      } catch {
        /* durdurma hatası yok sayılır; onend durumu temizler */
      }
    }
    setIsRecording(false);
    recognitionRef.current = null;
  };

  return { isRecording, unsupported, startRecording, stopRecording };
}
