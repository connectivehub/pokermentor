import React from "react";
import { motion } from "framer-motion";
import Card from "./Card";
import Chip from "./Chip";
import PlayerSeat from "./PlayerSeat";
import { GameState, Player, ActionType } from "../types";
import { KEY_MAPPINGS } from "../hooks/useKeyboardShortcuts";

interface PokerTableProps {
  gameState: GameState;
  onAction: (action: ActionType, amount?: number) => void;
  isPlayerTurn: boolean;
  betAmount: number;
  setBetAmount: (amount: number) => void;
  minBet: number;
  maxBet: number;
}

export default function PokerTable({
  gameState,
  onAction,
  isPlayerTurn,
  betAmount,
  setBetAmount,
  minBet,
  maxBet,
}: PokerTableProps) {
  const { players, communityCards, pot, currentBet, stage } = gameState;

  // Get the human player (always at position 0)
  const humanPlayer = players.find((player) => player.type === "human");

  // Determine available actions for the player
  const playerActions = {
    canFold: isPlayerTurn && humanPlayer && !humanPlayer.isFolded,
    canCheck:
      isPlayerTurn &&
      humanPlayer &&
      !humanPlayer.isFolded &&
      humanPlayer.betAmount >= currentBet,
    canCall:
      isPlayerTurn &&
      humanPlayer &&
      !humanPlayer.isFolded &&
      currentBet > humanPlayer.betAmount,
    canBet:
      isPlayerTurn && humanPlayer && !humanPlayer.isFolded && currentBet === 0,
    canRaise:
      isPlayerTurn && humanPlayer && !humanPlayer.isFolded && currentBet > 0,
  };

  // Handle bet slider change
  const onBetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBetAmount(parseInt(e.target.value));
  };

  // Position players around the table based on a more balanced elliptical layout
  const getPlayerPosition = (seatPosition: number, totalPlayers: number) => {
    // Calculate position on an ellipse (0 is bottom center, moving clockwise)
    const angleIncrement = (2 * Math.PI) / totalPlayers;
    const angle = seatPosition * angleIncrement - Math.PI / 2; // Start from bottom

    // Table dimensions - use width/height ratio of 2:1 for elliptical layout
    const tableWidth = 900;
    const tableHeight = 450;

    // Calculate position on ellipse
    const xRadius = tableWidth * 0.42;
    const yRadius = tableHeight * 0.42;

    // Position on ellipse
    const x = Math.cos(angle) * xRadius;
    const y = Math.sin(angle) * yRadius;

    return {
      x: x,
      y: y,
    };
  };

  return (
    <div className="relative w-full max-w-5xl mx-auto">
      {/* Poker table */}
      <div className="poker-table w-full aspect-[2/1] relative flex items-center justify-center">
        {/* Center area with community cards */}
        <div className="absolute inset-0 flex items-center justify-center">
          {/* Community cards - positioned in the center, but slightly above center */}
          <div
            className="absolute flex gap-2"
            style={{ top: "40%", transform: "translateY(-50%)" }}
          >
            {Array(5)
              .fill(null)
              .map((_, index) => {
                const card =
                  index < gameState.communityCards.length
                    ? gameState.communityCards[index]
                    : undefined;

                return (
                  <Card
                    key={`community-card-${index}`}
                    card={card}
                    isDealing={false}
                  />
                );
              })}
          </div>

          {/* Pot display - positioned below the community cards */}
          <div className="absolute text-center" style={{ top: "55%" }}>
            <div className="text-white font-casino text-xl mb-1">
              Pot: ${gameState.pot}
            </div>
            <div className="flex justify-center">
              <Chip value={gameState.pot} size="md" />
            </div>
          </div>
        </div>

        {/* Players around the table */}
        {players.map((player) => {
          const position = getPlayerPosition(
            player.seatPosition,
            players.length
          );
          return (
            <div
              key={player.id}
              className="absolute transform -translate-x-1/2 -translate-y-1/2"
              style={{
                left: `calc(50% + ${position.x}px)`,
                top: `calc(50% + ${position.y}px)`,
                zIndex: 5, // Keep players below cards but above table
              }}
            >
              <PlayerSeat
                player={player}
                isDealer={gameState.dealerIndex === players.indexOf(player)}
                isCurrentPlayer={
                  gameState.currentPlayerIndex === players.indexOf(player)
                }
                currentBet={currentBet}
              />
            </div>
          );
        })}
      </div>

      {/* Player actions container - moved completely outside the table for clarity */}
      {isPlayerTurn && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 flex flex-col items-center z-50 mt-4">
          {/* Game controls (fold, check, etc.) */}
          <div className="flex flex-wrap justify-center gap-2 mb-3 bg-black/40 p-3 rounded-lg">
            <button
              className="casino-btn px-5 py-3 text-base"
              onClick={() => onAction(ActionType.FOLD)}
              disabled={!playerActions.canFold}
            >
              Fold <span className="keyboard-shortcut">F</span>
            </button>

            <button
              className="casino-btn px-5 py-3 text-base"
              onClick={() => onAction(ActionType.CHECK)}
              disabled={!playerActions.canCheck}
            >
              Check <span className="keyboard-shortcut">C</span>
            </button>

            <button
              className="casino-btn px-5 py-3 text-base"
              onClick={() => onAction(ActionType.CALL)}
              disabled={!playerActions.canCall}
            >
              Call ${currentBet} <span className="keyboard-shortcut">A</span>
            </button>

            <button
              className="casino-btn px-5 py-3 text-base"
              onClick={() => onAction(ActionType.BET, betAmount)}
              disabled={!playerActions.canBet}
            >
              Bet <span className="keyboard-shortcut">B</span>
            </button>

            <button
              className="casino-btn px-5 py-3 text-base"
              onClick={() => onAction(ActionType.RAISE, betAmount)}
              disabled={!playerActions.canRaise}
            >
              Raise to ${betAmount} <span className="keyboard-shortcut">R</span>
            </button>
          </div>

          {/* Bet slider if applicable */}
          {(playerActions.canBet || playerActions.canRaise) && (
            <div className="w-80 flex items-center space-x-2 bg-black/40 p-3 rounded-lg">
              <input
                type="range"
                min={minBet}
                max={maxBet}
                value={betAmount}
                onChange={onBetChange}
                className="w-full"
              />
              <span className="text-white bg-casino-black/70 px-2 py-1 rounded text-base min-w-12 text-center">
                ${betAmount}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
