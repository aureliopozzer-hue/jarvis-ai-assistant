'use client';

import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, ImageIcon, Eye, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useJarvisStore } from '@/lib/jarvis-store';
import ReactMarkdown from 'react-markdown';

export function JarvisVision() {
  const {
    visionImage,
    visionAnalysis,
    isAnalyzing,
    setVisionImage,
    analyzeImage,
    clearVision,
  } = useJarvisStore();

  const [question, setQuestion] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(
    (file: File) => {
      if (!file.type.startsWith('image/')) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        // Store full data URL for display, but extract base64 for API
        setVisionImage(dataUrl);
      };
      reader.readAsDataURL(file);
    },
    [setVisionImage]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);

      const file = e.dataTransfer.files[0];
      if (file) {
        handleFileSelect(file);
      }
    },
    [handleFileSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFileSelect(file);
      }
    },
    [handleFileSelect]
  );

  const handleAnalyze = useCallback(() => {
    if (!question.trim() || !visionImage) return;
    analyzeImage(question.trim());
  }, [question, visionImage, analyzeImage]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleAnalyze();
      }
    },
    [handleAnalyze]
  );

  return (
    <div className="jarvis-panel p-4 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-jarvis-cyan/10">
          <Eye className="h-5 w-5 text-jarvis-cyan" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-jarvis-cyan jarvis-glow-text">
            Visao
          </h2>
          <p className="text-xs text-muted-foreground">
            Analise de imagens com IA
          </p>
        </div>
      </div>

      <ScrollArea className="flex-1 jarvis-scrollbar">
        <div className="space-y-4 pr-2">
          {/* Image Upload Area */}
          {!visionImage ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300 ${
                isDragOver
                  ? 'border-jarvis-cyan bg-jarvis-cyan/10 jarvis-glow-strong'
                  : 'border-jarvis-border hover:border-jarvis-cyan/50 hover:bg-jarvis-cyan/5'
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleInputChange}
              />
              <motion.div
                animate={isDragOver ? { scale: 1.1 } : { scale: 1 }}
                className="flex flex-col items-center gap-3"
              >
                <div className="p-4 rounded-full bg-jarvis-cyan/10">
                  <Upload className="h-8 w-8 text-jarvis-cyan" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Arraste uma imagem aqui
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    ou clique para selecionar
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <ImageIcon className="h-3 w-3" />
                  <span>PNG, JPG, GIF, WebP</span>
                </div>
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-3"
            >
              {/* Image Preview */}
              <div className="relative rounded-xl overflow-hidden jarvis-glow-border">
                <img
                  src={visionImage}
                  alt="Imagem carregada"
                  className="w-full max-h-64 object-contain bg-black/20"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 h-8 w-8 rounded-full bg-black/60 hover:bg-black/80 text-white"
                  onClick={clearVision}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Question Input */}
              <div className="flex gap-2">
                <Input
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="O que voce quer saber sobre esta imagem?"
                  className="flex-1 bg-jarvis-dark/50 border-jarvis-border focus:border-jarvis-cyan focus:ring-jarvis-cyan/20 text-foreground placeholder:text-muted-foreground"
                  disabled={isAnalyzing}
                />
                <Button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing || !question.trim()}
                  className="bg-jarvis-cyan/20 hover:bg-jarvis-cyan/30 text-jarvis-cyan border border-jarvis-cyan/30 disabled:opacity-50"
                >
                  {isAnalyzing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                  <span className="ml-2 hidden sm:inline">Analisar</span>
                </Button>
              </div>
            </motion.div>
          )}

          {/* Loading State */}
          <AnimatePresence>
            {isAnalyzing && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="jarvis-panel p-6 flex flex-col items-center justify-center gap-4"
              >
                <div className="relative">
                  {/* Outer ring */}
                  <div className="w-16 h-16 rounded-full border-2 border-jarvis-cyan/20 jarvis-arc-spinner" />
                  {/* Inner ring */}
                  <div className="absolute inset-2 rounded-full border-2 border-t-jarvis-cyan border-r-transparent border-b-jarvis-cyan/50 border-l-transparent jarvis-arc-spinner" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
                  {/* Center */}
                  <div className="absolute inset-4 rounded-full bg-jarvis-cyan/10 jarvis-pulse" />
                  <Eye className="absolute inset-0 m-auto h-5 w-5 text-jarvis-cyan" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-jarvis-cyan jarvis-glow-text">
                    Analisando imagem...
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Processando com visao computacional
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Analysis Results */}
          <AnimatePresence>
            {visionAnalysis && !isAnalyzing && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="jarvis-panel p-4 jarvis-hud-corner"
              >
                <div className="flex items-center gap-2 mb-3">
                  <Eye className="h-4 w-4 text-jarvis-cyan" />
                  <h3 className="text-sm font-semibold text-jarvis-cyan">
                    Resultado da Analise
                  </h3>
                </div>
                <div className="prose prose-invert prose-sm max-w-none text-foreground/90">
                  <ReactMarkdown>{visionAnalysis}</ReactMarkdown>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </ScrollArea>
    </div>
  );
}
