/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Shield,
  Users,
  Activity,
  Radio,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  RefreshCw,
  Lock,
  Unlock,
  Key,
  X,
  ExternalLink,
  ChevronRight,
  HardDrive,
  ArrowUpRight,
  Eye,
  MessageSquare
} from 'lucide-react';
import {
  PantaUser,
  PantaRoom,
  PantaActivityLog,
  AdminOverviewData,
  pantaRoomsApi
} from '../../services/pantaRoomsApi';

interface AdminActivityDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: PantaUser | null;
  onSwitchUser?: (user: PantaUser) => void;
  onNavigateToRoom?: (roomId: string) => void;
}

export const AdminActivityDashboard: React.FC<AdminActivityDashboardProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSwitchUser,
  onNavigateToRoom
}) => {
  const [data, setData] = useState<AdminOverviewData | null>(null);
  const [adminPasskey, setAdminPasskey] = useState<string>('panta2026');
  const [isAuthorized, setIsAuthorized] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'users' | 'activities' | 'rooms'>('users');

  // Filters
  const [userSearch, setUserSearch] = useState<string>('');
  const [selectedUserFilter, setSelectedUserFilter] = useState<string>('all');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all');
  const [activitySearch, setActivitySearch] = useState<string>('');
  const [inspectedUser, setInspectedUser] = useState<PantaUser | null>(null);

  const fetchOverview = async (passkey: string = adminPasskey) => {
    try {
      setIsLoading(true);
      setAuthError(null);
      const res = await pantaRoomsApi.getAdminOverview({
        adminKey: passkey,
        userId: currentUser?.id
      });
      if (res && res.authorized) {
        setData(res);
        setIsAuthorized(true);
      } else {
        setIsAuthorized(false);
        setAuthError('Invalid Admin credentials or unauthorized role.');
      }
    } catch (err: any) {
      setIsAuthorized(false);
      setAuthError(err?.message || 'Authorization failed.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchOverview();
    }
  }, [isOpen, currentUser?.id]);

  // Relative time helper
  const formatRelativeTime = (isoString?: string) => {
    if (!isoString) return 'Never';
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return 'Just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDays = Math.floor(diffHr / 24);
    return `${diffDays}d ago`;
  };

  // Filtered users
  const filteredUsers = useMemo(() => {
    if (!data?.users) return [];
    return data.users.filter((u) => {
      if (!userSearch) return true;
      const q = userSearch.toLowerCase();
      return (
        u.username.toLowerCase().includes(q) ||
        u.handle.toLowerCase().includes(q) ||
        (u.bio && u.bio.toLowerCase().includes(q))
      );
    });
  }, [data?.users, userSearch]);

  // Filtered activities
  const filteredActivities = useMemo(() => {
    if (!data?.recentActivities) return [];
    return data.recentActivities.filter((act) => {
      const matchUser = selectedUserFilter === 'all' || act.userId === selectedUserFilter;
      const matchType = selectedTypeFilter === 'all' || act.activityType === selectedTypeFilter;
      const matchText =
        !activitySearch ||
        act.details.toLowerCase().includes(activitySearch.toLowerCase()) ||
        act.username.toLowerCase().includes(activitySearch.toLowerCase()) ||
        (act.roomName && act.roomName.toLowerCase().includes(activitySearch.toLowerCase()));
      return matchUser && matchType && matchText;
    });
  }, [data?.recentActivities, selectedUserFilter, selectedTypeFilter, activitySearch]);

  // Activities for inspected user drawer
  const inspectedUserActivities = useMemo(() => {
    if (!inspectedUser || !data?.recentActivities) return [];
    return data.recentActivities.filter((act) => act.userId === inspectedUser.id);
  }, [inspectedUser, data?.recentActivities]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white border border-neutral-200 rounded-3xl w-full max-w-[1040px] h-[90vh] max-h-[860px] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between gap-4 bg-neutral-900 text-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold font-display tracking-tight text-white">
                  Activity Monitoring Interface
                </h2>
                <span className="text-[10px] font-extrabold uppercase bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-mono-tabular">
                  10 Forecasters
                </span>
              </div>
              <p className="text-[11px] text-neutral-400">
                Panta Rooms audit trail, online presence, and activity tracking.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fetchOverview()}
              disabled={isLoading}
              className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-white rounded-full hover:bg-neutral-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Authorization Banner / Key Prompt if not authorized */}
        {!isAuthorized ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-neutral-50">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 mb-3">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-neutral-900">Administrator Access Required</h3>
            <p className="text-xs text-neutral-600 max-w-[380px] mt-1 mb-4">
              Enter the administrator passkey or switch to user account Elena Rostova (Lead Administrator)
              to inspect user activities and logs.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                fetchOverview(adminPasskey);
              }}
              className="flex items-center gap-2 w-full max-w-[320px]"
            >
              <input
                type="password"
                value={adminPasskey}
                onChange={(e) => setAdminPasskey(e.target.value)}
                placeholder="Admin Passkey (default: panta2026)"
                className="flex-1 px-3 py-2 text-xs bg-white border border-neutral-300 rounded-xl focus:outline-none focus:border-neutral-900 font-mono-tabular"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-neutral-900 text-white font-bold text-xs rounded-xl hover:bg-neutral-800 cursor-pointer"
              >
                Unlock
              </button>
            </form>

            {authError && <p className="text-xs text-rose-600 mt-2">{authError}</p>}
          </div>
        ) : (
          <>
            {/* Quick Metrics Bar */}
            <div className="px-6 py-3 bg-neutral-50/90 border-b border-neutral-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs shrink-0">
              <div className="bg-white p-2.5 rounded-xl border border-neutral-200 shadow-2xs">
                <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
                  Test Users
                </span>
                <div className="text-lg font-extrabold text-[#09090B] font-mono-tabular mt-0.5">
                  {data?.stats.totalUsers || 10}
                </div>
                <div className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>{data?.stats.onlineUsers || 0} currently online</span>
                </div>
              </div>

              <div className="bg-white p-2.5 rounded-xl border border-neutral-200 shadow-2xs">
                <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
                  Active Rooms
                </span>
                <div className="text-lg font-extrabold text-[#09090B] font-mono-tabular mt-0.5">
                  {data?.stats.totalRooms || 4}
                </div>
                <div className="text-[10px] text-neutral-500">
                  {data?.stats.totalMessages || 0} messages recorded
                </div>
              </div>

              <div className="bg-white p-2.5 rounded-xl border border-neutral-200 shadow-2xs">
                <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
                  Logged Activities
                </span>
                <div className="text-lg font-extrabold text-[#09090B] font-mono-tabular mt-0.5">
                  {data?.stats.totalActivities || 0}
                </div>
                <div className="text-[10px] text-neutral-500 truncate">
                  Audit events synced
                </div>
              </div>

              <div className="bg-white p-2.5 rounded-xl border border-neutral-200 shadow-2xs">
                <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider flex items-center gap-1">
                  <HardDrive className="w-3 h-3 text-emerald-600" />
                  <span>Storage Ledger</span>
                </span>
                <div className="text-[11px] font-mono-tabular font-bold text-neutral-800 mt-1 truncate">
                  data/panta_ledger.json
                </div>
                <div className="text-[10px] text-emerald-600 font-semibold">
                  Saved across deployments
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="px-6 pt-3 pb-2 border-b border-neutral-200 flex items-center justify-between gap-3 bg-white shrink-0">
              <div className="flex items-center gap-1 bg-neutral-100 p-0.5 rounded-xl text-xs">
                <button
                  type="button"
                  onClick={() => setActiveTab('users')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                    activeTab === 'users'
                      ? 'bg-white text-[#09090B] shadow-2xs'
                      : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  10 Forecasters ({data?.users.length || 10})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('activities')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                    activeTab === 'activities'
                      ? 'bg-white text-[#09090B] shadow-2xs'
                      : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  Activity Audit Trail ({data?.recentActivities.length || 0})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('rooms')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                    activeTab === 'rooms'
                      ? 'bg-white text-[#09090B] shadow-2xs'
                      : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  Rooms ({data?.rooms.length || 0})
                </button>
              </div>

              {activeTab === 'users' && (
                <div className="relative w-48 sm:w-60">
                  <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Search forecasters..."
                    className="w-full pl-8 pr-2.5 py-1 text-xs bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-900"
                  />
                </div>
              )}
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-neutral-50/50">
              {/* TAB 1: 10 FORECASTERS */}
              {activeTab === 'users' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {filteredUsers.map((user) => {
                    const isCurrentUser = currentUser?.id === user.id;

                    return (
                      <div
                        key={user.id}
                        className={`bg-white border rounded-2xl p-4 shadow-2xs transition-all flex flex-col justify-between ${
                          isCurrentUser
                            ? 'border-emerald-500 ring-2 ring-emerald-500/10'
                            : 'border-neutral-200 hover:border-neutral-300'
                        }`}
                      >
                        <div>
                          {/* User Top Row */}
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="relative w-10 h-10 rounded-full overflow-hidden border border-neutral-200 shrink-0">
                                <img
                                  src={user.avatar}
                                  alt={user.username}
                                  className="w-full h-full object-cover"
                                />
                                {user.isOnline && (
                                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white" />
                                )}
                              </div>

                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <h4 className="text-xs sm:text-sm font-bold text-[#09090B] truncate">
                                    {user.username}
                                  </h4>
                                  {user.role === 'admin' ? (
                                    <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-neutral-900 text-white font-mono-tabular">
                                      Admin
                                    </span>
                                  ) : (
                                    <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-600 font-mono-tabular">
                                      User
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-neutral-500 font-mono-tabular truncate">
                                  {user.handle} · {user.walletAddress}
                                </div>
                              </div>
                            </div>

                            {/* Status Badge */}
                            <div className="text-right shrink-0">
                              <div className="flex items-center gap-1 text-[10px] font-bold">
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    user.isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-neutral-300'
                                  }`}
                                />
                                <span className={user.isOnline ? 'text-emerald-700' : 'text-neutral-400'}>
                                  {user.isOnline ? 'Online' : 'Offline'}
                                </span>
                              </div>
                              <span className="text-[10px] text-neutral-400 font-mono-tabular">
                                Active {formatRelativeTime(user.lastActiveTime)}
                              </span>
                            </div>
                          </div>

                          {/* Bio */}
                          <p className="text-[11px] text-neutral-600 line-clamp-2 mt-1">
                            {user.bio}
                          </p>

                          {/* Stats Strip */}
                          <div className="grid grid-cols-4 gap-2 mt-3 pt-2.5 border-t border-neutral-100 text-center font-mono-tabular">
                            <div className="bg-neutral-50 p-1.5 rounded-lg">
                              <span className="text-[9px] text-neutral-400 uppercase">Created</span>
                              <div className="text-xs font-bold text-neutral-800">
                                {user.roomsCreated?.length || 0}
                              </div>
                            </div>
                            <div className="bg-neutral-50 p-1.5 rounded-lg">
                              <span className="text-[9px] text-neutral-400 uppercase">Joined</span>
                              <div className="text-xs font-bold text-neutral-800">
                                {user.roomsJoined?.length || 0}
                              </div>
                            </div>
                            <div className="bg-neutral-50 p-1.5 rounded-lg">
                              <span className="text-[9px] text-neutral-400 uppercase">Win Rate</span>
                              <div className="text-xs font-bold text-emerald-600">
                                {user.winRatePercent}%
                              </div>
                            </div>
                            <div className="bg-neutral-50 p-1.5 rounded-lg">
                              <span className="text-[9px] text-neutral-400 uppercase">Reputation</span>
                              <div className="text-xs font-bold text-neutral-800">
                                {user.reputationScore}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="mt-3 pt-2.5 border-t border-neutral-100 flex items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => setInspectedUser(user)}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-neutral-600 hover:text-neutral-900 cursor-pointer"
                          >
                            <Activity className="w-3.5 h-3.5 text-neutral-400" />
                            <span>Audit Trail</span>
                          </button>

                          {onSwitchUser && (
                            <button
                              type="button"
                              onClick={() => {
                                onSwitchUser(user);
                                fetchOverview();
                              }}
                              className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                                isCurrentUser
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-neutral-900 text-white hover:bg-neutral-800'
                              }`}
                            >
                              {isCurrentUser ? 'Active Session' : 'Switch Session'}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* TAB 2: ACTIVITY AUDIT TRAIL */}
              {activeTab === 'activities' && (
                <div className="space-y-3">
                  {/* Filters Bar */}
                  <div className="bg-white p-3 rounded-2xl border border-neutral-200 flex flex-wrap items-center justify-between gap-2.5 text-xs">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-neutral-500">Filter User:</span>
                      <select
                        aria-label="Filter activity by user"
                        value={selectedUserFilter}
                        onChange={(e) => setSelectedUserFilter(e.target.value)}
                        className="bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1 text-xs focus:outline-none"
                      >
                        <option value="all">All Users</option>
                        {data?.users.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.username}
                          </option>
                        ))}
                      </select>

                      <span className="font-bold text-neutral-500 ml-2">Type:</span>
                      <select
                        aria-label="Filter by activity type"
                        value={selectedTypeFilter}
                        onChange={(e) => setSelectedTypeFilter(e.target.value)}
                        className="bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1 text-xs focus:outline-none"
                      >
                        <option value="all">All Activities</option>
                        <option value="room_created">Room Created</option>
                        <option value="room_joined">Room Joined</option>
                        <option value="room_left">Room Left</option>
                        <option value="thesis_shared">Thesis Shared</option>
                        <option value="room_message">Room Message</option>
                        <option value="user_login">User Login</option>
                        <option value="user_registered">Registered</option>
                        <option value="admin_action">Admin Action</option>
                      </select>
                    </div>

                    <div className="relative w-48">
                      <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        value={activitySearch}
                        onChange={(e) => setActivitySearch(e.target.value)}
                        placeholder="Search logs..."
                        className="w-full pl-8 pr-2.5 py-1 text-xs bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Activity Log List */}
                  {filteredActivities.length === 0 ? (
                    <div className="py-12 text-center text-xs text-neutral-400 bg-white rounded-2xl border border-neutral-200">
                      No activities recorded for this filter.
                    </div>
                  ) : (
                    <div className="bg-white rounded-2xl border border-neutral-200 divide-y divide-neutral-100 overflow-hidden shadow-2xs">
                      {filteredActivities.map((act) => {
                        return (
                          <div
                            key={act.id}
                            className="p-3.5 hover:bg-neutral-50 transition-colors flex items-start justify-between gap-3 text-xs"
                          >
                            <div className="flex items-start gap-3 min-w-0">
                              <div className="w-7 h-7 rounded-full overflow-hidden border border-neutral-200 shrink-0 mt-0.5">
                                <img
                                  src={act.userAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&h=100&q=80'}
                                  alt={act.username}
                                  className="w-full h-full object-cover"
                                />
                              </div>

                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-bold text-neutral-900">{act.username}</span>
                                  <span className="text-neutral-400 text-[11px] font-mono-tabular">
                                    {act.userHandle}
                                  </span>

                                  {/* Activity badge */}
                                  <span
                                    className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded font-mono-tabular ${
                                      act.activityType === 'room_created'
                                        ? 'bg-amber-100 text-amber-800'
                                        : act.activityType === 'room_joined'
                                        ? 'bg-emerald-100 text-emerald-800'
                                        : act.activityType === 'room_left'
                                        ? 'bg-neutral-100 text-neutral-600'
                                        : act.activityType === 'thesis_shared'
                                        ? 'bg-blue-100 text-blue-800'
                                        : act.activityType === 'user_login'
                                        ? 'bg-emerald-50 text-emerald-700'
                                        : act.activityType === 'admin_action'
                                        ? 'bg-purple-100 text-purple-800'
                                        : 'bg-neutral-100 text-neutral-700'
                                    }`}
                                  >
                                    {act.activityType.replace('_', ' ')}
                                  </span>
                                </div>

                                <p className="text-neutral-700 mt-1 leading-snug">
                                  {act.details}
                                </p>

                                {act.roomName && (
                                  <span className="inline-block text-[10px] text-neutral-400 mt-0.5 font-medium">
                                    Room: {act.roomName}
                                  </span>
                                )}
                              </div>
                            </div>

                            <span className="text-[10px] text-neutral-400 shrink-0 font-mono-tabular whitespace-nowrap">
                              {formatRelativeTime(act.timestamp)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: ROOMS OVERVIEW */}
              {activeTab === 'rooms' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {data?.rooms.map((room) => (
                      <div
                        key={room.id}
                        className="bg-white border border-neutral-200 rounded-2xl p-4 shadow-2xs flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-neutral-100 text-neutral-700 font-mono-tabular">
                              {room.category}
                            </span>
                            <span className="text-xs text-neutral-500 font-mono-tabular">
                              {room.participantCount} active
                            </span>
                          </div>

                          <h4 className="text-sm font-bold text-neutral-900 font-display">
                            {room.name}
                          </h4>
                          <p className="text-xs text-neutral-600 mt-1 line-clamp-2">
                            {room.topic}
                          </p>

                          <div className="mt-3 p-2.5 rounded-xl bg-neutral-50 text-xs text-neutral-700 italic border border-neutral-200/80">
                            "{room.activeThesis}"
                          </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between text-xs">
                          <span className="text-[11px] text-neutral-500">
                            {room.messages.length} messages logged
                          </span>

                          {onNavigateToRoom && (
                            <button
                              type="button"
                              onClick={() => {
                                onNavigateToRoom(room.id);
                                onClose();
                              }}
                              className="px-3 py-1 bg-neutral-900 text-white rounded-lg font-bold text-xs hover:bg-neutral-800 cursor-pointer"
                            >
                              Enter Room
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* Inspected User Audit Drawer */}
        {inspectedUser && (
          <div
            className="fixed inset-0 z-60 bg-black/40 backdrop-blur-2xs flex justify-end animate-in fade-in duration-100"
            onClick={() => setInspectedUser(null)}
          >
            <div
              className="bg-white w-full max-w-[460px] h-full shadow-2xl p-6 flex flex-col overflow-hidden animate-in slide-in-from-right duration-150"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full overflow-hidden border border-neutral-200">
                    <img src={inspectedUser.avatar} alt={inspectedUser.username} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#09090B]">{inspectedUser.username}</h3>
                    <div className="text-[11px] text-neutral-500 font-mono-tabular">{inspectedUser.handle}</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setInspectedUser(null)}
                  className="p-1 text-neutral-400 hover:text-neutral-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="my-3 p-3 bg-neutral-50 rounded-xl text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-neutral-500">Status:</span>
                  <span className={inspectedUser.isOnline ? 'text-emerald-600 font-bold' : 'text-neutral-500'}>
                    {inspectedUser.isOnline ? 'Online' : 'Offline'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Last Active:</span>
                  <span className="font-mono-tabular">{formatRelativeTime(inspectedUser.lastActiveTime)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Rooms Created / Joined:</span>
                  <span className="font-mono-tabular font-bold">
                    {inspectedUser.roomsCreated?.length || 0} / {inspectedUser.roomsJoined?.length || 0}
                  </span>
                </div>
              </div>

              <h4 className="text-xs font-bold text-neutral-900 uppercase tracking-wider mb-2">
                User Activity Audit Trail ({inspectedUserActivities.length})
              </h4>

              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {inspectedUserActivities.length === 0 ? (
                  <div className="text-center py-8 text-xs text-neutral-400">
                    No recent activity records found for this user.
                  </div>
                ) : (
                  inspectedUserActivities.map((act) => (
                    <div key={act.id} className="p-2.5 bg-neutral-50 rounded-xl border border-neutral-200 text-xs">
                      <div className="flex items-center justify-between text-[10px] text-neutral-400 font-mono-tabular mb-1">
                        <span className="font-extrabold uppercase text-neutral-700">
                          {act.activityType.replace('_', ' ')}
                        </span>
                        <span>{formatRelativeTime(act.timestamp)}</span>
                      </div>
                      <p className="text-neutral-800">{act.details}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
