import { Card, Suit, Rank, HandRank, HandEvaluation, Player, Action, ActionType, GameState, ShowdownResult, SidePot } from '../types';

// Deck management
export const createDeck = (): Card[] => {
  const deck: Card[] = [];
  
  Object.values(Suit).forEach(suit => {
    Object.values(Rank).forEach(rank => {
      deck.push({
        suit,
        rank,
        faceUp: false
      });
    });
  });
  
  return shuffleDeck(deck);
};

export const shuffleDeck = (deck: Card[]): Card[] => {
  const newDeck = [...deck];
  
  for (let i = newDeck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
  }
  
  return newDeck;
};

export const dealCards = (deck: Card[], numCards: number): { cards: Card[], remainingDeck: Card[] } => {
  const cards = deck.slice(0, numCards).map(card => ({
    ...card,
    faceUp: false
  }));
  
  const remainingDeck = deck.slice(numCards);
  
  return { cards, remainingDeck };
};

// Hand evaluation
export const evaluateHand = (holeCards: Card[], communityCards: Card[]): HandEvaluation => {
  const allCards = [...holeCards, ...communityCards];
  
  // Check for royal flush
  const royalFlush = checkRoyalFlush(allCards);
  if (royalFlush) return royalFlush;
  
  // Check for straight flush
  const straightFlush = checkStraightFlush(allCards);
  if (straightFlush) return straightFlush;
  
  // Check for four of a kind
  const fourOfAKind = checkFourOfAKind(allCards);
  if (fourOfAKind) return fourOfAKind;
  
  // Check for full house
  const fullHouse = checkFullHouse(allCards);
  if (fullHouse) return fullHouse;
  
  // Check for flush
  const flush = checkFlush(allCards);
  if (flush) return flush;
  
  // Check for straight
  const straight = checkStraight(allCards);
  if (straight) return straight;
  
  // Check for three of a kind
  const threeOfAKind = checkThreeOfAKind(allCards);
  if (threeOfAKind) return threeOfAKind;
  
  // Check for two pair
  const twoPair = checkTwoPair(allCards);
  if (twoPair) return twoPair;
  
  // Check for pair
  const pair = checkPair(allCards);
  if (pair) return pair;
  
  // If no other hand, return high card
  return checkHighCard(allCards);
};

// Helper functions for hand evaluation
const checkRoyalFlush = (cards: Card[]): HandEvaluation | null => {
  // Implementation
  const straightFlush = checkStraightFlush(cards);
  if (straightFlush && straightFlush.cards.some(card => card.rank === Rank.ACE) && 
      straightFlush.cards.some(card => card.rank === Rank.KING)) {
    return {
      rank: HandRank.ROYAL_FLUSH,
      value: 10,
      description: `Royal Flush of ${straightFlush.cards[0].suit}`,
      cards: straightFlush.cards,
      strengthPercentile: 100
    };
  }
  return null;
};

const checkStraightFlush = (cards: Card[]): HandEvaluation | null => {
  // Group cards by suit
  const cardsBySuit: Record<string, Card[]> = {};
  cards.forEach(card => {
    if (!cardsBySuit[card.suit]) {
      cardsBySuit[card.suit] = [];
    }
    cardsBySuit[card.suit].push(card);
  });
  
  // Check for flush
  for (const suit in cardsBySuit) {
    if (cardsBySuit[suit].length >= 5) {
      const straight = checkStraight(cardsBySuit[suit]);
      if (straight) {
        return {
          rank: HandRank.STRAIGHT_FLUSH,
          value: 9 + straight.value / 100,
          description: `Straight Flush, ${straight.description.split(' ').slice(1).join(' ')}`,
          cards: straight.cards,
          strengthPercentile: 99.9
        };
      }
    }
  }
  
  return null;
};

const checkFourOfAKind = (cards: Card[]): HandEvaluation | null => {
  // Group cards by rank
  const cardsByRank = groupCardsByRank(cards);
  
  // Find four of a kind
  for (const rank in cardsByRank) {
    if (cardsByRank[rank].length === 4) {
      const fourCards = cardsByRank[rank];
      
      // Find the highest kicker
      const kickers = cards
        .filter(card => card.rank !== rank)
        .sort((a, b) => rankToValue(b.rank) - rankToValue(a.rank));
      
      const handCards = [...fourCards, kickers[0]];
      
      return {
        rank: HandRank.FOUR_OF_A_KIND,
        value: 8 + rankToValue(rank as Rank) / 100,
        description: `Four of a Kind, ${rank}s`,
        cards: handCards,
        strengthPercentile: 99.8
      };
    }
  }
  
  return null;
};

