/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PredictionMarket } from '../types/market';

export interface AiChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
  lean?: 'YES' | 'NO' | 'NEUTRAL';
  confidence?: 'LOW' | 'MODERATE' | 'HIGH';
  isAnalysisCard?: boolean;
}

export interface MarketContextPayload {
  marketQuestion: string;
  category: string;
  yesProbability: number;
  noProbability: number;
  yesPriceCents: number;
  noPriceCents: number;
  volume: string;
  priceMovement?: string;
  timeRemaining: string;
  marketStatus: string;
  marketDescription?: string;
  resolutionCriteria?: string;
  traders?: number;
  recentActivity?: Array<{
    side: 'YES' | 'NO';
    amount: string;
    shares: number;
    price: number;
    time: string;
  }>;
  userPosition?: {
    side: 'YES' | 'NO';
    amount?: string;
    shares?: number;
  };
}

export function buildMarketContext(
  market: PredictionMarket,
  userPositionSide?: 'YES' | 'NO'
): MarketContextPayload {
  return {
    marketQuestion: market.question,
    category: market.category,
    yesProbability: market.yesProbability,
    noProbability: market.noProbability,
    yesPriceCents: market.yesPriceCents,
    noPriceCents: market.noPriceCents,
    volume: market.volume,
    priceMovement: market.trendingDelta || (market.change24h ? `${market.change24h > 0 ? '+' : ''}${market.change24h}% in 24h` : 'Stable'),
    timeRemaining: market.timeRemaining,
    marketStatus: market.isLive ? 'Live & Trading' : 'Active',
    marketDescription: market.topic || market.question,
    resolutionCriteria: market.resolutionCriteria || market.source || 'Standard market resolution.',
    traders: market.traders,
    recentActivity: (market.recentActivity || []).slice(0, 5).map((t) => ({
      side: t.side,
      amount: t.amount,
      shares: t.shares,
      price: t.price,
      time: t.time
    })),
    userPosition: userPositionSide
      ? {
          side: userPositionSide,
          shares: 50,
          amount: '$50.00'
        }
      : undefined
  };
}

export async function sendAiMarketQuery(
  context: MarketContextPayload,
  history: Array<{ role: 'user' | 'model'; text: string }>
): Promise<{ text: string; lean?: 'YES' | 'NO' | 'NEUTRAL'; confidence?: 'LOW' | 'MODERATE' | 'HIGH' }> {
  try {
    const res = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        marketContext: context,
        messages: history
      })
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `HTTP ${res.status}`);
    }

    return await res.json();
  } catch (err: any) {
    console.warn('AI API call failed, using client fallback:', err);
    // Offline / fallback analysis if server route unavailable
    const isYes = context.yesProbability >= 50;
    const leader = isYes ? 'YES' : 'NO';
    const leadOdds = isYes ? context.yesProbability : context.noProbability;
    return {
      text: `**Market Consensus: ${leader} (${leadOdds}%)**\n\n• **Core Driver:** Order flow reflects strong participant positioning on ${leader} across ${context.volume} in volume.\n• **Key Invalidation:** Sudden catalyst announcements or volume swings before ${context.timeRemaining}.\n• **Bottom Line:** The market favors ${leader}, but outcomes remain probabilistic.`,
      lean: leader,
      confidence: 'MODERATE'
    };
  }
}

export async function sendQuickAnalysis(
  context: MarketContextPayload,
  analysisType: 'summary' | 'bull_case' | 'bear_case' | 'risk' | 'probability'
): Promise<string> {
  try {
    const res = await fetch('/api/ai/quick-analysis', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        marketContext: context,
        analysisType
      })
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const data = await res.json();
    return data.text;
  } catch (err) {
    console.warn('Quick analysis failed, using fallback:', err);
    const leader = (context.yesProbability || 50) >= 50 ? 'YES' : 'NO';
    const leadOdds = leader === 'YES' ? context.yesProbability : context.noProbability;

    if (analysisType === 'bull_case') {
      return `• **Momentum:** Stronger buy conviction backing ${leader} at **${leadOdds}%**.\n• **Catalyst:** Participants anticipate resolution criteria being satisfied before ${context.timeRemaining}.\n• **Requirement:** Sustained volume without negative counter-catalysts.`;
    }
    if (analysisType === 'bear_case') {
      return `• **Asymmetry:** High probability pricing creates skewed downside if surprising counter-evidence emerges.\n• **Time Window:** With ${context.timeRemaining} remaining, unpredictable developments can flip sentiment.\n• **Invalidation Risk:** Any official announcement contradicting expectation.`;
    }
    if (analysisType === 'risk') {
      return `• **Resolution Terms:** Potential ambiguity in how official settlement criteria are interpreted.\n• **Order Liquidity:** With ${context.volume} traded, large orders could trigger sudden price volatility.\n• **Binary Resolution:** Outcome resolves 100% or 0% at expiration.`;
    }
    return `• **Market State:** Priced at **YES ${context.yesProbability}% / NO ${context.noProbability}%** across ${context.volume} volume.\n• **Consensus:** Conviction currently leans **${leader}**, subject to upcoming catalysts before ${context.timeRemaining}.`;
  }
}

export async function critiqueThesis(
  context: MarketContextPayload,
  thesisText: string,
  proposedSide: 'YES' | 'NO'
): Promise<string> {
  try {
    const res = await fetch('/api/ai/analyze-thesis', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        marketContext: context,
        thesisText,
        proposedSide
      })
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const data = await res.json();
    return data.critique;
  } catch (err) {
    return `Your argument emphasizes ${proposedSide} probability momentum. To bolster your thesis before posting, verify the exact resolution conditions and consider what counter-catalysts could challenge your assumption.`;
  }
}
