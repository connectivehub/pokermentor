import { Card, Rank, Suit, GameState, Player, HandEvaluation, GameStage, ActionType, Advice, AdviceType, HandRank, HandRankNames } from '../types';
import { evaluateHand, rankToValue } from './gameUtils';

// Preflop hand strength calculator based on starting hands
export const calculatePreflopHandStrength = (holeCards: Card[]): number => {
  if (holeCards.length !== 2) return 0;
  
  const [card1, card2] = holeCards;
  const rank1Value = rankToValue(card1.rank);
  const rank2Value = rankToValue(card2.rank);
  
  // Pair
  if (card1.rank === card2.rank) {
    // Scale from 0-100, where AA is 100 and 22 is 50
    return 50 + ((rank1Value - 2) / 12) * 50;
  }
  
  // Same suit (suited cards)
  const isSuited = card1.suit === card2.suit;
  
  // Sort by rank value (high to low)
  const highRankValue = Math.max(rank1Value, rank2Value);
  const lowRankValue = Math.min(rank1Value, rank2Value);
  
  // Calculate the gap between ranks
  const gap = highRankValue - lowRankValue;
  
  // Base strength based on high card
  let strength = (highRankValue - 2) / 12 * 30;
  
  // Adjust for connected cards (straights are more valuable with smaller gaps)
  if (gap <= 4) {
    strength += (4 - gap) * 3;
  }
  
  // Suited cards are more valuable
  if (isSuited) {
    strength += 10;
  }
  
  // Adjust for Broadway cards (10, J, Q, K, A)
  if (lowRankValue >= 10) {
    strength += 10;
  }
  
  // Scale to max 49 (below pocket pairs)
  return Math.min(49, strength);
};

// Starting hand recommendations chart
type HandCategory = 'premium' | 'strong' | 'playable' | 'speculative' | 'weak';

// Recommendation based on hand category and position
export const getPreflopAdvice = (holeCards: Card[], position: number, numPlayers: number): Advice => {
  const handStrength = calculatePreflopHandStrength(holeCards);
  const handCategory = categorizeHand(handStrength);
  const positionStrength = getPositionStrength(position, numPlayers);
  
  // Define base advice
  let advice: Advice = {
    type: AdviceType.PREFLOP_CHART,
    message: '',
    importance: 8,
    handStrength
  };
  
  if (handCategory === 'premium') {
    advice.message = 'You have a premium hand. Consider raising 3-4x the big blind.';
    advice.suggestedAction = ActionType.RAISE;
    advice.importance = 9;
  } else if (handCategory === 'strong') {
    if (positionStrength === 'late' || positionStrength === 'middle') {
      advice.message = 'You have a strong hand in good position. Consider raising 2.5-3x the big blind.';
      advice.suggestedAction = ActionType.RAISE;
      advice.importance = 8;
    } else {
      advice.message = 'You have a strong hand in early position. Consider a standard raise or call if there\'s action ahead of you.';
      advice.suggestedAction = ActionType.CALL;
      advice.importance = 7;
    }
  } else if (handCategory === 'playable') {
    if (positionStrength === 'late') {
      advice.message = 'This hand is playable from late position. Consider raising if no one has entered the pot, or calling if there\'s a single raise.';
      advice.suggestedAction = ActionType.CALL;
      advice.importance = 6;
    } else if (positionStrength === 'middle') {
      advice.message = 'This hand is marginally playable from middle position. Consider calling if the pot is unraised or folding to a raise.';
      advice.suggestedAction = ActionType.CALL;
      advice.importance = 5;
    } else {
      advice.message = 'This hand is weak from early position. Consider folding unless the game is very passive.';
      advice.suggestedAction = ActionType.FOLD;
      advice.importance = 7;
    }
  } else if (handCategory === 'speculative') {
    if (positionStrength === 'late') {
      advice.message = 'This speculative hand has potential in late position. Consider calling if the pot is unraised or there\'s a small raise.';
      advice.suggestedAction = ActionType.CALL;
      advice.importance = 5;
    } else {
      advice.message = 'This speculative hand is too weak to play from early/middle position. Consider folding.';
      advice.suggestedAction = ActionType.FOLD;
      advice.importance = 7;
    }
  } else { // weak
    advice.message = 'This is a weak hand. The standard play is to fold, regardless of your position.';
    advice.suggestedAction = ActionType.FOLD;
    advice.importance = 8;
  }
  
  // Add more detailed analysis of the hand
  advice.message += ` ${getDetailedHandAnalysis(holeCards)}`;
  
  return advice;
};

