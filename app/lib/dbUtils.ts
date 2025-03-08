import { sql } from '@vercel/postgres';
import { v4 as uuidv4 } from 'uuid';
import { 
  HandPerformance, 
  SessionPerformance, 
  Player,
  ActionType,
  Action,
  Advice,
  AdviceType,
  HandRank
} from '../types';

// User data
export const getUserBalance = async (userId: string): Promise<number> => {
  try {
    const { rows } = await sql`
      SELECT balance FROM users 
      WHERE id = ${userId}
    `;
    
    if (rows.length > 0) {
      return rows[0].balance;
    }
    
    // If user doesn't exist, create a new user with default balance
    const defaultBalance = 10000; // $10,000 starting balance
    await createUser(userId, defaultBalance);
    return defaultBalance;
  } catch (error) {
    console.error('Error getting user balance:', error);
    return 10000; // Default balance if there's an error
  }
};

export const updateUserBalance = async (userId: string, newBalance: number): Promise<boolean> => {
  try {
    await sql`
      UPDATE users 
      SET balance = ${newBalance} 
      WHERE id = ${userId}
    `;
    return true;
  } catch (error) {
    console.error('Error updating user balance:', error);
    return false;
  }
};

const createUser = async (userId: string, initialBalance: number): Promise<boolean> => {
  try {
    await sql`
      INSERT INTO users (id, balance, created_at) 
      VALUES (${userId}, ${initialBalance}, NOW())
    `;
    return true;
  } catch (error) {
    console.error('Error creating user:', error);
    return false;
  }
};

// Session performance tracking
export const createSession = async (userId: string): Promise<string> => {
  try {
    const sessionId = uuidv4();
    
    await sql`
      INSERT INTO sessions (
        id, 
        user_id, 
        start_time, 
        initial_balance, 
        final_balance, 
        hands_played,
        hands_won
      ) 
      VALUES (
        ${sessionId}, 
        ${userId}, 
        NOW(), 
        (SELECT balance FROM users WHERE id = ${userId}),
        (SELECT balance FROM users WHERE id = ${userId}),
        0,
        0
      )
    `;
    
    return sessionId;
  } catch (error) {
    console.error('Error creating session:', error);
    return '';
  }
};

export const updateSession = async (
  sessionId: string,
  finalBalance: number,
  handsPlayed: number,
  handsWon: number
): Promise<boolean> => {
  try {
    await sql`
      UPDATE sessions 
      SET 
        end_time = NOW(), 
        final_balance = ${finalBalance},
        hands_played = ${handsPlayed},
        hands_won = ${handsWon}
      WHERE id = ${sessionId}
    `;
    return true;
  } catch (error) {
    console.error('Error updating session:', error);
    return false;
  }
};

export const getSessionStats = async (sessionId: string): Promise<SessionPerformance | null> => {
  try {
    const { rows } = await sql`
      SELECT 
        s.id as session_id,
        s.start_time,
        s.end_time,
        s.initial_balance,
        s.final_balance,
        s.hands_played,
        s.hands_won,
        (SELECT MAX(h.pot_size) FROM hands h WHERE h.session_id = s.id) as biggest_pot,
        (SELECT MAX(h.profit) FROM hands h WHERE h.session_id = s.id AND h.profit > 0) as biggest_win,
        (SELECT MIN(h.profit) FROM hands h WHERE h.session_id = s.id AND h.profit < 0) as biggest_loss
      FROM sessions s
      WHERE s.id = ${sessionId}
    `;
    
    if (rows.length === 0) return null;
    
    const sessionData = rows[0];
    
    // Get hand performances
    const handPerformances = await getHandPerformances(sessionId);
    
    // Calculate additional metrics
    const showdownPercentage = calculateShowdownPercentage(handPerformances);
    const vpipPercentage = calculateVPIPPercentage(handPerformances);
    const pfr = calculatePFR(handPerformances);
    
    return {
      sessionId: sessionData.session_id,
      startTime: new Date(sessionData.start_time),
      endTime: sessionData.end_time ? new Date(sessionData.end_time) : new Date(),
      initialBalance: sessionData.initial_balance,
      finalBalance: sessionData.final_balance,
      profit: sessionData.final_balance - sessionData.initial_balance,
      handsPlayed: sessionData.hands_played,
      handsWon: sessionData.hands_won,
      biggestPot: sessionData.biggest_pot || 0,
      biggestWin: sessionData.biggest_win || 0,
      biggestLoss: Math.abs(sessionData.biggest_loss || 0),
      showdownPercentage,
      vpipPercentage,
      pfr,
      handPerformances
    };
  } catch (error) {
    console.error('Error getting session stats:', error);
    return null;
  }
};

