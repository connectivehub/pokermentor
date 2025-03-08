import { useRef, useCallback, useEffect } from "react";
import { Howl } from "howler";

export type SoundEffectType =
  | "deal"
  | "check"
  | "bet"
  | "call"
  | "raise"
  | "fold"
  | "win"
  | "lose"
  | "allIn"
  | "flip"
  | "chips"
  | "shuffle"
  | "button";

interface SoundEffects {
  [key: string]: Howl;
}

export default function useSoundEffects(isMuted: boolean = false) {
  const soundsRef = useRef<SoundEffects | null>(null);
  const isLoadedRef = useRef<boolean>(false);

  // Preload all sound effects
  useEffect(() => {
    if (isLoadedRef.current) return;

    const sounds: SoundEffects = {
      deal: new Howl({ src: ["/sounds/deal.mp3"], volume: 0.5 }),
      check: new Howl({ src: ["/sounds/check.mp3"], volume: 0.5 }),
      bet: new Howl({ src: ["/sounds/bet.mp3"], volume: 0.5 }),
      call: new Howl({ src: ["/sounds/call.mp3"], volume: 0.5 }),
      raise: new Howl({ src: ["/sounds/raise.mp3"], volume: 0.5 }),
      fold: new Howl({ src: ["/sounds/fold.mp3"], volume: 0.4 }),
      win: new Howl({ src: ["/sounds/win.mp3"], volume: 0.6 }),
      lose: new Howl({ src: ["/sounds/lose.mp3"], volume: 0.5 }),
      allIn: new Howl({ src: ["/sounds/all-in.mp3"], volume: 0.6 }),
      flip: new Howl({ src: ["/sounds/flip.mp3"], volume: 0.5 }),
      chips: new Howl({ src: ["/sounds/chips.mp3"], volume: 0.5 }),
      shuffle: new Howl({ src: ["/sounds/shuffle.mp3"], volume: 0.5 }),
      button: new Howl({ src: ["/sounds/button.mp3"], volume: 0.3 }),
    };

    soundsRef.current = sounds;
    isLoadedRef.current = true;
  }, []);

  // Play a sound effect if not muted
  const playSound = useCallback(
    (type: SoundEffectType) => {
      if (isMuted || !soundsRef.current) return;

      const sound = soundsRef.current[type];
      if (sound) {
        sound.play();
      }
    },
    [isMuted]
  );

  // Stop a specific sound
  const stopSound = useCallback((type: SoundEffectType) => {
    if (!soundsRef.current) return;

    const sound = soundsRef.current[type];
    if (sound) {
      sound.stop();
    }
  }, []);

  // Stop all sounds
  const stopAllSounds = useCallback(() => {
    if (!soundsRef.current) return;

    Object.values(soundsRef.current).forEach((sound) => {
      sound.stop();
    });
  }, []);

  return { playSound, stopSound, stopAllSounds };
}
