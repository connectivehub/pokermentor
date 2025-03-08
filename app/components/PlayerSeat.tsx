import React from "react";
import { motion } from "framer-motion";
import Card from "./Card";
import Chip from "./Chip";
import { Player } from "../types";

// Default avatars
const DEFAULT_AVATARS = [
  "/images/avatar-1.png",
  "/images/avatar-2.png",
  "/images/avatar-3.png",
  "/images/avatar-4.png",
  "/images/avatar-5.png",
  "/images/avatar-6.png",
  "/images/avatar-7.png",
  "/images/avatar-8.png",
];

interface PlayerSeatProps {
  player: Player;
  isDealer: boolean;
  isCurrentPlayer: boolean;
  currentBet: number;
}

export default function PlayerSeat({
  player,
  isDealer,
  isCurrentPlayer,
  currentBet,
}: PlayerSeatProps) {
  const { id, name, balance, cards, betAmount, isFolded, isAllIn, type } =
    player;

  // Determine default avatar if none is set
  const avatar =
    player.avatar ||
    DEFAULT_AVATARS[player.seatPosition % DEFAULT_AVATARS.length];

  // Determine if player is human
  const isHuman = type === "human";

  // Determine card visibility
  const areCardsVisible = isHuman || isFolded;

  return (
    <div className={`relative ${isFolded ? "opacity-60" : ""}`}>
      {/* Dealer button */}
      {isDealer && (
        <motion.div
          className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-white text-casino-black font-bold rounded-full w-8 h-8 flex items-center justify-center border-2 border-casino-gold shadow-neon"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.3, type: "spring" }}
        >
          D
        </motion.div>
      )}

      {/* Current player indicator */}
      {isCurrentPlayer && (
        <motion.div
          className="absolute -left-2 top-1/2 transform -translate-y-1/2 w-1.5 h-10 bg-casino-gold rounded-full"
          animate={{
            x: [0, 4, 0],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            repeatType: "reverse",
          }}
        />
      )}

      <div
        className={`
        w-32 rounded-lg p-2
        ${
          isCurrentPlayer
            ? "bg-casino-black/80 border border-casino-gold"
            : "bg-casino-black/60"
        } 
        ${isHuman ? "shadow-neon" : ""}
        transition-all duration-200
      `}
      >
        {/* Player info */}
        <div className="flex items-center mb-2">
          {/* Avatar */}
          <div
            className="w-12 h-12 rounded-full overflow-hidden border-2 border-casino-gold shadow-neon mb-1"
            style={{ margin: "0 auto" }}
          >
            {avatar ? (
              <img
                src={avatar}
                alt={name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-casino-blue flex items-center justify-center">
                <span className="text-white font-bold">{name[0]}</span>
              </div>
            )}
          </div>

          {/* Name and balance */}
          <div className="flex-1">
            <div className="text-white font-casino text-sm truncate">
              {name}
            </div>
            <div className="text-green-400 font-digital text-xs">
              ${balance}
            </div>
          </div>
        </div>

        {/* Player cards */}
        <div className="flex justify-center space-x-1">
          {cards.map((card, index) => (
            <Card
              key={`player-${id}-card-${index}`}
              card={{
                ...card,
                faceUp: areCardsVisible,
              }}
              size="sm"
              isDealing={!isFolded}
              dealDelay={index * 0.2 + player.seatPosition * 0.1}
            />
          ))}
        </div>

        {/* Bet amount */}
        {betAmount > 0 && (
          <div className="absolute -bottom-14 left-1/2 transform -translate-x-1/2 flex flex-col items-center">
            <Chip
              value={betAmount}
              size="sm"
              isAnimated
              animationDelay={player.seatPosition * 0.1}
            />
            <div className="text-white text-xs mt-1">${betAmount}</div>
          </div>
        )}

        {/* Status indicators */}
        {(isFolded || isAllIn) && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
            <div
              className={`
              px-2 py-1 rounded font-bold text-white text-xs uppercase
              ${isFolded ? "bg-red-500/80" : "bg-blue-500/80"}
            `}
            >
              {isFolded ? "Folded" : "All-In"}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
