import { motion } from "framer-motion";
import { ReactNode, useEffect, useState } from "react";
import { useLocation } from "wouter";

interface PageTransitionProps {
  children: ReactNode;
}

/**
 * PageTransition component wraps page content with smooth transition animations
 * between route changes. It uses framer-motion for animations and works with wouter.
 */
export function PageTransition({ children }: PageTransitionProps) {
  const [location] = useLocation();
  const [renderKey, setRenderKey] = useState(location);
  
  useEffect(() => {
    // Update the key when location changes to trigger animation
    setRenderKey(location);
  }, [location]);

  // Variants for page transitions
  const pageVariants = {
    initial: {
      opacity: 0,
      y: 10,
      scale: 0.99,
    },
    animate: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        mass: 0.6,
        damping: 25,
        stiffness: 300,
        duration: 0.3,
      },
    },
    exit: {
      opacity: 0,
      y: -10,
      transition: {
        duration: 0.2,
      },
    },
  };

  return (
    <motion.div
      key={renderKey}
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageVariants}
      className="w-full min-h-[75vh]"
      // Improve performance with hardware acceleration
      style={{ 
        willChange: "opacity, transform",
        transformStyle: "preserve-3d", 
        backfaceVisibility: "hidden"
      }}
    >
      {children}
    </motion.div>
  );
}