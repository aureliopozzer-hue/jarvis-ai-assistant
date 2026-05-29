'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  Mic,
  MicOff,
  ImagePlus,
  X,
  Loader2,
  Radio,
  SignalZero,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useJarvisStore } from '@/lib/jarvis-store';

// ─── Audio Recording Utility ─────────────────────────────────────────

class AudioRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  private stream: MediaStream | null = null;

  async start(): Promise<void> {
    this.chunks = [];
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.mediaRecorder = new MediaRecorder(this.stream, {
      mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm',
    });

    this.mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        this.chunks.push(e.data);
      }
    };

    this.mediaRecorder.start(100); // Collect data every 100ms
  }

  async stop(): Promise<string> {
    return new Promise((resolve) => {
      if (!this.mediaRecorder) {
        resolve('');
        return;
      }

      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.chunks, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result as string;
          // Remove data URL prefix to get raw base64
          const base64Data = base64.split(',')[1];
          resolve(base64Data);
        };
        reader.readAsDataURL(blob);

        // Stop all tracks
        this.stream?.getTracks().forEach((track) => track.stop());
        this.stream = null;
        this.mediaRecorder = null;
      };

      this.mediaRecorder.stop();
    });
  }

  cancel(): void {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
    this.stream?.getTracks().forEach((track) => track.stop());
    this.stream = null;
    this.mediaRecorder = null;
    this.chunks = [];
  }
}

// ─── Component ──────────────────────────────────────────────────────