const checkFullHouse = (cards: Card[]): HandEvaluation | null => {
  const cardsByRank = groupCardsByRank(cards);
  
  let threeOfAKindRank: Rank | null = null;
  let pairRank: Rank | null = null;
  
  // Find the highest three of a kind
  for (const rank in cardsByRank) {
    if (cardsByRank[rank].length >= 3) {
      if (!threeOfAKindRank || rankToValue(rank as Rank) > rankToValue(threeOfAKindRank)) {
        threeOfAKindRank = rank as Rank;
      }
    }
  }
  
  // Find the highest pair that's not the same as three of a kind
  for (const rank in cardsByRank) {
    if (rank !== threeOfAKindRank && cardsByRank[rank].length >= 2) {
      if (!pairRank || rankToValue(rank as Rank) > rankToValue(pairRank)) {
        pairRank = rank as Rank;
      }
    }
  }
  
  if (threeOfAKindRank && pairRank) {
    const threeCards = cardsByRank[threeOfAKindRank].slice(0, 3);
    const pairCards = cardsByRank[pairRank].slice(0, 2);
    
    return {
      rank: HandRank.FULL_HOUSE,
      value: 7 + rankToValue(threeOfAKindRank) / 100 + rankToValue(pairRank) / 10000,
      description: `Full House, ${threeOfAKindRank}s full of ${pairRank}s`,
      cards: [...threeCards, ...pairCards],
      strengthPercentile: 99.0
    };
  }
  
  return null;
};

const checkFlush = (cards: Card[]): HandEvaluation | null => {
  // Group cards by suit
  const cardsBySuit: Record<string, Card[]> = {};
  cards.forEach(card => {
    if (!cardsBySuit[card.suit]) {
      cardsBySuit[card.suit] = [];
    }
    cardsBySuit[card.suit].push(card);
  });
  
  // Check for flush
  for (const suit in cardsBySuit) {
    if (cardsBySuit[suit].length >= 5) {
      // Sort by rank (high to low)
      const flushCards = cardsBySuit[suit]
        .sort((a, b) => rankToValue(b.rank) - rankToValue(a.rank))
        .slice(0, 5);
      
      return {
        rank: HandRank.FLUSH,
        value: 6 + rankToValue(flushCards[0].rank) / 100,
        description: `Flush, ${flushCards[0].rank} high`,
        cards: flushCards,
        strengthPercentile: 96.0
      };
    }
  }
  
  return null;
};

const checkStraight = (cards: Card[]): HandEvaluation | null => {
  // Remove duplicate ranks
  const uniqueRanks = Array.from(new Set(cards.map(card => card.rank)));
  
  // Sort by rank value (high to low)
  const sortedRanks = uniqueRanks
    .map(rank => ({ rank, value: rankToValue(rank) }))
    .sort((a, b) => b.value - a.value);
  
  // Special case: Ace can be low in a straight (A-5-4-3-2)
  if (sortedRanks.find(r => r.rank === Rank.ACE)) {
    sortedRanks.push({ rank: Rank.ACE, value: 1 });
  }
  
  // Check for 5 consecutive cards
  for (let i = 0; i <= sortedRanks.length - 5; i++) {
    if (
      sortedRanks[i].value === sortedRanks[i + 1].value + 1 &&
      sortedRanks[i + 1].value === sortedRanks[i + 2].value + 1 &&
      sortedRanks[i + 2].value === sortedRanks[i + 3].value + 1 &&
      sortedRanks[i + 3].value === sortedRanks[i + 4].value + 1
    ) {
      // Get one card of each rank in the straight
      const straightCards: Card[] = [];
      
      for (let j = i; j < i + 5; j++) {
        const targetRank = sortedRanks[j].rank;
        const cardToAdd = cards.find(card => card.rank === targetRank && !straightCards.includes(card));
        if (cardToAdd) {
          straightCards.push(cardToAdd);
        }
      }
      
      // Handle the special case of a 5-high straight with an Ace
      if (sortedRanks[i].rank === Rank.FIVE && sortedRanks[i + 4].rank === Rank.ACE) {
        return {
          rank: HandRank.STRAIGHT,
          value: 5 + 5 / 100, // 5-high straight
          description: `Straight, Five high`,
          cards: straightCards,
          strengthPercentile: 80.0
        };
      }
      
      return {
        rank: HandRank.STRAIGHT,
        value: 5 + rankToValue(sortedRanks[i].rank) / 100,
        description: `Straight, ${sortedRanks[i].rank} high`,
        cards: straightCards,
        strengthPercentile: 80.0 + (rankToValue(sortedRanks[i].rank) - 5) * 2
      };
    }
  }
  
  return null;
};

