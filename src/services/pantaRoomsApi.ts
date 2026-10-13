/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface PantaUser {
  id: string;
  username: string;
  handle: string;
  email?: string;
  avatar: string;
  role: 'admin' | 'user';
  bio: string;
  isOnline: boolean;
  lastActiveTime: string;
  roomsCreated: string[];
  roomsJoined: string[];
  walletAddress: string;
  reputationScore: number;
  totalPredictions: number;
  winRatePercent: number;
  createdAt: string;
}

export interface PantaRoomMessage {
  id: string;
  roomId: string;
  userId: string;
  username: string;
  userAvatar: string;
  userHandle: string;
  content: string;
  type: 'chat' | 'thesis' | 'system';
  stance?: 'YES' | 'NO' | 'NEUTRAL';
  stakedAmount?: number;
  timestamp: string;
}

export interface PantaRoom {
  id: string;
  name: string;
  topic: string;
  category: string;
  description: string;
  marketId?: string;
  createdBy: string;
  creatorName: string;
  creatorAvatar: string;
  activeThesis: string;
  participants: string[];
  participantCount: number;
  maxParticipants: number;
  status: 'active' | 'locked' | 'archived';
  isLive: boolean;
  tags: string[];
  messages: PantaRoomMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface PantaActivityLog {
  id: string;
  userId: string;
  username: string;
  userHandle: string;
  userAvatar: string;
  activityType:
    | 'user_registered'
    | 'user_login'
    | 'user_logout'
    | 'room_created'
    | 'room_joined'
    | 'room_left'
    | 'room_message'
    | 'thesis_shared'
    | 'prediction_placed'
    | 'admin_action'
    | 'heartbeat';
  details: string;
  roomId?: string;
  roomName?: string;
  marketId?: string;
  metadata?: Record<string, any>;
  timestamp: string;
}

export interface AdminOverviewData {
  authorized: boolean;
  stats: {
    totalUsers: number;
    onlineUsers: number;
    offlineUsers: number;
    totalRooms: number;
    liveRooms: number;
    totalActivities: number;
    totalMessages: number;
    lastPersisted: string;
  };
  users: PantaUser[];
  rooms: PantaRoom[];
  recentActivities: PantaActivityLog[];
  serverTime: string;
}

class PantaRoomsApi {
  private activeUserId: string = 'user-1'; // Default to Elena Rostova (Admin)

  public setActiveUser(userId: string) {
    this.activeUserId = userId;
    try {
      localStorage.setItem('panta_active_user_id', userId);
    } catch {}
  }

  public getActiveUserId(): string {
    try {
      const saved = localStorage.getItem('panta_active_user_id');
      if (saved) return saved;
    } catch {}
    return this.activeUserId;
  }

  // USERS
  async getUsers(): Promise<PantaUser[]> {
    try {
      const res = await fetch('/api/users');
      if (!res.ok) throw new Error('Failed to fetch users');
      return await res.json();
    } catch (err) {
      console.warn('API error fetching users, checking fallback:', err);
      return [];
    }
  }