// Hand performance tracking
export const recordHand = async (
  sessionId: string,
  userId: string,
  handPerformance: HandPerformance
): Promise<boolean> => {
  try {
    // Insert hand record
    await sql`
      INSERT INTO hands (
        id, 
        session_id, 
        user_id,
        start_time,
        end_time,
        initial_stack,
        final_stack,
        profit,
        correct_decisions,
        incorrect_decisions,
        final_hand_rank,
        was_winner,
        pot_size
      ) 
      VALUES (
        ${handPerformance.handId},
        ${sessionId},
        ${userId},
        ${handPerformance.startTime.toISOString()},
        ${handPerformance.endTime.toISOString()},
        ${handPerformance.initialStack},
        ${handPerformance.finalStack},
        ${handPerformance.profit},
        ${handPerformance.correctDecisions},
        ${handPerformance.incorrectDecisions},
        ${handPerformance.finalHandRank || null},
        ${handPerformance.wasWinner},
        ${handPerformance.profit > 0 ? handPerformance.profit : 0}
      )
    `;
    
    // Record actions
    for (const action of handPerformance.actions) {
      await recordAction(handPerformance.handId, action);
    }
    
    // Record advice
    for (const advice of handPerformance.advice) {
      await recordAdvice(handPerformance.handId, advice);
    }
    
    // Record missed opportunities
    for (const opportunity of handPerformance.missedOpportunities) {
      await recordMissedOpportunity(handPerformance.handId, opportunity);
    }
    
    // Record good plays
    for (const play of handPerformance.goodPlays) {
      await recordGoodPlay(handPerformance.handId, play);
    }
    
    return true;
  } catch (error) {
    console.error('Error recording hand:', error);
    return false;
  }
};

const recordAction = async (handId: string, action: Action): Promise<void> => {
  await sql`
    INSERT INTO actions (
      hand_id,
      action_type,
      amount,
      player_id,
      player_name
    )
    VALUES (
      ${handId},
      ${action.type},
      ${action.amount || 0},
      ${action.player.id},
      ${action.player.name}
    )
  `;
};

const recordAdvice = async (handId: string, advice: Advice): Promise<void> => {
  await sql`
    INSERT INTO advice (
      hand_id,
      advice_type,
      message,
      importance,
      suggested_action,
      suggested_amount,
      hand_strength,
      win_probability
    )
    VALUES (
      ${handId},
      ${advice.type},
      ${advice.message},
      ${advice.importance},
      ${advice.suggestedAction || null},
      ${advice.suggestedAmount || null},
      ${advice.handStrength || null},
      ${advice.winProbability || null}
    )
  `;
};

const recordMissedOpportunity = async (handId: string, opportunity: string): Promise<void> => {
  await sql`
    INSERT INTO missed_opportunities (
      hand_id,
      description
    )
    VALUES (
      ${handId},
      ${opportunity}
    )
  `;
};

const recordGoodPlay = async (handId: string, play: string): Promise<void> => {
  await sql`
    INSERT INTO good_plays (
      hand_id,
      description
    )
    VALUES (
      ${handId},
      ${play}
    )
  `;
};

