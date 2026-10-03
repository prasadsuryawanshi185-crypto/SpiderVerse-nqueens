import { motion } from "framer-motion";

export function SpiderQueen({ size = 40, color = "#ff003c" }: { size?: number, color?: string }) {
  return (
    <motion.div 
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
      className="relative flex items-center justify-center pointer-events-none"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Abstract Web/Queen Base */}
        <path d="M50 10 L60 30 L90 40 L65 55 L75 85 L50 70 L25 85 L35 55 L10 40 L40 30 Z" fill={color} opacity="0.8" />
        
        {/* Core Diamond */}
        <path d="M50 20 L70 50 L50 80 L30 50 Z" fill="white" />
        
        {/* Cyber/Spider Legs */}
        <path d="M50 50 L95 20 M50 50 L95 80 M50 50 L5 20 M50 50 L5 80" stroke="white" strokeWidth="3" strokeLinecap="round" />
        
        {/* Crown Element */}
        <path d="M35 15 L50 5 L65 15" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        
        {/* Glowing Center */}
        <circle cx="50" cy="50" r="8" fill={color} />
      </svg>
      
      {/* Glitch Overlay Effect */}
      <motion.div 
        animate={{ 
          opacity: [0, 0.5, 0],
          x: [-2, 2, -2],
        }}
        transition={{ repeat: Infinity, duration: 0.2, ease: "linear" }}
        className="absolute inset-0 mix-blend-screen pointer-events-none"
      >
        <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M50 10 L60 30 L90 40 L65 55 L75 85 L50 70 L25 85 L35 55 L10 40 L40 30 Z" fill="#00f0ff" opacity="0.5" transform="translate(-2, 0)" />
        </svg>
      </motion.div>
    </motion.div>
  );
}