const checkThreeOfAKind = (cards: Card[]): HandEvaluation | null => {
  const cardsByRank = groupCardsByRank(cards);
  
  // Find three of a kind
  for (const rank in cardsByRank) {
    if (cardsByRank[rank].length === 3) {
      const threeCards = cardsByRank[rank];
      
      // Find the highest kickers
      const kickers = cards
        .filter(card => card.rank !== rank)
        .sort((a, b) => rankToValue(b.rank) - rankToValue(a.rank))
        .slice(0, 2);
      
      return {
        rank: HandRank.THREE_OF_A_KIND,
        value: 4 + rankToValue(rank as Rank) / 100,
        description: `Three of a Kind, ${rank}s`,
        cards: [...threeCards, ...kickers],
        strengthPercentile: 70.0 + rankToValue(rank as Rank) * 1.5
      };
    }
  }
  
  return null;
};

const checkTwoPair = (cards: Card[]): HandEvaluation | null => {
  const cardsByRank = groupCardsByRank(cards);
  
  const pairs: { rank: Rank, cards: Card[] }[] = [];
  
  // Find all pairs
  for (const rank in cardsByRank) {
    if (cardsByRank[rank].length >= 2) {
      pairs.push({
        rank: rank as Rank,
        cards: cardsByRank[rank].slice(0, 2)
      });
    }
  }
  
  // If we have at least 2 pairs
  if (pairs.length >= 2) {
    // Sort pairs by rank (high to low)
    pairs.sort((a, b) => rankToValue(b.rank) - rankToValue(a.rank));
    
    // Take the two highest pairs
    const highPair = pairs[0];
    const lowPair = pairs[1];
    
    // Find the highest kicker
    const kicker = cards
      .filter(card => card.rank !== highPair.rank && card.rank !== lowPair.rank)
      .sort((a, b) => rankToValue(b.rank) - rankToValue(a.rank))[0];
    
    return {
      rank: HandRank.TWO_PAIR,
      value: 3 + rankToValue(highPair.rank) / 100 + rankToValue(lowPair.rank) / 10000,
      description: `Two Pair, ${highPair.rank}s and ${lowPair.rank}s`,
      cards: [...highPair.cards, ...lowPair.cards, kicker],
      strengthPercentile: 40.0 + rankToValue(highPair.rank) + rankToValue(lowPair.rank) / 2
    };
  }
  
  return null;
};

const checkPair = (cards: Card[]): HandEvaluation | null => {
  const cardsByRank = groupCardsByRank(cards);
  
  // Find a pair
  for (const rank in cardsByRank) {
    if (cardsByRank[rank].length === 2) {
      const pairCards = cardsByRank[rank];
      
      // Find the highest kickers
      const kickers = cards
        .filter(card => card.rank !== rank)
        .sort((a, b) => rankToValue(b.rank) - rankToValue(a.rank))
        .slice(0, 3);
      
      return {
        rank: HandRank.PAIR,
        value: 2 + rankToValue(rank as Rank) / 100,
        description: `Pair of ${rank}s`,
        cards: [...pairCards, ...kickers],
        strengthPercentile: 20.0 + rankToValue(rank as Rank) * 2
      };
    }
  }
  
  return null;
};

const checkHighCard = (cards: Card[]): HandEvaluation => {
  // Sort cards by rank (high to low)
  const sortedCards = [...cards].sort((a, b) => rankToValue(b.rank) - rankToValue(a.rank));
  
  // Take the 5 highest cards
  const handCards = sortedCards.slice(0, 5);
  
  return {
    rank: HandRank.HIGH_CARD,
    value: 1 + rankToValue(handCards[0].rank) / 100,
    description: `High Card, ${handCards[0].rank}`,
    cards: handCards,
    strengthPercentile: 5.0 + rankToValue(handCards[0].rank) * 1.5
  };
};

// Helper functions
export const rankToValue = (rank: Rank): number => {
  const rankValues: Record<Rank, number> = {
    [Rank.TWO]: 2,
    [Rank.THREE]: 3,
    [Rank.FOUR]: 4,
    [Rank.FIVE]: 5,
    [Rank.SIX]: 6,
    [Rank.SEVEN]: 7,
    [Rank.EIGHT]: 8,
    [Rank.NINE]: 9,
    [Rank.TEN]: 10,
    [Rank.JACK]: 11,
    [Rank.QUEEN]: 12,
    [Rank.KING]: 13,
    [Rank.ACE]: 14
  };
  
  return rankValues[rank];
};

const groupCardsByRank = (cards: Card[]): Record<string, Card[]> => {
  const cardsByRank: Record<string, Card[]> = {};
  
  cards.forEach(card => {
    if (!cardsByRank[card.rank]) {
      cardsByRank[card.rank] = [];
    }
    cardsByRank[card.rank].push(card);
  });
  
  return cardsByRank;
};

// Game action utilities
export const canCheck = (gameState: GameState, playerId: string): boolean => {
  const player = gameState.players.find(p => p.id === playerId);
  if (!player) return false;
  
  return player.betAmount === gameState.currentBet;
};

