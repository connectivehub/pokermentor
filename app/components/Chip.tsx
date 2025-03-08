import React from "react";
import { motion } from "framer-motion";

type ChipColor = "white" | "red" | "blue" | "green" | "black";

interface ChipProps {
  value: number;
  size?: "sm" | "md" | "lg";
  isAnimated?: boolean;
  animationDelay?: number;
}

export default function Chip({
  value,
  size = "md",
  isAnimated = false,
  animationDelay = 0,
}: ChipProps) {
  // Get chip color based on value
  const chipColor = getChipColor(value);

  // Size classes
  const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-12 h-12 text-sm",
    lg: "w-16 h-16 text-base",
  };

  // Border color classes
  const borderColorClasses = {
    white: "border-gray-300",
    red: "border-casino-red/70",
    blue: "border-casino-blue/70",
    green: "border-casino-green/70",
    black: "border-gray-800",
  };

  // Background color classes
  const bgColorClasses = {
    white: "bg-chip-white",
    red: "bg-chip-red",
    blue: "bg-chip-blue",
    green: "bg-chip-green",
    black: "bg-chip-black",
  };

  // Text color classes
  const textColorClasses = {
    white: "text-chip-black",
    red: "text-white",
    blue: "text-white",
    green: "text-white",
    black: "text-white",
  };

  // Animation properties
  const animation = isAnimated
    ? {
        initial: { y: -50, opacity: 0 },
        animate: { y: 0, opacity: 1 },
        transition: {
          type: "spring",
          stiffness: 300,
          damping: 15,
          delay: animationDelay,
        },
      }
    : {};

  return (
    <motion.div
      className={`poker-chip ${sizeClasses[size]} ${bgColorClasses[chipColor]} ${borderColorClasses[chipColor]}`}
      {...animation}
    >
      <span className={`font-digital font-bold ${textColorClasses[chipColor]}`}>
        {formatChipValue(value)}
      </span>
    </motion.div>
  );
}

// Helper function to determine chip color based on value
function getChipColor(value: number): ChipColor {
  if (value <= 5) return "white";
  if (value <= 25) return "red";
  if (value <= 100) return "blue";
  if (value <= 500) return "green";
  return "black";
}

// Helper function to format chip value
function formatChipValue(value: number): string {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)}K`;
  }
  return value.toString();
}
