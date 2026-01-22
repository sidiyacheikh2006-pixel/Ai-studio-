import { useEffect, useRef } from 'react';

/**
 * Detects a 3-finger double-tap gesture.
 */
export const useMultiTouchGesture = (onTrigger: () => void, enabled: boolean = true) => {
  const lastTapTime = useRef(0);
  const tapCount = useRef(0);

  useEffect(() => {
    if (!enabled) return;

    const TIMEOUT = 600; // ms max between taps

    const handleTouchStart = (e: TouchEvent) => {
      // Check for exactly 3 fingers
      if (e.touches.length === 3) {
        const now = Date.now();

        if (now - lastTapTime.current < TIMEOUT) {
          tapCount.current += 1;
        } else {
          tapCount.current = 1;
        }

        lastTapTime.current = now;

        if (tapCount.current === 2) {
          // 3-finger Double Tap detected
          onTrigger();
          tapCount.current = 0; // Reset
        }
      }
    };

    window.addEventListener('touchstart', handleTouchStart);

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
    };
  }, [enabled, onTrigger]);
};