// Helper to categorize hand based on strength
const categorizeHand = (handStrength: number): HandCategory => {
  if (handStrength >= 80) return 'premium';
  if (handStrength >= 60) return 'strong';
  if (handStrength >= 40) return 'playable';
  if (handStrength >= 25) return 'speculative';
  return 'weak';
};

// Helper to determine position strength
const getPositionStrength = (position: number, numPlayers: number): 'early' | 'middle' | 'late' => {
  const positionRatio = position / numPlayers;
  
  if (positionRatio < 0.33) return 'early';
  if (positionRatio < 0.66) return 'middle';
  return 'late';
};

// Get detailed analysis of hole cards
const getDetailedHandAnalysis = (holeCards: Card[]): string => {
  if (holeCards.length !== 2) return '';
  
  const [card1, card2] = holeCards;
  const isSuited = card1.suit === card2.suit;
  const isPair = card1.rank === card2.rank;
  
  if (isPair) {
    if (card1.rank === Rank.ACE) {
      return 'Pocket Aces is the strongest starting hand in Hold\'em. Play aggressively!';
    }
    if (card1.rank === Rank.KING) {
      return 'Pocket Kings is the second-strongest starting hand. Be aware of Aces on the board.';
    }
    if (card1.rank === Rank.QUEEN) {
      return 'Pocket Queens is a very strong hand. Be cautious if an Ace or King appears on the flop.';
    }
    if (card1.rank === Rank.JACK || card1.rank === Rank.TEN) {
      return `Pocket ${card1.rank}s is strong but vulnerable to overcards. Play carefully against early position raisers.`;
    }
    if (rankToValue(card1.rank) >= 7) {
      return `Pocket ${card1.rank}s has good showdown value but can be dominated by bigger pairs. Be cautious with your post-flop play.`;
    }
    return `Pocket ${card1.rank}s is more valuable for hitting sets. Consider calling to see a flop if the price is right.`;
  }
  
  const highCard = rankToValue(card1.rank) > rankToValue(card2.rank) ? card1 : card2;
  const lowCard = rankToValue(card1.rank) > rankToValue(card2.rank) ? card2 : card1;
  
  if (highCard.rank === Rank.ACE) {
    if (lowCard.rank === Rank.KING) {
      return `A-K ${isSuited ? 'suited' : 'offsuit'} is a strong drawing hand but remember it\'s still just high-card strength until it improves.`;
    }
    if (rankToValue(lowCard.rank) >= 10) {
      return `A-${lowCard.rank} ${isSuited ? 'suited' : 'offsuit'} has good potential but often needs to improve to win at showdown.`;
    }
    return `A-${lowCard.rank} ${isSuited ? 'suited' : 'offsuit'} is dominated by stronger Ace hands. Be cautious if there\'s a lot of action.`;
  }
  
  if (highCard.rank === Rank.KING) {
    if (rankToValue(lowCard.rank) >= 10) {
      return `K-${lowCard.rank} ${isSuited ? 'suited' : 'offsuit'} is a respectable hand with good potential against weaker ranges.`;
    }
    return `K-${lowCard.rank} ${isSuited ? 'suited' : 'offsuit'} can be problematic. It often needs to improve to win.`;
  }
  
  // Connected cards
  const gap = rankToValue(highCard.rank) - rankToValue(lowCard.rank);
  if (gap === 1) {
    return `${highCard.rank}-${lowCard.rank} ${isSuited ? 'suited' : 'offsuit'} is connected, giving you straight potential. ${isSuited ? 'The flush draw adds more value.' : ''}`;
  }
  
  if (gap <= 3) {
    return `${highCard.rank}-${lowCard.rank} ${isSuited ? 'suited' : 'offsuit'} has some straight potential with the ${gap}-gap. ${isSuited ? 'The flush draw adds more value.' : ''}`;
  }
  
  if (isSuited) {
    return `${highCard.rank}-${lowCard.rank} suited has flush potential but not much else. It\'s generally a speculative hand.`;
  }
  
  return `${highCard.rank}-${lowCard.rank} offsuit has limited potential. It will rarely win without significant improvement.`;
};

