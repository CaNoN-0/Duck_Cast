import React, { useState, useEffect } from 'react';
import { X, Trophy, Database } from 'lucide-react';
import { LeaderboardSection } from '../marketplace/LeaderboardSection';
import { MOCK_LEADERBOARD } from '../../data/mockMarkets';
import { duckcastDb } from '../../services/duckcastDb';
import { LeaderboardUser } from '../../types/market';

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LeaderboardModal({ isOpen, onClose }: LeaderboardModalProps) {
  const [users, setUsers] = useState<LeaderboardUser[]>(MOCK_LEADERBOARD);

  useEffect(() => {
    if (isOpen) {
      duckcastDb.seedOrGet15Users().then((dbUsers) => {
        if (dbUsers && dbUsers.length > 0) {
          const mapped: LeaderboardUser[] = dbUsers.map((u) => ({
            rank: u.rank,
            username: u.displayName,
            handle: `@${u.username}`,
            avatar: u.avatar,
            accuracy: `${u.accuracy}%`,
            totalVolume: `$${(u.totalVolume / 1000).toFixed(0)}k`,
            pnl: `+$${Math.floor(u.balance * 0.4).toLocaleString()}`,
            predictions: u.totalPredictions,
            winStreak: Math.max(3, Math.floor(u.accuracy / 10)),
            badges: u.status === 'oracle' ? ['ORACLE', 'WHALE'] : ['PRO', 'ALPHA']
          }));
          setUsers(mapped);
        }
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white border border-neutral-200 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-neutral-100 mb-4">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold font-display text-[#09090B]">
                  Global Leaderboard
                </h3>
                <span className="flex items-center gap-1 text-[10px] font-extrabold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 font-mono-tabular">
                  <Database className="w-3 h-3 text-emerald-600" />
                  15 DB Users Synced
                </span>
              </div>
              <p className="text-xs text-neutral-500">
                Top 15 forecasters ranked by verified predictive accuracy and Firestore ledger volume.
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

        <LeaderboardSection users={users} />
      </div>
    </div>
  );
}