export function JarvisInput() {
  const [message, setMessage] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recorderRef = useRef<AudioRecorder | null>(null);

  const {
    isLoading,
    isListening,
    isSpeaking,
    activePanel,
    sendMessage,
    searchWeb,
    startListening,
    stopListening,
    setVisionImage,
    setActivePanel,
    wakeWordActive,
    wakeWordState,
    setWakeWordActive,
    setWakeWordState,
    setVoiceInitiated,
  } = useJarvisStore();

  // Cleanup recorder on unmount
  useEffect(() => {
    return () => {
      recorderRef.current?.cancel();
    };
  }, []);

  // Auto-focus input when wake word detects "jarvis"
  useEffect(() => {
    if (wakeWordState === 'awake') {
      if (activePanel !== 'chat') {
        setActivePanel('chat');
      }
      // Small delay to ensure panel switch has occurred
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [wakeWordState, activePanel, setActivePanel]);

  const handleSend = useCallback(async () => {
    const trimmed = message.trim();
    if (!trimmed && !imagePreview) return;
    if (isLoading) return;

    if (activePanel === 'search') {
      await searchWeb(trimmed);
    } else {
      await sendMessage(trimmed);
    }

    setMessage('');
    inputRef.current?.focus();
  }, [message, imagePreview, isLoading, activePanel, sendMessage, searchWeb]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const handleMicToggle = useCallback(async () => {
    if (isListening) {
      // Stop recording and transcribe
      if (recorderRef.current) {
        try {
          setWakeWordState('processing');
          const base64Audio = await recorderRef.current.stop();
          stopListening();

          if (base64Audio) {
            // Send to ASR API
            const response = await fetch('/api/jarvis/voice', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ audio: base64Audio }),
            });

            if (response.ok) {
              const data = await response.json();
              if (data.text && data.text.trim()) {
                const transcribedText = data.text.trim();
                // Auto-switch to chat if on another panel
                if (activePanel !== 'chat' && activePanel !== 'search') {
                  setActivePanel('chat');
                }
                // Auto-send voice message with TTS response
                setVoiceInitiated(true);
                if (activePanel === 'search') {
                  await searchWeb(transcribedText);
                } else {
                  await sendMessage(transcribedText);
                }
              }
            }
          }
        } catch (error) {
          console.error('Voice transcription error:', error);
          stopListening();
        }
        recorderRef.current = null;
        setWakeWordState('idle');
      } else {
        stopListening();
        setWakeWordState('idle');
      }
    } else {
      // Start recording
      try {
        const recorder = new AudioRecorder();
        await recorder.start();
        recorderRef.current = recorder;
        startListening();
      } catch (error) {
        console.error('Microphone access error:', error);
      }
    }
  }, [isListening, startListening, stopListening, activePanel, setActivePanel, setWakeWordState, setVoiceInitiated, sendMessage, searchWeb]);

  const handleImageAttach = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        setImagePreview(base64);
        if (activePanel === 'vision') {
          setVisionImage(base64);
        } else {
          // Switch to vision panel when image is attached
          setActivePanel('vision');
          setVisionImage(base64);
        }
      };
      reader.readAsDataURL(file);

      // Reset the input so same file can be re-selected
      e.target.value = '';
    },
    [activePanel, setVisionImage, setActivePanel]
  );

  const removeImage = useCallback(() => {
    setImagePreview(null);
  }, []);

  const getPlaceholder = () => {
    if (wakeWordState === 'awake') return 'JARVIS detectado! Fale ou digite...';
    if (isListening) return 'Ouvindo...';
    if (isSpeaking) return 'JARVIS está falando...';

    switch (activePanel) {
      case 'chat':
        return 'Pergunte ao JARVIS...';
      case 'vision':
        return imagePreview ? 'Pergunte sobre esta imagem...' : 'Anexe uma imagem e pergunte...';
      case 'search':
        return 'Buscar na web...';
      case 'dashboard':
        return 'Digite um comando...';
      default:
        return 'Digite uma mensagem...';
    }
  };

  const isWakeAwake = wakeWordState === 'awake';

  return (
    <TooltipProvider delayDuration={300}>
      <div className={`jarvis-panel jarvis-hud-corner p-3 md:p-4 transition-shadow duration-500 ${isWakeAwake ? 'jarvis-wake-flash' : ''}`}>
        {/* Image Preview */}
        <AnimatePresence>
          {imagePreview && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-3 overflow-hidden"
            >
              <div className="relative inline-block">
                <img
                  src={imagePreview}
                  alt="Anexada"
                  className="h-20 rounded-lg border border-jarvis-border object-cover"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={removeImage}
                  className="absolute -right-2 -top-2 h-5 w-5 rounded-full bg-red-500/80 text-white hover:bg-red-500"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Listening Indicator */}
        <AnimatePresence>
          {isListening && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              className="mb-3 flex items-center gap-2"
            >
              <div className="flex items-center gap-1">
                {[0, 1, 2, 3, 4].map((i) => (
                  <motion.div
                    key={i}
                    className="w-1 rounded-full bg-jarvis-cyan"
                    animate={{
                      height: [8, 20, 8],
                    }}
                    transition={{
                      duration: 0.8,
                      repeat: Infinity,
                      delay: i * 0.1,
                      ease: 'easeInOut',
                    }}
                  />
                ))}
              </div>
              <span className="text-xs font-medium text-jarvis-cyan">
                Ouvindo... Clique no microfone para parar
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Wake Word Awake Indicator */}
        <AnimatePresence>
          {isWakeAwake && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              className="mb-3 flex items-center gap-2"
            >
              <Radio className="h-4 w-4 text-jarvis-cyan jarvis-pulse" />
              <span className="text-xs font-medium text-jarvis-cyan">
                Wake word detectado! Fale ou digite seu comando...
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input Row */}
        <div className="flex items-center gap-2">
          {/* Attach Image Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleImageAttach}
                className="h-9 w-9 shrink-0 text-jarvis-cyan/50 hover:bg-jarvis-cyan/10 hover:text-jarvis-cyan"
              >
                <ImagePlus className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Anexar Imagem</p>
            </TooltipContent>
          </Tooltip>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />

          {/* Text Input */}
          <div className="relative flex-1">
            <Input
              ref={inputRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={getPlaceholder()}
              disabled={isListening || isSpeaking}
              className={`h-10 rounded-lg border-jarvis-border bg-jarvis-dark/50 pr-3 text-sm text-jarvis-cyan/90 placeholder:text-jarvis-cyan/25 focus-visible:ring-jarvis-cyan/30 transition-shadow duration-300 ${
                isWakeAwake ? 'shadow-[0_0_15px_rgba(0,212,255,0.3),inset_0_0_10px_rgba(0,212,255,0.1)] border-jarvis-cyan/50' : ''
              }`}
            />
          </div>

          {/* Wake Word Toggle Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setWakeWordActive(!wakeWordActive)}
                className={`h-9 w-9 shrink-0 ${
                  wakeWordActive
                    ? 'text-jarvis-cyan bg-jarvis-cyan/10 hover:bg-jarvis-cyan/20'
                    : 'text-jarvis-cyan/30 hover:bg-jarvis-cyan/10 hover:text-jarvis-cyan/60'
                }`}
              >
                {wakeWordActive ? (
                  <Radio className="h-4 w-4 jarvis-wake-breathing" />
                ) : (
                  <SignalZero className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{wakeWordActive ? 'Desativar Wake Word' : 'Ativar Wake Word'}</p>
            </TooltipContent>
          </Tooltip>

          {/* Microphone Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleMicToggle}
                disabled={isSpeaking}
                className={`relative h-9 w-9 shrink-0 ${
                  isListening
                    ? 'jarvis-listen-ring bg-jarvis-cyan/20 text-jarvis-cyan'
                    : 'text-jarvis-cyan/50 hover:bg-jarvis-cyan/10 hover:text-jarvis-cyan'
                }`}
              >
                {isListening ? (
                  <Mic className="h-4 w-4" />
                ) : (
                  <MicOff className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{isListening ? 'Parar de Ouvir' : 'Começar a Ouvir'}</p>
            </TooltipContent>
          </Tooltip>

          {/* Send Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={handleSend}
                disabled={(!message.trim() && !imagePreview) || isLoading}
                className={`h-9 shrink-0 gap-1.5 rounded-lg px-4 text-xs font-medium ${
                  message.trim() || imagePreview
                    ? 'bg-jarvis-cyan/20 text-jarvis-cyan hover:bg-jarvis-cyan/30 border border-jarvis-cyan/30'
                    : 'bg-jarvis-dark/50 text-jarvis-cyan/25 border border-jarvis-border'
                }`}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-3.5 w-3.5" />
                )}
                <span className="hidden sm:inline">Enviar</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Enviar Mensagem</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  );
}
