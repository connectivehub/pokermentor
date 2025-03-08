"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import PokerTable from "./components/PokerTable";
import Advisor from "./components/Advisor";
import CardComponent from "./components/Card";
import {
  GameState,
  GameStage,
  Player,
  PlayerType,
  PlayerStyle,
  ActionType,
  Action,
  Advice,
  HandEvaluation,
  Card,
} from "./types/index";
import {
  createDeck,
  dealCards,
  evaluateHand,
  canCheck,
  canCall,
  canBet,
  canRaise,
} from "./lib/gameUtils";
import { getPreflopAdvice, getPostflopAdvice } from "./lib/advisorUtils";
import useKeyboardShortcuts from "./hooks/useKeyboardShortcuts";
import useSoundEffects from "./hooks/useSoundEffects";
import useGamePersistence from "./hooks/useGamePersistence";
import { v4 as uuidv4 } from "uuid";

const PLAYER_NAMES = [
  "Tony",
  "Sophie",
  "Marcus",
  "Olivia",
  "Jackson",
  "Elena",
  "Raj",
];
const PLAYER_STYLES: PlayerStyle[] = [
  PlayerStyle.TIGHT_AGGRESSIVE,
  PlayerStyle.LOOSE_AGGRESSIVE,
  PlayerStyle.TIGHT_PASSIVE,
  PlayerStyle.LOOSE_PASSIVE,
  PlayerStyle.BALANCED,
];

// Define avatar URLs
const AVATAR_IMAGES = [
  "/images/avatars/avatar-1.png", // You
  "/images/avatars/avatar-2.png", // Jackson
  "/images/avatars/avatar-3.png", // Tony
  "/images/avatars/avatar-4.png", // Olivia
  "/images/avatars/avatar-5.png", // Sophie
  "/images/avatars/avatar-6.png", // Marcus
];

