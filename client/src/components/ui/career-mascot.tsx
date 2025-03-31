import React from 'react';
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

  // Get the appropriate compass mascot image based on the action
  const getMascotImage = () => {
    switch (action) {
      case 'loading':
        return (
          <svg width={pixelSize} height={pixelSize} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
            {/* Outer circle */}
            <circle cx="50" cy="50" r="45" stroke="#0C29AB" strokeWidth="6" fill="none" />
            
            {/* Cardinal points */}
            <path d="M50 5 L50 15" stroke="#0C29AB" strokeWidth="6" strokeLinecap="round" />
            <path d="M50 85 L50 95" stroke="#0C29AB" strokeWidth="6" strokeLinecap="round" />
            <path d="M5 50 L15 50" stroke="#0C29AB" strokeWidth="6" strokeLinecap="round" />
            <path d="M85 50 L95 50" stroke="#0C29AB" strokeWidth="6" strokeLinecap="round" />
            
            {/* Center pin */}
            <circle cx="50" cy="50" r="3" fill="#0C29AB" />
            
            {/* Spinning needle */}
            <motion.path
              d="M50 30 L50 70"
              stroke="#0C29AB"
              strokeWidth="4"
              strokeLinecap="round"
              fill="none"
              animate={{ rotate: 360 }}
              transition={{ 
                duration: 2, 
                repeat: Infinity, 
                ease: "linear" 
              }}
              style={{ transformOrigin: "50px 50px" }}
            />
            
            {/* Needle head */}
            <motion.path
              d="M40 40 L50 25 L60 40 Z"
              fill="#0C29AB"
              animate={{ rotate: 360 }}
              transition={{ 
                duration: 2, 
                repeat: Infinity, 
                ease: "linear" 
              }}
              style={{ transformOrigin: "50px 50px" }}
            />
          </svg>
        );
      case 'thinking':
        return (
          <svg width={pixelSize} height={pixelSize} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
            {/* Outer circle */}
            <circle cx="50" cy="50" r="45" stroke="#0C29AB" strokeWidth="6" fill="none" />
            
            {/* Cardinal points */}
            <path d="M50 5 L50 15" stroke="#0C29AB" strokeWidth="6" strokeLinecap="round" />
            <path d="M50 85 L50 95" stroke="#0C29AB" strokeWidth="6" strokeLinecap="round" />
            <path d="M5 50 L15 50" stroke="#0C29AB" strokeWidth="6" strokeLinecap="round" />
            <path d="M85 50 L95 50" stroke="#0C29AB" strokeWidth="6" strokeLinecap="round" />
            
            {/* Center pin */}
            <circle cx="50" cy="50" r="3" fill="#0C29AB" />
            
            {/* Oscillating needle */}
            <motion.path
              d="M50 30 L50 70"
              stroke="#0C29AB"
              strokeWidth="4"
              strokeLinecap="round"
              fill="none"
              animate={{ rotate: [-30, 30, -30] }}
              transition={{ 
                duration: 3, 
                repeat: Infinity, 
                ease: "easeInOut" 
              }}
              style={{ transformOrigin: "50px 50px" }}
            />
            
            {/* Needle head */}
            <motion.path
              d="M40 40 L50 25 L60 40 Z"
              fill="#0C29AB"
              animate={{ rotate: [-30, 30, -30] }}
              transition={{ 
                duration: 3, 
                repeat: Infinity, 
                ease: "easeInOut" 
              }}
              style={{ transformOrigin: "50px 50px" }}
            />
            
            {/* Thinking bubble */}
            <motion.path
              d="M75 25 Q 85 20 80 15"
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
            {/* Outer circle */}
            <circle cx="50" cy="50" r="45" stroke="#0C29AB" strokeWidth="6" fill="none" />
            
            {/* Cardinal points */}
            <path d="M50 5 L50 15" stroke="#0C29AB" strokeWidth="6" strokeLinecap="round" />
            <path d="M50 85 L50 95" stroke="#0C29AB" strokeWidth="6" strokeLinecap="round" />
            <path d="M5 50 L15 50" stroke="#0C29AB" strokeWidth="6" strokeLinecap="round" />
            <path d="M85 50 L95 50" stroke="#0C29AB" strokeWidth="6" strokeLinecap="round" />
            
            {/* Center pin */}
            <circle cx="50" cy="50" r="3" fill="#0C29AB" />
            
            {/* Needle pointing north */}
            <motion.path
              d="M50 30 L50 70"
              stroke="#0C29AB"
              strokeWidth="4"
              strokeLinecap="round"
              fill="none"
              initial={{ rotate: 180 }}
              animate={{ rotate: 0 }}
              transition={{ 
                duration: 0.8,
                type: "spring",
                stiffness: 100
              }}
              style={{ transformOrigin: "50px 50px" }}
            />
            
            {/* Needle head */}
            <motion.path
              d="M40 40 L50 25 L60 40 Z"
              fill="#0C29AB"
              initial={{ rotate: 180 }}
              animate={{ rotate: 0 }}
              transition={{ 
                duration: 0.8,
                type: "spring",
                stiffness: 100
              }}
              style={{ transformOrigin: "50px 50px" }}
            />
            
            {/* Success sparkle */}
            <motion.path
              d="M65 30 L 75 20 L 70 30 L 80 25"
              stroke="#FFD700"
              strokeWidth="3"
              strokeLinecap="round"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ 
                delay: 0.5,
                duration: 0.3
              }}
            />
          </svg>
        );
      case 'achievement':
        return (
          <svg width={pixelSize} height={pixelSize} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
            {/* Outer circle */}
            <circle cx="50" cy="50" r="45" stroke="#0C29AB" strokeWidth="6" fill="none" />
            
            {/* Cardinal points */}
            <path d="M50 5 L50 15" stroke="#0C29AB" strokeWidth="6" strokeLinecap="round" />
            <path d="M50 85 L50 95" stroke="#0C29AB" strokeWidth="6" strokeLinecap="round" />
            <path d="M5 50 L15 50" stroke="#0C29AB" strokeWidth="6" strokeLinecap="round" />
            <path d="M85 50 L95 50" stroke="#0C29AB" strokeWidth="6" strokeLinecap="round" />
            
            {/* Center pin */}
            <circle cx="50" cy="50" r="3" fill="#0C29AB" />
            
            {/* Fixed needle pointing north */}
            <path
              d="M50 30 L50 70"
              stroke="#0C29AB"
              strokeWidth="4"
              strokeLinecap="round"
              fill="none"
            />
            
            {/* Needle head */}
            <path
              d="M40 40 L50 25 L60 40 Z"
              fill="#0C29AB"
            />
            
            {/* Achievement medal */}
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
              <circle cx="75" cy="25" r="12" fill="#FFD700" stroke="#0C29AB" strokeWidth="2" />
              <path d="M70 25 L 80 25 M 75 20 L 75 30" stroke="#0C29AB" strokeWidth="2" strokeLinecap="round" />
            </motion.g>
            
            {/* Sparkles around compass */}
            <motion.path
              d="M20 20 L 25 25 M 80 80 L 75 75 M 20 80 L 25 75"
              stroke="#FFD700"
              strokeWidth="2"
              strokeLinecap="round"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.4 }}
            />
          </svg>
        );
      default:
        return (
          <svg width={pixelSize} height={pixelSize} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
            {/* Default static compass */}
            <circle cx="50" cy="50" r="45" stroke="#0C29AB" strokeWidth="6" fill="none" />
            <path d="M50 5 L50 15" stroke="#0C29AB" strokeWidth="6" strokeLinecap="round" />
            <path d="M50 85 L50 95" stroke="#0C29AB" strokeWidth="6" strokeLinecap="round" />
            <path d="M5 50 L15 50" stroke="#0C29AB" strokeWidth="6" strokeLinecap="round" />
            <path d="M85 50 L95 50" stroke="#0C29AB" strokeWidth="6" strokeLinecap="round" />
            <circle cx="50" cy="50" r="3" fill="#0C29AB" />
            <path d="M50 30 L50 70" stroke="#0C29AB" strokeWidth="4" strokeLinecap="round" />
            <path d="M40 40 L50 25 L60 40 Z" fill="#0C29AB" />
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