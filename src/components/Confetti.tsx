'use client';

import { useEffect, useState } from 'react';

interface ConfettiProps {
  active: boolean;
  duration?: number;
  targetRef?: React.RefObject<HTMLElement>;
}

export default function Confetti({ active, duration = 2000, targetRef }: ConfettiProps) {
  const [particles, setParticles] = useState<
    Array<{
      id: number;
      x: number;
      y: number;
      vx: number;
      vy: number;
      color: string;
      size: number;
    }>
  >([]);

  useEffect(() => {
    if (!active) return;

    const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3', '#54a0ff'];
    const newParticles = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      vx: (Math.random() - 0.5) * 4,
      vy: (Math.random() - 0.5) * 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: Math.random() * 6 + 2,
    }));

    setParticles(newParticles);

    const timer = setTimeout(() => {
      setParticles([]);
    }, duration);

    return () => clearTimeout(timer);
  }, [active, duration]);

  if (!active || particles.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute animate-bounce"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            backgroundColor: particle.color,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            borderRadius: '50%',
            animationDuration: '1s',
            animationDelay: `${Math.random() * 0.5}s`,
          }}
        />
      ))}
    </div>
  );
}