export const canCall = (gameState: GameState, playerId: string): boolean => {
  const player = gameState.players.find(p => p.id === playerId);
  if (!player) return false;
  
  return player.betAmount < gameState.currentBet && player.balance > 0;
};

export const canBet = (gameState: GameState, playerId: string): boolean => {
  const player = gameState.players.find(p => p.id === playerId);
  if (!player) return false;
  
  return gameState.currentBet === 0 && player.balance > 0;
};

export const canRaise = (gameState: GameState, playerId: string): boolean => {
  const player = gameState.players.find(p => p.id === playerId);
  if (!player) return false;
  
  return gameState.currentBet > 0 && player.balance >= 2 * gameState.currentBet - player.betAmount;
};

export const determineWinners = (gameState: GameState): ShowdownResult[] => {
  // Only consider active players or players who are all-in
  const eligiblePlayers = gameState.players.filter(player => 
    !player.isFolded && (player.isActive || player.isAllIn)
  );
  
  // Evaluate hands for all eligible players
  const evaluatedPlayers = eligiblePlayers.map(player => {
    const handEvaluation = evaluateHand(player.cards, gameState.communityCards);
    return {
      ...player,
      handEvaluation
    };
  });
  
  // Sort by hand value (highest first)
  evaluatedPlayers.sort((a, b) => 
    (b.handEvaluation?.value || 0) - (a.handEvaluation?.value || 0)
  );
  
  // Calculate side pots if necessary
  const sidePots = calculateSidePots(gameState);
  
  // Determine winners and distribute pot
  const results: ShowdownResult[] = [];
  
  if (sidePots.length === 0) {
    // Simple case: no side pots
    const winners = getWinnersForPot(evaluatedPlayers);
    const winAmount = gameState.pot / winners.length;
    
    evaluatedPlayers.forEach(player => {
      results.push({
        player,
        handEvaluation: player.handEvaluation!,
        winAmount: winners.includes(player) ? winAmount : 0,
        isWinner: winners.includes(player)
      });
    });
  } else {
    // Complex case: handle side pots
    sidePots.forEach(sidePot => {
      const eligiblePlayersForSidePot = evaluatedPlayers.filter(player => 
        sidePot.eligiblePlayers.includes(player.id)
      );
      
      const winners = getWinnersForPot(eligiblePlayersForSidePot);
      const winAmount = sidePot.amount / winners.length;
      
      winners.forEach(winner => {
        const existingResult = results.find(r => r.player.id === winner.id);
        
        if (existingResult) {
          existingResult.winAmount += winAmount;
          existingResult.isWinner = true;
        } else {
          results.push({
            player: winner,
            handEvaluation: winner.handEvaluation!,
            winAmount,
            isWinner: true
          });
        }
      });
      
      // Add players who didn't win this side pot
      eligiblePlayersForSidePot
        .filter(player => !winners.includes(player))
        .forEach(player => {
          if (!results.some(r => r.player.id === player.id)) {
            results.push({
              player,
              handEvaluation: player.handEvaluation!,
              winAmount: 0,
              isWinner: false
            });
          }
        });
    });
  }
  
  // Sort results by win amount (highest first)
  results.sort((a, b) => b.winAmount - a.winAmount);
  
  return results;
};

// Helper function to find winners for a pot
const getWinnersForPot = (evaluatedPlayers: (Player & { handEvaluation: HandEvaluation })[]): (Player & { handEvaluation: HandEvaluation })[] => {
  if (evaluatedPlayers.length === 0) return [];
  
  const highestValue = evaluatedPlayers[0].handEvaluation.value;
  return evaluatedPlayers.filter(player => player.handEvaluation.value === highestValue);
};

// Calculate side pots when players are all-in
const calculateSidePots = (gameState: GameState): SidePot[] => {
  if (!gameState.players.some(p => p.isAllIn)) {
    return [];
  }
  
  const activePlayers = gameState.players.filter(p => !p.isFolded);
  
  // Sort players by their total contribution to the pot (bet amount)
  const playersByContribution = [...activePlayers]
    .sort((a, b) => a.betAmount - b.betAmount);
  
  const sidePots: SidePot[] = [];
  let processedAmount = 0;
  
  playersByContribution.forEach(player => {
    if (player.betAmount > processedAmount) {
      // Calculate how much this player contributed above the previously processed amount
      const contribution = player.betAmount - processedAmount;
      
      // Eligible players are those who contributed at least as much as the current player
      const eligiblePlayers = activePlayers
        .filter(p => p.betAmount >= player.betAmount)
        .map(p => p.id);
      
      // Calculate side pot amount
      const potAmount = contribution * eligiblePlayers.length;
      
      sidePots.push({
        amount: potAmount,
        eligiblePlayers
      });
      
      processedAmount = player.betAmount;
    }
  });
  
  return sidePots;
}; 