import React, { useState, useEffect } from 'react';
import {
  X,
  Share2,
  Copy,
  Check,
  Users,
  ExternalLink,
  Send
} from 'lucide-react';
import { PredictionMarket } from '../../types/market';
import { HalftoneBackground } from './HalftoneBackground';

interface ShareRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  market: PredictionMarket | null;
  onShowNotification?: (msg: string) => void;
}

export function ShareRoomModal({
  isOpen,
  onClose,
  market,
  onShowNotification
}: ShareRoomModalProps) {
  const [copied, setCopied] = useState(false);
  const [marketRef, setMarketRef] = useState('');
  const [shareLink, setShareLink] = useState('');

  useEffect(() => {
    if (market) {
      const code = `DUCK-${market.id.replace('market-', '').replace('custom-', '').slice(0, 6).toUpperCase()}`;
      setMarketRef(code);
      if (typeof window !== 'undefined') {
        const origin = window.location.origin || 'https://duckcast.app';
        const path = window.location.pathname || '/';
        setShareLink(`${origin}${path}?market=${encodeURIComponent(market.id)}`);
      }
    }
  }, [market]);

  if (!isOpen || !market) return null;

  const handleCopy = () => {
    try {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(shareLink);
        setCopied(true);
        onShowNotification?.(`Market link copied to clipboard!`);
        setTimeout(() => setCopied(false), 2500);
      }
    } catch {}
  };

  const shareText = `Check out this DuckCast prediction market: "${market.question}"\nYES: ${market.yesProbability}% | NO: ${market.noProbability}%\n`;

  const handleShareTwitter = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareLink)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleShareTelegram = () => {
    const url = `https://t.me/share/url?url=${encodeURIComponent(shareLink)}&text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Mock active market forecasters
  const participants = [
    { name: 'AlphaDuck', side: 'YES', staked: '$250', avatar: '🦆' },
    { name: 'ForecasterOne', side: 'YES', staked: '$140', avatar: '🎯' },
    { name: 'RiskNeutral', side: 'NO', staked: '$300', avatar: '⚖️' },
    { name: 'SolanaWhale_8', side: 'YES', staked: '$600', avatar: '💎' }
  ];

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white border border-neutral-200/90 rounded-2xl w-full max-w-[540px] shadow-2xl relative overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <HalftoneBackground opacity={0.09} />

        {/* Modal Header */}
        <div className="relative z-10 px-5 sm:px-6 py-4 border-b border-neutral-100 flex items-center justify-between bg-white/90">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-[15px] font-bold font-display text-[#09090B]">
                  Share Prediction Market
                </h3>
                <span className="text-[10px] font-bold text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded-full border border-neutral-200 font-mono-tabular">
                  #{marketRef}
                </span>
              </div>
              <p className="text-[11px] text-neutral-500">
                Invite friends and forecasters to trade and claim on this prediction
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-black rounded-xl hover:bg-neutral-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="relative z-10 p-5 sm:p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Market Summary Card */}
          <div className="p-3.5 bg-neutral-50 border border-neutral-200/80 rounded-xl space-y-2">
            <div className="flex items-center justify-between text-[11px] text-neutral-500">
              <span className="font-semibold text-neutral-700">{market.category}</span>
              <span className="font-mono-tabular">Ends in {market.timeRemaining}</span>
            </div>
            <p className="text-sm font-bold text-[#09090B] leading-snug">
              {market.question}
            </p>
            <div className="flex items-center gap-3 pt-1 text-xs font-mono-tabular">
              <span className="text-emerald-700 font-bold">YES: {market.yesProbability}%</span>
              <span className="text-neutral-300">·</span>
              <span className="text-rose-700 font-bold">NO: {market.noProbability}%</span>
              <span className="text-neutral-300">·</span>
              <span className="text-neutral-600 font-semibold">{market.volume} Vol</span>
            </div>
          </div>

          {/* Link Copy Box */}
          <div>
            <label className="text-xs font-bold text-neutral-700 block mb-1.5">
              Direct Market Link
            </label>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-white border border-neutral-200 rounded-xl px-3 py-2 text-xs font-mono text-neutral-700 truncate shadow-2xs">
                {shareLink}
              </div>
              <button
                type="button"
                onClick={handleCopy}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 shadow-xs ${
                  copied
                    ? 'bg-emerald-600 text-white'
                    : 'bg-[#09090B] hover:bg-neutral-800 text-white'
                }`}
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy Link'}</span>
              </button>
            </div>
            <p className="text-[11px] text-neutral-400 mt-1">
              Anyone with this link will directly open this prediction market on DuckCast.
            </p>
          </div>

          {/* Social Share Buttons */}
          <div>
            <label className="text-xs font-bold text-neutral-700 block mb-1.5">
              Broadcast to Social Channels
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={handleShareTwitter}
                className="flex items-center justify-center gap-2 py-2.5 px-3 bg-neutral-900 hover:bg-black text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-xs"
              >
                <span>Share on X</span>
                <ExternalLink className="w-3 h-3 text-neutral-400" />
              </button>
              <button
                type="button"
                onClick={handleShareTelegram}
                className="flex items-center justify-center gap-2 py-2.5 px-3 bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-xs"
              >
                <span>Share to Telegram</span>
                <Send className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Active Market Forecasters Roster */}
          <div className="pt-2 border-t border-neutral-100">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-700">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Active Market Predictors ({participants.length + 8})</span>
              </div>
              <span className="text-[11px] text-neutral-400 font-mono-tabular">Live consensus</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {participants.map((p, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-2 rounded-lg bg-neutral-50/70 border border-neutral-200/60 text-xs font-medium"
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <span>{p.avatar}</span>
                    <span className="text-[#09090B] font-bold truncate">{p.name}</span>
                  </div>
                  <span
                    className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded font-mono-tabular ${
                      p.side === 'YES'
                        ? 'bg-emerald-100/80 text-emerald-800'
                        : 'bg-rose-100/80 text-rose-800'
                    }`}
                  >
                    {p.side} · {p.staked}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="relative z-10 px-6 py-3.5 bg-neutral-50 border-t border-neutral-100 flex items-center justify-between text-xs">
          <span className="text-neutral-500">
            Predictions settle synchronously on DuckCast.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 bg-white border border-neutral-200 text-neutral-700 hover:text-black rounded-lg font-bold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
