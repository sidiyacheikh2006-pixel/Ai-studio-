import { useCallback, useRef, useState } from 'react';
import { LongPressOptions } from '../types';

const useLongPress = (
  callback: () => void,
  { threshold = 2000, onStart, onFinish, onCancel }: LongPressOptions = {}
) => {
  const [isPressing, setIsPressing] = useState(false);
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const start = useCallback(() => {
    if (onStart) onStart();
    setIsPressing(true);
    timeout.current = setTimeout(() => {
      callback();
      if (onFinish) onFinish();
      setIsPressing(false);
    }, threshold);
  }, [callback, threshold, onStart, onFinish]);

  const clear = useCallback(() => {
    if (timeout.current) {
      clearTimeout(timeout.current);
      timeout.current = null;
    }
    if (isPressing) {
      setIsPressing(false);
      if (onCancel) onCancel();
    }
  }, [isPressing, onCancel]);

  return {
    onMouseDown: start,
    onMouseUp: clear,
    onMouseLeave: clear,
    onTouchStart: start,
    onTouchEnd: clear,
    onTouchMove: clear, // Cancel if user drags finger
  };
};

export default useLongPress;