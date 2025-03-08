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

  // Position players around the table
  const getPlayerPosition = (seatPosition: number, totalPlayers: number) => {
    // Calculate position on a circle (0 is bottom center, moving clockwise)
    const angleIncrement = (2 * Math.PI) / totalPlayers;
    const angle = seatPosition * angleIncrement - Math.PI / 2; // Start from bottom

    // Table dimensions
    const tableWidth = 800;
    const tableHeight = 400;

    // Calculate position
    const radius = Math.min(tableWidth, tableHeight) * 0.45;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;

    return {
      x: x,
      y: y,
    };
  };

  return (
    <div className="relative w-full max-w-5xl mx-auto">
      {/* Poker table */}
      <div className="poker-table w-full aspect-[2/1] relative flex items-center justify-center">
        {/* Center area with community cards and pot */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {/* Community cards */}
          <div className="flex space-x-2 mb-6">
            {Array(5)
              .fill(null)
              .map((_, i) => (
                <Card
                  key={`community-${i}`}
                  card={communityCards[i]}
                  isDealing={communityCards[i] !== undefined}
                  dealDelay={i * 0.1}
                />
              ))}
          </div>

          {/* Pot display */}
          {pot > 0 && (
            <div className="flex flex-col items-center">
              <div className="chip-stack">
                <Chip value={pot} size="lg" isAnimated />
              </div>
              <div className="mt-2 text-white font-casino text-lg">
                Pot: ${pot}
              </div>
            </div>
          )}
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

        {/* Action buttons */}
        {isPlayerTurn && humanPlayer && (
          <motion.div
            className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex flex-col items-center"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            <div className="flex space-x-4 mb-4">
              {/* Fold button */}
              <button
                onClick={() => onAction(ActionType.FOLD)}
                className="casino-btn-red"
              >
                Fold <span className="keyboard-shortcut">F</span>
              </button>

              {/* Check/Call button */}
              {humanPlayer.betAmount === currentBet ? (
                <button
                  onClick={() => onAction(ActionType.CHECK)}
                  className="casino-btn-blue"
                  disabled={humanPlayer.betAmount !== currentBet}
                >
                  Check <span className="keyboard-shortcut">C</span>
                </button>
              ) : (
                <button
                  onClick={() => onAction(ActionType.CALL)}
                  className="casino-btn-blue"
                  disabled={humanPlayer.balance === 0}
                >
                  Call ${currentBet - humanPlayer.betAmount}{" "}
                  <span className="keyboard-shortcut">C</span>
                </button>
              )}

              {/* Bet/Raise button */}
              {currentBet === 0 ? (
                <button
                  onClick={() => onAction(ActionType.BET, betAmount)}
                  className="casino-btn"
                  disabled={humanPlayer.balance === 0}
                >
                  Bet <span className="keyboard-shortcut">B</span>
                </button>
              ) : (
                <button
                  onClick={() => onAction(ActionType.RAISE, betAmount)}
                  className="casino-btn"
                  disabled={
                    humanPlayer.balance <
                    currentBet + minBet - humanPlayer.betAmount
                  }
                >
                  Raise <span className="keyboard-shortcut">R</span>
                </button>
              )}

              {/* All-in button */}
              <button
                onClick={() => onAction(ActionType.ALL_IN)}
                className="casino-btn-green"
                disabled={humanPlayer.balance === 0}
              >
                All-In <span className="keyboard-shortcut">A</span>
              </button>
            </div>

            {/* Bet amount slider */}
            {(currentBet === 0 || currentBet > 0) &&
              humanPlayer.balance > 0 && (
                <div className="flex items-center space-x-4 w-full max-w-md">
                  <span className="text-white font-casino">${betAmount}</span>
                  <input
                    type="range"
                    min={
                      currentBet === 0
                        ? minBet
                        : currentBet + minBet - humanPlayer.betAmount
                    }
                    max={humanPlayer.balance}
                    value={betAmount}
                    onChange={(e) => setBetAmount(parseInt(e.target.value))}
                    className="w-full"
                  />
                  <button
                    onClick={() => setBetAmount(humanPlayer.balance)}
                    className="text-white hover:text-casino-gold transition-colors"
                  >
                    Max
                  </button>
                </div>
              )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
