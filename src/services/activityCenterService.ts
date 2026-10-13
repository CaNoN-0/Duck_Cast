import { PredictionMarket } from '../types/market';

export interface MarketActivityItem {
  id: string;
  marketId: string;
  marketQuestion: string;
  username: string;
  avatarSeed: string;
  type: 'buy_yes' | 'buy_no' | 'thesis_backed' | 'liquidity_add' | 'take_profit';
  side: 'YES' | 'NO' | 'NEUTRAL';
  amount: string;
  shares: number;
  priceCents: number;
  timeAgo: string;
  timestampMs: number;
  note?: string;
}

// Fluent, realistic usernames simulating an active prediction community
export const FLUENT_USERNAMES = [
  'alex_quant',
  'elena_forecaster',
  'marcus_macro',
  'clara_trades',
  'devin_signals',
  'sophia_sol',
  'liam_hedge',
  'maya_capital',
  'julian_research',
  'olivia_flow',
  'ethan_oracle',
  'chloe_alpha',
  'noah_prob',
  'ava_metrics',
  'lucas_delta',
  'isabella_nexus',
  'gabriel_trades',
  'hannah_ventures',
  'samuel_predict',
  'zoe_analytics',
  'aiden_crypto',
  'mia_sentiment',
  'caleb_odds',
  'emily_forecast',
  'leo_parimutuel',
  'nadia_macro',
  'felix_arb',
  'valeria_flow',
  'dante_alpha',
  'serena_quant',
  'victor_thesis',
  'kai_derivatives'
];

// Market-specific note templates by category
const CATEGORY_ACTIVITY_NOTES: Record<string, string[]> = {
  Crypto: [
    'Order filled following spot ETF net inflow report',
    'Adding to position after 4H volume confirmation',
    'Hedging downside risk ahead of weekly options expiry',
    'Sizing up YES on institutional desk quote imbalance',
    'Staked thesis: On-chain active addresses up 18% DoD',
    'Limit order absorbed at key liquidity level',
    'Taking partial profit into the momentum rally'
  ],
  Politics: [
    'Position backed by fresh state-level polling crossover',
    'Order placed following debate performance metrics',
    'Hedging position before committee vote resolution',
    'Taking contrarian NO on excessive media consensus',
    'Staked thesis: Registration trend favors turnaround',
    'Liquidity added to election market spread'
  ],
  Sports: [
    'Live in-play bet following key momentum shift in half',
    'Backed YES on projected xG differential and tempo',
    'Counter-trading the line movement before final whistle',
    'Position sized on confirmed starting lineup release',
    'Taking NO based on tactical defensive substitution'
  ],
  Technology: [
    'Position opened on third-party benchmark leaks',
    'Backed YES following earnings commentary on compute',
    'Adding liquidity for upcoming developer conference',
    'Thesis backed: Enterprise token throughput growing 3x',
    'Taking NO on regulatory scrutiny friction'
  ],
  Business: [
    'Backed YES on quarterly revenue revision beat',
    'Order filled on central bank rate probability shifts',
    'Hedging exposure to supply chain constraint rumors',
    'Staked thesis: Margin expansion across core units'
  ],
  General: [
    'Order filled on breaking public verification catalyst',
    'Backed thesis based on primary source documentation',
    'Position opened into elevated order-book depth',
    'Taking contrarian NO on crowd over-optimism'
  ]
};

// Simple pseudo-random hash based on market id
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/**
 * Generates an initial varied list of realistic activities for a specific market.
 * Uses the market ID and properties to ensure each prediction tab has distinct activities.
 */