// Post-flop advice based on hand strength and board texture
export const getPostflopAdvice = (
  gameState: GameState,
  player: Player,
  handEvaluation: HandEvaluation
): Advice[] => {
  const advice: Advice[] = [];
  
  // Evaluate hand strength
  const handStrengthAdvice = getHandStrengthAdvice(gameState, player, handEvaluation);
  advice.push(handStrengthAdvice);
  
  // Board texture analysis
  const textureAdvice = getBoardTextureAdvice(gameState.communityCards, player.cards, handEvaluation);
  advice.push(textureAdvice);
  
  // Pot odds and position advice
  if (gameState.currentBet > 0) {
    const potOddsAdvice = getPotOddsAdvice(gameState, player);
    advice.push(potOddsAdvice);
  }
  
  // Get position-based advice
  const positionAdvice = getPositionAdvice(gameState, player);
  advice.push(positionAdvice);
  
  // Sort advice by importance
  return advice.sort((a, b) => b.importance - a.importance);
};

// Analyze hand strength relative to the board
const getHandStrengthAdvice = (
  gameState: GameState,
  player: Player,
  handEvaluation: HandEvaluation
): Advice => {
  const { rank, strengthPercentile } = handEvaluation;
  const stage = gameState.stage;
  
  let message = '';
  let suggestedAction: ActionType | undefined;
  let importance = 7;
  
  // Very strong hands (sets, full houses, etc.)
  if (strengthPercentile >= 90) {
    if (stage === GameStage.RIVER) {
      message = `You have a very strong ${HandRankNames[rank]} (${strengthPercentile.toFixed(1)}% strength). Consider a value bet to maximize your winnings.`;
      suggestedAction = ActionType.RAISE;
      importance = 9;
    } else {
      message = `You have a very strong ${HandRankNames[rank]} (${strengthPercentile.toFixed(1)}% strength). Consider building the pot, but be aware that draw-heavy boards can change.`;
      suggestedAction = ActionType.RAISE;
      importance = 8;
    }
  }
  // Strong hands
  else if (strengthPercentile >= 70) {
    message = `You have a strong ${HandRankNames[rank]} (${strengthPercentile.toFixed(1)}% strength). This likely beats most hands, but be cautious of possible draws.`;
    suggestedAction = gameState.currentBet > 0 ? ActionType.CALL : ActionType.BET;
    importance = 7;
  }
  // Medium strength hands
  else if (strengthPercentile >= 40) {
    message = `You have a medium-strength ${HandRankNames[rank]} (${strengthPercentile.toFixed(1)}% strength). Consider your position and opponents' actions carefully.`;
    suggestedAction = gameState.currentBet > 0 ? ActionType.CALL : ActionType.CHECK;
    importance = 6;
  }
  // Weak hands
  else {
    message = `You have a weak ${HandRankNames[rank]} (${strengthPercentile.toFixed(1)}% strength). Unless you have a good draw, consider folding to significant pressure.`;
    suggestedAction = gameState.currentBet > player.betAmount ? ActionType.FOLD : ActionType.CHECK;
    importance = 8;
  }
  
  return {
    type: AdviceType.ODDS,
    message,
    suggestedAction,
    importance,
    handStrength: strengthPercentile,
    winProbability: strengthPercentile / 1.2, // Approximate win probability
  };
};

