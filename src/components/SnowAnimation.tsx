import { useEffect, useRef, useCallback } from 'react';
import { useTheme } from '../context/ThemeContext';

const SNOWFLAKES = ['❄', '❅', '❆', '✻', '✼', '❉', '✿', '•'];

export function SnowAnimation() {
  const { isChristmas } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<number | null>(null);

  const createSnowflake = useCallback((initialBatch: boolean) => {
    const container = containerRef.current;
    if (!container) return;

    const flake = document.createElement('div');
    flake.className = 'snowflake';
    flake.textContent = SNOWFLAKES[Math.floor(Math.random() * SNOWFLAKES.length)];
    flake.style.left = `${Math.random() * 100}%`;
    
    const size = 0.5 + Math.random() * 1.5;
    flake.style.fontSize = `${size}rem`;
    flake.style.opacity = String(0.3 + Math.random() * 0.7);
    
    const duration = 8 + Math.random() * 12;
    flake.style.animationDuration = `${duration}s`;

    if (initialBatch) {
      const startY = Math.random() * 100;
      flake.style.top = `${startY}vh`;
      flake.style.animationDelay = `-${Math.random() * duration}s`;
    }

    container.appendChild(flake);

    setTimeout(() => {
      flake.remove();
    }, duration * 1000 + 1000);
  }, []);

  useEffect(() => {
    if (!isChristmas) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
      return;
    }

    // Create initial batch
    for (let i = 0; i < 50; i++) {
      createSnowflake(true);
    }

    // Continuously add snowflakes
    intervalRef.current = window.setInterval(() => {
      createSnowflake(false);
      // Limit snowflakes
      const container = containerRef.current;
      if (container) {
        const flakes = container.querySelectorAll('.snowflake');
        if (flakes.length > 100) {
          flakes[0].remove();
        }
      }
    }, 200);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isChristmas, createSnowflake]);

  if (!isChristmas) return null;

  return <div ref={containerRef} className="snow-container" />;
}
