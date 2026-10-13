import React, { useState, useEffect } from 'react';
import {
  X,
  Activity,
  MessageSquare,
  TrendingUp,
  Users,
  Flame,
  ArrowUpRight,
  ShieldCheck,
  Clock,
  Sparkles,
  Share2
} from 'lucide-react';
import { PredictionMarket } from '../../types/market';
import { HalftoneBackground } from './HalftoneBackground';
import { HorizontalActivityStream } from './HorizontalActivityStream';
import {
  getInitialActivitiesForMarket,
  generateNextLiveActivity,
  MarketActivityItem
} from '../../services/activityCenterService';

interface ActivityCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  market: PredictionMarket | null;
  onOpenShareRoom?: (market: PredictionMarket) => void;
  onSelectMarket?: (market: PredictionMarket, side?: 'YES' | 'NO') => void;
}

export function ActivityCenterModal({
  isOpen,
  onClose,
  market,
  onOpenShareRoom,
  onSelectMarket
}: ActivityCenterModalProps) {
  const [activeTab, setActiveTab] = useState<'stream' | 'trades' | 'claims'>('stream');
  const [marketActivities, setMarketActivities] = useState<MarketActivityItem[]>([]);

  // Update dynamic, market-specific activities whenever a different market is opened
  useEffect(() => {
    if (market) {
      setMarketActivities(getInitialActivitiesForMarket(market));
    }
  }, [market?.id]);

  if (!isOpen || !market) return null;

  // Active claims
  const claims = market.theses || [];

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white border border-neutral-200/90 rounded-2xl w-full max-w-[640px] shadow-2xl relative overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <HalftoneBackground opacity={0.08} />

        {/* Header */}
        <div className="relative z-10 px-5 sm:px-6 py-4 border-b border-neutral-100 flex items-center justify-between bg-white/95">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-neutral-900 text-white flex items-center justify-center shadow-2xs">
              <Activity className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-[15px] font-bold font-display text-[#09090B]">
                  Prediction Activity Center
                </h3>
                <span className="flex items-center gap-1 text-[10px] font-extrabold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  LIVE
                </span>
              </div>
              <p className="text-[11px] text-neutral-500">
                Real-time horizontal order flow &amp; community feeds
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenShareRoom && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenShareRoom(market);
                }}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                title="Share Market"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Share Market</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-black rounded-xl hover:bg-neutral-100 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Market Title Banner */}
        <div className="relative z-10 px-5 sm:px-6 py-3 bg-neutral-50/80 border-b border-neutral-100 flex items-center justify-between gap-3 text-xs">
          <p className="font-bold text-[#09090B] line-clamp-1 flex-1">
            {market.question}
          </p>
          <div className="flex items-center gap-2 shrink-0 font-mono-tabular font-bold">
            <span className="text-emerald-700">YES {market.yesProbability}%</span>
            <span className="text-neutral-300">/</span>
            <span className="text-rose-700">NO {market.noProbability}%</span>
          </div>
        </div>

        {/* Activity Center Tab Nav */}
        <div className="relative z-10 px-5 sm:px-6 pt-3 border-b border-neutral-100 flex items-center gap-2 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab('stream')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'stream'
                ? 'border-[#09090B] text-[#09090B]'
                : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <Activity className="w-3 h-3 text-emerald-500" />
            <span>Activity Stream (Horizontal)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('trades')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'trades'
                ? 'border-[#09090B] text-[#09090B]'
                : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
          >
            All Trades ({marketActivities.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('claims')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'claims'
                ? 'border-[#09090B] text-[#09090B]'
                : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
          >
            Claims ({claims.length})
          </button>
        </div>

        {/* Body Content */}
        <div className="relative z-10 p-5 sm:px-6 space-y-3 max-h-[55vh] overflow-y-auto">
          {/* TAB 0: Horizontal Activity Stream where recent activities fade in and older fade out */}
          {activeTab === 'stream' && (
            <div className="space-y-3">
              <HorizontalActivityStream
                market={market}
                className="border-0 shadow-none p-0"
              />
              <p className="text-[11px] text-neutral-400 font-medium text-center">
                ← Swipe or scroll horizontally to view earlier order flow · Recent activities smoothly fade in
              </p>
            </div>
          )}

          {/* TAB 1: Live Trades */}
          {activeTab === 'trades' && (
            <div className="space-y-2">
              {marketActivities.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-neutral-50 border border-neutral-100 text-xs font-mono-tabular"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        t.side === 'YES' ? 'bg-emerald-500' : t.side === 'NO' ? 'bg-rose-500' : 'bg-purple-500'
                      }`}
                    />
                    <span className="font-bold text-[#09090B]">@{t.username}</span>
                    <span className="text-neutral-400">
                      {t.type === 'buy_yes' ? 'bought' : t.type === 'buy_no' ? 'bought' : 'staked'}
                    </span>
                    <span
                      className={`font-black px-1.5 py-0.5 rounded text-[10px] ${
                        t.side === 'YES'
                          ? 'bg-emerald-100 text-emerald-800'
                          : t.side === 'NO'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-purple-100 text-purple-800'
                      }`}
                    >
                      {t.side}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-bold text-[#09090B]">{t.amount}</span>
                    <span className="text-neutral-400 text-[11px]">{t.timeAgo}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 2: Community Claims */}
          {activeTab === 'claims' && (
            <div className="space-y-2.5">
              {claims.length > 0 ? (
                claims.map((th) => (
                  <div
                    key={th.id}
                    className="p-3 rounded-xl bg-neutral-50 border border-neutral-200/80 space-y-2"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#09090B]">{th.author}</span>
                        <span
                          className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
                            th.side === 'YES'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          Backed {th.side}
                        </span>
                      </div>
                      <span className="text-[11px] text-neutral-400">{th.timestamp}</span>
                    </div>

                    <p className="text-xs text-neutral-700 leading-relaxed">
                      "{th.text}"
                    </p>

                    <div className="flex items-center gap-3 pt-1 text-[11px] text-neutral-500 border-t border-neutral-100">
                      <span>Staked: <strong className="text-neutral-900">{th.staked}</strong></span>
                      <span>·</span>
                      <span>👍 {th.reactions.agree} agreements</span>
                      <span>·</span>
                      <span>🔥 {th.reactions.fire} hot</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-xs text-neutral-400">
                  No community claims posted yet. Be the first to post a claim!
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="relative z-10 px-5 sm:px-6 py-3.5 bg-neutral-50 border-t border-neutral-100 flex items-center justify-between">
          <div className="text-xs text-neutral-500 font-mono-tabular">
            {market.volume} Volume · {market.traders} Traders
          </div>

          <div className="flex items-center gap-2">
            {onSelectMarket && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onSelectMarket(market);
                }}
                className="px-3.5 py-1.5 bg-[#09090B] text-white hover:bg-neutral-800 text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                Trade Prediction
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
