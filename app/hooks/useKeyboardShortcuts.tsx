import { useEffect, useState } from "react";
import { ActionType } from "../types";

type KeyAction = {
  key: string;
  action: ActionType;
  description: string;
};

type ActionMap = {
  [key in ActionType]?: () => void;
};

export const KEY_MAPPINGS: KeyAction[] = [
  { key: "f", action: ActionType.FOLD, description: "Fold your hand" },
  { key: "c", action: ActionType.CHECK, description: "Check (when no bet)" },
  { key: "c", action: ActionType.CALL, description: "Call a bet" },
  {
    key: "b",
    action: ActionType.BET,
    description: "Bet (when no previous bet)",
  },
  { key: "r", action: ActionType.RAISE, description: "Raise a bet" },
  { key: "a", action: ActionType.ALL_IN, description: "Go All-In" },
];

export default function useKeyboardShortcuts(actionHandlers: ActionMap) {
  const [isListening, setIsListening] = useState(true);

  // Enable/disable keyboard shortcuts
  const toggleListening = (state?: boolean) => {
    setIsListening(state !== undefined ? state : !isListening);
  };

  useEffect(() => {
    if (!isListening) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in input fields
      if (
        document.activeElement instanceof HTMLInputElement ||
        document.activeElement instanceof HTMLTextAreaElement
      ) {
        return;
      }

      const key = event.key.toLowerCase();

      // Check for matches in our key mappings
      const matchedAction = KEY_MAPPINGS.find((mapping) => mapping.key === key);

      if (matchedAction && actionHandlers[matchedAction.action]) {
        event.preventDefault();
        actionHandlers[matchedAction.action]?.();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [actionHandlers, isListening]);

  return { isListening, toggleListening };
}
