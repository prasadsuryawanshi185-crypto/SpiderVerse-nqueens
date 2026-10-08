"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

type ScoreEntry = {
  username: string;
  totalTime: number;
  totalMoves: number;
  totalInvalidMoves: number;
  completedAt: string;
  currentLevel: number;
  status: string;
  isCurrentPlayer?: boolean;
};

export default function LeaderboardScreen() {
  const [data, setData] = useState<ScoreEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const rowRef = useRef<HTMLTableRowElement | null>(null);
  const [initialScrollDone, setInitialScrollDone] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    async function fetchLeaderboard() {
      try {
        const res = await fetch(`/api/leaderboard`);
        if (res.ok) {
          const json = await res.json();
          setData(json.leaderboard || []);
        }
      } catch (err) {
        console.error("Failed to fetch leaderboard:", err);
      } finally {
        setLoading(false);
      }
    }
    
    fetchLeaderboard();
    interval = setInterval(fetchLeaderboard, 4000); // Poll every 4 seconds

    return () => clearInterval(interval);
  }, []);

  // Auto-scroll on initial load only
  useEffect(() => {
    if (!loading && data.length > 0 && !initialScrollDone) {
      setTimeout(() => {
        if (rowRef.current) {
          rowRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
          setInitialScrollDone(true);
        }
      }, 300);
    }
  }, [loading, data, initialScrollDone]);

  const scrollToMyRank = () => {
    if (rowRef.current) {
      rowRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}s`;
  };

  const currentPlayerIndex = data.findIndex(e => e.isCurrentPlayer);
  const currentPlayer = currentPlayerIndex !== -1 ? data[currentPlayerIndex] : null;

  return (
    <div className="min-h-screen flex flex-col items-center p-4 md:p-8 pt-12 relative">
      <div className="spider-web-bg opacity-30"></div>
      
      <div className="text-center mb-8 z-10">
        <h1 className="text-4xl md:text-7xl font-black text-white text-glitch tracking-tighter uppercase" data-text="LIVE LEADERBOARD">
          LIVE LEADERBOARD
        </h1>
        <p className="text-gray-400 mt-4 font-light">The greatest heroes of the Multiverse</p>
      </div>
      
      <div className="w-full max-w-5xl z-10 flex flex-col gap-6">
        
        {/* Leaderboard Table Container */}
        <div className="comic-panel p-1 md:p-6 bg-black/90 w-full">
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="border-b-2 border-[var(--color-neon-cyan)] text-xs md:text-sm uppercase tracking-widest text-gray-400">
                  <th className="p-4 w-16 text-center">Rank</th>
                  <th className="p-4">Player</th>
                  <th className="p-4 text-center">Level</th>
                  <th className="p-4 text-center">Total Time</th>
                  <th className="p-4 text-center">Moves</th>
                  <th className="p-4 text-center">Invalid</th>
                </tr>
              </thead>
              <tbody>
                {loading && data.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-[var(--color-neon-cyan)] animate-pulse font-comic tracking-widest">
                      SYNCING ACROSS MULTIVERSE...
                    </td>
                  </tr>
                ) : data.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-500 italic">
                      No heroes have progressed yet.
                    </td>
                  </tr>
                ) : (
                  <AnimatePresence>
                    {data.map((entry, idx) => {
                      const isMe = entry.isCurrentPlayer;
                      return (
                        <motion.tr 
                          key={entry.username} // Use username as key for correct animation tracking
                          layout // Smooth movement when ranks change!
                          ref={isMe ? rowRef : null}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`border-b transition-colors
                            ${isMe 
                              ? 'bg-[var(--color-neon-magenta)]/20 border-l-4 border-l-[var(--color-neon-magenta)] border-b-[var(--color-neon-magenta)]/30 glow-subtle' 
                              : 'border-white/10 hover:bg-white/5'}
                          `}
                        >
                          <td className="p-4 text-center font-bold text-xl font-comic" style={{ color: idx === 0 ? '#ffd700' : idx === 1 ? '#c0c0c0' : idx === 2 ? '#cd7f32' : 'white' }}>
                            #{idx + 1}
                          </td>
                          <td className="p-4 font-bold text-lg flex items-center gap-2">
                            <span className="truncate max-w-[120px] sm:max-w-[200px] md:max-w-[300px] inline-block">{entry.username}</span>
                            {isMe && (
                              <span className="bg-[var(--color-neon-cyan)] text-black text-xs px-2 py-0.5 font-black uppercase tracking-widest rounded-sm transform -skew-x-12 shrink-0">
                                YOU
                              </span>
                            )}
                          </td>
                          <td className="p-4 text-center font-bold text-[var(--color-neon-cyan)]">
                            {entry.status === 'completed' ? 'Completed' : `Level ${entry.currentLevel}`}
                          </td>
                          <td className="p-4 text-center font-mono">{formatTime(entry.totalTime)}</td>
                          <td className="p-4 text-center font-mono">{entry.totalMoves}</td>
                          <td className="p-4 text-center font-mono text-[var(--color-neon-red)]">{entry.totalInvalidMoves}</td>
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* YOUR RANK Card (Normal Document Flow) */}
        {!loading && currentPlayer && (
          <div 
            onClick={scrollToMyRank}
            className="cursor-pointer comic-panel bg-black/95 border-2 border-[var(--color-neon-magenta)] p-4 md:p-6 shadow-[0_0_20px_rgba(255,0,255,0.3)] hover:shadow-[0_0_30px_rgba(255,0,255,0.6)] transition-all flex flex-col gap-3 w-full"
          >
            <div className="flex justify-between items-end border-b border-white/10 pb-2">
              <span className="text-[var(--color-neon-magenta)] font-bold uppercase tracking-widest text-sm md:text-lg">YOUR RANK</span>
              <span className="text-3xl md:text-5xl font-black font-comic text-white">#{currentPlayerIndex + 1}</span>
            </div>
            <div className="flex flex-wrap justify-between items-center text-sm md:text-lg text-gray-300 font-mono gap-4">
              <span className="font-bold text-white font-sans truncate flex-1 min-w-[120px]">{currentPlayer.username}</span>
              <span className="text-[var(--color-neon-cyan)] font-bold">{currentPlayer.status === 'completed' ? 'Completed' : `Level ${currentPlayer.currentLevel}`}</span>
              <span>{formatTime(currentPlayer.totalTime)}</span>
              <span>{currentPlayer.totalMoves} moves</span>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
