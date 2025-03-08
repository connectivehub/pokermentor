import { useCallback, useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import * as kvStore from "../lib/kvStore";

// Local storage fallback for offline use
interface PersistedData {
  userId: string;
  sessionId: string;
  balance: number;
  handsPlayed: number;
  handsWon: number;
  lastUpdated: string;
}

const STORAGE_KEY = "pokermentor_game_data";

export default function useGamePersistence() {
  const [userData, setUserData] = useState<PersistedData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user data on component mount
  useEffect(() => {
    const loadUserData = async () => {
      setIsLoading(true);

      try {
        // First try to load from localStorage
        const storedData = localStorage.getItem(STORAGE_KEY);

        if (storedData) {
          // Data exists in localStorage
          const parsedData = JSON.parse(storedData) as PersistedData;
          setUserData(parsedData);

          // Sync with KV store (only if we have a userId)
          if (parsedData.userId) {
            // Get the latest balance from KV store
            const kvBalance = await kvStore.getUserBalance(parsedData.userId);

            // If the KV balance is different, update localStorage
            if (kvBalance !== parsedData.balance) {
              const updatedData = {
                ...parsedData,
                balance: kvBalance,
                lastUpdated: new Date().toISOString(),
              };

              localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedData));
              setUserData(updatedData);
            }
          }
        } else {
          // No data in localStorage, create new user data
          const userId = uuidv4();
          const sessionId = await kvStore.createSession(userId);
          const defaultBalance = 10000; // $10,000 starting balance

          const newData: PersistedData = {
            userId,
            sessionId: sessionId || uuidv4(), // Fallback if KV store fails
            balance: defaultBalance,
            handsPlayed: 0,
            handsWon: 0,
            lastUpdated: new Date().toISOString(),
          };

          localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
          setUserData(newData);
        }
      } catch (error) {
        console.error("Error loading user data:", error);
        // Fallback to new user data if there's an error
        const newData: PersistedData = {
          userId: uuidv4(),
          sessionId: uuidv4(),
          balance: 10000,
          handsPlayed: 0,
          handsWon: 0,
          lastUpdated: new Date().toISOString(),
        };

        localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
        setUserData(newData);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();
  }, []);

  // Update user balance
  const updateBalance = useCallback(
    async (newBalance: number) => {
      if (!userData) return;

      const updatedData = {
        ...userData,
        balance: newBalance,
        lastUpdated: new Date().toISOString(),
      };

      // Update localStorage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedData));
      setUserData(updatedData);

      // Update KV store
      try {
        await kvStore.updateUserBalance(userData.userId, newBalance);
      } catch (error) {
        console.error("Error updating KV store balance:", error);
      }
    },
    [userData]
  );

  // Record a hand result
  const recordHandResult = useCallback(
    async (won: boolean, profitAmount: number) => {
      if (!userData) return;

      const newBalance = userData.balance + profitAmount;
      const handsPlayed = userData.handsPlayed + 1;
      const handsWon = won ? userData.handsWon + 1 : userData.handsWon;

      const updatedData = {
        ...userData,
        balance: newBalance,
        handsPlayed,
        handsWon,
        lastUpdated: new Date().toISOString(),
      };

      // Update localStorage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedData));
      setUserData(updatedData);

      // Update KV store
      try {
        await kvStore.updateUserBalance(userData.userId, newBalance);
        await kvStore.updateSession(
          userData.sessionId,
          newBalance,
          handsPlayed,
          handsWon
        );

        // In a full implementation, you would also record the hand details
        // This would require passing in more data about the hand
      } catch (error) {
        console.error("Error updating KV store after hand:", error);
      }
    },
    [userData]
  );

  // Start a new session
  const startNewSession = useCallback(async () => {
    if (!userData) return;

    try {
      const sessionId = await kvStore.createSession(userData.userId);

      const updatedData = {
        ...userData,
        sessionId: sessionId || uuidv4(), // Fallback if KV store fails
        lastUpdated: new Date().toISOString(),
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedData));
      setUserData(updatedData);
    } catch (error) {
      console.error("Error creating new session:", error);

      // Fallback to local session ID if KV store fails
      const updatedData = {
        ...userData,
        sessionId: uuidv4(),
        lastUpdated: new Date().toISOString(),
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedData));
      setUserData(updatedData);
    }
  }, [userData]);

  // Reset user data (for testing)
  const resetUserData = useCallback(async () => {
    try {
      const userId = uuidv4();
      const sessionId = await kvStore.createSession(userId);

      const newData: PersistedData = {
        userId,
        sessionId: sessionId || uuidv4(), // Fallback if KV store fails
        balance: 10000,
        handsPlayed: 0,
        handsWon: 0,
        lastUpdated: new Date().toISOString(),
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
      setUserData(newData);
    } catch (error) {
      console.error("Error resetting user data:", error);

      // Fallback to local only if KV store fails
      const newData: PersistedData = {
        userId: uuidv4(),
        sessionId: uuidv4(),
        balance: 10000,
        handsPlayed: 0,
        handsWon: 0,
        lastUpdated: new Date().toISOString(),
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
      setUserData(newData);
    }
  }, []);

  return {
    userData,
    isLoading,
    updateBalance,
    recordHandResult,
    startNewSession,
    resetUserData,
  };
}