// Get hand performances for a session
const getHandPerformances = async (sessionId: string): Promise<HandPerformance[]> => {
  const { rows: handRows } = await sql`
    SELECT 
      id as hand_id,
      start_time,
      end_time,
      initial_stack,
      final_stack,
      profit,
      correct_decisions,
      incorrect_decisions,
      final_hand_rank,
      was_winner
    FROM hands
    WHERE session_id = ${sessionId}
    ORDER BY start_time
  `;
  
  const handPerformances: HandPerformance[] = [];
  
  for (const hand of handRows) {
    // Get actions
    const { rows: actionRows } = await sql`
      SELECT 
        action_type,
        amount,
        player_id,
        player_name
      FROM actions
      WHERE hand_id = ${hand.hand_id}
      ORDER BY id
    `;
    
    const actions: Action[] = actionRows.map(row => ({
      type: row.action_type as ActionType,
      amount: row.amount,
      player: {
        id: row.player_id,
        name: row.player_name,
        balance: 0, // Not stored in DB
        cards: [], // Not stored in DB
        type: 'human', // Not stored in DB
        betAmount: 0, // Not stored in DB
        isActive: false, // Not stored in DB
        isFolded: false, // Not stored in DB
        isAllIn: false, // Not stored in DB
        seatPosition: 0 // Not stored in DB
      } as Player
    }));
    
    // Get advice
    const { rows: adviceRows } = await sql`
      SELECT 
        advice_type,
        message,
        importance,
        suggested_action,
        suggested_amount,
        hand_strength,
        win_probability
      FROM advice
      WHERE hand_id = ${hand.hand_id}
      ORDER BY id
    `;
    
    const advice: Advice[] = adviceRows.map(row => ({
      type: row.advice_type as AdviceType,
      message: row.message,
      importance: row.importance,
      suggestedAction: row.suggested_action as ActionType,
      suggestedAmount: row.suggested_amount,
      handStrength: row.hand_strength,
      winProbability: row.win_probability
    }));
    
    // Get missed opportunities
    const { rows: missedRows } = await sql`
      SELECT description
      FROM missed_opportunities
      WHERE hand_id = ${hand.hand_id}
    `;
    
    const missedOpportunities = missedRows.map(row => row.description);
    
    // Get good plays
    const { rows: goodPlayRows } = await sql`
      SELECT description
      FROM good_plays
      WHERE hand_id = ${hand.hand_id}
    `;
    
    const goodPlays = goodPlayRows.map(row => row.description);
    
    handPerformances.push({
      handId: hand.hand_id,
      startTime: new Date(hand.start_time),
      endTime: new Date(hand.end_time),
      initialStack: hand.initial_stack,
      finalStack: hand.final_stack,
      profit: hand.profit,
      actions,
      advice,
      correctDecisions: hand.correct_decisions,
      incorrectDecisions: hand.incorrect_decisions,
      finalHandRank: hand.final_hand_rank as HandRank,
      wasWinner: hand.was_winner,
      missedOpportunities,
      goodPlays
    });
  }
  
  return handPerformances;
};

// Calculate metrics
const calculateShowdownPercentage = (handPerformances: HandPerformance[]): number => {
  if (handPerformances.length === 0) return 0;
  
  const showdownHands = handPerformances.filter(hand => hand.finalHandRank !== undefined);
  return (showdownHands.length / handPerformances.length) * 100;
};

const calculateVPIPPercentage = (handPerformances: HandPerformance[]): number => {
  if (handPerformances.length === 0) return 0;
  
  // VPIP = Voluntarily Put Money In Pot (not counting blinds)
  const vpipHands = handPerformances.filter(hand => {
    const playerActions = hand.actions.filter(action => 
      action.player.id === hand.handId.split('_')[0] && // Filter to just player actions
      (action.type === ActionType.CALL || action.type === ActionType.BET || action.type === ActionType.RAISE)
    );
    return playerActions.length > 0;
  });
  
  return (vpipHands.length / handPerformances.length) * 100;
};

const calculatePFR = (handPerformances: HandPerformance[]): number => {
  if (handPerformances.length === 0) return 0;
  
  // PFR = Preflop Raise percentage
  const pfrHands = handPerformances.filter(hand => {
    // Look for raise actions by player in preflop stage
    const preflopRaises = hand.actions.filter(action => 
      action.player.id === hand.handId.split('_')[0] && // Filter to just player actions
      action.type === ActionType.RAISE
    );
    
    // If we have any in the first few actions (preflop), count it
    // This is an approximation since we don't explicitly track game stage in actions
    return preflopRaises.length > 0 && 
           hand.actions.indexOf(preflopRaises[0]) < 10; // Assume first 10 actions are preflop
  });
  
  return (pfrHands.length / handPerformances.length) * 100;
}; 