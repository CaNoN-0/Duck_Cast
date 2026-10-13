/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Search,
  Plus,
  Users,
  MessageSquare,
  Sparkles,
  Flame,
  ArrowRight,
  Shield,
  TrendingUp,
  CheckCircle2,
  X,
  Send,
  Radio,
  Clock,
  ChevronRight,
  SlidersHorizontal,
  ExternalLink,
  Lock,
  Globe
} from 'lucide-react';
import {
  PantaRoom,
  PantaUser,
  PantaRoomMessage,
  pantaRoomsApi
} from '../../services/pantaRoomsApi';
import { MOCK_MARKETS } from '../../data/mockMarkets';

interface PantaRoomsViewProps {
  onBackToPredictions: () => void;
  onOpenAdminModal?: () => void;
  currentUser?: PantaUser | null;
  onSelectUser?: (user: PantaUser) => void;
  initialRoomId?: string | null;
}

const CATEGORIES = ['All', 'Crypto', 'Macro', 'Sports', 'AI & Tech', 'General'];

export const PantaRoomsView: React.FC<PantaRoomsViewProps> = ({
  onBackToPredictions,
  onOpenAdminModal,
  currentUser: propUser,
  onSelectUser,
  initialRoomId
}) => {
  const [rooms, setRooms] = useState<PantaRoom[]>([]);
  const [users, setUsers] = useState<PantaUser[]>([]);
  const [activeUser, setActiveUser] = useState<PantaUser | null>(propUser || null);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeRoom, setActiveRoom] = useState<PantaRoom | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [notification, setNotification] = useState<string | null>(null);

  // Message composer in room
  const [messageText, setMessageText] = useState<string>('');
  const [messageType, setMessageType] = useState<'chat' | 'thesis'>('thesis');
  const [stance, setStance] = useState<'YES' | 'NO' | 'NEUTRAL'>('YES');
  const [stakedAmount, setStakedAmount] = useState<string>('500');
  const [isSending, setIsSending] = useState<boolean>(false);

  // Create room form
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomTopic, setNewRoomTopic] = useState('');
  const [newRoomCategory, setNewRoomCategory] = useState('Crypto');
  const [newRoomDescription, setNewRoomDescription] = useState('');
  const [newRoomThesis, setNewRoomThesis] = useState('');
  const [newRoomMarketId, setNewRoomMarketId] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  // Load rooms and users from database
  const loadData = async () => {
    try {
      setIsLoading(true);
      const [fetchedRooms, fetchedUsers] = await Promise.all([
        pantaRoomsApi.getRooms(),
        pantaRoomsApi.getUsers()
      ]);
      setRooms(fetchedRooms);
      setUsers(fetchedUsers);

      // Default active user to Elena Rostova (user-1) if none set
      if (!activeUser && fetchedUsers.length > 0) {
        const storedId = pantaRoomsApi.getActiveUserId();
        const found = fetchedUsers.find((u) => u.id === storedId) || fetchedUsers[0];
        setActiveUser(found);
      }

      if (initialRoomId) {
        const target = fetchedRooms.find((r) => r.id === initialRoomId);
        if (target) setActiveRoom(target);
      }
    } catch (err) {
      console.error('Failed to load Panta Rooms data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
      // Background poll for room messages and participants
      pantaRoomsApi.getRooms().then((updated) => {
        setRooms(updated);
        if (activeRoom) {
          const fresh = updated.find((r) => r.id === activeRoom.id);
          if (fresh) setActiveRoom(fresh);
        }
      });
    }, 5000);
    return () => clearInterval(interval);
  }, [initialRoomId]);

  // Keep heartbeat alive for current user
  useEffect(() => {
    if (activeUser?.id) {
      pantaRoomsApi.heartbeat(activeUser.id);
    }
  }, [activeUser?.id]);

  // Scroll to bottom when room messages update
  useEffect(() => {
    if (activeRoom && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeRoom?.messages?.length]);

  const handleSwitchUser = async (user: PantaUser) => {
    setActiveUser(user);
    pantaRoomsApi.setActiveUser(user.id);
    await pantaRoomsApi.loginUser(user.id);
    if (onSelectUser) onSelectUser(user);
    showNotification(`Switched active session to ${user.username} (${user.handle})`);
    // refresh users to update online status
    const updatedUsers = await pantaRoomsApi.getUsers();
    setUsers(updatedUsers);
  };

  const handleJoinRoom = async (room: PantaRoom) => {
    if (!activeUser) return;
    const res = await pantaRoomsApi.joinRoom(room.id, activeUser.id);
    if (res.success && res.room) {
      setActiveRoom(res.room);
      showNotification(`Joined "${room.name}"`);
      loadData();
    }
  };

  const handleLeaveRoom = async (room: PantaRoom) => {
    if (!activeUser) return;
    await pantaRoomsApi.leaveRoom(room.id, activeUser.id);
    showNotification(`Left "${room.name}"`);
    setActiveRoom(null);
    loadData();
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRoom || !activeUser || !messageText.trim()) return;

    try {
      setIsSending(true);
      const parsedStake = messageType === 'thesis' ? parseFloat(stakedAmount) || 0 : undefined;
      const sentMsg = await pantaRoomsApi.sendRoomMessage({
        roomId: activeRoom.id,
        userId: activeUser.id,
        content: messageText.trim(),
        type: messageType,
        stance: messageType === 'thesis' ? stance : undefined,
        stakedAmount: parsedStake
      });

      if (sentMsg) {
        setMessageText('');
        // Update local active room messages immediately
        setActiveRoom((prev) =>
          prev ? { ...prev, messages: [...prev.messages, sentMsg] } : null
        );
        showNotification(messageType === 'thesis' ? 'Thesis posted to room log' : 'Message sent');
        // Refresh room list in background
        pantaRoomsApi.getRooms().then(setRooms);
      }
    } catch (err) {
      console.error('Failed to post message:', err);
    } finally {
      setIsSending(false);
    }
  };

  const handleCreateRoomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomName || !newRoomTopic || !activeUser) return;

    const created = await pantaRoomsApi.createRoom({
      name: newRoomName,
      topic: newRoomTopic,
      category: newRoomCategory,
      description: newRoomDescription,
      createdBy: activeUser.id,
      activeThesis: newRoomThesis || `${activeUser.username}: Primary debate space initialized.`,
      marketId: newRoomMarketId || undefined
    });

    if (created) {
      showNotification(`Created room "${created.name}"`);
      setIsCreateModalOpen(false);
      setNewRoomName('');
      setNewRoomTopic('');
      setNewRoomDescription('');
      setNewRoomThesis('');
      setActiveRoom(created);
      loadData();
    }
  };

  // Filtered rooms
  const filteredRooms = useMemo(() => {
    return rooms.filter((room) => {
      const matchCat = selectedCategory === 'All' || room.category === selectedCategory;
      const matchSearch =
        !searchQuery ||
        room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        room.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
        room.activeThesis.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [rooms, selectedCategory, searchQuery]);

  return (
    <div className="w-full min-h-screen bg-[#FBFBFC] text-[#09090B] flex flex-col items-center">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-20 right-4 sm:right-6 z-50 bg-white text-[#09090B] text-xs font-semibold px-4 py-3 rounded-2xl shadow-xl border border-neutral-200/90 animate-in fade-in slide-in-from-top-3 flex items-center gap-2.5">
          <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse shrink-0" />
          <span className="text-[#09090B]">{notification}</span>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="ml-2 text-neutral-400 hover:text-[#09090B] transition-colors cursor-pointer p-0.5 rounded-md hover:bg-neutral-100"
            aria-label="Dismiss notification"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Navigation & Test User Switcher Bar */}
      <header className="sticky top-0 z-30 w-full bg-white/90 backdrop-blur-md border-b border-neutral-200/80 px-4 sm:px-6 py-3">
        <div className="max-w-[1240px] mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Logo & Breadcrumb */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] animate-pulse" />
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-[#09090B] font-display flex items-center gap-1.5">
                <span>Panta Rooms</span>
                <span className="text-[10px] uppercase font-mono-tabular bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full">
                  Live Spaces
                </span>
              </h1>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onBackToPredictions}
                className="text-xs font-semibold text-neutral-600 hover:text-neutral-900 px-2.5 py-1.5 rounded-lg border border-neutral-200 hover:bg-neutral-50 transition-colors cursor-pointer"
              >
                Back to Predictions
              </button>
              {onOpenAdminModal && (
                <button
                  type="button"
                  onClick={onOpenAdminModal}
                  className="inline-flex items-center gap-1 text-xs font-semibold bg-neutral-900 hover:bg-neutral-800 text-white px-3 py-1.5 rounded-lg transition-colors cursor-pointer shadow-xs"
                >
                  <Shield className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Admin Monitor</span>
                </button>
              )}
            </div>
          </div>

          {/* Test User Switcher: Quick session selector across 10 users */}
          <div className="flex items-center gap-2 bg-neutral-100/90 p-1.5 rounded-xl border border-neutral-200/80 text-xs w-full md:w-auto overflow-x-auto">
            <span className="text-neutral-500 font-semibold px-2 shrink-0">Acting As:</span>
            <div className="flex items-center gap-1 shrink-0">
              {users.slice(0, 5).map((user) => {
                const isSelected = activeUser?.id === user.id;
                return (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => handleSwitchUser(user)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-white text-[#09090B] font-bold shadow-xs border border-neutral-300'
                        : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/60'
                    }`}
                  >
                    <div className="relative w-4 h-4 rounded-full overflow-hidden shrink-0 border border-neutral-300">
                      <img src={user.avatar} alt={user.username} className="w-full h-full object-cover" />
                      {user.isOnline && (
                        <span className="absolute bottom-0 right-0 w-1.5 h-1.5 bg-[#10B981] rounded-full border border-white" />
                      )}
                    </div>
                    <span className="truncate max-w-[80px]">{user.username.split(' ')[0]}</span>
                    {user.role === 'admin' && (
                      <span className="text-[9px] bg-amber-100 text-amber-800 font-bold px-1 rounded">
                        Admin
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* User Dropdown for remaining users */}
            {users.length > 5 && (
              <select
                aria-label="Switch to other test user"
                value={activeUser?.id || ''}
                onChange={(e) => {
                  const target = users.find((u) => u.id === e.target.value);
                  if (target) handleSwitchUser(target);
                }}
                className="bg-white border border-neutral-200 rounded-lg text-xs font-medium px-2 py-1 text-neutral-800 focus:outline-none"
              >
                {users.slice(5).map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.username} ({u.handle}) {u.role === 'admin' ? '[Admin]' : ''}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="w-full max-w-[1240px] px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Banner Section */}
        <section className="relative rounded-3xl border border-[#e0f2e9] bg-[#f0faf5] p-6 sm:p-8 overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div className="max-w-[560px]">
              <span className="inline-block text-[10px] font-bold tracking-wider text-emerald-800 bg-white/90 border border-emerald-200 px-3 py-1 rounded-full uppercase mb-3 shadow-2xs">
                PERSISTENT PANTA SPACES · 10 VERIFIED FORECASTERS
              </span>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-[#0f172a] leading-tight">
                Debate live odds. <br />
                <span className="text-[#10b981]">Back your conviction in real-time.</span>
              </h2>
              <p className="text-xs sm:text-sm text-[#475569] leading-relaxed mt-2.5 mb-5">
                Join focused rooms to challenge probability distributions, post research theses, and build
                verifiable on-chain track records across markets.
              </p>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#10B981] hover:bg-[#059669] text-white font-bold text-xs sm:text-sm rounded-xl transition-all cursor-pointer shadow-xs hover:shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Strategy Room</span>
                </button>

                {onOpenAdminModal && (
                  <button
                    type="button"
                    onClick={onOpenAdminModal}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-neutral-50 text-neutral-900 border border-neutral-300 font-bold text-xs sm:text-sm rounded-xl transition-all cursor-pointer shadow-xs"
                  >
                    <Shield className="w-4 h-4 text-emerald-600" />
                    <span>View Admin Activity Monitor</span>
                  </button>
                )}
              </div>
            </div>

            {/* Quick Metrics Badge */}
            <div className="grid grid-cols-2 gap-3 shrink-0 md:w-[260px]">
              <div className="bg-white/80 backdrop-blur-xs border border-emerald-200/80 rounded-2xl p-3.5 shadow-2xs">
                <div className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider">
                  Active Rooms
                </div>
                <div className="text-2xl font-extrabold text-[#09090B] mt-0.5 font-mono-tabular">
                  {rooms.filter((r) => r.isLive).length}
                </div>
                <div className="text-[10px] text-neutral-500 mt-1 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-ping" />
                  <span>Real-time persistence</span>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-xs border border-emerald-200/80 rounded-2xl p-3.5 shadow-2xs">
                <div className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider">
                  Test Forecasters
                </div>
                <div className="text-2xl font-extrabold text-[#09090B] mt-0.5 font-mono-tabular">
                  {users.length}
                </div>
                <div className="text-[10px] text-neutral-500 mt-1">
                  {users.filter((u) => u.isOnline).length} online now
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Categories */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                  selectedCategory === cat
                    ? 'bg-[#09090B] text-white shadow-xs'
                    : 'bg-white text-neutral-600 hover:text-neutral-900 border border-neutral-200 hover:bg-neutral-50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-[280px]">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search rooms, theses, or topics..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-neutral-200 rounded-xl focus:border-[#10b981] focus:outline-none transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 text-xs"
              >
                ×
              </button>
            )}
          </div>
        </div>

        {/* Rooms Grid */}
        {isLoading ? (
          <div className="py-16 text-center text-neutral-400 text-xs">
            Loading Panta Rooms...
          </div>
        ) : filteredRooms.length === 0 ? (
          <div className="py-16 text-center border border-dashed border-neutral-300 rounded-2xl bg-white p-8">
            <h3 className="text-sm font-bold text-neutral-800">No rooms match your filter</h3>
            <p className="text-xs text-neutral-500 mt-1 mb-4">
              Try a different keyword or create a new strategy room.
            </p>
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2 bg-[#10b981] text-white font-bold text-xs rounded-xl cursor-pointer"
            >
              Create Room
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredRooms.map((room) => {
              const isUserInRoom = activeUser && room.participants.includes(activeUser.id);
              const linkedMarket = room.marketId
                ? MOCK_MARKETS.find((m) => m.id === room.marketId)
                : null;

              return (
                <div
                  key={room.id}
                  className="bg-white border border-neutral-200 hover:border-neutral-300 rounded-2xl p-5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Top Meta */}
                    <div className="flex items-center justify-between gap-2 mb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-700 font-mono-tabular">
                          {room.category}
                        </span>
                        {room.isLive && (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
                            <span>Live Space</span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1 text-[11px] font-bold text-neutral-600 font-mono-tabular">
                        <Users className="w-3.5 h-3.5 text-neutral-400" />
                        <span>{room.participantCount}</span>
                      </div>
                    </div>

                    {/* Room Title & Topic */}
                    <h3 className="text-sm sm:text-base font-bold text-[#09090B] font-display hover:text-[#10b981] transition-colors cursor-pointer"
                      onClick={() => {
                        if (isUserInRoom) {
                          setActiveRoom(room);
                        } else {
                          handleJoinRoom(room);
                        }
                      }}
                    >
                      {room.name}
                    </h3>
                    <p className="text-xs text-neutral-600 mt-1 line-clamp-2">
                      {room.topic}
                    </p>

                    {/* Active Thesis Quote Box */}
                    <div className="mt-3.5 p-3 rounded-xl bg-neutral-50 border border-neutral-200/90 text-xs">
                      <div className="text-[10px] font-extrabold text-neutral-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-amber-500" />
                        <span>Active Thesis</span>
                      </div>
                      <p className="text-neutral-800 font-medium italic">
                        "{room.activeThesis}"
                      </p>
                    </div>

                    {/* Linked Market Odds Banner if attached */}
                    {linkedMarket && (
                      <div className="mt-3 flex items-center justify-between text-xs p-2 rounded-lg bg-emerald-50/70 border border-emerald-100">
                        <span className="text-emerald-900 font-semibold truncate max-w-[220px]">
                          Market: {linkedMarket.question}
                        </span>
                        <div className="flex items-center gap-1.5 font-mono-tabular font-bold shrink-0">
                          <span className="text-emerald-700">YES {linkedMarket.yesProbability}%</span>
                          <span className="text-neutral-300">/</span>
                          <span className="text-rose-600">NO {linkedMarket.noProbability}%</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Footer & Actions */}
                  <div className="mt-4 pt-3.5 border-t border-neutral-100 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full overflow-hidden border border-neutral-200">
                        <img
                          src={room.creatorAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&h=100&q=80'}
                          alt={room.creatorName}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <span className="text-[11px] text-neutral-500 font-medium truncate max-w-[120px]">
                        By {room.creatorName}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {isUserInRoom ? (
                        <button
                          type="button"
                          onClick={() => setActiveRoom(room)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#09090B] text-white hover:bg-neutral-800 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                        >
                          <MessageSquare className="w-3 h-3 text-emerald-400" />
                          <span>Open Chat ({room.messages.length})</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleJoinRoom(room)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#10B981] hover:bg-[#059669] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-2xs"
                        >
                          <span>Join Room</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* ACTIVE ROOM MODAL / CHAT & THESIS INTERFACE */}
      {activeRoom && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150"
          onClick={() => setActiveRoom(null)}
        >
          <div
            className="bg-white border border-neutral-200 rounded-3xl w-full max-w-[780px] h-[88vh] max-h-[820px] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Room Header */}
            <div className="px-5 py-4 border-b border-neutral-200/90 flex items-center justify-between gap-3 bg-neutral-50/80 shrink-0">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse" />
                  <span className="text-[10px] font-extrabold uppercase bg-neutral-200/70 text-neutral-800 px-2 py-0.5 rounded font-mono-tabular">
                    {activeRoom.category}
                  </span>
                  <span className="text-xs text-neutral-500 font-mono-tabular">
                    {activeRoom.participantCount} participants online
                  </span>
                </div>
                <h3 className="text-base font-bold text-[#09090B] font-display truncate mt-0.5">
                  {activeRoom.name}
                </h3>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleLeaveRoom(activeRoom)}
                  className="px-2.5 py-1 text-xs text-neutral-500 hover:text-rose-600 rounded-lg hover:bg-neutral-100 transition-colors"
                  title="Leave Room"
                >
                  Leave
                </button>
                <button
                  type="button"
                  onClick={() => setActiveRoom(null)}
                  className="p-1.5 text-neutral-400 hover:text-neutral-800 rounded-full hover:bg-neutral-100 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Room Topic & Active Thesis Header */}
            <div className="px-5 py-2.5 bg-neutral-100/60 border-b border-neutral-200 text-xs shrink-0 flex items-center justify-between gap-3">
              <div className="truncate">
                <span className="font-bold text-neutral-700">Topic: </span>
                <span className="text-neutral-600">{activeRoom.topic}</span>
              </div>
              <span className="text-[10px] text-neutral-500 font-medium shrink-0">
                Created by {activeRoom.creatorName}
              </span>
            </div>

            {/* Messages Feed */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 bg-white">
              {activeRoom.messages.length === 0 ? (
                <div className="py-12 text-center text-xs text-neutral-400">
                  No messages yet. Be the first to share your probability thesis!
                </div>
              ) : (
                activeRoom.messages.map((msg) => {
                  const isCurrent = activeUser?.id === msg.userId;
                  const isThesis = msg.type === 'thesis';

                  return (
                    <div
                      key={msg.id}
                      className={`flex gap-3 text-xs ${isCurrent ? 'justify-end' : 'justify-start'}`}
                    >
                      {!isCurrent && (
                        <div className="w-7 h-7 rounded-full overflow-hidden border border-neutral-200 shrink-0 mt-0.5">
                          <img
                            src={msg.userAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&h=100&q=80'}
                            alt={msg.username}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}

                      <div
                        className={`max-w-[85%] rounded-2xl p-3 shadow-2xs ${
                          isThesis
                            ? msg.stance === 'YES'
                              ? 'bg-emerald-50/90 border border-emerald-200 text-neutral-900'
                              : msg.stance === 'NO'
                              ? 'bg-rose-50/90 border border-rose-200 text-neutral-900'
                              : 'bg-neutral-50 border border-neutral-200 text-neutral-900'
                            : isCurrent
                            ? 'bg-[#09090B] text-white'
                            : 'bg-neutral-100 text-[#09090B]'
                        }`}
                      >
                        {/* Message Top Meta */}
                        <div className="flex items-center justify-between gap-3 mb-1">
                          <span
                            className={`font-bold ${
                              isCurrent && !isThesis ? 'text-white' : 'text-neutral-900'
                            }`}
                          >
                            {msg.username}{' '}
                            <span className="text-[10px] font-normal opacity-70">
                              {msg.userHandle}
                            </span>
                          </span>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {isThesis && msg.stance && (
                              <span
                                className={`text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded font-mono-tabular ${
                                  msg.stance === 'YES'
                                    ? 'bg-emerald-600 text-white'
                                    : msg.stance === 'NO'
                                    ? 'bg-rose-600 text-white'
                                    : 'bg-neutral-600 text-white'
                                }`}
                              >
                                {msg.stance}
                              </span>
                            )}
                            {msg.stakedAmount && (
                              <span className="text-[10px] font-bold font-mono-tabular text-emerald-800 bg-emerald-100 px-1 rounded">
                                ${msg.stakedAmount}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Content */}
                        <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>

                        <div
                          className={`text-[9px] mt-1 text-right font-mono-tabular opacity-60`}
                        >
                          {new Date(msg.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>

                      {isCurrent && (
                        <div className="w-7 h-7 rounded-full overflow-hidden border border-neutral-200 shrink-0 mt-0.5">
                          <img
                            src={activeUser.avatar}
                            alt={activeUser.username}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Composer */}
            <form
              onSubmit={handleSendMessage}
              className="p-3.5 bg-neutral-50 border-t border-neutral-200 shrink-0"
            >
              {/* Mode switch */}
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-1 bg-neutral-200/80 p-0.5 rounded-lg text-xs">
                  <button
                    type="button"
                    onClick={() => setMessageType('thesis')}
                    className={`px-2.5 py-1 rounded-md font-bold transition-all ${
                      messageType === 'thesis'
                        ? 'bg-white text-[#09090B] shadow-2xs'
                        : 'text-neutral-600 hover:text-neutral-900'
                    }`}
                  >
                    Post Thesis
                  </button>
                  <button
                    type="button"
                    onClick={() => setMessageType('chat')}
                    className={`px-2.5 py-1 rounded-md font-bold transition-all ${
                      messageType === 'chat'
                        ? 'bg-white text-[#09090B] shadow-2xs'
                        : 'text-neutral-600 hover:text-neutral-900'
                    }`}
                  >
                    Quick Chat
                  </button>
                </div>

                {messageType === 'thesis' && (
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold text-neutral-500">Stance:</span>
                    <button
                      type="button"
                      onClick={() => setStance('YES')}
                      className={`px-2 py-0.5 text-[10px] font-extrabold rounded ${
                        stance === 'YES'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-neutral-200 text-neutral-700'
                      }`}
                    >
                      YES
                    </button>
                    <button
                      type="button"
                      onClick={() => setStance('NO')}
                      className={`px-2 py-0.5 text-[10px] font-extrabold rounded ${
                        stance === 'NO'
                          ? 'bg-rose-600 text-white'
                          : 'bg-neutral-200 text-neutral-700'
                      }`}
                    >
                      NO
                    </button>
                    <button
                      type="button"
                      onClick={() => setStance('NEUTRAL')}
                      className={`px-2 py-0.5 text-[10px] font-extrabold rounded ${
                        stance === 'NEUTRAL'
                          ? 'bg-neutral-700 text-white'
                          : 'bg-neutral-200 text-neutral-700'
                      }`}
                    >
                      NEUTRAL
                    </button>

                    <div className="flex items-center gap-1 text-[11px] text-neutral-600 font-mono-tabular">
                      <span>Stake $:</span>
                      <input
                        type="number"
                        value={stakedAmount}
                        onChange={(e) => setStakedAmount(e.target.value)}
                        className="w-16 px-1.5 py-0.5 bg-white border border-neutral-300 rounded text-xs font-bold"
                        min="0"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Input & Send */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder={
                    messageType === 'thesis'
                      ? `Share your ${stance} thesis on this room topic...`
                      : 'Type a message to room participants...'
                  }
                  className="flex-1 px-3.5 py-2 text-xs bg-white border border-neutral-300 rounded-xl focus:border-[#10b981] focus:outline-none transition-all shadow-2xs"
                />
                <button
                  type="submit"
                  disabled={!messageText.trim() || isSending}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#10b981] hover:bg-[#059669] disabled:bg-neutral-300 text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-xs shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSending ? 'Sending...' : 'Send'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE ROOM MODAL */}
      {isCreateModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setIsCreateModalOpen(false)}
        >
          <div
            className="bg-white border border-neutral-200 rounded-3xl w-full max-w-[540px] p-6 shadow-2xl animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3.5 border-b border-neutral-100">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] animate-pulse" />
                <h3 className="text-base font-bold text-[#09090B]">Create Strategy Room</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 text-neutral-400 hover:text-neutral-700 rounded-full"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateRoomSubmit} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block font-bold text-neutral-800 mb-1">Room Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ethereum Dencun Upgrade Quantitative Review"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl focus:border-[#10b981] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-neutral-800 mb-1">Category</label>
                  <select
                    value={newRoomCategory}
                    onChange={(e) => setNewRoomCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl focus:border-[#10b981] focus:outline-none"
                  >
                    <option value="Crypto">Crypto</option>
                    <option value="Macro">Macro</option>
                    <option value="Sports">Sports</option>
                    <option value="AI & Tech">AI & Tech</option>
                    <option value="General">General</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-neutral-800 mb-1">Link Prediction Market (Optional)</label>
                  <select
                    value={newRoomMarketId}
                    onChange={(e) => setNewRoomMarketId(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl focus:border-[#10b981] focus:outline-none"
                  >
                    <option value="">None (Standalone Space)</option>
                    {MOCK_MARKETS.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.question.slice(0, 36)}...
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-neutral-800 mb-1">Topic / Resolution Question</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Will ETH gas median fees remain below 15 gwei post-fork?"
                  value={newRoomTopic}
                  onChange={(e) => setNewRoomTopic(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl focus:border-[#10b981] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-800 mb-1">Room Description</label>
                <textarea
                  rows={2}
                  placeholder="Brief context for forecasters entering this room..."
                  value={newRoomDescription}
                  onChange={(e) => setNewRoomDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl focus:border-[#10b981] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-800 mb-1">Your Initial Thesis</label>
                <input
                  type="text"
                  placeholder="e.g. Layer 2 blob space absorption models point toward a 60% fee reduction."
                  value={newRoomThesis}
                  onChange={(e) => setNewRoomThesis(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl focus:border-[#10b981] focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 font-semibold text-neutral-600 hover:text-neutral-900 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#10B981] hover:bg-[#059669] text-white font-bold rounded-xl shadow-xs cursor-pointer"
                >
                  Create & Launch Room
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
