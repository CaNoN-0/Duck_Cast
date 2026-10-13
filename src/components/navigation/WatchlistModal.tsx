import React, { useState, useEffect } from 'react';
import { X, Bookmark, ArrowUpRight, Star, Trash2 } from 'lucide-react';
import { PredictionMarket } from '../../types/market';
import { HalftoneBackground } from '../marketplace/HalftoneBackground';

interface WatchlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  markets: PredictionMarket[];
  onSelectMarket: (market: PredictionMarket) => void;
  onNavigateToPredictions: () => void;
  bookmarkedIds?: string[];
  onToggleBookmark?: (marketId: string) => void;
}

export function WatchlistModal({
  isOpen,
  onClose,
  markets,
  onSelectMarket,
  onNavigateToPredictions,
  bookmarkedIds: propBookmarkedIds,
  onToggleBookmark
}: WatchlistModalProps) {
  const [localBookmarks, setLocalBookmarks] = useState<string[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('duckcast_bookmarked_ids');
      if (saved) {
        setLocalBookmarks(JSON.parse(saved));
      }
    } catch {
      // ignore
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentBookmarkedIds = propBookmarkedIds ?? localBookmarks;
  const watchlistItems = markets.filter((m) => currentBookmarkedIds.includes(m.id));

  const handleRemoveBookmark = (e: React.MouseEvent, marketId: string) => {
    e.stopPropagation();
    if (onToggleBookmark) {
      onToggleBookmark(marketId);
    }
    const next = currentBookmarkedIds.filter((id) => id !== marketId);
    setLocalBookmarks(next);
    try {
      localStorage.setItem('duckcast_bookmarked_ids', JSON.stringify(next));
    } catch {
      // ignore
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white border border-neutral-200 rounded-2xl w-full max-w-xl max-h-[85vh] overflow-y-auto p-6 shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-neutral-100 mb-4">
          <div className="flex items-center gap-2">
            <Bookmark className="w-5 h-5 text-emerald-600 fill-emerald-100" />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold font-display text-[#09090B]">
                  Your Watchlist
                </h3>
                <span className="text-xs font-mono-tabular font-bold bg-neutral-100 text-neutral-800 px-2 py-0.5 rounded-full">
                  {watchlistItems.length}
                </span>
              </div>
              <p className="text-xs text-neutral-500">
                Only predictions you bookmark appear here.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-black rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {watchlistItems.length > 0 ? (
          <div className="space-y-3">
            {watchlistItems.map((m) => (
              <div
                key={m.id}
                onClick={() => {
                  onSelectMarket(m);
                  onClose();
                }}
                className="relative overflow-hidden p-4 rounded-xl border border-neutral-200/90 hover:border-neutral-400 bg-white hover:bg-neutral-50/60 transition-all cursor-pointer flex items-center justify-between gap-4 group"
              >
                <HalftoneBackground opacity={0.06} className="group-hover:opacity-12" />

                <div className="flex-1 min-w-0 relative z-10">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded">
                      {m.category}
                    </span>
                    <span className="text-xs text-neutral-400 font-mono-tabular">
                      {m.timeRemaining}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-[#09090B] font-display line-clamp-1 group-hover:text-emerald-700 transition-colors">
                    {m.question}
                  </h4>
                  <div className="flex items-center gap-3 mt-2 text-xs text-neutral-500 font-mono-tabular">
                    <span>Vol: <strong className="text-neutral-800">{m.volume}</strong></span>
                    <span>·</span>
                    <span className="text-emerald-700 font-bold">{m.yesProbability}% YES</span>
                    <span>/</span>
                    <span className="text-rose-700 font-bold">{m.noProbability}% NO</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 relative z-10 shrink-0">
                  <button
                    type="button"
                    onClick={(e) => handleRemoveBookmark(e, m.id)}
                    className="p-2 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    title="Remove from watchlist"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <div className="w-8 h-8 rounded-lg bg-neutral-100 group-hover:bg-[#09090B] group-hover:text-white flex items-center justify-center transition-colors">
                    <ArrowUpRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 px-4 text-center">
            <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center mx-auto mb-3">
              <Star className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-[#09090B] mb-1">
              Your watchlist is empty
            </h4>
            <p className="text-xs text-neutral-500 max-w-sm mx-auto mb-5">
              Click the favorite (star) button on any prediction card in the feed to bookmark and track it here.
            </p>
            <button
              type="button"
              onClick={() => {
                onClose();
                onNavigateToPredictions();
              }}
              className="px-4 py-2 bg-[#09090B] hover:bg-neutral-800 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer inline-flex items-center gap-1.5"
            >
              <span>Explore Predictions</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <div className="pt-4 mt-4 border-t border-neutral-100 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              onNavigateToPredictions();
              onClose();
            }}
            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 underline cursor-pointer"
          >
            Browse All Markets →
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
