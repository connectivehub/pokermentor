// Card-related types
export enum Suit {
  HEARTS = 'hearts',
  DIAMONDS = 'diamonds',
  CLUBS = 'clubs',
  SPADES = 'spades',
}

export enum Rank {
  TWO = '2',
  THREE = '3',
  FOUR = '4',
  FIVE = '5',
  SIX = '6',
  SEVEN = '7',
  EIGHT = '8',
  NINE = '9',
  TEN = '10',
  JACK = 'J',
  QUEEN = 'Q',
  KING = 'K',
  ACE = 'A',
}

export interface Card {
  suit: Suit;
  rank: Rank;
  faceUp: boolean;
}

// Hand-related types
export enum HandRank {
  HIGH_CARD = 0,
  PAIR = 1,
  TWO_PAIR = 2,
  THREE_OF_A_KIND = 3,
  STRAIGHT = 4,
  FLUSH = 5,
  FULL_HOUSE = 6,
  FOUR_OF_A_KIND = 7,
  STRAIGHT_FLUSH = 8,
  ROYAL_FLUSH = 9
}

// Human-readable hand rank names
export const HandRankNames = {
  [HandRank.HIGH_CARD]: 'High Card',
  [HandRank.PAIR]: 'Pair',
  [HandRank.TWO_PAIR]: 'Two Pair',
  [HandRank.THREE_OF_A_KIND]: 'Three of a Kind',
  [HandRank.STRAIGHT]: 'Straight',
  [HandRank.FLUSH]: 'Flush',
  [HandRank.FULL_HOUSE]: 'Full House',
  [HandRank.FOUR_OF_A_KIND]: 'Four of a Kind',
  [HandRank.STRAIGHT_FLUSH]: 'Straight Flush',
  [HandRank.ROYAL_FLUSH]: 'Royal Flush'
}

export interface HandEvaluation {
  rank: HandRank;
  value: number; // For comparing hands of the same rank
  description: string;
  cards: Card[];
  strengthPercentile: number; // 0-100 score indicating hand strength
}

// Player-related types
export enum PlayerType {
  HUMAN = 'human',
  AI = 'ai',
}

export enum PlayerStyle {
  TIGHT_PASSIVE = 'tight-passive',
  TIGHT_AGGRESSIVE = 'tight-aggressive',
  LOOSE_PASSIVE = 'loose-passive',
  LOOSE_AGGRESSIVE = 'loose-aggressive',
  BALANCED = 'balanced',
}

export interface Player {
  id: string;
  name: string;
  balance: number;
  cards: Card[];
  type: PlayerType;
  style?: PlayerStyle;
  betAmount: number;
  isActive: boolean;
  isFolded: boolean;
  isAllIn: boolean;
  currentHandEvaluation?: HandEvaluation;
  avatar?: string;
  seatPosition: number;
}

// Game-related types
export enum GameStage {
  PREFLOP = 'preflop',
  FLOP = 'flop',
  TURN = 'turn',
  RIVER = 'river',
  SHOWDOWN = 'showdown',
}

export enum ActionType {
  FOLD = 'fold',
  CHECK = 'check',
  CALL = 'call',
  BET = 'bet',
  RAISE = 'raise',
  ALL_IN = 'all-in',
}

export interface Action {
  type: ActionType;
  amount?: number;
  player: Player;
}

export interface GameState {
  players: Player[];
  currentPlayerIndex: number;
  dealerIndex: number;
  smallBlindIndex: number;
  bigBlindIndex: number;
  pot: number;
  sidePots: SidePot[];
  communityCards: Card[];
  deck: Card[];
  stage: GameStage;
  minBet: number;
  currentBet: number;
  lastRaiseAmount: number;
  actionHistory: Action[];
  showdownResults?: ShowdownResult[];
  advisorEnabled: boolean;
}

export interface SidePot {
  amount: number;
  eligiblePlayers: string[]; // Player IDs
}

export interface ShowdownResult {
  player: Player;
  handEvaluation: HandEvaluation;
  winAmount: number;
  isWinner: boolean;
}

// Advisor-related types
export enum AdviceType {
  PREFLOP_CHART = 'preflop-chart',
  POSITION = 'position',
  ODDS = 'odds',
  BETTING = 'betting',
  READING = 'reading',
  GENERAL = 'general',
}

export interface Advice {
  type: AdviceType;
  message: string;
  importance: number; // 1-10 scale
  suggestedAction?: ActionType;
  suggestedAmount?: number;
  handStrength?: number; // 0-100 scale
  winProbability?: number; // 0-100 scale
}

// Performance-related types
export interface HandPerformance {
  handId: string;
  startTime: Date;
  endTime: Date;
  initialStack: number;
  finalStack: number;
  profit: number;
  actions: Action[];
  advice: Advice[];
  correctDecisions: number;
  incorrectDecisions: number;
  finalHandRank?: HandRank;
  wasWinner: boolean;
  missedOpportunities: string[];
  goodPlays: string[];
}

export interface SessionPerformance {
  sessionId: string;
  startTime: Date;
  endTime: Date;
  initialBalance: number;
  finalBalance: number;
  profit: number;
  handsPlayed: number;
  handsWon: number;
  biggestPot: number;
  biggestWin: number;
  biggestLoss: number;
  showdownPercentage: number;
  vpipPercentage: number; // Voluntarily Put Money In Pot
  pfr: number; // Pre-Flop Raise percentage
  handPerformances: HandPerformance[];
} 