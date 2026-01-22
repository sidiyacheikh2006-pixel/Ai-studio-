import { useEffect, useRef } from 'react';

/**
 * Detects a "Triple Shake" pattern.
 * Logic: A shake is registered if acceleration > threshold.
 * We require 3 distinct shakes within a short time window.
 */
export const useShakeDetector = (onShake: () => void, enabled: boolean = true) => {
  const shakeCount = useRef(0);
  const lastShakeTime = useRef(0);
  
  useEffect(() => {
    if (!enabled) return;

    const THRESHOLD = 25; // m/s^2 (approx 2.5G)
    const SHAKE_COOLDOWN = 200; // ms between shakes
    const SEQUENCE_TIMEOUT = 1500; // ms to complete the sequence
    const REQUIRED_SHAKES = 3;

    const handleMotion = (event: DeviceMotionEvent) => {
      if (!event.accelerationIncludingGravity) return;
      
      const { x, y, z } = event.accelerationIncludingGravity;
      if (x === null || y === null || z === null) return;

      // Calculate magnitude of acceleration vector
      const magnitude = Math.sqrt(x*x + y*y + z*z);

      if (magnitude > THRESHOLD) {
        const now = Date.now();
        
        // Debounce: prevent single physical shake from registering multiple times
        if (now - lastShakeTime.current > SHAKE_COOLDOWN) {
          
          // If too much time passed since last shake, reset sequence
          if (now - lastShakeTime.current > SEQUENCE_TIMEOUT) {
            shakeCount.current = 0;
          }

          shakeCount.current += 1;
          lastShakeTime.current = now;

          if (shakeCount.current >= REQUIRED_SHAKES) {
            onShake();
            shakeCount.current = 0; // Reset after trigger
          }
        }
      }
    };

    // Check if permission is needed (iOS 13+)
    // For Android/Chrome, this usually just works.
    if (typeof (DeviceMotionEvent as any).requestPermission === 'function') {
      // We can't auto-request permission without a user gesture. 
      // This hook assumes permission is granted or not needed.
    }

    window.addEventListener('devicemotion', handleMotion);
    
    return () => {
      window.removeEventListener('devicemotion', handleMotion);
    };
  }, [enabled, onShake]);
};