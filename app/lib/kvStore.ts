import { kv } from '@vercel/kv';
import { HandPerformance, SessionPerformance } from '../types';
import { v4 as uuidv4 } from 'uuid';

// Generate UUID using uuid package for wider compatibility
const generateId = (): string => {
  return uuidv4();
};

// Simple in-memory cache
interface CacheEntry<T> {
  value: T;
  timestamp: number;
}

class MemoryCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private ttl: number = 60 * 1000; // Default TTL: 60 seconds
  
  constructor(ttlMs?: number) {
    if (ttlMs) {
      this.ttl = ttlMs;
    }
  }
  
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) return null;
    
    // Check if entry has expired
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.value;
  }
  
  set<T>(key: string, value: T): void {
    this.cache.set(key, {
      value,
      timestamp: Date.now()
    });
  }
  
  delete(key: string): void {
    this.cache.delete(key);
  }
  
  invalidateUserData(userId: string): void {
    // Delete all cache entries related to this user
    Array.from(this.cache.keys()).forEach(key => {
      if (key.includes(userId)) {
        this.cache.delete(key);
      }
    });
  }
}

// Initialize cache with 5-minute TTL
const cache = new MemoryCache(5 * 60 * 1000);

// User data
export async function getUserBalance(userId: string): Promise<number> {
  const cacheKey = `user:${userId}:balance`;
  
  // Try to get from cache first
  const cachedBalance = cache.get<number>(cacheKey);
  if (cachedBalance !== null) {
    return cachedBalance;
  }
  
  try {
    const balance = await kv.get<number>(`user:${userId}:balance`);
    if (balance !== null) {
      // Store in cache
      cache.set(cacheKey, balance);
      return balance;
    }
    
    // If user doesn't exist, create a new user with default balance
    const defaultBalance = 10000; // $10,000 starting balance
    await kv.set(`user:${userId}:balance`, defaultBalance);
    
    // Store in cache
    cache.set(cacheKey, defaultBalance);
    return defaultBalance;
  } catch (error) {
    console.error('Error getting user balance:', error);
    return 10000; // Default balance if there's an error
  }
}

export async function updateUserBalance(userId: string, newBalance: number): Promise<boolean> {
  try {
    await kv.set(`user:${userId}:balance`, newBalance);
    
    // Update cache
    cache.set(`user:${userId}:balance`, newBalance);
    
    return true;
  } catch (error) {
    console.error('Error updating user balance:', error);
    return false;
  }
}

// Session management
export async function createSession(userId: string): Promise<string> {
  try {
    const sessionId = generateId();
    const timestamp = new Date().toISOString();
    const balance = await getUserBalance(userId);
    
    const session = {
      id: sessionId,
      userId,
      startTime: timestamp,
      initialBalance: balance,
      finalBalance: balance,
      handsPlayed: 0,
      handsWon: 0
    };
    
    await kv.set(`session:${sessionId}`, session);
    await kv.sadd(`user:${userId}:sessions`, sessionId);
    
    // Cache the session data
    cache.set(`session:${sessionId}`, session);
    
    return sessionId;
  } catch (error) {
    console.error('Error creating session:', error);
    return '';
  }
}

export async function updateSession(
  sessionId: string,
  finalBalance: number,
  handsPlayed: number,
  handsWon: number
): Promise<boolean> {
  try {
    // Try to get from cache first, otherwise fetch from KV
    let session = cache.get<any>(`session:${sessionId}`);
    if (!session) {
      session = await kv.get(`session:${sessionId}`);
    }
    
    if (!session) return false;
    
    const updatedSession = {
      ...session,
      endTime: new Date().toISOString(),
      finalBalance,
      handsPlayed,
      handsWon
    };
    
    await kv.set(`session:${sessionId}`, updatedSession);
    
    // Update cache
    cache.set(`session:${sessionId}`, updatedSession);
    
    return true;
  } catch (error) {
    console.error('Error updating session:', error);
    return false;
  }
}

// Hand performance tracking
export async function recordHand(
  sessionId: string,
  userId: string,
  handPerformance: HandPerformance
): Promise<boolean> {
  try {
    await kv.set(`hand:${handPerformance.handId}`, handPerformance);
    await kv.sadd(`session:${sessionId}:hands`, handPerformance.handId);
    
    // Cache the hand performance
    cache.set(`hand:${handPerformance.handId}`, handPerformance);
    
    // Invalidate session hands cache since we've added a hand
    cache.delete(`session:${sessionId}:hands`);
    
    return true;
  } catch (error) {
    console.error('Error recording hand:', error);
    return false;
  }
}

