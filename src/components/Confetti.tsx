import { useEffect, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';

const DEFAULT_COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#F7DC6F', '#BB8FCE', '#82E0AA'];
const CHRISTMAS_COLORS = ['#c41e3a', '#2d5a27', '#ffd700', '#ffffff', '#ff6b6b', '#90EE90'];

export function Confetti() {
  const { isChristmas } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const colors = isChristmas ? CHRISTMAS_COLORS : DEFAULT_COLORS;

    for (let i = 0; i < 50; i++) {
      setTimeout(() => {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = `${Math.random() * 100}%`;
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.animationDuration = `${2 + Math.random() * 2}s`;
        confetti.style.animationDelay = `${Math.random() * 0.5}s`;
        container.appendChild(confetti);

        setTimeout(() => confetti.remove(), 5000);
      }, i * 50);
    }

    return () => {
      container.innerHTML = '';
    };
  }, [isChristmas]);

  return <div ref={containerRef} className="confetti-container" />;
}
