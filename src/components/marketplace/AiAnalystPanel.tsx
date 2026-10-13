/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  X,
  Send,
  RotateCcw,
  TrendingUp,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';
import { PredictionMarket } from '../../types/market';
import {
  AiChatMessage,
  buildMarketContext,
  sendAiMarketQuery,
  sendQuickAnalysis
} from '../../services/aiAnalystService';

interface AiAnalystPanelProps {
  isOpen: boolean;
  onClose: () => void;
  market: PredictionMarket;
  userPositionSide?: 'YES' | 'NO';
  onDraftThesisFill?: (text: string) => void;
}

export function AiAnalystPanel({
  isOpen,
  onClose,
  market,
  userPositionSide
}: AiAnalystPanelProps) {
  const [messages, setMessages] = useState<AiChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isYesLeading = market.yesProbability >= market.noProbability;
  const leaderSide = isYesLeading ? 'YES' : 'NO';
  const leaderOdds = isYesLeading ? market.yesProbability : market.noProbability;

  const createInitialMessage = (): AiChatMessage => ({
    id: `init-${market.id}-${Date.now()}`,
    role: 'model',
    text: `**Market consensus leans ${leaderSide} (${leaderOdds}%).**\n\n• **Order Flow:** Volume of **${market.volume}** across ${market.traders} traders favors ${leaderSide}.\n• **Key Question:** Will criteria be verified before **${market.timeRemaining}**?\n• **Invalidation:** Watch for sudden counter-catalysts or adverse news.\n\nAsk any question below or tap a quick prompt to analyze odds, risk, or catalysts.`,
    timestamp: 'Just now'
  });

  // Initialize and load live Gemini analysis for this specific market
  useEffect(() => {
    let isCancelled = false;

    if (isOpen) {
      setMessages([]);
      setInputValue('');
      setIsLoading(true);

      // Perform real-time Gemini market analysis for this specific selected market
      const context = buildMarketContext(market, userPositionSide);
      sendQuickAnalysis(context, 'summary')
        .then((aiAnalysis) => {
          if (!isCancelled) {
            setMessages([
              {
                id: `live-init-${market.id}-${Date.now()}`,
                role: 'model',
                text: aiAnalysis || createInitialMessage().text,
                timestamp: 'Just now'
              }
            ]);
          }
        })
        .catch((err) => {
          console.warn('Initial Gemini analysis error:', err);
          if (!isCancelled) {
            setMessages([createInitialMessage()]);
          }
        })
        .finally(() => {
          if (!isCancelled) {
            setIsLoading(false);
          }
        });
    }

    return () => {
      isCancelled = true;
    };
  }, [isOpen, market.id]);

  // Handle Escape key and lock body scroll
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  // Auto scroll to bottom
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading, isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleResetChat = () => {
    setMessages([]);
    setInputValue('');
    setIsLoading(true);
    const context = buildMarketContext(market, userPositionSide);
    sendQuickAnalysis(context, 'summary')
      .then((aiAnalysis) => {
        setMessages([
          {
            id: `live-init-${market.id}-${Date.now()}`,
            role: 'model',
            text: aiAnalysis || createInitialMessage().text,
            timestamp: 'Just now'
          }
        ]);
      })
      .catch(() => {
        setMessages([createInitialMessage()]);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const handleSendMessage = async (customText?: string) => {
    const textToSend = (customText || inputValue).trim();
    if (!textToSend || isLoading) return;

    const userMessage: AiChatMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      text: textToSend,
      timestamp: 'Just now'
    };

    const newHistory = [...messages, userMessage];
    setMessages(newHistory);
    setInputValue('');
    setIsLoading(true);

    try {
      const context = buildMarketContext(market, userPositionSide);
      const apiHistory = newHistory.map((m) => ({
        role: m.role,
        text: m.text
      }));

      const res = await sendAiMarketQuery(context, apiHistory);

      const aiResponse: AiChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'model',
        text: res.text,
        timestamp: 'Just now',
        lean: res.lean,
        confidence: res.confidence
      };

      setMessages((prev) => [...prev, aiResponse]);
    } catch (err) {
      console.error('Failed to get AI response:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = async (type: 'bull_case' | 'bear_case' | 'risk' | 'summary') => {
    if (isLoading) return;

    const labels: Record<string, string> = {
      bull_case: 'What is the strongest bull case for YES?',
      bear_case: 'What is the strongest counter-argument or case for NO?',
      risk: 'What are the main risks that could invalidate the market odds?',
      summary: 'Give me a straight-to-the-point summary of this market.'
    };

    const userMsg: AiChatMessage = {
      id: `quick-usr-${Date.now()}`,
      role: 'user',
      text: labels[type],
      timestamp: 'Just now'
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const context = buildMarketContext(market, userPositionSide);
      const analysisText = await sendQuickAnalysis(context, type);

      const aiMsg: AiChatMessage = {
        id: `quick-ai-${Date.now()}`,
        role: 'model',
        text: analysisText,
        timestamp: 'Just now'
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      console.error('Quick action failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to render message text cleanly without noisy markdown headers
  const formatMessageText = (text: string) => {
    return text.split('\n').map((line, idx) => {
      const trimmed = line.trim();
      if (!trimmed) {
        return <div key={idx} className="h-1.5" />;
      }

      // Check for bullet points
      const isBullet = trimmed.startsWith('•') || trimmed.startsWith('-') || trimmed.startsWith('*');
      const content = isBullet ? trimmed.replace(/^[•\-*]\s*/, '') : trimmed;

      // Parse bold segments **bold**
      const parts = content.split(/(\*\*.*?\*\*)/g);
      const renderedContent = parts.map((part, pIdx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <strong key={pIdx} className="font-bold text-[#09090B]">
              {part.slice(2, -2)}
            </strong>
          );
        }
        return part;
      });

      if (isBullet) {
        return (
          <div key={idx} className="flex items-start gap-2 text-xs leading-relaxed">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
            <span className="text-neutral-700">{renderedContent}</span>
          </div>
        );
      }

      return (
        <p key={idx} className="text-xs leading-relaxed text-neutral-800">
          {renderedContent}
        </p>
      );
    });
  };

  const quickPrompts = [
    { label: `Why is ${leaderSide} leading?`, action: () => handleSendMessage(`Why is ${leaderSide} leading the market at ${leaderOdds}%?`) },
    { label: 'Key invalidation risks', action: () => handleQuickAction('risk') },
    { label: 'Bull Case (YES)', action: () => handleQuickAction('bull_case') },
    { label: 'Bear Case (NO)', action: () => handleQuickAction('bear_case') }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
          {/* Backdrop with smooth blur and fade */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            onClick={onClose}
            className="fixed inset-0 bg-neutral-950/40 backdrop-blur-xs cursor-pointer"
            aria-hidden="true"
          />

          {/* Slide-in & Slide-out Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{
              x: 0,
              transition: {
                type: 'spring',
                damping: 30,
                stiffness: 300,
                mass: 0.8
              }
            }}
            exit={{
              x: '100%',
              transition: {
                duration: 0.22,
                ease: [0.32, 0, 0.67, 0]
              }
            }}
            className="relative z-10 w-full max-w-[420px] h-full bg-white shadow-2xl flex flex-col justify-between border-l border-neutral-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Clean, Noise-Free Header */}
            <div className="px-4 py-3.5 border-b border-neutral-100 flex items-center justify-between bg-white shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-neutral-900 text-white flex items-center justify-center shadow-2xs shrink-0 overflow-hidden p-1">
                  <svg
                    viewBox="0 0 100 100"
                    className="w-full h-full shrink-0"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <circle cx="50" cy="50" r="48" fill="#000000" />
                    <rect x="-5" y="-13" width="10" height="26" rx="5" fill="#ffffff" transform="translate(47, 47) rotate(26)" />
                    <rect x="-4.5" y="-11" width="9" height="22" rx="4.5" fill="#ffffff" transform="translate(61, 53) rotate(26)" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-bold text-[#09090B] font-display">DuckCast AI</h2>
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/80 uppercase tracking-wider font-mono-tabular">
                      Analyst
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-500 font-medium truncate">
                    Direct probabilistic intelligence
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {messages.length > 1 && (
                  <button
                    type="button"
                    onClick={handleResetChat}
                    className="p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer"
                    title="Reset chat"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1.5 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer"
                  title="Close panel"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Compact 1-Line Market Context Reference */}
            <div className="px-4 py-2 bg-neutral-50/80 border-b border-neutral-100 flex items-center justify-between gap-3 text-xs shrink-0">
              <span className="font-semibold text-neutral-800 truncate" title={market.question}>
                {market.question}
              </span>
              <div className="flex items-center gap-1.5 shrink-0 font-mono-tabular font-bold text-[11px]">
                <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/70">
                  YES {market.yesProbability}%
                </span>
                <span className="text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200/70">
                  NO {market.noProbability}%
                </span>
              </div>
            </div>

            {/* Quick Prompts Bar */}
            <div className="px-3 py-2 bg-white border-b border-neutral-100 overflow-x-auto scrollbar-none flex items-center gap-1.5 shrink-0">
              {quickPrompts.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={p.action}
                  disabled={isLoading}
                  className="whitespace-nowrap px-2.5 py-1 text-[11px] font-semibold text-neutral-700 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200/80 rounded-lg transition-colors cursor-pointer disabled:opacity-50 shrink-0"
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[90%] rounded-2xl p-3.5 text-xs shadow-xs ${
                      msg.role === 'user'
                        ? 'bg-[#09090B] text-white rounded-tr-xs'
                        : 'bg-neutral-50/90 border border-neutral-200/80 text-neutral-800 rounded-tl-xs space-y-1.5'
                    }`}
                  >
                    {msg.role === 'user' ? (
                      <p className="leading-relaxed whitespace-pre-wrap font-medium">{msg.text}</p>
                    ) : (
                      formatMessageText(msg.text)
                    )}
                  </div>
                </div>
              ))}

              {/* 3-Dot Text Typing Animation */}
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -2 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col items-start"
                >
                  <div className="bg-neutral-50/90 border border-neutral-200/80 rounded-2xl rounded-tl-xs px-4 py-3 shadow-xs flex items-center gap-2">
                    <div className="flex items-center gap-1.5 py-0.5" aria-label="AI is typing">
                      <motion.span
                        animate={{ y: [0, -5, 0], opacity: [0.35, 1, 0.35] }}
                        transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut' }}
                        className="w-2 h-2 rounded-full bg-[#09090B] inline-block"
                      />
                      <motion.span
                        animate={{ y: [0, -5, 0], opacity: [0.35, 1, 0.35] }}
                        transition={{ duration: 0.8, repeat: Infinity, delay: 0.18, ease: 'easeInOut' }}
                        className="w-2 h-2 rounded-full bg-[#09090B] inline-block"
                      />
                      <motion.span
                        animate={{ y: [0, -5, 0], opacity: [0.35, 1, 0.35] }}
                        transition={{ duration: 0.8, repeat: Infinity, delay: 0.36, ease: 'easeInOut' }}
                        className="w-2 h-2 rounded-full bg-[#09090B] inline-block"
                      />
                    </div>
                    <span className="text-[11px] font-medium text-neutral-400 select-none">
                      DuckCast AI is analyzing
                    </span>
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Straightforward Footer & Input Form */}
            <div className="p-3.5 bg-white border-t border-neutral-100 shrink-0">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center gap-2"
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Ask DuckCast AI..."
                  disabled={isLoading}
                  className="flex-1 px-3.5 py-2.5 text-xs bg-neutral-100 hover:bg-neutral-100/80 focus:bg-white border border-neutral-200/90 focus:border-[#09090B] rounded-xl focus:outline-none transition-colors text-[#09090B] disabled:opacity-50 placeholder:text-neutral-400"
                />

                <button
                  type="submit"
                  disabled={!inputValue.trim() || isLoading}
                  className="w-9 h-9 rounded-xl bg-[#09090B] text-white flex items-center justify-center hover:bg-neutral-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer shadow-2xs shrink-0"
                  title="Send query"
                  aria-label="Send query"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>

              <div className="mt-1.5 text-center text-[10px] text-neutral-400 font-medium">
                Probabilistic market analysis · Not financial advice
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
