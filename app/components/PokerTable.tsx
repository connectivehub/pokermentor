import React from "react";
import { motion } from "framer-motion";
import Card from "./Card";
import Chip from "./Chip";
import PlayerSeat from "./PlayerSeat";
import { GameState, Player, ActionType } from "../types";
import { KEY_MAPPINGS } from "../hooks/useKeyboardShortcuts";
import styled from "styled-components";

interface PokerTableProps {
  gameState: GameState;
  onAction: (action: ActionType, amount?: number) => void;
  isPlayerTurn: boolean;
  betAmount: number;
  setBetAmount: (amount: number) => void;
  minBet: number;
  maxBet: number;
}

// Find the community cards container and add z-index
const CommunityCardsContainer = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  gap: 8px;
  z-index: 10; // Add this to ensure cards appear above players
`;

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
          <CommunityCardsContainer>
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
          </CommunityCardsContainer>

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

        {/* Player actions container - moved up to avoid advisor overlap */}
        <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 flex flex-col items-center z-40">
          {/* Game controls (fold, check, etc.) */}
          <div className="flex space-x-2 mb-4">
            {/* Controls buttons */}
            <button
              className="casino-btn px-4 py-2 text-sm"
              onClick={() => onAction(ActionType.FOLD)}
              disabled={!playerActions.canFold}
            >
              Fold <span className="keyboard-shortcut">F</span>
            </button>

            {/* Other buttons... */}
          </div>

          {/* Bet slider if applicable */}
          {(playerActions.canBet || playerActions.canRaise) && (
            <div className="w-64 flex items-center space-x-2">
              <input
                type="range"
                min={minBet}
                max={maxBet}
                value={betAmount}
                onChange={onBetChange}
                className="w-full"
              />
              <span className="text-white bg-casino-black/50 px-2 py-1 rounded text-sm">
                ${betAmount}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
