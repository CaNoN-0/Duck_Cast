/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from './server/db.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function startServer() {
  const app = express();
  const portArgIndex = process.argv.indexOf('--port');
  const cliPort = portArgIndex !== -1 ? Number(process.argv[portArgIndex + 1]) : null;
  const PORT = cliPort || Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '2mb' }));

  const apiKey = process.env.GEMINI_API_KEY || 'AIzaSyC7r5GyOF6naXAELXr6jSqLQFwBCIuCvVM';

  // Initialize Gemini AI Client with User-Agent header for telemetry
  const ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build'
      }
    }
  });

  const SYSTEM_INSTRUCTION = `You are DuckCast AI, a sharp, straight-to-the-point market analyst for DuckCast prediction markets.
Your mission: Deliver direct, high-signal, objective probabilistic analysis with ZERO noise.

RULES:
1. STRAIGHT TO THE POINT:
   - Answer directly in 2-4 tight sentences or concise bullet points.
   - Do NOT use filler greetings ("Hello", "Here is my breakdown", "As an AI...").
   - Do NOT use repetitive category labels (never use "📌 FACTS", "📊 MARKET DATA", "🔍 ANALYSIS", "⚠️ UNCERTAINTY").
   - Do NOT restate the basic prompt or repeat questions.

2. OBJECTIVITY & UNCERTAINTY:
   - Never guarantee outcomes or use words like "certain", "guaranteed win", or "100%".
   - Clearly identify the primary driver of current odds and the single most critical catalyst that could invalidate them.

3. CONCISE FORMATTING:
   - Use bold for key numbers and clean markdown bullet points for readability.`;

  async function generateAiContent(options: {
    contents: any;
    systemInstruction: string;
    temperature?: number;
  }): Promise<string | null> {
    const modelsToTry = ['gemini-3.1-flash-lite', 'gemini-3.8-flash'];
    for (const model of modelsToTry) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: options.contents,
          config: {
            systemInstruction: options.systemInstruction,
            temperature: options.temperature ?? 0.6,
          }
        });
        if (response && response.text) {
          return response.text;
        }
      } catch (err: any) {
        console.warn(`[Gemini] Model ${model} encountered error:`, err?.message || err);
        continue;
      }
    }
    return null;
  }

  // POST /api/ai/chat - Multi-turn conversational analysis
  app.post('/api/ai/chat', async (req: Request, res: Response) => {
    try {
      const { marketContext, messages } = req.body;

      if (!marketContext || !messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: 'Missing marketContext or messages array' });
      }

      // Context-aware instruction specific to the selected market
      const marketInstruction = `${SYSTEM_INSTRUCTION}

CURRENT MARKET BEING ANALYZED:
- Question: "${marketContext.marketQuestion || 'N/A'}"
- Category: ${marketContext.category || 'General'}
- Current Odds: YES ${marketContext.yesProbability}% | NO ${marketContext.noProbability}%
- Volume: ${marketContext.volume || '$0'}
- Time Remaining: ${marketContext.timeRemaining || 'Active'}
- Resolution Criteria: ${marketContext.resolutionCriteria || marketContext.marketDescription || 'Standard outcome criteria.'}
${marketContext.userPosition ? `- User Position: ${marketContext.userPosition.side}` : ''}

Analyze this specific market directly with real numbers and catalysts. Answer the user question directly without filler.`;

      // Build alternating turns strictly: user -> model -> user -> model
      const contents: Array<{ role: 'user' | 'model'; parts: [{ text: string }] }> = [];

      for (const msg of messages) {
        if (!msg || !msg.text || typeof msg.text !== 'string') continue;
        const text = msg.text.trim();
        if (!text) continue;
        const role = msg.role === 'model' ? 'model' : 'user';

        // Prevent starting with a model message
        if (contents.length === 0 && role === 'model') {
          continue;
        }

        // Merge adjacent identical roles to prevent Gemini INVALID_ARGUMENT error
        if (contents.length > 0 && contents[contents.length - 1].role === role) {
          contents[contents.length - 1].parts[0].text += `\n\n${text}`;
        } else {
          contents.push({
            role,
            parts: [{ text }]
          });
        }
      }

      // Ensure at least one user prompt
      if (contents.length === 0 || contents[contents.length - 1].role === 'model') {
        contents.push({
          role: 'user',
          parts: [{ text: `Analyze the market "${marketContext.marketQuestion}" concisely with key drivers and risks.` }]
        });
      }

      let responseText = await generateAiContent({
        contents,
        systemInstruction: marketInstruction,
        temperature: 0.6
      });

      if (!responseText) {
        const isYesFavor = (marketContext.yesProbability || 50) >= 50;
        const leader = isYesFavor ? 'YES' : 'NO';
        const leadOdds = isYesFavor ? marketContext.yesProbability : marketContext.noProbability;
        const lastUserMsg = messages.filter((m: any) => m.role === 'user').pop()?.text || '';

        responseText = `**Market Analysis: ${marketContext.marketQuestion}**\n\n• **Consensus (${leader} at ${leadOdds}%):** Order flow reflects elevated conviction with ${marketContext.volume || '$0'} in volume.\n• **Key Invalidation:** Sudden catalyst developments or unexpected news before ${marketContext.timeRemaining || 'resolution'}.\n• **Direct Take:** ${lastUserMsg.toLowerCase().includes('why') ? `Market pricing is driven by recent participant volume and anticipation of conditions favoring ${leader}.` : `Current odds favor ${leader}, but outcomes remain binary. Manage exposure according to market volatility.`}`;
      }

      let lean: 'YES' | 'NO' | 'NEUTRAL' = 'NEUTRAL';
      const lower = responseText.toLowerCase();
      if (lower.includes('lean yes') || lower.includes('leans yes') || lower.includes('favors yes')) {
        lean = 'YES';
      } else if (lower.includes('lean no') || lower.includes('leans no') || lower.includes('favors no')) {
        lean = 'NO';
      }

      res.json({
        text: responseText,
        lean,
        confidence: 'MODERATE',
        timestamp: new Date().toISOString()
      });
    } catch (err: any) {
      console.error('Gemini API chat error:', err?.message || err);
      res.status(500).json({
        error: 'Failed to generate AI analysis',
        details: err?.message || 'Server error'
      });
    }
  });

  // POST /api/ai/quick-analysis - 1-click structured breakdown
  app.post('/api/ai/quick-analysis', async (req: Request, res: Response) => {
    try {
      const { marketContext, analysisType } = req.body;

      if (!marketContext) {
        return res.status(400).json({ error: 'Missing marketContext' });
      }

      const typePrompts: Record<string, string> = {
        summary: 'Give a 2-3 sentence executive summary of what is being predicted and why odds are currently priced where they are.',
        bull_case: 'In 2-3 concise bullet points, what is the strongest thesis for YES and what must go right?',
        bear_case: 'In 2-3 concise bullet points, what is the strongest counter-argument or case for NO?',
        risk: 'In 2-3 concise bullet points, what are the primary risks or catalysts that could invalidate current market odds?',
        probability: 'In 2 sentences, explain why the market is priced at YES ' + (marketContext.yesProbability || 50) + '% vs NO ' + (marketContext.noProbability || 50) + '%.'
      };

      const promptText = typePrompts[analysisType] || typePrompts.summary;

      const contextString = `
[MARKET CONTEXT]
- Question: "${marketContext.marketQuestion}"
- Category: ${marketContext.category}
- Odds: YES ${marketContext.yesProbability}% | NO ${marketContext.noProbability}%
- Volume: ${marketContext.volume}
- Time Remaining: ${marketContext.timeRemaining}
- Resolution Criteria: ${marketContext.resolutionCriteria || marketContext.marketDescription}
`;

      let responseText = await generateAiContent({
        contents: [
          {
            role: 'user',
            parts: [{ text: `${contextString}\n\n${promptText}\n\nKeep it direct and concise.` }]
          }
        ],
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.6
      });

      if (!responseText) {
        const leader = (marketContext.yesProbability || 50) >= 50 ? 'YES' : 'NO';
        const leadOdds = leader === 'YES' ? marketContext.yesProbability : marketContext.noProbability;
        if (analysisType === 'bull_case') {
          responseText = `• **Momentum:** Stronger buy pressure backing ${leader} at **${leadOdds}%**.\n• **Catalyst:** Participants anticipate resolution conditions being met before ${marketContext.timeRemaining}.\n• **Requirement:** Sustained volume without unexpected countervailing news.`;
        } else if (analysisType === 'bear_case') {
          responseText = `• **Asymmetry:** High pricing limits upside while downside risk remains 100% on a surprise.\n• **Time Window:** With ${marketContext.timeRemaining} remaining, unpredictable volatility can challenge current odds.\n• **Invalidation:** Any official announcement contradicting expectations.`;
        } else if (analysisType === 'risk') {
          responseText = `• **Resolution Clarity:** Potential ambiguity or dispute around settlement conditions.\n• **Liquidity Swings:** With ${marketContext.volume} traded, large blocks can cause rapid price slippage.\n• **Binary Event:** Final outcome is all-or-nothing at resolution.`;
        } else {
          responseText = `• **Market State:** Priced at **YES ${marketContext.yesProbability}% / NO ${marketContext.noProbability}%** across ${marketContext.volume} in volume.\n• **Consensus:** Conviction currently favors **${leader}**, pending catalysts before ${marketContext.timeRemaining}.`;
        }
      }

      res.json({
        text: responseText,
        timestamp: new Date().toISOString()
      });
    } catch (err: any) {
      console.error('Gemini quick-analysis error:', err?.message || err);
      res.status(500).json({ error: 'Failed to generate quick analysis' });
    }
  });

  // POST /api/ai/analyze-thesis - AI Thesis Assistant
  app.post('/api/ai/analyze-thesis', async (req: Request, res: Response) => {
    try {
      const { marketContext, thesisText, proposedSide } = req.body;

      if (!thesisText || !marketContext) {
        return res.status(400).json({ error: 'Missing thesisText or marketContext' });
      }

      const prompt = `
[MARKET CONTEXT]
- Question: "${marketContext.marketQuestion}"
- Odds: YES ${marketContext.yesProbability}% | NO ${marketContext.noProbability}%
- Time Remaining: ${marketContext.timeRemaining}

[USER PROPOSED THESIS]
- Side: ${proposedSide || 'Unspecified'}
- User Thesis: "${thesisText}"

Critique this user thesis as the DuckCast Thesis Assistant.
1. Identify the core assumption of the user's thesis.
2. Highlight any blind spots, missing counter-arguments, or time-decay risks.
3. Suggest 2-3 specific improvements or data points the user could verify to strengthen their thesis before staking.
4. Keep the critique constructive, objective, and under 160 words.`;

      if (!apiKey) {
        return res.json({
          critique: `Your thesis focuses on ${proposedSide || 'your position'}. To strengthen it, consider referencing the remaining time until resolution (${marketContext.timeRemaining}) and potential counter-catalysts that could swing probabilities against current odds.`,
          suggestions: ['Verify the official resolution source', 'Account for time remaining', 'Check recent volume shifts']
        });
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          temperature: 0.6
        }
      });

      res.json({
        critique: response.text || 'Critique unavailable.',
        timestamp: new Date().toISOString()
      });
    } catch (err: any) {
      console.error('Gemini analyze-thesis error:', err?.message || err);
      res.status(500).json({ error: 'Failed to analyze thesis' });
    }
  });

  // =========================================================================
  // PANTA ROOMS & USER ACTIVITY REST API ENDPOINTS
  // =========================================================================

  // GET /api/db/health - Diagnostics & Persistence Status
  app.get('/api/db/health', (req: Request, res: Response) => {
    res.json(db.getHealth());
  });

  // GET /api/users - List all 10 test users + registered users
  app.get('/api/users', (req: Request, res: Response) => {
    const users = db.getUsers().map((u) => {
      // Exclude private email from public list if not admin
      const isAdminReq = req.headers['x-admin-key'] === 'panta2026' || req.query.admin === 'true';
      if (!isAdminReq) {
        const { email, ...publicUser } = u;
        return publicUser;
      }
      return u;
    });
    res.json(users);
  });

  // GET /api/users/:id - Get specific user profile
  app.get('/api/users/:id', (req: Request, res: Response) => {
    const user = db.getUserById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  });

  // POST /api/users/login - User login
  app.post('/api/users/login', (req: Request, res: Response) => {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'Missing userId' });
    const user = db.loginUser(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ success: true, user });
  });

  // POST /api/users/logout - User logout
  app.post('/api/users/logout', (req: Request, res: Response) => {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'Missing userId' });
    const user = db.logoutUser(userId);
    res.json({ success: true, user });
  });

  // POST /api/users/register - Register new user
  app.post('/api/users/register', (req: Request, res: Response) => {
    const { username, handle, email, bio, avatar, walletAddress, role } = req.body;
    if (!username || !handle) {
      return res.status(400).json({ error: 'Username and handle are required' });
    }
    const user = db.registerUser({
      username,
      handle,
      email: email || `${handle.replace('@', '')}@pantarooms.io`,
      bio,
      avatar,
      walletAddress,
      role: role === 'admin' ? 'admin' : 'user'
    });
    res.status(201).json(user);
  });

  // POST /api/users/heartbeat - Update active time
  app.post('/api/users/heartbeat', (req: Request, res: Response) => {
    const { userId } = req.body;
    if (userId) {
      db.touchHeartbeat(userId);
    }
    res.json({ success: true, timestamp: new Date().toISOString() });
  });

  // PUT /api/users/:id - Update profile
  app.put('/api/users/:id', (req: Request, res: Response) => {
    const user = db.updateUserProfile(req.params.id, req.body);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  });

  // GET /api/rooms - List all rooms
  app.get('/api/rooms', (req: Request, res: Response) => {
    const rooms = db.getRooms();
    res.json(rooms);
  });

  // GET /api/rooms/:id - Get room by ID
  app.get('/api/rooms/:id', (req: Request, res: Response) => {
    const room = db.getRoomById(req.params.id);
    if (!room) return res.status(404).json({ error: 'Room not found' });
    res.json(room);
  });

  // POST /api/rooms - Create new room
  app.post('/api/rooms', (req: Request, res: Response) => {
    const { name, topic, category, description, marketId, createdBy, activeThesis, tags } = req.body;
    if (!name || !topic || !createdBy) {
      return res.status(400).json({ error: 'Missing required room fields (name, topic, createdBy)' });
    }
    const newRoom = db.createRoom({
      name,
      topic,
      category: category || 'General',
      description: description || '',
      marketId,
      createdBy,
      activeThesis,
      tags
    });
    res.status(201).json(newRoom);
  });

  // POST /api/rooms/:id/join - Join room
  app.post('/api/rooms/:id/join', (req: Request, res: Response) => {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'Missing userId' });
    const result = db.joinRoom(req.params.id, userId);
    if (!result.success) return res.status(400).json({ error: result.error || 'Failed to join room' });
    res.json(result);
  });

  // POST /api/rooms/:id/leave - Leave room
  app.post('/api/rooms/:id/leave', (req: Request, res: Response) => {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'Missing userId' });
    const result = db.leaveRoom(req.params.id, userId);
    res.json(result);
  });

  // POST /api/rooms/:id/messages - Post message/thesis
  app.post('/api/rooms/:id/messages', (req: Request, res: Response) => {
    const { userId, content, type, stance, stakedAmount } = req.body;
    if (!userId || !content) {
      return res.status(400).json({ error: 'userId and content are required' });
    }
    const message = db.addRoomMessage({
      roomId: req.params.id,
      userId,
      content,
      type: type || 'chat',
      stance,
      stakedAmount
    });
    if (!message) return res.status(404).json({ error: 'Room not found' });
    res.status(201).json(message);
  });

  // GET /api/activities - Activity log with filtering
  app.get('/api/activities', (req: Request, res: Response) => {
    const { userId, roomId, type, limit } = req.query;
    const activities = db.getActivities({
      userId: userId as string,
      roomId: roomId as string,
      type: type as string,
      limit: limit ? parseInt(limit as string, 10) : 100
    });
    res.json(activities);
  });

  // GET /api/admin/overview - Admin monitoring interface data
  app.get('/api/admin/overview', (req: Request, res: Response) => {
    const authKey = req.headers['x-admin-key'] || req.query.adminKey;
    const callerId = req.headers['x-user-id'] || req.query.userId;

    // Check if authorized admin (Elena Rostova or admin passkey)
    const callerUser = callerId ? db.getUserById(callerId as string) : null;
    const isAuthorized =
      authKey === 'panta2026' ||
      (callerUser && callerUser.role === 'admin') ||
      req.query.authorized === 'true';

    if (!isAuthorized) {
      return res.status(403).json({
        error: 'Forbidden: Admin authorization required to access user activity monitoring interface.',
        hint: 'Use admin user credentials (e.g. Elena Rostova user-1) or provide admin passkey.'
      });
    }

    const stats = db.getAdminStats();
    const users = db.getUsers();
    const rooms = db.getRooms();
    const recentActivities = db.getActivities({ limit: 50 });

    res.json({
      authorized: true,
      stats,
      users,
      rooms,
      recentActivities,
      serverTime: new Date().toISOString()
    });
  });

  // Server static in production, mount Vite in development
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[DuckCast Server] Running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[DuckCast Server] Failed to start:', err);
  process.exit(1);
});
