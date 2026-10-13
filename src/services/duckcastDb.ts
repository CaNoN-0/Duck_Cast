import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from './firebase';

export interface DuckcastDbUser {
  id: string;
  username: string;
  displayName: string;
  bio: string;
  walletAddress: string;
  avatar: string;
  balance: number;
  accuracy: number;
  totalPredictions: number;
  totalVolume: number;
  rank: number;
  status: 'active' | 'pro' | 'oracle';
  createdAt?: string;
  updatedAt?: string;
}

export interface DbTrade {
  id: string;
  marketId: string;
  userId: string;
  username: string;
  side: 'YES' | 'NO';
  amount: number;
  shares: number;
  priceCents: number;
  timestamp: string;
}

// Exactly 15 Initial Forecasters with unique profiles
export const INITIAL_15_USERS: DuckcastDbUser[] = [
  {
    id: 'user-01',
    username: 'alex_quant',
    displayName: 'Alex Chen',
    bio: 'Statistical arbitrage & automated probability modeling.',
    walletAddress: '8x4QJ29a1Mkd091zL88Kpa921vL',
    avatar: '📊',
    balance: 42500,
    accuracy: 84.5,
    totalPredictions: 284,
    totalVolume: 342000,
    rank: 1,
    status: 'oracle'
  },
  {
    id: 'user-02',
    username: 'elena_forecaster',
    displayName: 'Elena Rostova',
    bio: 'Geopolitical risk & central bank policy analysis.',
    walletAddress: '5y1L09mKa28vL88QJ91zMkd8x4Q',
    avatar: '🌐',
    balance: 38200,
    accuracy: 82.1,
    totalPredictions: 215,
    totalVolume: 295000,
    rank: 2,
    status: 'pro'
  },
  {
    id: 'user-03',
    username: 'marcus_macro',
    displayName: 'Marcus Vance',
    bio: 'Macro liquidity cycles and sovereign debt spreads.',
    walletAddress: '3zMkd8x4Q5y1L09mKa28vL88QJ9',
    avatar: '📈',
    balance: 29400,
    accuracy: 79.4,
    totalPredictions: 194,
    totalVolume: 220000,
    rank: 3,
    status: 'pro'
  },
  {
    id: 'user-04',
    username: 'clara_trades',
    displayName: 'Clara Lin',
    bio: 'High-frequency momentum & crypto market breakouts.',
    walletAddress: '7vL88QJ91zMkd8x4Q5y1L09mKa28',
    avatar: '⚡',
    balance: 27800,
    accuracy: 78.2,
    totalPredictions: 312,
    totalVolume: 210000,
    rank: 4,
    status: 'active'
  },
  {
    id: 'user-05',
    username: 'solana_whale_8',
    displayName: 'Dmitri K.',
    bio: 'Deep liquidity provider and DeFi derivatives staking.',
    walletAddress: '9a28vL88QJ91zMkd8x4Q5y1L09m',
    avatar: '🐋',
    balance: 50000,
    accuracy: 76.8,
    totalPredictions: 140,
    totalVolume: 490000,
    rank: 5,
    status: 'oracle'
  },
  {
    id: 'user-06',
    username: 'risk_neutral',
    displayName: 'Sarah Jenkins',
    bio: 'Delta-neutral volatility trading & multi-outcome hedging.',
    walletAddress: '4Q5y1L09mKa28vL88QJ91zMkd8x',
    avatar: '⚖️',
    balance: 22100,
    accuracy: 75.9,
    totalPredictions: 178,
    totalVolume: 185000,
    rank: 6,
    status: 'active'
  },
  {
    id: 'user-07',
    username: 'alpha_duck',
    displayName: 'DuckCast Sentinel',
    bio: 'Platform native market maker & consensus validator.',
    walletAddress: '2vL88QJ91zMkd8x4Q5y1L09mKa28',
    avatar: '🦆',
    balance: 35000,
    accuracy: 75.0,
    totalPredictions: 240,
    totalVolume: 260000,
    rank: 7,
    status: 'oracle'
  },
  {
    id: 'user-08',
    username: 'duck_oracle',
    displayName: 'Bayesian Node',
    bio: 'Crowd wisdom aggregation & real-time probability calibration.',
    walletAddress: '6QJ91zMkd8x4Q5y1L09mKa28vL88',
    avatar: '🔮',
    balance: 31000,
    accuracy: 74.5,
    totalPredictions: 220,
    totalVolume: 240000,
    rank: 8,
    status: 'oracle'
  },
  {
    id: 'user-09',
    username: 'satoshi_prophet',
    displayName: 'Liam O’Connor',
    bio: 'Halving cycles, hash-rate dynamics & ETF flow tracking.',
    walletAddress: '1zMkd8x4Q5y1L09mKa28vL88QJ9',
    avatar: '₿',
    balance: 24500,
    accuracy: 73.8,
    totalPredictions: 165,
    totalVolume: 175000,
    rank: 9,
    status: 'active'
  },
  {
    id: 'user-10',
    username: 'elena_v',
    displayName: 'Elena Vasquez',
    bio: 'Frontier AI benchmarks & silicon supply chain intelligence.',
    walletAddress: '88QJ91zMkd8x4Q5y1L09mKa28vL',
    avatar: '🤖',
    balance: 21300,
    accuracy: 72.9,
    totalPredictions: 142,
    totalVolume: 160000,
    rank: 10,
    status: 'active'
  },
  {
    id: 'user-11',
    username: 'kai_nordic',
    displayName: 'Kai Lindqvist',
    bio: 'Renewable energy markets & European carbon credit spreads.',
    walletAddress: '09mKa28vL88QJ91zMkd8x4Q5y1L',
    avatar: '🌲',
    balance: 19800,
    accuracy: 71.4,
    totalPredictions: 128,
    totalVolume: 145000,
    rank: 11,
    status: 'active'
  },
  {
    id: 'user-12',
    username: 'maya_stats',
    displayName: 'Maya Patel',
    bio: 'Monte Carlo simulations for election & polling models.',
    walletAddress: '5y1L09mKa28vL88QJ91zMkd8x4Q',
    avatar: '🎯',
    balance: 18400,
    accuracy: 70.8,
    totalPredictions: 116,
    totalVolume: 130000,
    rank: 12,
    status: 'active'
  },
  {
    id: 'user-13',
    username: 'zane_contrarian',
    displayName: 'Zane Morales',
    bio: 'Fading sentiment bubbles & betting against extreme consensus.',
    walletAddress: '8x4Q5y1L09mKa28vL88QJ91zMkd',
    avatar: '🎲',
    balance: 16900,
    accuracy: 69.5,
    totalPredictions: 154,
    totalVolume: 120000,
    rank: 13,
    status: 'active'
  },
  {
    id: 'user-14',
    username: 'tariq_arbitrage',
    displayName: 'Tariq Al-Mansoor',
    bio: 'Cross-exchange odds discrepancies & event contracts.',
    walletAddress: 'Ka28vL88QJ91zMkd8x4Q5y1L09m',
    avatar: '💎',
    balance: 15200,
    accuracy: 68.9,
    totalPredictions: 98,
    totalVolume: 115000,
    rank: 14,
    status: 'active'
  },
  {
    id: 'user-15',
    username: 'chloe_alpha',
    displayName: 'Chloe Dupont',
    bio: 'Consumer product adoption, streaming box office & culture.',
    walletAddress: 'Mkd8x4Q5y1L09mKa28vL88QJ91z',
    avatar: '✨',
    balance: 14100,
    accuracy: 67.4,
    totalPredictions: 89,
    totalVolume: 98000,
    rank: 15,
    status: 'active'
  }
];

