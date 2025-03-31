import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Mascot action types
type MascotAction = 'loading' | 'thinking' | 'success' | 'achievement';

interface CareerMascotProps {
  action: MascotAction;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function CareerMascot({ action, className = '', size = 'md' }: CareerMascotProps) {
  // Calculate size in pixels based on prop
  const sizeMap = {
    sm: 64,
    md: 96,
    lg: 128
  };
  
  const pixelSize = sizeMap[size];

  // Get the appropriate mascot image based on the action
  const getMascotImage = () => {
    // This would ideally use actual images, but for now we're using SVGs
    // In a real implementation, these would be replaced with proper character images
    switch (action) {
      case 'loading':
        return (
          <svg width={pixelSize} height={pixelSize} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
            <circle cx="50" cy="50" r="40" stroke="#0C29AB" strokeWidth="4" fill="none" />
            <motion.path
              d="M50 10 A 40 40 0 0 1 90 50"
              stroke="#0C29AB"
              strokeWidth="4"
              strokeLinecap="round"
              fill="none"
              animate={{ rotate: 360 }}
              transition={{ 
                duration: 1, 
                repeat: Infinity, 
                ease: "linear" 
              }}
              style={{ transformOrigin: "50px 50px" }}
            />
            <circle cx="40" cy="40" r="5" fill="#0C29AB" />
            <circle cx="60" cy="40" r="5" fill="#0C29AB" />
            <path d="M40 60 Q 50 70 60 60" stroke="#0C29AB" strokeWidth="3" fill="none" />
          </svg>
        );
      case 'thinking':
        return (
          <svg width={pixelSize} height={pixelSize} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
            <circle cx="50" cy="50" r="40" stroke="#0C29AB" strokeWidth="4" fill="none" />
            <circle cx="40" cy="40" r="5" fill="#0C29AB" />
            <circle cx="60" cy="40" r="5" fill="#0C29AB" />
            <motion.path 
              d="M40 60 L 60 60" 
              stroke="#0C29AB" 
              strokeWidth="3" 
              fill="none"
              animate={{ 
                d: ["M40 60 L 60 60", "M40 65 L 60 65", "M40 60 L 60 60"] 
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity, 
                repeatType: "reverse" 
              }}
            />
            <motion.path
              d="M75 30 Q 85 25 80 15"
              stroke="#0C29AB"
              strokeWidth="2"
              strokeDasharray="4 2"
              fill="none"
              initial={{ opacity: 0 }}
              animate={{ 
                opacity: [0, 1, 0],
                scale: [0.8, 1, 0.8]
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity,
                repeatType: "loop",
                times: [0, 0.5, 1] 
              }}
            />
          </svg>
        );
      case 'success':
        return (
          <svg width={pixelSize} height={pixelSize} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
            <circle cx="50" cy="50" r="40" stroke="#0C29AB" strokeWidth="4" fill="none" />
            <motion.circle 
              cx="40" 
              cy="40" 
              r="5" 
              fill="#0C29AB"
              animate={{ scaleY: [1, 0.4, 1] }}
              transition={{ 
                duration: 0.5, 
                repeat: 1, 
                repeatDelay: 2.5
              }}
            />
            <motion.circle 
              cx="60" 
              cy="40" 
              r="5" 
              fill="#0C29AB"
              animate={{ scaleY: [1, 0.4, 1] }}
              transition={{ 
                duration: 0.5, 
                repeat: 1, 
                repeatDelay: 2.5
              }}
            />
            <motion.path 
              d="M40 60 Q 50 70 60 60" 
              stroke="#0C29AB" 
              strokeWidth="3" 
              fill="none"
              animate={{ 
                d: ["M40 60 Q 50 70 60 60", "M36 65 Q 50 80 64 65", "M40 60 Q 50 70 60 60"] 
              }}
              transition={{ 
                duration: 0.5,
                delay: 1,
                repeat: 1,
                repeatDelay: 2
              }}
            />
            <motion.path
              d="M65 30 L 75 20 L 70 30 L 80 25"
              stroke="#FFD700"
              strokeWidth="3"
              strokeLinecap="round"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ 
                delay: 1.5,
                duration: 0.3
              }}
            />
          </svg>
        );
      case 'achievement':
        return (
          <svg width={pixelSize} height={pixelSize} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
            <circle cx="50" cy="50" r="40" stroke="#0C29AB" strokeWidth="4" fill="none" />
            <circle cx="40" cy="40" r="5" fill="#0C29AB" />
            <circle cx="60" cy="40" r="5" fill="#0C29AB" />
            <path d="M40 60 Q 50 70 60 60" stroke="#0C29AB" strokeWidth="3" fill="none" />
            <motion.g
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ 
                type: "spring",
                stiffness: 260,
                damping: 20,
                delay: 0.3
              }}
            >
              <circle cx="50" cy="25" r="15" fill="#FFD700" stroke="#0C29AB" strokeWidth="2" />
              <path d="M50 15 L 50 20 M 50 30 L 50 35 M 40 25 L 45 25 M 55 25 L 60 25" stroke="#0C29AB" strokeWidth="2" />
            </motion.g>
            <motion.path
              d="M20 20 L 25 25 M 80 20 L 75 25 M 20 80 L 25 75 M 80 80 L 75 75"
              stroke="#FFD700"
              strokeWidth="2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.4 }}
            />
          </svg>
        );
      default:
        return (
          <svg width={pixelSize} height={pixelSize} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
            <circle cx="50" cy="50" r="40" stroke="#0C29AB" strokeWidth="4" fill="none" />
            <circle cx="40" cy="40" r="5" fill="#0C29AB" />
            <circle cx="60" cy="40" r="5" fill="#0C29AB" />
            <path d="M40 60 Q 50 70 60 60" stroke="#0C29AB" strokeWidth="3" fill="none" />
          </svg>
        );
    }
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <AnimatePresence mode="wait">
        <motion.div
          key={action}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.2 }}
        >
          {getMascotImage()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}