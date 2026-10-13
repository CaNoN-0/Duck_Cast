import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Activity,
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Sparkles,
  Users,
  DollarSign,
  MessageSquare,
  ShieldCheck,
  Flame,
  ArrowRight
} from 'lucide-react';
import { PredictionMarket } from '../../types/market';
import {
  MarketActivityItem,
  getInitialActivitiesForMarket,
  generateNextLiveActivity
} from '../../services/activityCenterService';

interface HorizontalActivityStreamProps {
  market?: PredictionMarket | null;
  allMarkets?: PredictionMarket[];
  onSelectMarket?: (market: PredictionMarket) => void;
  className?: string;
  showTitle?: boolean;
}

export function HorizontalActivityStream({
  market,
  allMarkets = [],
  onSelectMarket,
  className = '',
  showTitle = true
}: HorizontalActivityStreamProps) {
  // Initial list of activities for this market or across all markets
  const [activities, setActivities] = useState<MarketActivityItem[]>(() => {
    if (market) {
      return getInitialActivitiesForMarket(market);
    }
    // Across multiple markets
    if (allMarkets.length > 0) {
      const combined = allMarkets
        .slice(0, 6)
        .flatMap((m) => getInitialActivitiesForMarket(m).slice(0, 2))
        .sort((a, b) => b.timestampMs - a.timestampMs);
      return combined.length > 0 ? combined : [];
    }
    return [];
  });

  const [isStreaming, setIsStreaming] = useState(true);
  const [sideFilter, setSideFilter] = useState<'ALL' | 'YES' | 'NO'>('ALL');
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // When selected market changes, refresh activities for that market
  useEffect(() => {
    if (market) {
      setActivities(getInitialActivitiesForMarket(market));
    }
  }, [market?.id]);

  // Live feed simulation: periodically generate fresh live events that fade in
  useEffect(() => {
    if (!isStreaming) return;

    const interval = setInterval(() => {
      // Pick target market: either current market, or random one from allMarkets
      const targetMarket =
        market ||
        (allMarkets.length > 0
          ? allMarkets[Math.floor(Math.random() * allMarkets.length)]
          : null);

      if (!targetMarket) return;

      const newAct = generateNextLiveActivity(targetMarket);

      setActivities((prev) => {
        // Prepend new activity so it fades in on the left; cap list to 16 items so older fade out
        return [newAct, ...prev.slice(0, 15)];
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [isStreaming, market, allMarkets]);

  // Scroll controls
  const handleScroll = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return;
    const scrollAmount = 300;
    scrollContainerRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });
  };

  const filteredActivities = activities.filter((act) => {
    if (sideFilter === 'YES') return act.side === 'YES';
    if (sideFilter === 'NO') return act.side === 'NO';
    return true;
  });

  return (
    <div className={`w-full bg-white rounded-2xl border border-neutral-200/90 shadow-xs p-4 sm:p-5 relative ${className}`}>
      {/* Header with Title, Live Badge, Filter, and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-100 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-neutral-900 text-white flex items-center justify-center shadow-2xs shrink-0">
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold font-display text-[#09090B]">
                Live Activity Center
              </h3>
              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                <span className={`w-1.5 h-1.5 rounded-full bg-emerald-500 ${isStreaming ? 'animate-pulse' : ''}`} />
                {isStreaming ? 'LIVE FEED' : 'PAUSED'}
              </span>
            </div>
            <p className="text-[11px] text-neutral-500 font-medium">
              {market
                ? `Real-time activity stream for "${market.question.slice(0, 45)}..."`
                : 'Real-time order flow and community activity stream'}
            </p>
          </div>
        </div>

        {/* Action Controls: Side filters, Streaming toggle, Scroll arrows */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 bg-neutral-100 p-0.5 rounded-lg text-xs font-bold">
            <button
              type="button"
              onClick={() => setSideFilter('ALL')}
              className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
                sideFilter === 'ALL'
                  ? 'bg-white text-[#09090B] shadow-2xs'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setSideFilter('YES')}
              className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
                sideFilter === 'YES'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'text-neutral-500 hover:text-emerald-700'
              }`}
            >
              YES
            </button>
            <button
              type="button"
              onClick={() => setSideFilter('NO')}
              className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
                sideFilter === 'NO'
                  ? 'bg-rose-600 text-white shadow-2xs'
                  : 'text-neutral-500 hover:text-rose-700'
              }`}
            >
              NO
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsStreaming(!isStreaming)}
            className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg border transition-colors cursor-pointer ${
              isStreaming
                ? 'bg-neutral-50 text-neutral-700 border-neutral-200 hover:bg-neutral-100'
                : 'bg-emerald-50 text-emerald-800 border-emerald-300'
            }`}
            title={isStreaming ? 'Pause live updates' : 'Resume live stream'}
          >
            {isStreaming ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            <span>{isStreaming ? 'Pause' : 'Resume'}</span>
          </button>

          <div className="hidden sm:flex items-center gap-1 text-neutral-400">
            <button
              type="button"
              onClick={() => handleScroll('left')}
              className="p-1 hover:text-neutral-800 hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer"
              title="Scroll left"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => handleScroll('right')}
              className="p-1 hover:text-neutral-800 hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer"
              title="Scroll right"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Horizontal Layout Container where recent activities fade in and older fade out */}
      <div className="relative w-full">
        <div
          ref={scrollContainerRef}
          className="flex flex-row overflow-x-auto gap-3 py-2 px-1 no-scrollbar scroll-smooth items-stretch"
          style={{
            maskImage:
              'linear-gradient(to right, black 82%, rgba(0, 0, 0, 0.45) 94%, transparent 100%)',
            WebkitMaskImage:
              'linear-gradient(to right, black 82%, rgba(0, 0, 0, 0.45) 94%, transparent 100%)'
          }}
        >
          <AnimatePresence initial={false} mode="popLayout">
            {filteredActivities.map((act, index) => {
              // Calculate graceful opacity degradation so older activities fade out
              let opacity = 1;
              if (index === 0) opacity = 1;
              else if (index <= 3) opacity = 0.98;
              else if (index <= 6) opacity = 0.85;
              else if (index <= 9) opacity = 0.65;
              else opacity = 0.45;

              const isYes = act.side === 'YES';
              const isNo = act.side === 'NO';

              return (
                <motion.div
                  key={act.id}
                  layout
                  initial={{ opacity: 0, scale: 0.88, x: -35 }}
                  animate={{
                    opacity: opacity,
                    scale: 1,
                    x: 0,
                    transition: {
                      type: 'spring',
                      stiffness: 400,
                      damping: 25,
                      mass: 0.8
                    }
                  }}
                  exit={{
                    opacity: 0,
                    scale: 0.85,
                    x: 35,
                    transition: { duration: 0.25, ease: 'easeOut' }
                  }}
                  className={`min-w-[270px] max-w-[290px] shrink-0 p-3.5 rounded-xl border bg-white flex flex-col justify-between transition-all duration-200 select-none ${
                    index === 0
                      ? 'border-emerald-300 ring-2 ring-emerald-100 shadow-md'
                      : 'border-neutral-200/80 hover:border-neutral-300 shadow-2xs'
                  }`}
                >
                  {/* Top: Fluent Username, Badge, Time */}
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        {/* Avatar initials badge */}
                        <div
                          className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white uppercase shrink-0 ${
                            isYes
                              ? 'bg-emerald-600'
                              : isNo
                              ? 'bg-rose-600'
                              : 'bg-neutral-800'
                          }`}
                        >
                          {act.username.slice(0, 2)}
                        </div>
                        <span className="text-xs font-bold text-[#09090B] font-display truncate">
                          @{act.username}
                        </span>
                      </div>

                      <span className="text-[10px] font-mono-tabular font-medium text-neutral-400 shrink-0">
                        {act.timeAgo}
                      </span>
                    </div>

                    {/* Middle: Order Badge & Amount */}
                    <div className="flex items-baseline justify-between gap-2 mb-2 bg-neutral-50 p-2 rounded-lg border border-neutral-100">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider font-mono-tabular ${
                            isYes
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300/70'
                              : isNo
                              ? 'bg-rose-100 text-rose-800 border border-rose-300/70'
                              : 'bg-purple-100 text-purple-800 border border-purple-200'
                          }`}
                        >
                          {act.type === 'buy_yes' && 'BUY YES'}
                          {act.type === 'buy_no' && 'BUY NO'}
                          {act.type === 'thesis_backed' && 'BACKED'}
                          {act.type === 'liquidity_add' && 'LIQUIDITY'}
                          {act.type === 'take_profit' && 'TAKE PROFIT'}
                          {act.priceCents > 0 && <span>@{act.priceCents}¢</span>}
                        </span>
                      </div>

                      <div className="text-right font-mono-tabular">
                        <span className="text-xs font-extrabold text-[#09090B]">
                          {act.amount}
                        </span>
                        {act.shares > 0 && (
                          <span className="text-[10px] text-neutral-400 block -mt-0.5">
                            {act.shares.toLocaleString()} shares
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Bottom: Context catalyst note */}
                    {act.note && (
                      <p className="text-[11px] text-neutral-600 line-clamp-2 leading-relaxed mb-1.5 font-medium">
                        "{act.note}"
                      </p>
                    )}
                  </div>

                  {/* Market Reference if multi-market stream */}
                  {!market && act.marketQuestion && (
                    <div className="pt-2 border-t border-neutral-100 flex items-center justify-between text-[10px] text-neutral-500 font-medium">
                      <span className="truncate max-w-[200px]" title={act.marketQuestion}>
                        {act.marketQuestion}
                      </span>
                      <ArrowRight className="w-2.5 h-2.5 text-neutral-400 shrink-0 ml-1" />
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
