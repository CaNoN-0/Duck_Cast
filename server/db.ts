/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../data');
const DB_FILE = path.join(DATA_DIR, 'panta_database.json');

export interface User {
  id: string;
  username: string;
  handle: string;
  email: string;
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

export interface RoomMessage {
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

export interface Room {
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
  participants: string[]; // user IDs
  participantCount: number;
  maxParticipants: number;
  status: 'active' | 'locked' | 'archived';
  isLive: boolean;
  tags: string[];
  messages: RoomMessage[];
  createdAt: string;
  updatedAt: string;
}

export type ActivityType =
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

export interface ActivityLog {
  id: string;
  userId: string;
  username: string;
  userHandle: string;
  userAvatar: string;
  activityType: ActivityType;
  details: string;
  roomId?: string;
  roomName?: string;
  marketId?: string;
  metadata?: Record<string, any>;
  timestamp: string;
}

export interface PantaDatabaseSchema {
  version: number;
  lastPersisted: string;
  users: User[];
  rooms: Room[];
  activities: ActivityLog[];
}

// 10 Seed Test Users as specified in requirements
const SEED_USERS: User[] = [
  {
    id: 'user-1',
    username: 'Elena Rostova',
    handle: '@elena_crypto',
    email: 'elena@pantarooms.io',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&h=200&q=80',
    role: 'admin',
    bio: 'Lead Macro & Crypto Quant. Founder of Panta Alpha Room.',
    isOnline: true,
    lastActiveTime: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    roomsCreated: ['room-1', 'room-4'],
    roomsJoined: ['room-1', 'room-2', 'room-4'],
    walletAddress: '7Yw...9bA1',
    reputationScore: 98,
    totalPredictions: 142,
    winRatePercent: 78,
    createdAt: new Date('2026-01-10T10:00:00Z').toISOString()
  },
  {
    id: 'user-2',
    username: 'SatoshiDuck',
    handle: '@satoshiduck',
    email: 'satoshi@pantarooms.io',
    avatar: '/src/assets/images/duckcast_mascot_illustration_1790877735628.jpg',
    role: 'user',
    bio: 'On-chain derivatives analyst. Always long volatility.',
    isOnline: true,
    lastActiveTime: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    roomsCreated: ['room-2'],
    roomsJoined: ['room-1', 'room-2', 'room-3'],
    walletAddress: '3Xp...8mC2',
    reputationScore: 94,
    totalPredictions: 210,
    winRatePercent: 74,
    createdAt: new Date('2026-01-12T11:00:00Z').toISOString()
  },
  {
    id: 'user-3',
    username: 'Marcus Vance',
    handle: '@marcus_vance',
    email: 'marcus@pantarooms.io',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&h=200&q=80',
    role: 'user',
    bio: 'Sports modeling & tactical analysis. Expected goals (xG) purist.',
    isOnline: false,
    lastActiveTime: new Date(Date.now() - 42 * 60 * 1000).toISOString(),
    roomsCreated: ['room-3'],
    roomsJoined: ['room-3', 'room-1'],
    walletAddress: '9Lm...4jP9',
    reputationScore: 89,
    totalPredictions: 95,
    winRatePercent: 68,
    createdAt: new Date('2026-01-15T09:30:00Z').toISOString()
  },
  {
    id: 'user-4',
    username: 'Kaito Tanaka',
    handle: '@kaito_tanaka',
    email: 'kaito@pantarooms.io',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&h=200&q=80',
    role: 'user',
    bio: 'AI researcher tracking frontier LLM benchmarks and release timelines.',
    isOnline: true,
    lastActiveTime: new Date(Date.now() - 11 * 60 * 1000).toISOString(),
    roomsCreated: [],
    roomsJoined: ['room-1', 'room-4'],
    walletAddress: '2Kp...7vT8',
    reputationScore: 91,
    totalPredictions: 88,
    winRatePercent: 71,
    createdAt: new Date('2026-01-20T14:15:00Z').toISOString()
  },
  {
    id: 'user-5',
    username: 'Sophia Chen',
    handle: '@sophia_chen',
    email: 'sophia@pantarooms.io',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&h=200&q=80',
    role: 'user',
    bio: 'Biopharma analyst tracking FDA PDUFA decision dates & Phase 3 trial readouts.',
    isOnline: false,
    lastActiveTime: new Date(Date.now() - 120 * 60 * 1000).toISOString(),
    roomsCreated: [],
    roomsJoined: ['room-1', 'room-2'],
    walletAddress: '5Qw...1zN3',
    reputationScore: 87,
    totalPredictions: 64,
    winRatePercent: 65,
    createdAt: new Date('2026-01-22T08:00:00Z').toISOString()
  },
  {
    id: 'user-6',
    username: 'Alex Rivera',
    handle: '@alex_rivera',
    email: 'alex@pantarooms.io',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&h=200&q=80',
    role: 'user',
    bio: 'Tech equity strategist specializing in semiconductor capex cycles.',
    isOnline: true,
    lastActiveTime: new Date(Date.now() - 1 * 60 * 1000).toISOString(),
    roomsCreated: [],
    roomsJoined: ['room-1', 'room-4'],
    walletAddress: '4Ty...6uM5',
    reputationScore: 92,
    totalPredictions: 119,
    winRatePercent: 73,
    createdAt: new Date('2026-01-25T16:20:00Z').toISOString()
  },
  {
    id: 'user-7',
    username: 'Dara O\'Connor',
    handle: '@dara_dublin',
    email: 'dara@pantarooms.io',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&h=200&q=80',
    role: 'user',
    bio: 'Geopolitical risk & European energy flows specialist.',
    isOnline: false,
    lastActiveTime: new Date(Date.now() - 360 * 60 * 1000).toISOString(),
    roomsCreated: [],
    roomsJoined: ['room-2'],
    walletAddress: '8Op...3bV7',
    reputationScore: 86,
    totalPredictions: 78,
    winRatePercent: 63,
    createdAt: new Date('2026-02-01T12:00:00Z').toISOString()
  },
  {
    id: 'user-8',
    username: 'TechBae',
    handle: '@techbae_sol',
    email: 'techbae@pantarooms.io',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&h=200&q=80',
    role: 'user',
    bio: 'Solana DeFi protocols, DEX volume aggregator tracking.',
    isOnline: true,
    lastActiveTime: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
    roomsCreated: [],
    roomsJoined: ['room-1', 'room-2'],
    walletAddress: '1Zx...9yH4',
    reputationScore: 90,
    totalPredictions: 104,
    winRatePercent: 69,
    createdAt: new Date('2026-02-03T14:45:00Z').toISOString()
  },
  {
    id: 'user-9',
    username: 'MacroQuack',
    handle: '@macroquack',
    email: 'macroquack@pantarooms.io',
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=200&h=200&q=80',
    role: 'user',
    bio: 'Federal Reserve rate curves, CPI prints, and treasury yield spreads.',
    isOnline: false,
    lastActiveTime: new Date(Date.now() - 180 * 60 * 1000).toISOString(),
    roomsCreated: [],
    roomsJoined: ['room-1', 'room-2'],
    walletAddress: '6Vb...2cQ1',
    reputationScore: 93,
    totalPredictions: 167,
    winRatePercent: 72,
    createdAt: new Date('2026-02-05T09:10:00Z').toISOString()
  },
  {
    id: 'user-10',
    username: 'Liam Sterling',
    handle: '@liam_sterling',
    email: 'liam@pantarooms.io',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&h=200&q=80',
    role: 'user',
    bio: 'European football & Champions League analytical modeling.',
    isOnline: true,
    lastActiveTime: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    roomsCreated: [],
    roomsJoined: ['room-3'],
    walletAddress: '9Qa...5wE8',
    reputationScore: 88,
    totalPredictions: 82,
    winRatePercent: 67,
    createdAt: new Date('2026-02-10T10:30:00Z').toISOString()
  }
];

// Initial Seed Rooms
const SEED_ROOMS: Room[] = [
  {
    id: 'room-1',
    name: 'Bitcoin $120K Strategy Room',
    topic: 'Will BTC move above $120K before Friday options expiry?',
    category: 'Crypto',
    description: 'High-conviction debate room on Bitcoin order-book depth, spot ETF inflows, and Friday gamma pinning.',
    marketId: 'crypto-btc-120k',
    createdBy: 'user-1',
    creatorName: 'Elena Rostova',
    creatorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&h=200&q=80',
    activeThesis: 'Elena: Institutional OTC desks have zero liquid supply above $115K.',
    participants: ['user-1', 'user-2', 'user-4', 'user-5', 'user-6', 'user-8', 'user-9'],
    participantCount: 42,
    maxParticipants: 100,
    status: 'active',
    isLive: true,
    tags: ['Bitcoin', 'Crypto', 'Derivatives', 'Options'],
    createdAt: new Date('2026-02-15T08:00:00Z').toISOString(),
    updatedAt: new Date().toISOString(),
    messages: [
      {
        id: 'msg-1',
        roomId: 'room-1',
        userId: 'user-1',
        username: 'Elena Rostova',
        userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&h=200&q=80',
        userHandle: '@elena_crypto',
        content: 'Institutional OTC order books show massive bids stacked around $117.8K. Breakout probability is heavily skewed YES.',
        type: 'thesis',
        stance: 'YES',
        stakedAmount: 2500,
        timestamp: new Date(Date.now() - 40 * 60 * 1000).toISOString()
      },
      {
        id: 'msg-2',
        roomId: 'room-1',
        userId: 'user-2',
        username: 'SatoshiDuck',
        userAvatar: '/src/assets/images/duckcast_mascot_illustration_1790877735628.jpg',
        userHandle: '@satoshiduck',
        content: 'Agreed on spot depth, but watch Friday 08:00 UTC max pain at $119,500. Whales might suppress till expiry settlement.',
        type: 'thesis',
        stance: 'NO',
        stakedAmount: 1800,
        timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString()
      },
      {
        id: 'msg-3',
        roomId: 'room-1',
        userId: 'user-6',
        username: 'Alex Rivera',
        userAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&h=200&q=80',
        userHandle: '@alex_rivera',
        content: 'Nasdaq correlation just ticked above 0.82 today. If tech rallies into the close, BTC will effortlessly break $120k.',
        type: 'chat',
        stance: 'YES',
        timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString()
      }
    ]
  },
  {
    id: 'room-2',
    name: 'Fed Rates & CPI Print War Room',
    topic: 'Will the Fed cut rates by 25bps or hold steady at next FOMC?',
    category: 'Macro',
    description: 'Real-time discussion on macroeconomic indicators, core inflation reads, and treasury yield curve inversions.',
    marketId: 'business-fed-rate-cut',
    createdBy: 'user-2',
    creatorName: 'SatoshiDuck',
    creatorAvatar: '/src/assets/images/duckcast_mascot_illustration_1790877735628.jpg',
    activeThesis: 'MacroQuack: Labor market softening increases 25bps cut odds to 68%.',
    participants: ['user-1', 'user-2', 'user-5', 'user-7', 'user-8', 'user-9'],
    participantCount: 35,
    maxParticipants: 75,
    status: 'active',
    isLive: true,
    tags: ['FOMC', 'Rates', 'Macro', 'Inflation'],
    createdAt: new Date('2026-02-16T10:00:00Z').toISOString(),
    updatedAt: new Date().toISOString(),
    messages: [
      {
        id: 'msg-201',
        roomId: 'room-2',
        userId: 'user-9',
        username: 'MacroQuack',
        userAvatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=200&h=200&q=80',
        userHandle: '@macroquack',
        content: 'Non-farm payroll revisions are consistently negative. Chairman Powell signaled flexibility in the Jackson Hole minutes.',
        type: 'thesis',
        stance: 'YES',
        stakedAmount: 3200,
        timestamp: new Date(Date.now() - 90 * 60 * 1000).toISOString()
      }
    ]
  },
  {
    id: 'room-3',
    name: 'Champions League Half-time Analysis',
    topic: 'Tactical xG model evaluation and live in-play predictions.',
    category: 'Sports',
    description: 'Forecasters analyzing pressing traps, defensive blocks, and referee tendency metrics.',
    marketId: 'sports-team-a-halftime',
    createdBy: 'user-3',
    creatorName: 'Marcus Vance',
    creatorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&h=200&q=80',
    activeThesis: 'Marcus: Defensive sub incoming, second-half goal probability drops below 35%.',
    participants: ['user-2', 'user-3', 'user-10'],
    participantCount: 28,
    maxParticipants: 50,
    status: 'active',
    isLive: true,
    tags: ['Champions League', 'Football', 'In-play', 'Tactics'],
    createdAt: new Date('2026-02-17T12:00:00Z').toISOString(),
    updatedAt: new Date().toISOString(),
    messages: [
      {
        id: 'msg-301',
        roomId: 'room-3',
        userId: 'user-3',
        username: 'Marcus Vance',
        userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&h=200&q=80',
        userHandle: '@marcus_vance',
        content: 'Away team is playing a compact 5-4-1 low block. Zero shots on target conceded in 45 minutes.',
        type: 'thesis',
        stance: 'NO',
        timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString()
      }
    ]
  },
  {
    id: 'room-4',
    name: 'Frontier AI Model Benchmarks & Q4 Releases',
    topic: 'Will a frontier reasoning model surpass 90% on SWE-bench Verified this quarter?',
    category: 'AI & Tech',
    description: 'Benchmarking labs, test-time compute scaling laws, and release window forecasting.',
    marketId: 'tech-ai-benchmark-q4',
    createdBy: 'user-1',
    creatorName: 'Elena Rostova',
    creatorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&h=200&q=80',
    activeThesis: 'Kaito: Test-time compute scaling trajectory favors YES resolution by late November.',
    participants: ['user-1', 'user-4', 'user-6'],
    participantCount: 19,
    maxParticipants: 60,
    status: 'active',
    isLive: true,
    tags: ['AI', 'Reasoning', 'SWE-bench', 'Tech'],
    createdAt: new Date('2026-02-18T14:00:00Z').toISOString(),
    updatedAt: new Date().toISOString(),
    messages: [
      {
        id: 'msg-401',
        roomId: 'room-4',
        userId: 'user-4',
        username: 'Kaito Tanaka',
        userAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&h=200&q=80',
        userHandle: '@kaito_tanaka',
        content: 'MCTS rollout verification on repository-level patches is hitting 87% in pre-prints. The jump over 90% is statistically assured.',
        type: 'thesis',
        stance: 'YES',
        stakedAmount: 1400,
        timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString()
      }
    ]
  }
];

// Initial Seed Activity Logs
const SEED_ACTIVITIES: ActivityLog[] = [
  {
    id: 'act-seed-1',
    userId: 'user-1',
    username: 'Elena Rostova',
    userHandle: '@elena_crypto',
    userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&h=200&q=80',
    activityType: 'room_created',
    details: 'Created room "Bitcoin $120K Strategy Room"',
    roomId: 'room-1',
    roomName: 'Bitcoin $120K Strategy Room',
    timestamp: new Date(Date.now() - 120 * 60 * 1000).toISOString()
  },
  {
    id: 'act-seed-2',
    userId: 'user-2',
    username: 'SatoshiDuck',
    userHandle: '@satoshiduck',
    userAvatar: '/src/assets/images/duckcast_mascot_illustration_1790877735628.jpg',
    activityType: 'room_joined',
    details: 'Joined room "Bitcoin $120K Strategy Room"',
    roomId: 'room-1',
    roomName: 'Bitcoin $120K Strategy Room',
    timestamp: new Date(Date.now() - 95 * 60 * 1000).toISOString()
  },
  {
    id: 'act-seed-3',
    userId: 'user-1',
    username: 'Elena Rostova',
    userHandle: '@elena_crypto',
    userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&h=200&q=80',
    activityType: 'thesis_shared',
    details: 'Submitted YES thesis with 2,500 USDC stake in "Bitcoin $120K Strategy Room"',
    roomId: 'room-1',
    roomName: 'Bitcoin $120K Strategy Room',
    metadata: { stance: 'YES', staked: 2500 },
    timestamp: new Date(Date.now() - 40 * 60 * 1000).toISOString()
  },
  {
    id: 'act-seed-4',
    userId: 'user-2',
    username: 'SatoshiDuck',
    userHandle: '@satoshiduck',
    userAvatar: '/src/assets/images/duckcast_mascot_illustration_1790877735628.jpg',
    activityType: 'thesis_shared',
    details: 'Submitted NO counter-thesis with 1,800 USDC stake in "Bitcoin $120K Strategy Room"',
    roomId: 'room-1',
    roomName: 'Bitcoin $120K Strategy Room',
    metadata: { stance: 'NO', staked: 1800 },
    timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString()
  },
  {
    id: 'act-seed-5',
    userId: 'user-3',
    username: 'Marcus Vance',
    userHandle: '@marcus_vance',
    userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&h=200&q=80',
    activityType: 'room_created',
    details: 'Created room "Champions League Half-time Analysis"',
    roomId: 'room-3',
    roomName: 'Champions League Half-time Analysis',
    timestamp: new Date(Date.now() - 70 * 60 * 1000).toISOString()
  },
  {
    id: 'act-seed-6',
    userId: 'user-6',
    username: 'Alex Rivera',
    userHandle: '@alex_rivera',
    userAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&h=200&q=80',
    activityType: 'room_message',
    details: 'Posted message in "Bitcoin $120K Strategy Room"',
    roomId: 'room-1',
    roomName: 'Bitcoin $120K Strategy Room',
    timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString()
  },
  {
    id: 'act-seed-7',
    userId: 'user-4',
    username: 'Kaito Tanaka',
    userHandle: '@kaito_tanaka',
    userAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&h=200&q=80',
    activityType: 'user_login',
    details: 'Logged into Panta Rooms session',
    timestamp: new Date(Date.now() - 11 * 60 * 1000).toISOString()
  },
  {
    id: 'act-seed-8',
    userId: 'user-1',
    username: 'Elena Rostova',
    userHandle: '@elena_crypto',
    userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&h=200&q=80',
    activityType: 'admin_action',
    details: 'Verified resolution source feed for Panta primary market',
    metadata: { action: 'verify_oracle' },
    timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString()
  }
];

class PantaDatabase {
  private data: PantaDatabaseSchema;
  private saveTimeout: NodeJS.Timeout | null = null;

