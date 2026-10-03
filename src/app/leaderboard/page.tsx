"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

type ScoreEntry = {
  username: string;
  totalTime: number;
  totalMoves: number;
  totalInvalidMoves: number;
  completedAt: string;
  isCurrentPlayer?: boolean;
};

export default function LeaderboardScreen() {
  const [data, setData] = useState<ScoreEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const rowRef = useRef<HTMLTableRowElement | null>(null);

  useEffect(() => {
    async function fetchLeaderboard() {
      setLoading(true);
      try {
        const res = await fetch(`/api/leaderboard`);
        if (res.ok) {
          const json = await res.json();
          setData(json.leaderboard || []);
        } else {
          console.error("Failed to fetch leaderboard");
          setData([]);
        }
      } catch (err) {
        console.error(err);
        setData([]);
      } finally {
        setLoading(false);
      }
    }
    fetchLeaderboard();
  }, []);

  // Auto-scroll when data loads and rowRef is populated
  useEffect(() => {
    if (!loading && data.length > 0) {
      // Small timeout to ensure DOM is fully painted
      setTimeout(() => {
        if (rowRef.current) {
          rowRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 500);
    }
  }, [loading, data]);

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
    <div className="min-h-screen flex flex-col items-center p-4 md:p-8 pt-12 relative pb-32">
      <div className="spider-web-bg opacity-30"></div>
      
      <div className="text-center mb-8 z-10">
        <h1 className="text-4xl md:text-7xl font-black text-white text-glitch tracking-tighter uppercase" data-text="FINAL LEADERBOARD">
          FINAL LEADERBOARD
        </h1>
        <p className="text-gray-400 mt-4 font-light">The greatest heroes of the Multiverse</p>
      </div>
      
      <div className="w-full max-w-5xl z-10">
        <div className="comic-panel p-1 md:p-6 bg-black/90">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-[var(--color-neon-cyan)] text-xs md:text-sm uppercase tracking-widest text-gray-400">
                  <th className="p-4 w-16 text-center">Rank</th>
                  <th className="p-4">Player</th>
                  <th className="p-4 text-center">Total Time</th>
                  <th className="p-4 text-center">Total Moves</th>
                  <th className="p-4 text-center">Invalid Moves</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-[var(--color-neon-cyan)] animate-pulse font-comic tracking-widest">
                      SYNCING ACROSS MULTIVERSE...
                    </td>
                  </tr>
                ) : data.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-gray-500 italic">
                      No heroes have completed the challenge yet.
                    </td>
                  </tr>
                ) : (
                  data.map((entry, idx) => {
                    const isMe = entry.isCurrentPlayer;
                    return (
                      <motion.tr 
                        key={idx}
                        ref={isMe ? rowRef : null}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: Math.min(idx * 0.05, 1) }} // cap delay for long lists
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
                          {entry.username}
                          {isMe && (
                            <span className="bg-[var(--color-neon-cyan)] text-black text-xs px-2 py-0.5 font-black uppercase tracking-widest rounded-sm transform -skew-x-12">
                              YOU
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-center font-mono">{formatTime(entry.totalTime)}</td>
                        <td className="p-4 text-center font-mono">{entry.totalMoves}</td>
                        <td className="p-4 text-center font-mono text-[var(--color-neon-red)]">{entry.totalInvalidMoves}</td>
                      </motion.tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Floating YOUR RANK Card */}
      <AnimatePresence>
        {!loading && currentPlayer && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-md"
          >
            <div 
              onClick={scrollToMyRank}
              className="cursor-pointer comic-panel bg-black/95 border-2 border-[var(--color-neon-magenta)] p-4 shadow-[0_0_20px_rgba(255,0,255,0.3)] hover:shadow-[0_0_30px_rgba(255,0,255,0.6)] transition-all flex flex-col gap-2"
            >
              <div className="flex justify-between items-end border-b border-white/10 pb-2">
                <span className="text-[var(--color-neon-magenta)] font-bold uppercase tracking-widest text-sm">YOUR RANK</span>
                <span className="text-3xl font-black font-comic text-white">#{currentPlayerIndex + 1}</span>
              </div>
              <div className="flex justify-between items-center text-sm md:text-base text-gray-300 font-mono">
                <span className="font-bold text-white font-sans truncate max-w-[100px]">{currentPlayer.username}</span>
                <span>•</span>
                <span>{formatTime(currentPlayer.totalTime)}</span>
                <span>•</span>
                <span>{currentPlayer.totalMoves} moves</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
