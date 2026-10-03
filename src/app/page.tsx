"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

export default function Home() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Check if player has already started or completed
  useEffect(() => {
    if (!localStorage.getItem("spiderverse_device_id")) {
      localStorage.setItem("spiderverse_device_id", crypto.randomUUID());
    }

    const checkExistingAttempt = async () => {
      try {
        const res = await fetch("/api/attempt");
        if (res.ok) {
          const data = await res.json();
          if (data.attempt) {
            if (data.attempt.status === 'completed') {
              router.push("/leaderboard");
            } else {
              router.push("/game");
            }
          }
        }
      } catch (err) {
        // Ignore errors, stay on login
      }
    };
    checkExistingAttempt();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) return;

    setLoading(true);
    setError("");

    try {
      const clientDeviceId = localStorage.getItem("spiderverse_device_id");
      
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, clientDeviceId }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 403 && data.completed) {
          // Already played!
          alert(data.error);
          router.push("/leaderboard");
        } else {
          setError(data.error || "Login failed");
          setLoading(false);
        }
      } else {
        // Success
        router.push("/game");
      }
    } catch (err) {
      console.error(err);
      setError("An unexpected error occurred.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="spider-web-bg opacity-50"></div>
      
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-md z-10 flex flex-col items-center"
      >
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-black mb-2 tracking-tighter text-glitch" data-text="SPIDER-VERSE">
            SPIDER-VERSE
          </h1>
          <h2 className="text-xl md:text-2xl font-bold text-white tracking-widest drop-shadow-[0_0_10px_rgba(255,0,255,0.8)]">
            N-QUEENS CHALLENGE
          </h2>
        </div>

        <div className="comic-panel p-8 w-full">
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            
            <AnimatePresence>
              {error && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-red-900/50 border border-red-500 text-red-200 p-3 text-sm font-bold text-center"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <div>
              <label className="block text-[var(--color-neon-cyan)] font-bold mb-2 uppercase text-sm tracking-widest">Player Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Miles Morales"
                required
                maxLength={30}
                className="w-full bg-black/50 border-2 border-white p-3 text-white outline-none focus:border-[var(--color-neon-cyan)] focus:shadow-[0_0_15px_rgba(0,240,255,0.5)] transition-all font-bold"
              />
            </div>
            
            <div>
              <label className="block text-[var(--color-neon-magenta)] font-bold mb-2 uppercase text-sm tracking-widest">Event Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-black/50 border-2 border-white p-3 text-white outline-none focus:border-[var(--color-neon-magenta)] focus:shadow-[0_0_15px_rgba(255,0,255,0.5)] transition-all font-bold"
              />
            </div>
            
            <button 
              type="submit" 
              className="comic-button w-full mt-4" 
              disabled={loading || !username.trim() || !password.trim()}
            >
              <span>{loading ? "INITIALIZING..." : "ENTER MULTIVERSE"}</span>
            </button>
          </form>
        </div>
      </motion.div>

      {/* Decorative dimensional portals */}
      <div className="absolute top-10 left-10 w-32 h-32 rounded-full border-4 border-dashed border-[#00f0ff] opacity-20 animate-[spin_10s_linear_infinite]"></div>
      <div className="absolute bottom-10 right-10 w-48 h-48 rounded-full border-4 border-dotted border-[#ff003c] opacity-20 animate-[spin_15s_linear_infinite_reverse]"></div>
    </div>
  );
}
