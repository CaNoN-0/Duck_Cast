import React, { useState, useEffect } from 'react';
import {
  X,
  Database,
  Users,
  Check,
  ShieldCheck,
  TrendingUp,
  Award,
  Wallet,
  Sparkles,
  RefreshCw,
  Search,
  ExternalLink
} from 'lucide-react';
import { DuckcastDbUser, duckcastDb, INITIAL_15_USERS } from '../../services/duckcastDb';
import { HalftoneBackground } from '../marketplace/HalftoneBackground';

interface DatabaseRosterModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeUserId?: string;
  onSelectUser?: (user: DuckcastDbUser) => void;
}

export function DatabaseRosterModal({
  isOpen,
  onClose,
  activeUserId,
  onSelectUser
}: DatabaseRosterModalProps) {
  const [users, setUsers] = useState<DuckcastDbUser[]>(INITIAL_15_USERS);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<DuckcastDbUser | null>(null);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      duckcastDb.seedOrGet15Users().then((res) => {
        setUsers(res);
        setLoading(false);
      });

      // Subscribe to real-time updates
      const unsub = duckcastDb.subscribeUsers((updated) => {
        setUsers(updated);
      });
      return () => unsub();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredUsers = users.filter((u) => {
    const q = search.toLowerCase();
    return (
      u.username.toLowerCase().includes(q) ||
      u.displayName.toLowerCase().includes(q) ||
      u.bio.toLowerCase().includes(q)
    );
  });

  const totalPoolVolume = users.reduce((acc, u) => acc + u.totalVolume, 0);
  const avgAccuracy = (users.reduce((acc, u) => acc + u.accuracy, 0) / (users.length || 1)).toFixed(1);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white border border-neutral-200/90 rounded-2xl w-full max-w-[760px] shadow-2xl relative overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <HalftoneBackground opacity={0.07} />

        {/* Modal Header */}
        <div className="relative z-10 px-5 sm:px-6 py-4 border-b border-neutral-100 flex items-center justify-between bg-white/95">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-neutral-900 text-white flex items-center justify-center shadow-xs">
              <Database className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold font-display text-[#09090B]">
                  DuckCast Database (15 Forecasters)
                </h3>
                <span className="flex items-center gap-1 text-[10px] font-extrabold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 font-mono-tabular">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  FIRESTORE LIVE
                </span>
              </div>
              <p className="text-[11px] text-neutral-500 font-mono-tabular">
                15 Persistent User Profiles · Real-time Accuracy &amp; Stakes
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

        {/* Stats Strip */}
        <div className="relative z-10 px-5 sm:px-6 py-3 bg-neutral-50/80 border-b border-neutral-100 grid grid-cols-3 gap-2 text-xs font-mono-tabular">
          <div className="p-2 bg-white rounded-lg border border-neutral-200/60">
            <div className="text-[10px] text-neutral-400 uppercase font-sans font-bold">Total Users</div>
            <div className="text-sm font-extrabold text-[#09090B]">15 Registered</div>
          </div>
          <div className="p-2 bg-white rounded-lg border border-neutral-200/60">
            <div className="text-[10px] text-neutral-400 uppercase font-sans font-bold">Avg Accuracy</div>
            <div className="text-sm font-extrabold text-emerald-700">{avgAccuracy}%</div>
          </div>
          <div className="p-2 bg-white rounded-lg border border-neutral-200/60">
            <div className="text-[10px] text-neutral-400 uppercase font-sans font-bold">Collective Vol</div>
            <div className="text-sm font-extrabold text-[#09090B]">${(totalPoolVolume / 1000000).toFixed(2)}M</div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative z-10 px-5 sm:px-6 pt-3 pb-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by username, specialty, or handle..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:border-black transition-colors"
            />
          </div>
        </div>

        {/* User Roster List */}
        <div className="relative z-10 px-5 sm:px-6 py-2 space-y-2 max-h-[50vh] overflow-y-auto">
          {loading ? (
            <div className="py-10 text-center text-xs text-neutral-400 flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
              <span>Syncing 15 database records from Firestore...</span>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="py-10 text-center text-xs text-neutral-400">
              No forecasters match "{search}".
            </div>
          ) : (
            filteredUsers.map((u) => {
              const isSelected = activeUserId === u.id || selectedUser?.id === u.id;
              return (
                <div
                  key={u.id}
                  onClick={() => {
                    setSelectedUser(u);
                    onSelectUser?.(u);
                  }}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 group ${
                    isSelected
                      ? 'bg-neutral-900 text-white border-neutral-900 shadow-sm'
                      : 'bg-white hover:bg-neutral-50/90 border-neutral-200/80 hover:border-neutral-300'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`text-xs font-mono font-bold w-6 text-center ${isSelected ? 'text-emerald-400' : 'text-neutral-400'}`}>
                      #{u.rank}
                    </span>
                    <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-base shrink-0 border border-neutral-200/60">
                      {u.avatar}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold truncate ${isSelected ? 'text-white' : 'text-[#09090B]'}`}>
                          {u.displayName}
                        </span>
                        <span className={`text-[11px] font-mono-tabular ${isSelected ? 'text-neutral-400' : 'text-neutral-500'}`}>
                          @{u.username}
                        </span>
                        <span className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded uppercase ${
                          u.status === 'oracle'
                            ? isSelected ? 'bg-emerald-950 text-emerald-400' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : isSelected ? 'bg-neutral-800 text-neutral-300' : 'bg-neutral-100 text-neutral-600'
                        }`}>
                          {u.status}
                        </span>
                      </div>
                      <p className={`text-[11px] truncate mt-0.5 ${isSelected ? 'text-neutral-300' : 'text-neutral-500'}`}>
                        {u.bio}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0 font-mono-tabular text-right">
                    <div>
                      <div className={`text-xs font-bold ${isSelected ? 'text-emerald-400' : 'text-emerald-700'}`}>
                        {u.accuracy}% Acc
                      </div>
                      <div className={`text-[10px] ${isSelected ? 'text-neutral-400' : 'text-neutral-500'}`}>
                        {u.totalPredictions} Preds
                      </div>
                    </div>

                    <div className="hidden sm:block">
                      <div className={`text-xs font-extrabold ${isSelected ? 'text-white' : 'text-[#09090B]'}`}>
                        ${(u.totalVolume / 1000).toFixed(0)}k
                      </div>
                      <div className={`text-[10px] ${isSelected ? 'text-neutral-400' : 'text-neutral-500'}`}>
                        Volume
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectUser?.(u);
                        onClose();
                      }}
                      className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-500 text-white hover:bg-emerald-400'
                          : 'bg-neutral-100 text-neutral-800 hover:bg-neutral-200'
                      }`}
                    >
                      Select
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="relative z-10 px-5 sm:px-6 py-3.5 bg-neutral-50 border-t border-neutral-100 flex items-center justify-between text-xs">
          <div className="text-[11px] text-neutral-500 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Database backed by Google Cloud Firestore</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 bg-white border border-neutral-200 text-neutral-800 hover:text-black rounded-lg font-bold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
