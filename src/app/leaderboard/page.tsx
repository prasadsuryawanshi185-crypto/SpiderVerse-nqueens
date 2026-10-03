"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

type ScoreEntry = {
  username: string;
  totalTime: number;
  totalMoves: number;
  totalInvalidMoves: number;
  completedAt: string;
};

export default function LeaderboardScreen() {
  const [data, setData] = useState<ScoreEntry[]>([]);
  const [loading, setLoading] = useState(true);

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

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}s`;
  };

  return (
    <div className="min-h-screen flex flex-col items-center p-4 md:p-8 pt-12 relative">
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
                  data.map((entry, idx) => (
                    <motion.tr 
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="border-b border-white/10 hover:bg-white/5 transition-colors"
                    >
                      <td className="p-4 text-center font-bold text-xl font-comic" style={{ color: idx === 0 ? '#ffd700' : idx === 1 ? '#c0c0c0' : idx === 2 ? '#cd7f32' : 'white' }}>
                        #{idx + 1}
                      </td>
                      <td className="p-4 font-bold text-lg">{entry.username}</td>
                      <td className="p-4 text-center font-mono">{formatTime(entry.totalTime)}</td>
                      <td className="p-4 text-center font-mono">{entry.totalMoves}</td>
                      <td className="p-4 text-center font-mono text-[var(--color-neon-red)]">{entry.totalInvalidMoves}</td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        
      </div>
    </div>
  );
}
