import React from "react";
import { motion } from "framer-motion";
import { Card as CardType, Suit } from "../types";

interface CardProps {
  card?: CardType;
  isDealing?: boolean;
  isFlipping?: boolean;
  dealDelay?: number;
  size?: "sm" | "md" | "lg";
}

export default function Card({
  card,
  isDealing = false,
  isFlipping = false,
  dealDelay = 0,
  size = "md",
}: CardProps) {
  // Size classes
  const sizeClasses = {
    sm: "w-12 h-16",
    md: "w-16 h-22",
    lg: "w-20 h-28",
  };

  // If no card, show back of card or empty space
  if (!card) {
    return <div className={`${sizeClasses[size]} rounded-md bg-transparent`} />;
  }

  // Deal animation
  const dealAnimation = isDealing
    ? {
        initial: { y: -100, x: -50, opacity: 0, rotateZ: -15 },
        animate: { y: 0, x: 0, opacity: 1, rotateZ: 0 },
        transition: {
          type: "spring",
          stiffness: 200,
          damping: 20,
          delay: dealDelay,
        },
      }
    : {};

  // Flip animation
  const flipAnimation = isFlipping
    ? {
        initial: { rotateY: 0 },
        animate: { rotateY: 180 },
        transition: {
          duration: 0.5,
          delay: dealDelay,
        },
      }
    : {};

  // Combine animations
  const animation = isDealing ? dealAnimation : isFlipping ? flipAnimation : {};

  // Back of card
  if (!card.faceUp) {
    return (
      <motion.div
        className={`${sizeClasses[size]} poker-card flex items-center justify-center
                   bg-casino-blue border-2 border-white`}
        {...animation}
      >
        <div className="rounded-sm w-2/3 h-2/3 bg-white/10 flex items-center justify-center">
          <div className="text-white font-casino font-bold text-xl">PM</div>
        </div>
      </motion.div>
    );
  }

  // Determine card color
  const isRed = card.suit === Suit.HEARTS || card.suit === Suit.DIAMONDS;
  const textColor = isRed ? "text-casino-red" : "text-casino-black";

  // Suit symbol
  const suitSymbol = getSuitSymbol(card.suit);

  return (
    <motion.div
      className={`${sizeClasses[size]} poker-card flex flex-col p-1`}
      {...animation}
    >
      <div className="flex justify-between items-center w-full">
        <div className={`text-xs ${textColor} font-bold`}>{card.rank}</div>
        <div className={`text-xs ${textColor}`}>{suitSymbol}</div>
      </div>

      <div className="flex-grow flex items-center justify-center">
        <div className={`text-2xl ${textColor}`}>{suitSymbol}</div>
      </div>

      <div className="flex justify-between items-center w-full transform rotate-180">
        <div className={`text-xs ${textColor} font-bold`}>{card.rank}</div>
        <div className={`text-xs ${textColor}`}>{suitSymbol}</div>
      </div>
    </motion.div>
  );
}

// Helper to get suit symbol
function getSuitSymbol(suit: Suit): string {
  switch (suit) {
    case Suit.HEARTS:
      return "♥";
    case Suit.DIAMONDS:
      return "♦";
    case Suit.CLUBS:
      return "♣";
    case Suit.SPADES:
      return "♠";
    default:
      return "";
  }
}
