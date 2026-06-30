import { useRef } from 'react';

export function useDragToSwipe(onLeft: () => void, onRight: () => void) {
  const startX = useRef(0);
  return {
    onTouchStart: (e: React.TouchEvent) => { startX.current = e.touches[0].clientX; },
    onTouchEnd: (e: React.TouchEvent) => {
      const delta = e.changedTouches[0].clientX - startX.current;
      if (delta < -50) onLeft();
      else if (delta > 50) onRight();
    },
  };
}