export function getInitialActivitiesForMarket(market: PredictionMarket): MarketActivityItem[] {
  const seed = hashString(market.id || 'default');
  const count = 6 + (seed % 5); // 6 to 10 activities per market
  const categoryNotes = CATEGORY_ACTIVITY_NOTES[market.category] || CATEGORY_ACTIVITY_NOTES.General;

  const activities: MarketActivityItem[] = [];
  const baseTimeMinutes = [1, 2, 4, 7, 12, 19, 28, 45, 60, 90];

  for (let i = 0; i < count; i++) {
    const userIndex = (seed + i * 7) % FLUENT_USERNAMES.length;
    const username = FLUENT_USERNAMES[userIndex];
    const isYes = ((seed + i * 3) % 100) < (market.yesProbability || 50);

    const typeRoll = (seed + i * 5) % 10;
    let type: MarketActivityItem['type'] = 'buy_yes';
    let side: MarketActivityItem['side'] = 'YES';

    if (typeRoll <= 4) {
      type = isYes ? 'buy_yes' : 'buy_no';
      side = isYes ? 'YES' : 'NO';
    } else if (typeRoll <= 6) {
      type = 'thesis_backed';
      side = isYes ? 'YES' : 'NO';
    } else if (typeRoll === 7) {
      type = 'liquidity_add';
      side = 'NEUTRAL';
    } else if (typeRoll === 8) {
      type = 'take_profit';
      side = isYes ? 'YES' : 'NO';
    } else {
      type = 'take_profit';
      side = isYes ? 'YES' : 'NO';
    }

    const rawAmounts = [65, 120, 250, 480, 850, 1200, 2400, 3600, 5000];
    const amountVal = rawAmounts[(seed + i * 2) % rawAmounts.length];
    const amountStr = `$${amountVal.toLocaleString()}`;

    const priceCents = side === 'YES' ? market.yesProbability : market.noProbability;
    const shares = Math.floor((amountVal / Math.max(priceCents, 5)) * 100);

    const note = categoryNotes[(seed + i) % categoryNotes.length];
    const timeMinutes = baseTimeMinutes[i % baseTimeMinutes.length] + Math.floor(i * 1.5);
    const timeAgo = timeMinutes === 1 ? '1m ago' : `${timeMinutes}m ago`;

    activities.push({
      id: `act-${market.id}-${i}-${seed}`,
      marketId: market.id,
      marketQuestion: market.question,
      username,
      avatarSeed: username,
      type,
      side,
      amount: amountStr,
      shares,
      priceCents,
      timeAgo,
      timestampMs: Date.now() - timeMinutes * 60 * 1000,
      note
    });
  }

  return activities;
}

/**
 * Creates a brand-new live streaming activity event for the market.
 */
export function generateNextLiveActivity(market: PredictionMarket): MarketActivityItem {
  const randIndex = Math.floor(Math.random() * FLUENT_USERNAMES.length);
  const username = FLUENT_USERNAMES[randIndex];
  const isYes = Math.random() * 100 < (market.yesProbability || 50);

  const roll = Math.random();
  let type: MarketActivityItem['type'] = 'buy_yes';
  let side: MarketActivityItem['side'] = 'YES';

  if (roll < 0.5) {
    type = isYes ? 'buy_yes' : 'buy_no';
    side = isYes ? 'YES' : 'NO';
  } else if (roll < 0.75) {
    type = 'thesis_backed';
    side = isYes ? 'YES' : 'NO';
  } else if (roll < 0.88) {
    type = 'liquidity_add';
    side = 'NEUTRAL';
  } else {
    type = 'take_profit';
    side = isYes ? 'YES' : 'NO';
  }

  const rawAmounts = [80, 150, 320, 540, 920, 1500, 2800, 4200];
  const amountVal = rawAmounts[Math.floor(Math.random() * rawAmounts.length)];
  const amountStr = `$${amountVal.toLocaleString()}`;

  const priceCents = side === 'YES' ? market.yesProbability : market.noProbability;
  const shares = Math.floor((amountVal / Math.max(priceCents, 5)) * 100);

  const categoryNotes = CATEGORY_ACTIVITY_NOTES[market.category] || CATEGORY_ACTIVITY_NOTES.General;
  const note = categoryNotes[Math.floor(Math.random() * categoryNotes.length)];

  return {
    id: `live-act-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    marketId: market.id,
    marketQuestion: market.question,
    username,
    avatarSeed: username,
    type,
    side,
    amount: amountStr,
    shares,
    priceCents,
    timeAgo: 'Just now',
    timestampMs: Date.now(),
    note
  };
}