export default function Home() {
  // Game state
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isPlayerTurn, setIsPlayerTurn] = useState(false);
  const [betAmount, setBetAmount] = useState(10);
  const [gameStarted, setGameStarted] = useState(false);
  const [showdown, setShowdown] = useState<{
    winners: Player[];
    message: string;
  } | null>(null);

  // Advisor state
  const [advisorEnabled, setAdvisorEnabled] = useState(true);
  const [advice, setAdvice] = useState<Advice[]>([]);

  // Sound effects and game persistence
  const { playSound } = useSoundEffects();
  const { userData, updateBalance, recordHandResult } = useGamePersistence();

  // Initialize game state
  const initializeGame = useCallback(() => {
    if (!userData) return;

    // Create players
    const numOpponents = 5;
    const players: Player[] = [];

    // Human player
    players.push({
      id: userData.userId,
      name: "You",
      balance: userData.balance,
      cards: [],
      type: PlayerType.HUMAN,
      betAmount: 0,
      isActive: true,
      isFolded: false,
      isAllIn: false,
      seatPosition: 0, // Bottom center
    });

    // AI opponents
    for (let i = 0; i < numOpponents; i++) {
      players.push(
        createAIPlayer(
          PLAYER_NAMES[i % PLAYER_NAMES.length],
          5000 + Math.floor(Math.random() * 10000),
          PLAYER_STYLES[i % PLAYER_STYLES.length],
          i
        )
      );
    }

    // Initial dealer position (random)
    const dealerIndex = Math.floor(Math.random() * players.length);

    // Small and big blind positions
    const smallBlindIndex = (dealerIndex + 1) % players.length;
    const bigBlindIndex = (dealerIndex + 2) % players.length;

    // Initial game state
    const initialState: GameState = {
      players,
      currentPlayerIndex: (bigBlindIndex + 1) % players.length, // First to act
      dealerIndex,
      smallBlindIndex,
      bigBlindIndex,
      pot: 0,
      sidePots: [],
      communityCards: [],
      deck: createDeck(),
      stage: GameStage.PREFLOP,
      minBet: 10, // Small blind
      currentBet: 20, // Big blind
      lastRaiseAmount: 20,
      actionHistory: [],
      advisorEnabled,
    };

    // Post blinds
    const updatedPlayers = [...players];

    // Small blind
    updatedPlayers[smallBlindIndex].betAmount = initialState.minBet;
    updatedPlayers[smallBlindIndex].balance -= initialState.minBet;

    // Big blind
    updatedPlayers[bigBlindIndex].betAmount = initialState.currentBet;
    updatedPlayers[bigBlindIndex].balance -= initialState.currentBet;

    initialState.players = updatedPlayers;
    initialState.pot = initialState.minBet + initialState.currentBet;

    // Deal cards
    dealInitialCards(initialState);

    // Update game state
    setGameState(initialState);
    setBetAmount(initialState.currentBet * 2); // Default bet is 2x the big blind
    setGameStarted(true);

    // Check if it's player's turn
    setIsPlayerTurn(initialState.currentPlayerIndex === 0);

    // Generate preflop advice if advisor is enabled
    if (advisorEnabled && initialState.players[0].cards.length === 2) {
      const playerAdvice = getPreflopAdvice(
        initialState.players[0].cards,
        0, // Position
        initialState.players.length
      );
      setAdvice([playerAdvice]);
    }
  }, [userData, advisorEnabled]);

  // Deal initial cards to all players
  const dealInitialCards = (state: GameState) => {
    const deck = [...state.deck];
    const players = [...state.players];

    // Deal 2 cards to each player
    for (let i = 0; i < players.length; i++) {
      const { cards, remainingDeck } = dealCards(deck, 2);
      players[i].cards = cards;
      deck.splice(0, 2); // Remove dealt cards from deck
    }

    state.players = players;
    state.deck = deck;
  };

  // Deal community cards
  const dealCommunityCards = (state: GameState, count: number) => {
    const deck = [...state.deck];
    const { cards, remainingDeck } = dealCards(deck, count);

    // Mark cards as face up
    const faceUpCards = cards.map((card) => ({ ...card, faceUp: true }));

    state.communityCards = [...state.communityCards, ...faceUpCards];
    state.deck = remainingDeck;

    // Play dealing sound
    playSound("deal");
  };

  // Handle player action
  const handlePlayerAction = (action: ActionType, amount?: number) => {
    if (!gameState || !isPlayerTurn) return;

    // Play sound based on action
    playSound(action.toLowerCase() as any);

    // Execute action
    executeAction(0, action, amount);
  };

  // Execute an action for a player
  const executeAction = (
    playerIndex: number,
    action: ActionType,
    amount?: number
  ) => {
    if (!gameState) return;

    const newState = { ...gameState };
    const player = { ...newState.players[playerIndex] };

    // Record action
    const actionRecord: Action = {
      type: action,
      amount,
      player: { ...player },
    };

    newState.actionHistory = [...newState.actionHistory, actionRecord];

    // Process the action
    switch (action) {
      case ActionType.FOLD:
        player.isFolded = true;
        player.isActive = false;
        break;

      case ActionType.CHECK:
        // No action needed for check
        break;

      case ActionType.CALL:
        const callAmount = newState.currentBet - player.betAmount;
        player.balance -= callAmount;
        player.betAmount = newState.currentBet;
        newState.pot += callAmount;

        // Check if player is all-in
        if (player.balance === 0) {
          player.isAllIn = true;
        }
        break;

      case ActionType.BET:
        if (amount) {
          player.balance -= amount;
          player.betAmount = amount;
          newState.pot += amount;
          newState.currentBet = amount;
          newState.lastRaiseAmount = amount;

          // Check if player is all-in
          if (player.balance === 0) {
            player.isAllIn = true;
          }
        }
        break;

      case ActionType.RAISE:
        if (amount) {
          const raiseAmount = amount;
          const totalBet = newState.currentBet + raiseAmount;
          const amountToCall = totalBet - player.betAmount;

          player.balance -= amountToCall;
          player.betAmount = totalBet;
          newState.pot += amountToCall;
          newState.currentBet = totalBet;
          newState.lastRaiseAmount = raiseAmount;

          // Check if player is all-in
          if (player.balance === 0) {
            player.isAllIn = true;
          }
        }
        break;

      case ActionType.ALL_IN:
        const allInAmount = player.balance;
        if (allInAmount > 0) {
          const newBetAmount = player.betAmount + allInAmount;
          player.balance = 0;
          player.betAmount = newBetAmount;
          newState.pot += allInAmount;
          player.isAllIn = true;

          // Update current bet if the all-in amount is higher
          if (newBetAmount > newState.currentBet) {
            newState.currentBet = newBetAmount;
            newState.lastRaiseAmount = newBetAmount - newState.currentBet;
          }
        }
        break;
    }

    // Update player in state
    newState.players[playerIndex] = player;

    // Move to next player
    moveToNextPlayer(newState);

    // Update game state
    setGameState(newState);

    // Set player turn
    setIsPlayerTurn(
      newState.currentPlayerIndex === 0 &&
        !newState.players[0].isFolded &&
        !newState.players[0].isAllIn
    );
  };

  // Move to the next player
  const moveToNextPlayer = (state: GameState) => {
    let nextPlayerIndex = (state.currentPlayerIndex + 1) % state.players.length;

    // Find next active player
    while (
      (state.players[nextPlayerIndex].isFolded ||
        state.players[nextPlayerIndex].isAllIn) &&
      nextPlayerIndex !== state.currentPlayerIndex
    ) {
      nextPlayerIndex = (nextPlayerIndex + 1) % state.players.length;
    }

    // Check if betting round is complete
    if (isBettingRoundComplete(state, nextPlayerIndex)) {
      // Move to next stage
      moveToNextStage(state);
    } else {
      // Continue betting round
      state.currentPlayerIndex = nextPlayerIndex;
    }
  };

  // Check if betting round is complete
  const isBettingRoundComplete = (
    state: GameState,
    nextPlayerIndex: number
  ): boolean => {
    // If only one player is active, round is complete
    const activePlayers = state.players.filter((p) => !p.isFolded);
    if (activePlayers.length === 1) {
      return true;
    }

    // All players have acted and bets are matched or players are all-in
    const allBetsMatched = state.players.every(
      (player) =>
        player.isFolded ||
        player.isAllIn ||
        player.betAmount === state.currentBet
    );

    // If we've looped back to the first player to act in this round
    const isBackToFirstActor =
      nextPlayerIndex === state.bigBlindIndex &&
      state.stage === GameStage.PREFLOP;

    return (
      allBetsMatched &&
      (isBackToFirstActor || state.stage !== GameStage.PREFLOP)
    );
  };

  // Move to the next stage of the game
  const moveToNextStage = (state: GameState) => {
    // Reset betting
    state.players.forEach((player) => {
      if (!player.isFolded) {
        player.isActive = true;
      }
    });

    // Find the first active player after the dealer
    let firstToAct = (state.dealerIndex + 1) % state.players.length;
    while (
      state.players[firstToAct].isFolded &&
      firstToAct !== state.dealerIndex
    ) {
      firstToAct = (firstToAct + 1) % state.players.length;
    }

    state.currentPlayerIndex = firstToAct;
    state.currentBet = 0;
    state.players.forEach((player) => (player.betAmount = 0));

    // Move to next stage
    switch (state.stage) {
      case GameStage.PREFLOP:
        state.stage = GameStage.FLOP;
        dealCommunityCards(state, 3); // Deal flop
        break;

      case GameStage.FLOP:
        state.stage = GameStage.TURN;
        dealCommunityCards(state, 1); // Deal turn
        break;

      case GameStage.TURN:
        state.stage = GameStage.RIVER;
        dealCommunityCards(state, 1); // Deal river
        break;

      case GameStage.RIVER:
        state.stage = GameStage.SHOWDOWN;
        handleShowdown(state);
        break;
    }

    // Generate new advice for human player if it's not a showdown
    if (state.stage !== GameStage.SHOWDOWN && state.advisorEnabled) {
      const humanPlayer = state.players[0];
      if (!humanPlayer.isFolded) {
        const handEvaluation = evaluateHand(
          humanPlayer.cards,
          state.communityCards
        );
        const playerAdvice = getPostflopAdvice(
          state,
          humanPlayer,
          handEvaluation
        );
        setAdvice(playerAdvice);
      }
    }
  };

  // Handle showdown
  const handleShowdown = (state: GameState) => {
    // Reveal all cards
    state.players.forEach((player) => {
      if (!player.isFolded) {
        player.cards = player.cards.map((card) => ({ ...card, faceUp: true }));
      }
    });

    // Determine winner(s)
    const activePlayers = state.players.filter((player) => !player.isFolded);

    // Evaluate hands
    const playerWithHands = activePlayers.map((player) => {
      const handEvaluation = evaluateHand(player.cards, state.communityCards);
      return {
        ...player,
        handEvaluation,
      };
    });

    // Sort by hand strength (highest first)
    playerWithHands.sort(
      (a, b) => (b.handEvaluation?.value || 0) - (a.handEvaluation?.value || 0)
    );

    // Determine winners (players with the same highest hand value)
    const highestHandValue = playerWithHands[0].handEvaluation.value;
    const winners = playerWithHands.filter(
      (player) => player.handEvaluation.value === highestHandValue
    );

    // Distribute pot among winners
    const winAmount = Math.floor(state.pot / winners.length);

    winners.forEach((winner) => {
      const playerIndex = state.players.findIndex((p) => p.id === winner.id);
      if (playerIndex !== -1) {
        state.players[playerIndex].balance += winAmount;
      }
    });

    // Check if human player won
    const humanWon = winners.some(
      (winner) => winner.id === state.players[0].id
    );

    // Record the result
    if (userData) {
      const profit = humanWon
        ? winAmount - state.players[0].betAmount
        : -state.players[0].betAmount;
      recordHandResult(humanWon, profit);

      // Update balance in persistence
      updateBalance(state.players[0].balance);
    }

    // Create showdown message
    let message = "";
    if (winners.length === 1) {
      const winner = winners[0];
      message = `${winner.name} wins $${winAmount} with ${winner.handEvaluation.description}!`;
    } else {
      const winnerNames = winners.map((w) => w.name).join(", ");
      message = `Pot split between ${winnerNames}, each winning $${winAmount} with ${winners[0].handEvaluation.description}!`;
    }

    // Show result message
    setShowdown({
      winners,
      message,
    });

    // Play win/lose sound
    playSound(humanWon ? "win" : "lose");
  };

  // AI player action logic
  useEffect(() => {
    if (!gameState || !gameStarted || isPlayerTurn || showdown) return;

    // Delay AI actions for realism
    const aiActionDelay = setTimeout(() => {
      const currentPlayerIndex = gameState.currentPlayerIndex;
      const currentPlayer = gameState.players[currentPlayerIndex];

      // Skip if it's not an AI player
      if (currentPlayer.type !== PlayerType.AI) return;

      // Determine AI action based on hand strength, position, etc.
      const aiAction = determineAIAction(gameState, currentPlayerIndex);

      // Execute the action
      executeAction(currentPlayerIndex, aiAction.action, aiAction.amount);
    }, 1500);

    return () => clearTimeout(aiActionDelay);
  }, [gameState, isPlayerTurn, gameStarted, showdown]);

  // Determine AI action based on various factors
  const determineAIAction = (
    state: GameState,
    playerIndex: number
  ): { action: ActionType; amount?: number } => {
    const player = state.players[playerIndex];
    const playerStyle = player.style || PlayerStyle.BALANCED;
    const handEvaluation = evaluateHand(player.cards, state.communityCards);
    const handStrength = handEvaluation.strengthPercentile;

    // Can check?
    const canCheckAction = canCheck(state, player.id);
    // Can call?
    const canCallAction = canCall(state, player.id);
    // Can bet?
    const canBetAction = canBet(state, player.id);
    // Can raise?
    const canRaiseAction = canRaise(state, player.id);

    // Calculate call amount
    const callAmount = state.currentBet - player.betAmount;

    // Calculate pot odds
    const potOdds = callAmount / (state.pot + callAmount);

    // Adjust hand strength based on player style
    let adjustedHandStrength = handStrength;

    switch (playerStyle) {
      case PlayerStyle.TIGHT_AGGRESSIVE:
        // More selective with hands, but aggressive when playing
        adjustedHandStrength = handStrength * 0.8;
        break;
      case PlayerStyle.LOOSE_AGGRESSIVE:
        // Plays more hands, and aggressive
        adjustedHandStrength = handStrength * 1.2;
        break;
      case PlayerStyle.TIGHT_PASSIVE:
        // Selective with hands, and passive
        adjustedHandStrength = handStrength * 0.7;
        break;
      case PlayerStyle.LOOSE_PASSIVE:
        // Plays many hands, but passive
        adjustedHandStrength = handStrength * 1.1;
        break;
      // balanced stays at 1.0 multiplier
    }

    // Simple decision making
    if (canCheckAction) {
      // If can check, check with weak hands, bet with strong hands
      if (adjustedHandStrength > 70 && canBetAction) {
        // Strong hand - bet
        const betSize = determineBetSize(state, handStrength);
        return { action: ActionType.BET, amount: betSize };
      } else {
        // Weak to medium hand - check
        return { action: ActionType.CHECK };
      }
    } else if (canCallAction) {
      // Calling requires comparing pot odds to hand strength
      if (adjustedHandStrength / 100 > potOdds * 1.5) {
        // Hand strength justifies a raise
        if (adjustedHandStrength > 80 && canRaiseAction) {
          const raiseSize = determineRaiseSize(state, handStrength);
          return { action: ActionType.RAISE, amount: raiseSize };
        } else {
          // Call
          return { action: ActionType.CALL };
        }
      } else if (adjustedHandStrength / 100 > potOdds) {
        // Marginal call
        if (Math.random() < 0.7) {
          // 70% chance to call
          return { action: ActionType.CALL };
        } else {
          return { action: ActionType.FOLD };
        }
      } else {
        // Not worth calling
        if (Math.random() < 0.1) {
          // 10% chance to bluff
          return { action: ActionType.CALL };
        } else {
          return { action: ActionType.FOLD };
        }
      }
    } else {
      // Can't check or call (shouldn't happen in normal gameplay)
      return { action: ActionType.FOLD };
    }
  };

  // Determine bet size based on hand strength and stage
  const determineBetSize = (state: GameState, handStrength: number): number => {
    const potSizeBet = Math.min(
      state.pot * 0.75,
      state.players[state.currentPlayerIndex].balance
    );
    const minBet = state.minBet;

    // Scale bet size with hand strength
    const ratio = handStrength / 100;
    const betSize = Math.floor(minBet + (potSizeBet - minBet) * ratio);

    // Ensure minimum bet
    return Math.max(betSize, minBet);
  };

  // Determine raise size based on hand strength and stage
  const determineRaiseSize = (
    state: GameState,
    handStrength: number
  ): number => {
    const currentBet = state.currentBet;
    const minRaise = currentBet + state.lastRaiseAmount;
    const potSizeRaise = Math.min(
      state.pot,
      state.players[state.currentPlayerIndex].balance
    );

    // Scale raise size with hand strength
    const ratio = handStrength / 100;
    const raiseSize = Math.floor(minRaise + (potSizeRaise - minRaise) * ratio);

    // Ensure minimum raise
    return Math.max(raiseSize, minRaise);
  };

  // Keyboard shortcuts
  const actionHandlers = {
    [ActionType.FOLD]: () => handlePlayerAction(ActionType.FOLD),
    [ActionType.CHECK]: () =>
      canCheck(gameState!, gameState!.players[0].id) &&
      handlePlayerAction(ActionType.CHECK),
    [ActionType.CALL]: () =>
      canCall(gameState!, gameState!.players[0].id) &&
      handlePlayerAction(ActionType.CALL),
    [ActionType.BET]: () =>
      canBet(gameState!, gameState!.players[0].id) &&
      handlePlayerAction(ActionType.BET, betAmount),
    [ActionType.RAISE]: () =>
      canRaise(gameState!, gameState!.players[0].id) &&
      handlePlayerAction(ActionType.RAISE, betAmount),
    [ActionType.ALL_IN]: () => handlePlayerAction(ActionType.ALL_IN),
  };

  useKeyboardShortcuts(actionHandlers);

  // Toggle advisor
  const toggleAdvisor = () => {
    setAdvisorEnabled(!advisorEnabled);

    if (gameState) {
      setGameState({
        ...gameState,
        advisorEnabled: !advisorEnabled,
      });
    }
  };

  // Deal next hand
  const dealNextHand = () => {
    setShowdown(null);

    // Update dealer position
    if (gameState) {
      const newDealerIndex =
        (gameState.dealerIndex + 1) % gameState.players.length;
      const newSmallBlindIndex =
        (newDealerIndex + 1) % gameState.players.length;
      const newBigBlindIndex = (newDealerIndex + 2) % gameState.players.length;

      const newState: GameState = {
        ...gameState,
        dealerIndex: newDealerIndex,
        smallBlindIndex: newSmallBlindIndex,
        bigBlindIndex: newBigBlindIndex,
        currentPlayerIndex: (newBigBlindIndex + 1) % gameState.players.length,
        pot: 0,
        sidePots: [],
        communityCards: [],
        deck: createDeck(),
        stage: GameStage.PREFLOP,
        currentBet: gameState.minBet * 2, // Big blind
        lastRaiseAmount: gameState.minBet * 2,
        actionHistory: [],
      };

      // Reset player states
      newState.players = newState.players.map((player) => ({
        ...player,
        cards: [],
        betAmount: 0,
        isActive: true,
        isFolded: false,
        isAllIn: false,
      }));

      // Post blinds
      // Small blind
      newState.players[newSmallBlindIndex].betAmount = newState.minBet;
      newState.players[newSmallBlindIndex].balance -= newState.minBet;

      // Big blind
      newState.players[newBigBlindIndex].betAmount = newState.minBet * 2;
      newState.players[newBigBlindIndex].balance -= newState.minBet * 2;

      newState.pot = newState.minBet * 3;

      // Deal cards
      dealInitialCards(newState);

      // Update game state
      setGameState(newState);
      setBetAmount(newState.currentBet * 2); // Default bet is 2x the big blind

      // Check if it's player's turn
      setIsPlayerTurn(newState.currentPlayerIndex === 0);

      // Generate preflop advice if advisor is enabled
      if (advisorEnabled && newState.players[0].cards.length === 2) {
        const playerAdvice = getPreflopAdvice(
          newState.players[0].cards,
          0, // Position
          newState.players.length
        );
        setAdvice([playerAdvice]);
      }

      // Play shuffle sound
      playSound("shuffle");
    }
  };

  // Initialize the game when userData is loaded
  useEffect(() => {
    if (userData && !gameStarted) {
      initializeGame();
    }
  }, [userData, gameStarted, initializeGame]);

  // Start screen
  if (!gameState || !gameStarted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-casino-black text-white">
        <motion.div
          className="text-center"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-5xl font-casino text-casino-gold mb-6">
            Poker Mentor
          </h1>
          <p className="text-xl mb-8">
            Learn and master Texas Hold'em like a pro!
          </p>

          {userData ? (
            <button
              className="casino-btn text-xl px-8 py-4"
              onClick={initializeGame}
            >
              Start Game
            </button>
          ) : (
            <p>Loading game data...</p>
          )}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-casino-black p-4 pb-20">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-casino text-casino-gold">
            Poker Mentor
          </h1>

          {/* Player stats */}
          <div className="bg-casino-black/70 rounded-lg p-2 flex items-center space-x-4">
            <div className="text-white">
              <span className="text-gray-400">Balance:</span>{" "}
              <span className="font-digital text-green-400">
                ${gameState.players[0].balance}
              </span>
            </div>
            <div className="text-white">
              <span className="text-gray-400">Hands Won:</span>{" "}
              <span className="font-digital">
                {userData?.handsWon || 0}/{userData?.handsPlayed || 0}
              </span>
            </div>
          </div>
        </div>

        {/* Poker table */}
        <PokerTable
          gameState={gameState}
          onAction={handlePlayerAction}
          isPlayerTurn={isPlayerTurn}
          betAmount={betAmount}
          setBetAmount={setBetAmount}
          minBet={gameState.minBet}
          maxBet={gameState.players[0].balance}
        />

        {/* Advisor */}
        <div className="fixed bottom-4 right-4 z-30">
          <Advisor
            advice={advice}
            isEnabled={advisorEnabled}
            toggleEnabled={toggleAdvisor}
            holeCards={gameState.players[0].cards}
            stage={gameState.stage}
          />
        </div>

        {/* Showdown modal */}
        {showdown && (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50">
            <motion.div
              className="bg-casino-black border-4 border-casino-gold rounded-lg p-6 max-w-2xl mx-4 text-center shadow-neon"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", damping: 15 }}
            >
              <h2 className="text-3xl font-casino text-casino-gold mb-4">
                Showdown
              </h2>
              <p className="text-white text-xl mb-6">{showdown.message}</p>

              <div className="flex justify-center gap-4 mb-6">
                {showdown.winners.map((winner, i) => (
                  <div key={`winner-${i}`} className="text-center">
                    <div className="font-casino text-lg text-white mb-2">
                      {winner.name}
                    </div>
                    <div className="flex justify-center space-x-2 mb-2">
                      {winner.cards.map((card, j) => (
                        <CardComponent
                          key={`winner-${i}-card-${j}`}
                          card={{ ...card, faceUp: true }}
                          size="sm"
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <button
                className="casino-btn text-xl px-8 py-4"
                onClick={dealNextHand}
              >
                Deal Next Hand
              </button>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}

// Update AI player creation to include avatars
const createAIPlayer = (
  name: string,
  balance: number,
  style: PlayerStyle,
  position: number
): Player => {
  return {
    id: uuidv4(),
    name,
    balance,
    cards: [],
    type: PlayerType.AI,
    style,
    betAmount: 0,
    isActive: false,
    isFolded: false,
    isAllIn: false,
    avatar: AVATAR_IMAGES[position], // Add avatar image
    seatPosition: position,
  };
};
