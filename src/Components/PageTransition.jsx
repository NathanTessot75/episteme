import React from 'react';
import { motion } from 'framer-motion';

const animations = {
  // DÉPART : Légèrement en bas, invisible
  initial: { opacity: 0, y: 20 }, 
  
  // ARRIVÉE : Position normale, visible
  animate: { opacity: 1, y: 0 },  
  
  // SORTIE : Légèrement vers le haut, invisible (accélérée)
  exit: { opacity: 0, y: -20 }    
};

const PageTransition = ({ children }) => {
  return (
    <motion.div
      variants={animations}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ 
        type: "spring",
        stiffness: 400, // Beaucoup plus rapide (C'était 200 avant)
        damping: 35,    // Freinage sec pour éviter que ça rebondisse trop longtemps
        mass: 0.5       // Plus léger = démarre plus vite
      }}
      className="w-full h-full"
    >
      {children}
    </motion.div>
  );
};

export default PageTransition;