// Analyze board texture and potential draws
const getBoardTextureAdvice = (
  communityCards: Card[],
  holeCards: Card[],
  handEvaluation: HandEvaluation
): Advice => {
  // Check for draws and board texture
  const allCards = [...communityCards, ...holeCards];
  
  // Count suits and ranks for texture analysis
  const suitCounts: Record<Suit, number> = {
    [Suit.HEARTS]: 0,
    [Suit.DIAMONDS]: 0,
    [Suit.CLUBS]: 0,
    [Suit.SPADES]: 0,
  };
  
  const rankCounts: Record<string, number> = {};
  
  allCards.forEach(card => {
    suitCounts[card.suit]++;
    
    if (!rankCounts[card.rank]) {
      rankCounts[card.rank] = 0;
    }
    rankCounts[card.rank]++;
  });
  
  // Check for flush draws
  const flushDrawSuit = Object.entries(suitCounts)
    .filter(([_, count]) => count >= 4)
    .map(([suit, _]) => suit as Suit)[0];
  
  // Check for straight draws
  const hasOpenEndedStraightDraw = checkForOpenEndedStraightDraw(allCards);
  const hasGutShotStraightDraw = checkForGutShotStraightDraw(allCards);
  
  // Calculate board texture
  const isPaired = Object.values(rankCounts).some(count => count >= 2);
  const isThreeOfAKind = Object.values(rankCounts).some(count => count >= 3);
  const isBoardPaired = communityCards.some(card1 => 
    communityCards.some(card2 => card1 !== card2 && card1.rank === card2.rank)
  );
  
  // Check if the board is connected
  const isBoardConnected = checkIfBoardIsConnected(communityCards);
  
  // Check if the board is suited
  const isBoardSuited = Object.values(suitCounts).some(count => count >= 3);
  
  // Generate advice based on texture analysis
  let message = '';
  let importance = 6;
  
  if (flushDrawSuit && holeCards.some(card => card.suit === flushDrawSuit)) {
    const cardsNeeded = 5 - suitCounts[flushDrawSuit];
    const drawType = cardsNeeded === 1 ? 'flush draw' : 'backdoor flush draw';
    message = `You have a ${drawType} in ${flushDrawSuit}. `;
    importance = cardsNeeded === 1 ? 8 : 6;
  }
  
  if (hasOpenEndedStraightDraw) {
    message += 'You have an open-ended straight draw (8 outs). ';
    importance = Math.max(importance, 7);
  } else if (hasGutShotStraightDraw) {
    message += 'You have a gutshot straight draw (4 outs). ';
    importance = Math.max(importance, 5);
  }
  
  // Add board texture analysis
  let textureDescription = '';
  
  if (isBoardPaired) {
    textureDescription += 'paired';
  }
  
  if (isBoardConnected) {
    textureDescription += textureDescription ? ', connected' : 'connected';
  }
  
  if (isBoardSuited) {
    textureDescription += textureDescription ? ', suited' : 'suited';
  }
  
  if (textureDescription) {
    message += `The board is ${textureDescription}, which `;
    
    if (isBoardPaired && handEvaluation.rank >= HandRank.THREE_OF_A_KIND) {
      message += 'helps your hand significantly. ';
    } else if (isBoardConnected && handEvaluation.rank >= HandRank.STRAIGHT) {
      message += 'is perfect for your straight. ';
    } else if (isBoardSuited && handEvaluation.rank >= HandRank.FLUSH) {
      message += 'gives you a strong flush. ';
    } else if ((isBoardPaired || isBoardConnected || isBoardSuited) && handEvaluation.strengthPercentile < 50) {
      message += 'could help opponent drawing hands. Be cautious. ';
    } else {
      message += 'presents both opportunities and risks. ';
    }
  }
  
  // If no specific draws or texture worth mentioning
  if (!message) {
    message = 'The board is relatively dry, making it easier to evaluate your hand strength. ';
    
    if (handEvaluation.strengthPercentile > 60) {
      message += 'This is favorable for your strong hand.';
    } else {
      message += 'Focus on the relative strength of your hand compared to likely opponent ranges.';
    }
  }
  
  return {
    type: AdviceType.READING,
    message,
    importance,
  };
};

// Check for open-ended straight draw
const checkForOpenEndedStraightDraw = (cards: Card[]): boolean => {
  const ranks = cards.map(card => rankToValue(card.rank)).sort((a, b) => a - b);
  const uniqueRanks = Array.from(new Set(ranks));
  
  // Check for sequences of 4 consecutive cards
  for (let i = 0; i <= uniqueRanks.length - 4; i++) {
    if (
      uniqueRanks[i + 1] === uniqueRanks[i] + 1 &&
      uniqueRanks[i + 2] === uniqueRanks[i] + 2 &&
      uniqueRanks[i + 3] === uniqueRanks[i] + 3
    ) {
      // Check if there's room for a straight on either end
      if (uniqueRanks[i] > 1 || uniqueRanks[i + 3] < 14) {
        return true;
      }
    }
  }
  
  return false;
};

// Check for gutshot straight draw
const checkForGutShotStraightDraw = (cards: Card[]): boolean => {
  const ranks = cards.map(card => rankToValue(card.rank)).sort((a, b) => a - b);
  const uniqueRanks = Array.from(new Set(ranks));
  
  // Check for sequences with one gap
  for (let i = 0; i <= uniqueRanks.length - 4; i++) {
    if (
      uniqueRanks[i + 3] - uniqueRanks[i] === 4 &&
      uniqueRanks[i + 1] - uniqueRanks[i] >= 1 &&
      uniqueRanks[i + 2] - uniqueRanks[i + 1] >= 1 &&
      uniqueRanks[i + 3] - uniqueRanks[i + 2] >= 1
    ) {
      return true;
    }
  }
  
  return false;
};

