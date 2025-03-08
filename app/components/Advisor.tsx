import React from "react";
import { motion } from "framer-motion";
import { Advice, AdviceType, GameStage, Card as CardType } from "../types";
import Card from "./Card";

interface AdvisorProps {
  advice: Advice[];
  isEnabled: boolean;
  toggleEnabled: () => void;
  holeCards: CardType[];
  stage: GameStage;
}

export default function Advisor({
  advice,
  isEnabled,
  toggleEnabled,
  holeCards,
  stage,
}: AdvisorProps) {
  if (!isEnabled) {
    return (
      <div className="fixed bottom-4 right-4 z-10">
        <button
          onClick={toggleEnabled}
          className="casino-btn-blue flex items-center space-x-2 px-4 py-2"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
            />
          </svg>
          <span>Show Advisor</span>
        </button>
      </div>
    );
  }

  return (
    <motion.div
      className="fixed bottom-4 right-4 w-80 bg-casino-black/90 border border-casino-gold rounded-lg shadow-neon p-4 z-10"
      initial={{ x: 300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 300, opacity: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
    >
      {/* Header with toggle */}
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-white font-casino text-lg">Poker Advisor</h3>
        <button
          onClick={toggleEnabled}
          className="text-white hover:text-casino-gold transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {/* Current hand information */}
      <div className="mb-4">
        <h4 className="text-casino-gold text-sm uppercase font-bold mb-2">
          Your Hand
        </h4>
        <div className="flex justify-center space-x-2 mb-2">
          {holeCards.map((card, index) => (
            <Card
              key={`advisor-card-${index}`}
              card={{ ...card, faceUp: true }}
              size="sm"
            />
          ))}
        </div>
        <div className="text-white text-sm">{getStageDescription(stage)}</div>
      </div>

      {/* Advice sections */}
      <div className="space-y-4 max-h-64 overflow-y-auto pr-1">
        {advice.map((item, index) => (
          <AdvisorItem key={`advice-${index}`} advice={item} />
        ))}
      </div>

      {/* Hand chart reference */}
      <div className="mt-4 pt-3 border-t border-white/20">
        <button className="text-casino-gold hover:text-white text-sm underline">
          View Poker Hand Rankings Chart
        </button>
      </div>
    </motion.div>
  );
}

// Individual advice item
function AdvisorItem({ advice }: { advice: Advice }) {
  // Icon for the advice type
  const getAdviceIcon = (type: AdviceType) => {
    switch (type) {
      case AdviceType.PREFLOP_CHART:
        return (
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
        );
      case AdviceType.POSITION:
        return (
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        );
      case AdviceType.ODDS:
        return (
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
            />
          </svg>
        );
      case AdviceType.READING:
        return (
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 16l2.879-2.879m0 0a3 3 0 104.243-4.242 3 3 0 00-4.243 4.242zM21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
      case AdviceType.BETTING:
        return (
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
      default:
        return (
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
    }
  };

  // Background color based on importance
  const getImportanceColor = (importance: number) => {
    if (importance >= 8) return "bg-casino-red/20 border-casino-red";
    if (importance >= 6) return "bg-casino-blue/20 border-casino-blue";
    return "bg-casino-green/20 border-casino-green";
  };

  return (
    <div
      className={`advisor-suggestion ${getImportanceColor(
        advice.importance
      )} relative`}
    >
      <div className="flex items-start">
        <div className="text-white mr-2 mt-0.5">
          {getAdviceIcon(advice.type)}
        </div>
        <div>
          <p className="text-white text-sm">{advice.message}</p>

          {/* Additional metrics if available */}
          {(advice.handStrength !== undefined ||
            advice.winProbability !== undefined) && (
            <div className="flex space-x-3 mt-2 text-xs text-white/80">
              {advice.handStrength !== undefined && (
                <div>
                  Hand Strength:{" "}
                  <span className="text-casino-gold">
                    {advice.handStrength.toFixed(1)}%
                  </span>
                </div>
              )}
              {advice.winProbability !== undefined && (
                <div>
                  Win Probability:{" "}
                  <span className="text-casino-gold">
                    {advice.winProbability.toFixed(1)}%
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Helper function to describe the current game stage
function getStageDescription(stage: GameStage): string {
  switch (stage) {
    case GameStage.PREFLOP:
      return "Pre-flop betting round";
    case GameStage.FLOP:
      return "Flop - First three community cards";
    case GameStage.TURN:
      return "Turn - Fourth community card";
    case GameStage.RIVER:
      return "River - Final community card";
    case GameStage.SHOWDOWN:
      return "Showdown - Compare hands to determine winner";
    default:
      return "";
  }
}
