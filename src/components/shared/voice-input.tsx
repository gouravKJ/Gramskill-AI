"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Mic, MicOff } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/misc";
import { cn } from "@/lib/utils";
import { usePreferences } from "@/components/providers/app-providers";

/**
 * Speech-to-text input for users with limited digital literacy.
 *
 * Uses the Web Speech API where available (Chrome/Edge, and Android Chrome
 * which is the common device in rural deployments). Where it is unavailable we
 * say so plainly rather than showing a button that silently does nothing.
 */

interface SpeechRecognitionEventLike {
  results: ArrayLike<ArrayLike<{ transcript: string }>>;
}

interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
}

type SpeechCtor = new () => SpeechRecognitionLike;

function getSpeechRecognition(): SpeechCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechCtor;
    webkitSpeechRecognition?: SpeechCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function VoiceInput({
  onTranscript,
  className,
  label = "Speak",
}: {
  onTranscript: (text: string) => void;
  className?: string;
  label?: string;
}) {
  const { prefs } = usePreferences();
  const [listening, setListening] = React.useState(false);
  const [supported, setSupported] = React.useState(false);
  const recognitionRef = React.useRef<SpeechRecognitionLike | null>(null);

  React.useEffect(() => {
    setSupported(Boolean(getSpeechRecognition()));
    return () => recognitionRef.current?.stop();
  }, []);

  const start = React.useCallback(() => {
    const Ctor = getSpeechRecognition();
    if (!Ctor) {
      toast.error("Voice input is not available in this browser.", {
        description: "Please type your question instead, or use Chrome on Android.",
      });
      return;
    }

    const recognition = new Ctor();
    recognition.lang = prefs.language === "hi" ? "hi-IN" : "en-IN";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = (event) => {
      const transcript = Array.from({ length: event.results.length })
        .map((_, i) => event.results[i][0]?.transcript ?? "")
        .join(" ")
        .trim();
      if (transcript) onTranscript(transcript);
    };
    recognition.onerror = (event) => {
      if (event.error !== "aborted") {
        toast.error("I couldn't hear that clearly.", {
          description: "Please try again in a quieter place.",
        });
      }
      setListening(false);
    };
    recognition.onend = () => setListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }, [onTranscript, prefs.language]);

  const stop = React.useCallback(() => {
    recognitionRef.current?.stop();
    setListening(false);
  }, []);

  if (!supported) return null;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant={listening ? "destructive" : "outline"}
          size="icon"
          onClick={listening ? stop : start}
          aria-label={listening ? "Stop listening" : label}
          className={cn("relative", className)}
        >
          {listening ? <MicOff className="size-4" /> : <Mic className="size-4" />}
          {listening && (
            <motion.span
              className="absolute inset-0 rounded-lg border-2 border-destructive"
              animate={{ scale: [1, 1.25], opacity: [0.7, 0] }}
              transition={{ duration: 1.4, repeat: Infinity }}
              aria-hidden
            />
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{listening ? "Listening… tap to stop" : `${label} (voice input)`}</TooltipContent>
    </Tooltip>
  );
}