// Check if board is connected (at least 3 consecutive ranks)
const checkIfBoardIsConnected = (communityCards: Card[]): boolean => {
  if (communityCards.length < 3) return false;
  
  const ranks = communityCards.map(card => rankToValue(card.rank)).sort((a, b) => a - b);
  const uniqueRanks = Array.from(new Set(ranks));
  
  // Check for at least 3 consecutive cards
  for (let i = 0; i <= uniqueRanks.length - 3; i++) {
    if (
      uniqueRanks[i + 1] === uniqueRanks[i] + 1 &&
      uniqueRanks[i + 2] === uniqueRanks[i] + 2
    ) {
      return true;
    }
  }
  
  return false;
};

// Calculate pot odds and advise based on them
const getPotOddsAdvice = (gameState: GameState, player: Player): Advice => {
  // Calculate pot odds
  const callAmount = gameState.currentBet - player.betAmount;
  const potAfterCall = gameState.pot + callAmount;
  const potOdds = callAmount / potAfterCall;
  
  // Approximate equity based on hand evaluation and game stage
  let equity = 0;
  let equityExplanation = '';
  
  // Get current hand evaluation
  const handEvaluation = evaluateHand(player.cards, gameState.communityCards);
  
  if (gameState.stage === GameStage.FLOP) {
    // On the flop, we consider possible improvements
    if (handEvaluation.rank >= HandRank.TWO_PAIR) {
      equity = 0.8; // Strong hand already
      equityExplanation = 'With a strong hand on the flop, your equity is around 80%.';
    } else if (checkForOpenEndedStraightDraw([...player.cards, ...gameState.communityCards])) {
      equity = 0.35; // Open-ended straight draw (8 outs * 4% = ~32%)
      equityExplanation = 'With an open-ended straight draw, you have about 35% equity.';
    } else if (checkForGutShotStraightDraw([...player.cards, ...gameState.communityCards])) {
      equity = 0.20; // Gutshot (4 outs * 4% = ~16%)
      equityExplanation = 'With a gutshot straight draw, you have about 20% equity.';
    } else {
      equity = handEvaluation.strengthPercentile / 100 * 0.5;
      equityExplanation = `With your ${HandRankNames[handEvaluation.rank]}, your equity is roughly ${(equity * 100).toFixed(0)}%.`;
    }
  } else if (gameState.stage === GameStage.TURN) {
    // On the turn, fewer cards to come
    if (handEvaluation.rank >= HandRank.TWO_PAIR) {
      equity = 0.85; // Strong hand already
      equityExplanation = 'With a strong hand on the turn, your equity is around 85%.';
    } else if (checkForOpenEndedStraightDraw([...player.cards, ...gameState.communityCards])) {
      equity = 0.2; // Open-ended straight draw (8 outs * 2% = ~16%)
      equityExplanation = 'With an open-ended straight draw, you have about 20% equity on the turn.';
    } else if (checkForGutShotStraightDraw([...player.cards, ...gameState.communityCards])) {
      equity = 0.1; // Gutshot (4 outs * 2% = ~8%)
      equityExplanation = 'With a gutshot straight draw, you have about 10% equity on the turn.';
    } else {
      equity = handEvaluation.strengthPercentile / 100 * 0.6;
      equityExplanation = `With your ${HandRankNames[handEvaluation.rank]}, your equity is roughly ${(equity * 100).toFixed(0)}%.`;
    }
  } else if (gameState.stage === GameStage.RIVER) {
    // On the river, no more cards to come, equity is based solely on current hand
    equity = handEvaluation.strengthPercentile / 100 * 0.8;
    equityExplanation = `With your ${HandRankNames[handEvaluation.rank]} on the river, your equity is roughly ${(equity * 100).toFixed(0)}%.`;
  }
  
  // Compare pot odds to equity and advise
  let message = '';
  let suggestedAction: ActionType | undefined;
  let importance = 8;
  
  if (equity > potOdds * 1.2) { // Clear call or raise
    message = `${equityExplanation} The pot is offering you ${(potOdds * 100).toFixed(1)}% odds, which is favorable compared to your equity. This is a profitable call.`;
    suggestedAction = ActionType.CALL;
    
    if (equity > potOdds * 2) {
      message += ' In fact, this is so favorable you should consider raising.';
      suggestedAction = ActionType.RAISE;
    }
  } else if (equity > potOdds) { // Marginal call
    message = `${equityExplanation} The pot is offering you ${(potOdds * 100).toFixed(1)}% odds, which makes calling slightly profitable.`;
    suggestedAction = ActionType.CALL;
    importance = 7;
  } else { // Fold
    message = `${equityExplanation} The pot is offering you ${(potOdds * 100).toFixed(1)}% odds, which isn't enough compared to your equity. Mathematically, this is a fold.`;
    suggestedAction = ActionType.FOLD;
  }
  
  return {
    type: AdviceType.ODDS,
    message,
    suggestedAction,
    importance,
    winProbability: equity * 100,
  };
};