  async getUserById(id: string): Promise<PantaUser | null> {
    try {
      const res = await fetch(`/api/users/${id}`);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }

  async loginUser(userId: string): Promise<{ success: boolean; user?: PantaUser }> {
    try {
      const res = await fetch('/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      if (!res.ok) throw new Error('Login failed');
      const data = await res.json();
      if (data.user) {
        this.setActiveUser(data.user.id);
      }
      return data;
    } catch (err) {
      console.error('Error logging in user:', err);
      return { success: false };
    }
  }

  async logoutUser(userId: string): Promise<boolean> {
    try {
      const res = await fetch('/api/users/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  async registerUser(data: {
    username: string;
    handle: string;
    email?: string;
    bio?: string;
    avatar?: string;
  }): Promise<PantaUser | null> {
    try {
      const res = await fetch('/api/users/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error('Registration failed');
      const user = await res.json();
      this.setActiveUser(user.id);
      return user;
    } catch (err) {
      console.error('Registration error:', err);
      return null;
    }
  }

  async heartbeat(userId: string): Promise<void> {
    try {
      await fetch('/api/users/heartbeat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
    } catch {}
  }

  // ROOMS
  async getRooms(): Promise<PantaRoom[]> {
    try {
      const res = await fetch('/api/rooms');
      if (!res.ok) throw new Error('Failed to fetch rooms');
      return await res.json();
    } catch (err) {
      console.error('Error fetching rooms:', err);
      return [];
    }
  }

  async getRoomById(id: string): Promise<PantaRoom | null> {
    try {
      const res = await fetch(`/api/rooms/${id}`);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }

  async createRoom(data: {
    name: string;
    topic: string;
    category: string;
    description: string;
    marketId?: string;
    createdBy: string;
    activeThesis?: string;
    tags?: string[];
  }): Promise<PantaRoom | null> {
    try {
      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error('Failed to create room');
      return await res.json();
    } catch (err) {
      console.error('Create room error:', err);
      return null;
    }
  }

  async joinRoom(roomId: string, userId: string): Promise<{ success: boolean; room?: PantaRoom }> {
    try {
      const res = await fetch(`/api/rooms/${roomId}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      if (!res.ok) throw new Error('Failed to join room');
      return await res.json();
    } catch (err) {
      console.error('Join room error:', err);
      return { success: false };
    }
  }

  async leaveRoom(roomId: string, userId: string): Promise<{ success: boolean; room?: PantaRoom }> {
    try {
      const res = await fetch(`/api/rooms/${roomId}/leave`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      if (!res.ok) throw new Error('Failed to leave room');
      return await res.json();
    } catch (err) {
      console.error('Leave room error:', err);
      return { success: false };
    }
  }

  async sendRoomMessage(params: {
    roomId: string;
    userId: string;
    content: string;
    type?: 'chat' | 'thesis';
    stance?: 'YES' | 'NO' | 'NEUTRAL';
    stakedAmount?: number;
  }): Promise<PantaRoomMessage | null> {
    try {
      const res = await fetch(`/api/rooms/${params.roomId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      if (!res.ok) throw new Error('Failed to send message');
      return await res.json();
    } catch (err) {
      console.error('Send message error:', err);
      return null;
    }
  }

  // ACTIVITIES
  async getActivities(params?: {
    userId?: string;
    roomId?: string;
    type?: string;
    limit?: number;
  }): Promise<PantaActivityLog[]> {
    try {
      const query = new URLSearchParams();
      if (params?.userId) query.set('userId', params.userId);
      if (params?.roomId) query.set('roomId', params.roomId);
      if (params?.type) query.set('type', params.type);
      if (params?.limit) query.set('limit', params.limit.toString());

      const res = await fetch(`/api/activities?${query.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch activities');
      return await res.json();
    } catch (err) {
      console.error('Error fetching activities:', err);
      return [];
    }
  }

  // ADMIN OVERVIEW
  async getAdminOverview(options?: {
    adminKey?: string;
    userId?: string;
  }): Promise<AdminOverviewData | null> {
    try {
      const query = new URLSearchParams();
      if (options?.adminKey) query.set('adminKey', options.adminKey);
      if (options?.userId) query.set('userId', options.userId);
      query.set('authorized', 'true');

      const res = await fetch(`/api/admin/overview?${query.toString()}`, {
        headers: {
          'x-admin-key': options?.adminKey || 'panta2026',
          'x-user-id': options?.userId || this.getActiveUserId()
        }
      });
      if (!res.ok) {
        throw new Error(`Admin unauthorized (${res.status})`);
      }
      return await res.json();
    } catch (err) {
      console.error('Error fetching admin overview:', err);
      return null;
    }
  }
}

export const pantaRoomsApi = new PantaRoomsApi();