class DuckcastDbService {
  private usersCache: DuckcastDbUser[] = INITIAL_15_USERS;
  private initialized = false;

  /**
   * Initializes and ensures the 15 users exist in Firestore.
   */
  async seedOrGet15Users(): Promise<DuckcastDbUser[]> {
    if (this.initialized) return this.usersCache;

    try {
      const usersCol = collection(db, 'users');
      const snapshot = await getDocs(usersCol);

      if (snapshot.empty || snapshot.size < 15) {
        // Seed the 15 users to Firestore
        const promises = INITIAL_15_USERS.map((user) => {
          const userRef = doc(db, 'users', user.id);
          return setDoc(userRef, {
            ...user,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }, { merge: true });
        });
        await Promise.all(promises);
        this.usersCache = INITIAL_15_USERS;
      } else {
        const loaded: DuckcastDbUser[] = [];
        snapshot.forEach((d) => {
          loaded.push(d.data() as DuckcastDbUser);
        });
        loaded.sort((a, b) => a.rank - b.rank);
        this.usersCache = loaded;
      }

      this.initialized = true;
      return this.usersCache;
    } catch (err) {
      console.warn('Fallback to local 15 users while initializing Firestore:', err);
      this.initialized = true;
      return INITIAL_15_USERS;
    }
  }

  /**
   * Real-time subscription to the 15 users collection.
   */
  subscribeUsers(onUpdate: (users: DuckcastDbUser[]) => void) {
    try {
      const usersCol = collection(db, 'users');
      return onSnapshot(usersCol, (snapshot) => {
        if (!snapshot.empty) {
          const users: DuckcastDbUser[] = [];
          snapshot.forEach((d) => {
            users.push(d.data() as DuckcastDbUser);
          });
          users.sort((a, b) => a.rank - b.rank);
          this.usersCache = users;
          onUpdate(users);
        }
      }, (err) => {
        console.warn('Firestore snapshot subscription warning:', err);
      });
    } catch (err) {
      console.warn('Subscription error:', err);
      return () => {};
    }
  }

  /**
   * Updates an individual user profile document.
   */
  async updateUser(userId: string, data: Partial<DuckcastDbUser>): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        ...data,
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      console.warn('Error updating user in Firestore:', err);
    }
  }

  /**
   * Record a trade execution by any of the 15 users.
   */
  async recordTrade(trade: DbTrade): Promise<void> {
    try {
      const tradeRef = doc(db, 'trades', trade.id);
      await setDoc(tradeRef, trade);

      // Increment predictions and volume for the user in Firestore
      const user = this.usersCache.find((u) => u.id === trade.userId);
      if (user) {
        const newPredictions = user.totalPredictions + 1;
        const newVolume = user.totalVolume + trade.amount;
        const newBalance = Math.max(0, user.balance - trade.amount);
        await this.updateUser(user.id, {
          totalPredictions: newPredictions,
          totalVolume: newVolume,
          balance: newBalance
        });
      }
    } catch (err) {
      console.warn('Error recording trade in Firestore:', err);
    }
  }
}

export const duckcastDb = new DuckcastDbService();