// Generate position-based advice
const getPositionAdvice = (gameState: GameState, player: Player): Advice => {
  const playerIndex = gameState.players.findIndex(p => p.id === player.id);
  const numActivePlayers = gameState.players.filter(p => !p.isFolded).length;
  
  // Calculate position advantage
  const isInPosition = 
    (gameState.dealerIndex === playerIndex) || 
    (playerIndex === (gameState.dealerIndex + numActivePlayers - 1) % numActivePlayers);
  
  const isEarlyPosition = 
    playerIndex === (gameState.dealerIndex + 1) % gameState.players.length || 
    playerIndex === (gameState.dealerIndex + 2) % gameState.players.length;
  
  let message = '';
  let importance = 5;
  
  if (isInPosition) {
    message = 'You have position advantage, which allows you to act last in betting rounds. You can make more informed decisions based on your opponents\' actions.';
    
    if (gameState.stage === GameStage.PREFLOP) {
      message += ' In late position, you can play a wider range of hands profitably.';
    } else {
      message += ' Use this advantage to control the pot size and extract value when you have strong hands.';
    }
    
    importance = 6;
  } else if (isEarlyPosition) {
    message = 'You\'re in early position, acting before most players. This is a disadvantage as you have less information when making decisions.';
    
    if (gameState.stage === GameStage.PREFLOP) {
      message += ' Play tighter and more cautiously from early position.';
    } else {
      message += ' Consider check-calling more often to avoid difficult situations out of position.';
    }
    
    importance = 7;
  } else {
    message = 'You\'re in middle position. You have some information from early position players but will still be acting before late position players.';
    message += ' Adjust your play based on the actions of players who have already acted.';
    
    importance = 5;
  }
  
  return {
    type: AdviceType.POSITION,
    message,
    importance,
  };
};

// Generate showdown analysis to improve future play
export const getShowdownAnalysis = (gameState: GameState, playerId: string): string => {
  const player = gameState.players.find(p => p.id === playerId);
  if (!player) return '';
  
  const showdownResults = gameState.showdownResults || [];
  const playerResult = showdownResults.find(result => result.player.id === playerId);
  
  if (!playerResult) return '';
  
  let analysis = '';
  
  if (playerResult.isWinner) {
    analysis = `Congratulations! Your ${playerResult.handEvaluation.description} won the pot.`;
  } else {
    // Find what beat the player
    const winners = showdownResults.filter(result => result.isWinner);
    if (winners.length > 0) {
      const winningHand = winners[0].handEvaluation;
      analysis = `Your ${playerResult.handEvaluation.description} was beaten by ${winners[0].player.name}'s ${winningHand.description}.`;
    } else {
      analysis = `You didn't win with your ${playerResult.handEvaluation.description}.`;
    }
  }
  
  // Add analysis based on starting hand and decisions
  const startingHandStrength = calculatePreflopHandStrength(player.cards);
  const handCategory = categorizeHand(startingHandStrength);
  
  if (playerResult.isWinner) {
    if (handCategory === 'premium' || handCategory === 'strong') {
      analysis += ' You had a strong starting hand that held up through the showdown. Well played.';
    } else if (handCategory === 'playable' || handCategory === 'speculative') {
      analysis += ' Your medium-strength starting hand improved nicely. Good job seeing the potential and staying in the hand.';
    } else {
      analysis += ' You won with a relatively weak starting hand. Sometimes this works out, but be cautious about playing too many weak hands.';
    }
  } else {
    if (handCategory === 'premium' || handCategory === 'strong') {
      analysis += ' Even strong starting hands can be outdrawn. Consider how the board texture evolved and whether your betting strategy was optimal.';
    } else if (handCategory === 'playable' || handCategory === 'speculative') {
      analysis += ' Medium-strength starting hands often need to improve to win. Evaluate whether the pot odds justified your continued involvement.';
    } else {
      analysis += ' Weak starting hands usually need to hit the board very hard to win. Be selective about which hands you play, especially from early position.';
    }
  }
  
  return analysis;
}; 