  constructor() {
    this.ensureDataDir();
    this.data = this.loadDatabase();
  }

  private ensureDataDir() {
    if (!fs.existsSync(DATA_DIR)) {
      try {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      } catch (err) {
        console.error('[DB] Failed to create data directory:', err);
      }
    }
  }

  private loadDatabase(): PantaDatabaseSchema {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw) as PantaDatabaseSchema;
        if (parsed && Array.isArray(parsed.users) && parsed.users.length >= 10) {
          console.log(`[DB] Successfully loaded existing database from ${DB_FILE} (${parsed.users.length} users, ${parsed.rooms.length} rooms, ${parsed.activities.length} activities)`);
          return parsed;
        }
      }
    } catch (err) {
      console.warn('[DB] Failed to read database file, initializing seed defaults:', err);
    }

    // Initialize with seed data
    const initialData: PantaDatabaseSchema = {
      version: 1,
      lastPersisted: new Date().toISOString(),
      users: SEED_USERS,
      rooms: SEED_ROOMS,
      activities: SEED_ACTIVITIES
    };

    this.saveFileSync(initialData);
    console.log(`[DB] Seeded initial database at ${DB_FILE} with 10 users and 4 rooms.`);
    return initialData;
  }

  private saveFileSync(dataToSave: PantaDatabaseSchema) {
    try {
      this.ensureDataDir();
      dataToSave.lastPersisted = new Date().toISOString();
      const tempFile = `${DB_FILE}.tmp.${Date.now()}`;
      fs.writeFileSync(tempFile, JSON.stringify(dataToSave, null, 2), 'utf-8');
      fs.renameSync(tempFile, DB_FILE);
    } catch (err) {
      console.error('[DB] Failed to persist database:', err);
    }
  }

  private persist() {
    this.saveFileSync(this.data);
  }

  // Diagnostic / Health
  public getHealth() {
    return {
      status: 'healthy',
      dbFile: DB_FILE,
      userCount: this.data.users.length,
      roomCount: this.data.rooms.length,
      activityCount: this.data.activities.length,
      lastPersisted: this.data.lastPersisted,
      version: this.data.version
    };
  }

  // USER OPERATIONS
  public getUsers(): User[] {
    return this.data.users;
  }

  public getUserById(id: string): User | undefined {
    return this.data.users.find((u) => u.id === id);
  }

  public getUserByHandle(handle: string): User | undefined {
    return this.data.users.find(
      (u) => u.handle.toLowerCase() === handle.toLowerCase()
    );
  }

  public registerUser(params: {
    username: string;
    handle: string;
    email: string;
    avatar?: string;
    bio?: string;
    walletAddress?: string;
    role?: 'admin' | 'user';
  }): User {
    const cleanHandle = params.handle.startsWith('@')
      ? params.handle
      : `@${params.handle}`;

    const existing = this.getUserByHandle(cleanHandle);
    if (existing) {
      return existing;
    }

    const nextId = `user-${this.data.users.length + 1}`;
    const newUser: User = {
      id: nextId,
      username: params.username,
      handle: cleanHandle,
      email: params.email,
      avatar:
        params.avatar ||
        `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&h=200&q=80`,
      role: params.role || 'user',
      bio: params.bio || 'Panta Rooms Forecaster & Market Participant',
      isOnline: true,
      lastActiveTime: new Date().toISOString(),
      roomsCreated: [],
      roomsJoined: [],
      walletAddress: params.walletAddress || `0x${Math.random().toString(16).slice(2, 8)}`,
      reputationScore: 75,
      totalPredictions: 0,
      winRatePercent: 50,
      createdAt: new Date().toISOString()
    };

    this.data.users.push(newUser);

    this.logActivity({
      userId: newUser.id,
      username: newUser.username,
      userHandle: newUser.handle,
      userAvatar: newUser.avatar,
      activityType: 'user_registered',
      details: `New user ${newUser.username} (${newUser.handle}) registered`
    });

    this.persist();
    return newUser;
  }

  public loginUser(userId: string): User | null {
    const user = this.getUserById(userId);
    if (!user) return null;

    user.isOnline = true;
    user.lastActiveTime = new Date().toISOString();

    this.logActivity({
      userId: user.id,
      username: user.username,
      userHandle: user.handle,
      userAvatar: user.avatar,
      activityType: 'user_login',
      details: `${user.username} logged into session`
    });

    this.persist();
    return user;
  }

  public logoutUser(userId: string): User | null {
    const user = this.getUserById(userId);
    if (!user) return null;

    user.isOnline = false;
    user.lastActiveTime = new Date().toISOString();

    this.logActivity({
      userId: user.id,
      username: user.username,
      userHandle: user.handle,
      userAvatar: user.avatar,
      activityType: 'user_logout',
      details: `${user.username} logged out`
    });

    this.persist();
    return user;
  }

  public touchHeartbeat(userId: string): void {
    const user = this.getUserById(userId);
    if (user) {
      user.isOnline = true;
      user.lastActiveTime = new Date().toISOString();
      this.persist();
    }
  }

  public updateUserProfile(
    userId: string,
    updates: Partial<Pick<User, 'username' | 'bio' | 'avatar' | 'walletAddress'>>
  ): User | null {
    const user = this.getUserById(userId);
    if (!user) return null;

    if (updates.username) user.username = updates.username;
    if (updates.bio !== undefined) user.bio = updates.bio;
    if (updates.avatar) user.avatar = updates.avatar;
    if (updates.walletAddress) user.walletAddress = updates.walletAddress;
    user.lastActiveTime = new Date().toISOString();

    this.logActivity({
      userId: user.id,
      username: user.username,
      userHandle: user.handle,
      userAvatar: user.avatar,
      activityType: 'admin_action',
      details: `${user.username} updated their profile settings`
    });

    this.persist();
    return user;
  }

  // ROOM OPERATIONS
  public getRooms(): Room[] {
    return this.data.rooms;
  }

  public getRoomById(id: string): Room | undefined {
    return this.data.rooms.find((r) => r.id === id);
  }

  public createRoom(params: {
    name: string;
    topic: string;
    category: string;
    description: string;
    marketId?: string;
    createdBy: string;
    activeThesis?: string;
    tags?: string[];
    maxParticipants?: number;
  }): Room {
    const creator = this.getUserById(params.createdBy);
    const creatorName = creator ? creator.username : 'Panta Member';
    const creatorAvatar = creator ? creator.avatar : '';
    const creatorHandle = creator ? creator.handle : '@panta';

    const nextId = `room-${Date.now()}`;
    const newRoom: Room = {
      id: nextId,
      name: params.name,
      topic: params.topic,
      category: params.category || 'General',
      description: params.description,
      marketId: params.marketId,
      createdBy: params.createdBy,
      creatorName,
      creatorAvatar,
      activeThesis: params.activeThesis || `${creatorName}: Initial thesis space open.`,
      participants: [params.createdBy],
      participantCount: 1,
      maxParticipants: params.maxParticipants || 80,
      status: 'active',
      isLive: true,
      tags: params.tags || [params.category || 'General'],
      messages: [
        {
          id: `msg-${Date.now()}`,
          roomId: nextId,
          userId: params.createdBy,
          username: creatorName,
          userAvatar: creatorAvatar,
          userHandle: creatorHandle,
          content: params.activeThesis || `Welcome to ${params.name}. Share your probability forecasts and thesis below.`,
          type: 'thesis',
          timestamp: new Date().toISOString()
        }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.data.rooms.unshift(newRoom);

    // Update creator user profile
    if (creator) {
      if (!creator.roomsCreated.includes(nextId)) {
        creator.roomsCreated.push(nextId);
      }
      if (!creator.roomsJoined.includes(nextId)) {
        creator.roomsJoined.push(nextId);
      }
      creator.lastActiveTime = new Date().toISOString();
    }

    this.logActivity({
      userId: params.createdBy,
      username: creatorName,
      userHandle: creatorHandle,
      userAvatar: creatorAvatar,
      activityType: 'room_created',
      details: `Created new prediction room "${newRoom.name}"`,
      roomId: newRoom.id,
      roomName: newRoom.name,
      metadata: { category: newRoom.category }
    });

    this.persist();
    return newRoom;
  }

  public joinRoom(roomId: string, userId: string): { success: boolean; room?: Room; error?: string } {
    const room = this.getRoomById(roomId);
    if (!room) return { success: false, error: 'Room not found' };

    const user = this.getUserById(userId);
    if (!user) return { success: false, error: 'User not found' };

    if (!room.participants.includes(userId)) {
      room.participants.push(userId);
      room.participantCount = Math.max(room.participantCount + 1, room.participants.length);
    }

    if (!user.roomsJoined.includes(roomId)) {
      user.roomsJoined.push(roomId);
    }
    user.lastActiveTime = new Date().toISOString();
    room.updatedAt = new Date().toISOString();

    this.logActivity({
      userId: user.id,
      username: user.username,
      userHandle: user.handle,
      userAvatar: user.avatar,
      activityType: 'room_joined',
      details: `${user.username} joined "${room.name}"`,
      roomId: room.id,
      roomName: room.name
    });

    this.persist();
    return { success: true, room };
  }

  public leaveRoom(roomId: string, userId: string): { success: boolean; room?: Room } {
    const room = this.getRoomById(roomId);
    if (!room) return { success: false };

    const user = this.getUserById(userId);
    room.participants = room.participants.filter((p) => p !== userId);
    room.participantCount = Math.max(0, room.participantCount - 1);
    room.updatedAt = new Date().toISOString();

    if (user) {
      user.roomsJoined = user.roomsJoined.filter((r) => r !== roomId);
      user.lastActiveTime = new Date().toISOString();

      this.logActivity({
        userId: user.id,
        username: user.username,
        userHandle: user.handle,
        userAvatar: user.avatar,
        activityType: 'room_left',
        details: `${user.username} left "${room.name}"`,
        roomId: room.id,
        roomName: room.name
      });
    }

    this.persist();
    return { success: true, room };
  }

  public addRoomMessage(params: {
    roomId: string;
    userId: string;
    content: string;
    type?: 'chat' | 'thesis' | 'system';
    stance?: 'YES' | 'NO' | 'NEUTRAL';
    stakedAmount?: number;
  }): RoomMessage | null {
    const room = this.getRoomById(params.roomId);
    if (!room) return null;

    const user = this.getUserById(params.userId);
    const username = user ? user.username : 'Participant';
    const userAvatar = user ? user.avatar : '';
    const userHandle = user ? user.handle : '@participant';

    const message: RoomMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      roomId: params.roomId,
      userId: params.userId,
      username,
      userAvatar,
      userHandle,
      content: params.content,
      type: params.type || 'chat',
      stance: params.stance,
      stakedAmount: params.stakedAmount,
      timestamp: new Date().toISOString()
    };

    room.messages.push(message);
    if (params.type === 'thesis') {
      room.activeThesis = `${username}: ${params.content.slice(0, 85)}${params.content.length > 85 ? '...' : ''}`;
    }
    room.updatedAt = new Date().toISOString();

    if (user) {
      user.lastActiveTime = new Date().toISOString();
      if (!room.participants.includes(user.id)) {
        room.participants.push(user.id);
      }
      if (!user.roomsJoined.includes(room.id)) {
        user.roomsJoined.push(room.id);
      }
    }

    this.logActivity({
      userId: params.userId,
      username,
      userHandle,
      userAvatar,
      activityType: params.type === 'thesis' ? 'thesis_shared' : 'room_message',
      details: params.type === 'thesis'
        ? `Shared thesis (${params.stance || 'neutral'}) in "${room.name}": "${params.content.slice(0, 60)}..."`
        : `Sent message in "${room.name}": "${params.content.slice(0, 60)}..."`,
      roomId: room.id,
      roomName: room.name,
      metadata: {
        stance: params.stance,
        stakedAmount: params.stakedAmount,
        messageId: message.id
      }
    });

    this.persist();
    return message;
  }

  // ACTIVITY LOG OPERATIONS
  public logActivity(activity: Omit<ActivityLog, 'id' | 'timestamp'>): ActivityLog {
    const newActivity: ActivityLog = {
      ...activity,
      id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      timestamp: new Date().toISOString()
    };

    this.data.activities.unshift(newActivity);

    // Keep log to last 500 items to prevent unbounded file growth
    if (this.data.activities.length > 500) {
      this.data.activities = this.data.activities.slice(0, 500);
    }

    this.persist();
    return newActivity;
  }

  public getActivities(options?: {
    userId?: string;
    roomId?: string;
    type?: string;
    limit?: number;
  }): ActivityLog[] {
    let result = this.data.activities;

    if (options?.userId) {
      result = result.filter((a) => a.userId === options.userId);
    }

    if (options?.roomId) {
      result = result.filter((a) => a.roomId === options.roomId);
    }

    if (options?.type && options.type !== 'all') {
      result = result.filter((a) => a.activityType === options.type);
    }

    if (options?.limit) {
      result = result.slice(0, options.limit);
    }

    return result;
  }

  // ADMIN OPERATIONS
  public getAdminStats() {
    const totalUsers = this.data.users.length;
    const onlineUsers = this.data.users.filter((u) => u.isOnline).length;
    const totalRooms = this.data.rooms.length;
    const liveRooms = this.data.rooms.filter((r) => r.isLive).length;
    const totalActivities = this.data.activities.length;
    const totalMessages = this.data.rooms.reduce(
      (sum, r) => sum + r.messages.length,
      0
    );

    return {
      totalUsers,
      onlineUsers,
      offlineUsers: totalUsers - onlineUsers,
      totalRooms,
      liveRooms,
      totalActivities,
      totalMessages,
      lastPersisted: this.data.lastPersisted
    };
  }
}

// Singleton database instance
export const db = new PantaDatabase();
