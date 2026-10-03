"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function CompletionScreen({ params }: { params: Promise<{ level: string }> }) {
  const unwrappedParams = use(params);
  const n = parseInt(unwrappedParams.level);
  const router = useRouter();
  
  const [scoreData, setScoreData] = useState<{ time: number, moves: number, invalidMoves: number, score: number } | null>(null);

  useEffect(() => {
    const data = sessionStorage.getItem("last_score");
    if (data) {
      setScoreData(JSON.parse(data));
    } else {
      router.push("/levels");
    }
  }, [router]);

  if (!scoreData) return null;

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="spider-web-bg opacity-30"></div>
      
      <motion.div 
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", damping: 15 }}
        className="comic-panel p-8 md:p-12 w-full max-w-lg z-10 flex flex-col items-center"
      >
        <h2 className="text-4xl font-black mb-2 text-white text-glitch text-center" data-text="DIMENSION SECURED">
          DIMENSION SECURED
        </h2>
        <p className="text-gray-400 mb-8 font-light text-center">Score submitted to the Multiverse Web.</p>
        
        <div className="w-full space-y-4 mb-8">
          <div className="flex justify-between items-center border-b border-white/10 pb-2">
            <span className="text-gray-400 uppercase tracking-widest text-sm font-bold">Time</span>
            <span className="font-mono text-xl text-white">{formatTime(scoreData.time)}</span>
          </div>
          <div className="flex justify-between items-center border-b border-white/10 pb-2">
            <span className="text-gray-400 uppercase tracking-widest text-sm font-bold">Moves</span>
            <span className="font-mono text-xl text-white">{scoreData.moves}</span>
          </div>
          <div className="flex justify-between items-center border-b border-white/10 pb-2">
            <span className="text-gray-400 uppercase tracking-widest text-sm font-bold">Invalid Moves</span>
            <span className="font-mono text-xl text-[var(--color-neon-red)]">{scoreData.invalidMoves}</span>
          </div>
          <div className="flex justify-between items-center pt-2">
            <span className="text-[var(--color-neon-cyan)] font-black uppercase tracking-widest text-lg">Final Score</span>
            <span className="font-mono text-4xl text-[var(--color-neon-cyan)] font-black glow">{scoreData.score}</span>
          </div>
        </div>
        
        <div className="flex flex-col gap-4 w-full">
          <Link href={`/leaderboard?level=${n}`} className="comic-button text-center">
            <span>VIEW LEADERBOARD</span>
          </Link>
          <Link href="/levels" className="text-center text-gray-400 hover:text-white transition-colors uppercase font-bold text-sm tracking-widest py-2 mt-2">
            Return to Multiverse
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