export async function getSessionHands(sessionId: string): Promise<HandPerformance[]> {
  // Try to get from cache first
  const cachedHands = cache.get<HandPerformance[]>(`session:${sessionId}:hands:full`);
  if (cachedHands !== null) {
    return cachedHands;
  }
  
  try {
    const handIds = await kv.smembers<string>(`session:${sessionId}:hands`);
    if (!handIds || handIds.length === 0) return [];
    
    const hands: HandPerformance[] = [];
    for (const handId of handIds) {
      // Check cache for each hand
      let hand = cache.get<HandPerformance>(`hand:${handId}`);
      
      // If not in cache, get from KV
      if (!hand) {
        hand = await kv.get<HandPerformance>(`hand:${handId}`);
        if (hand) {
          // Cache for future use
          cache.set(`hand:${handId}`, hand);
        }
      }
      
      if (hand) hands.push(hand);
    }
    
    const sortedHands = hands.sort((a, b) => 
      new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );
    
    // Cache the complete hands array
    cache.set(`session:${sessionId}:hands:full`, sortedHands);
    
    return sortedHands;
  } catch (error) {
    console.error('Error getting session hands:', error);
    return [];
  }
}

// Session statistics
export async function getSessionStats(sessionId: string): Promise<SessionPerformance | null> {
  // Try to get from cache first
  const cachedStats = cache.get<SessionPerformance>(`session:${sessionId}:stats`);
  if (cachedStats !== null) {
    return cachedStats;
  }
  
  try {
    // Try to get session from cache first
    let session = cache.get<any>(`session:${sessionId}`);
    if (!session) {
      session = await kv.get<any>(`session:${sessionId}`);
      if (session) {
        cache.set(`session:${sessionId}`, session);
      }
    }
    
    if (!session) return null;
    
    const hands = await getSessionHands(sessionId);
    
    // Calculate statistics
    const showdownPercentage = calculateShowdownPercentage(hands);
    const vpipPercentage = calculateVPIPPercentage(hands);
    const pfr = calculatePFR(hands);
    
    // Find biggest pot and biggest win/loss
    let biggestPot = 0;
    let biggestWin = 0;
    let biggestLoss = 0;
    
    hands.forEach(hand => {
      if (hand.wasWinner && hand.profit > biggestWin) {
        biggestWin = hand.profit;
      } else if (!hand.wasWinner && hand.profit < biggestLoss) {
        biggestLoss = hand.profit;
      }
      
      // For simplicity, we're using profit as pot size for winning hands
      if (hand.wasWinner && hand.profit > biggestPot) {
        biggestPot = hand.profit;
      }
    });
    
    const stats = {
      sessionId: session.id,
      startTime: new Date(session.startTime),
      endTime: session.endTime ? new Date(session.endTime) : new Date(),
      initialBalance: session.initialBalance,
      finalBalance: session.finalBalance,
      profit: session.finalBalance - session.initialBalance,
      handsPlayed: session.handsPlayed,
      handsWon: session.handsWon,
      biggestPot,
      biggestWin,
      biggestLoss: Math.abs(biggestLoss),
      showdownPercentage,
      vpipPercentage,
      pfr,
      handPerformances: hands
    };
    
    // Cache the stats
    cache.set(`session:${sessionId}:stats`, stats);
    
    return stats;
  } catch (error) {
    console.error('Error getting session stats:', error);
    return null;
  }
}

// Helper functions for statistics
const calculateShowdownPercentage = (handPerformances: HandPerformance[]): number => {
  if (handPerformances.length === 0) return 0;
  
  const showdownHands = handPerformances.filter(hand => hand.finalHandRank !== undefined);
  return (showdownHands.length / handPerformances.length) * 100;
};

const calculateVPIPPercentage = (handPerformances: HandPerformance[]): number => {
  if (handPerformances.length === 0) return 0;
  
  // VPIP = Voluntarily Put Money In Pot (not counting blinds)
  const vpipHands = handPerformances.filter(hand => {
    const hasVoluntaryAction = hand.actions.some(action => 
      action.type === 'call' || action.type === 'bet' || action.type === 'raise'
    );
    return hasVoluntaryAction;
  });
  
  return (vpipHands.length / handPerformances.length) * 100;
};

const calculatePFR = (handPerformances: HandPerformance[]): number => {
  if (handPerformances.length === 0) return 0;
  
  // PFR = Preflop Raise percentage
  const pfrHands = handPerformances.filter(hand => {
    // Look for raise actions in the first few actions (preflop)
    const hasRaiseAction = hand.actions.slice(0, 10).some(action => 
      action.type === 'raise'
    );
    return hasRaiseAction;
  });
  
  return (pfrHands.length / handPerformances.length) * 100;
}; 