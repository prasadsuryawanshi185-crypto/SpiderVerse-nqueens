"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { SpiderQueen } from "@/components/SpiderQueen";
import { motion, AnimatePresence } from "framer-motion";

export default function GameScreen() {
  const router = useRouter();

  const [n, setN] = useState<number | null>(null);
  const [board, setBoard] = useState<number[][]>([]);
  const [time, setTime] = useState(0);
  const [moves, setMoves] = useState(0);
  const [invalidMoves, setInvalidMoves] = useState(0);
  const [levelStartTime, setLevelStartTime] = useState<number | null>(null);
  const [isLevelCompleted, setIsLevelCompleted] = useState(false);
  const [timerActive, setTimerActive] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [loading, setLoading] = useState(true);

  // Fetch current attempt
  useEffect(() => {
    const fetchAttempt = async () => {
      try {
        const res = await fetch("/api/attempt");
        if (!res.ok) {
          router.push("/");
          return;
        }
        const data = await res.json();
        const attempt = data.attempt;

        if (attempt.status === 'completed') {
          alert("You have already played this challenge on this device.");
          router.push("/leaderboard");
          return;
        }

        const level = attempt.currentLevel; // 4, 5, or 6
        setN(level);
        
        if (attempt.currentBoard && attempt.currentBoard.length === level) {
          setBoard(attempt.currentBoard);
        } else {
          setBoard(Array(level).fill(null).map(() => Array(level).fill(0)));
        }

        const startTs = new Date(attempt.levelStartTime).getTime();
        setLevelStartTime(startTs);
        setTime(Math.max(0, Math.floor((Date.now() - startTs) / 1000)));
        
        setMoves(attempt.currentMoves || 0);
        setInvalidMoves(attempt.currentInvalidMoves || 0);
        
        setIsLevelCompleted(false);
        setTimerActive(true);
        setLoading(false);
      } catch (e) {
        console.error(e);
        router.push("/");
      }
    };
    
    fetchAttempt();
  }, [router]);

  // Timer securely based on server timestamp
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timerActive && !isLevelCompleted && levelStartTime) {
      interval = setInterval(() => {
        setTime(Math.max(0, Math.floor((Date.now() - levelStartTime) / 1000)));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerActive, isLevelCompleted, levelStartTime]);

  const isValidPlacement = (currentBoard: number[][], row: number, col: number) => {
    if (!n) return false;
    // Check row and column
    for (let i = 0; i < n; i++) {
      if (i !== col && currentBoard[row][i] === 1) return false;
      if (i !== row && currentBoard[i][col] === 1) return false;
    }

    // Check diagonals
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (i === row && j === col) continue;
        if (currentBoard[i][j] === 1) {
          if (Math.abs(i - row) === Math.abs(j - col)) {
            return false;
          }
        }
      }
    }
    return true;
  };

  const checkCompletion = (currentBoard: number[][], currentMoves: number) => {
    if (!n) return;
    let queensCount = 0;
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        if (currentBoard[r][c] === 1) queensCount++;
      }
    }

    if (queensCount === n) {
      // Validate all queens
      let valid = true;
      for (let r = 0; r < n; r++) {
        for (let c = 0; c < n; c++) {
          if (currentBoard[r][c] === 1) {
            // temporarily remove to check
            currentBoard[r][c] = 0;
            if (!isValidPlacement(currentBoard, r, c)) {
              valid = false;
            }
            currentBoard[r][c] = 1;
          }
        }
      }

      if (valid) {
        handleLevelCompletion(currentMoves, currentBoard);
      }
    }
  };

  const syncState = (newBoard: number[][], newMoves: number, newInvalid: number) => {
    fetch("/api/attempt", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ board: newBoard, moves: newMoves, invalidMoves: newInvalid }),
    }).catch(e => console.error("Sync failed", e));
  };

  const handleLevelCompletion = async (finalMoves: number, finalBoard: number[][]) => {
    if (!n) return;
    setTimerActive(false);
    setIsLevelCompleted(true);
    
    // Submit level progress
    try {
      const res = await fetch("/api/attempt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          level: n,
          board: finalBoard,
          moves: finalMoves,
          invalidMoves
        }),
      });

      if (res.ok) {
        const data = await res.json();
        
        setTimeout(() => {
          if (data.isCompleted) {
            // Challenge completely finished
            router.push("/leaderboard");
          } else {
            // Proceed to next level
            setN(data.nextLevel);
            setBoard(Array(data.nextLevel).fill(null).map(() => Array(data.nextLevel).fill(0)));
            setTime(0);
            setMoves(0);
            setInvalidMoves(0);
            setIsLevelCompleted(false);
            setTimerActive(true);
          }
        }, 2500);
      } else {
        const data = await res.json();
        alert(`Error: ${data.error}`);
        if (res.status === 403) router.push("/leaderboard");
      }
    } catch (e) {
      console.error(e);
      alert("Failed to submit progress.");
    }
  };

  const showToastError = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 2000);
  };

  const attackedCells = useCallback(() => {
    if (!n) return [];
    const attacked = Array(n).fill(null).map(() => Array(n).fill(false));
    if (!board.length) return attacked;

    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        if (board[r][c] === 1) {
          // Attack row and column
          for (let i = 0; i < n; i++) {
            attacked[r][i] = true;
            attacked[i][c] = true;
          }
          // Attack diagonals
          for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
              if (Math.abs(r - i) === Math.abs(c - j)) {
                attacked[i][j] = true;
              }
            }
          }
        }
      }
    }
    return attacked;
  }, [board, n]);

  const handleCellClick = (row: number, col: number) => {
    if (isLevelCompleted || !board.length || !n) return;

    const newBoard = [...board.map(r => [...r])];
    
    if (newBoard[row][col] === 1) {
      // Remove queen
      newBoard[row][col] = 0;
      setBoard(newBoard);
      setMoves(m => m + 1);
      syncState(newBoard, moves + 1, invalidMoves);
    } else {
      const attacked = attackedCells();
      if (attacked[row][col]) {
        // Prevents placement on an attacked cell
        setInvalidMoves(i => i + 1);
        syncState(board, moves, invalidMoves + 1);
        showToastError("Conflict detected!");
        
        // Flash conflict cell
        const cell = document.getElementById(`cell-${row}-${col}`);
        if (cell) {
          cell.classList.add("invalid-conflict");
          setTimeout(() => {
            cell.classList.remove("invalid-conflict");
          }, 500);
        }
        return;
      }
      
      // Valid placement
      newBoard[row][col] = 1;
      setBoard(newBoard);
      setMoves(m => m + 1);
      syncState(newBoard, moves + 1, invalidMoves);
      
      checkCompletion(newBoard, moves + 1);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  if (loading || !n || !board.length) return <div className="min-h-screen bg-black text-white flex items-center justify-center font-comic text-2xl animate-pulse text-[var(--color-neon-cyan)]">SYNCING WITH DIMENSION...</div>;

  const currentAttacks = attackedCells();

  return (
    <div className="min-h-screen flex flex-col items-center p-4 relative overflow-hidden">
      
      {/* Spider-Verse Graffiti & Web Decor */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="spider-web-bg opacity-40"></div>
        
        {/* Subtle Graffiti */}
        <div className="absolute top-[20%] left-[-5%] text-[120px] font-black text-transparent stroke-gray-800 opacity-20 rotate-[-15deg] uppercase tracking-tighter" style={{ WebkitTextStroke: '2px rgba(255, 0, 60, 0.3)' }}>
          ANOMALY
        </div>
        <div className="absolute bottom-[10%] right-[-5%] text-[100px] font-black text-transparent stroke-gray-800 opacity-20 rotate-[10deg] uppercase tracking-tighter" style={{ WebkitTextStroke: '2px rgba(0, 240, 255, 0.3)' }}>
          MULTIVERSE
        </div>

        {/* Corner Web 1 */}
        <svg className="absolute top-0 left-0 w-48 h-48 opacity-30 text-[var(--color-neon-cyan)]" viewBox="0 0 100 100" preserveAspectRatio="none">
          <path d="M0 0 L100 0 L0 100 Z" fill="none" stroke="currentColor" strokeWidth="1"/>
          <path d="M0 0 Q 50 10 100 0" fill="none" stroke="currentColor" strokeWidth="0.5"/>
          <path d="M0 0 Q 10 50 0 100" fill="none" stroke="currentColor" strokeWidth="0.5"/>
          <path d="M0 0 Q 40 40 80 80" fill="none" stroke="currentColor" strokeWidth="0.5"/>
          <path d="M0 33 Q 33 33 33 0" fill="none" stroke="currentColor" strokeWidth="0.5"/>
          <path d="M0 66 Q 66 66 66 0" fill="none" stroke="currentColor" strokeWidth="0.5"/>
        </svg>

        {/* Corner Web 2 */}
        <svg className="absolute bottom-0 right-0 w-64 h-64 opacity-20 text-[var(--color-neon-red)]" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ transform: 'rotate(180deg)' }}>
          <path d="M0 0 L100 0 L0 100 Z" fill="none" stroke="currentColor" strokeWidth="1"/>
          <path d="M0 0 Q 50 10 100 0" fill="none" stroke="currentColor" strokeWidth="0.5"/>
          <path d="M0 0 Q 10 50 0 100" fill="none" stroke="currentColor" strokeWidth="0.5"/>
          <path d="M0 0 Q 40 40 80 80" fill="none" stroke="currentColor" strokeWidth="0.5"/>
          <path d="M0 33 Q 33 33 33 0" fill="none" stroke="currentColor" strokeWidth="0.5"/>
          <path d="M0 66 Q 66 66 66 0" fill="none" stroke="currentColor" strokeWidth="0.5"/>
        </svg>
      </div>

      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 z-50 bg-[var(--color-neon-red)] text-white font-bold py-2 px-6 rounded-full shadow-[0_0_15px_rgba(255,0,60,0.8)] border-2 border-white font-comic tracking-widest text-sm"
          >
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* HUD */}
      <div className="w-full max-w-4xl flex flex-wrap justify-between items-center mb-8 bg-black/80 border border-[var(--color-neon-cyan)] p-4 rounded-lg neon-border z-10 mt-12 md:mt-4">
        <div className="text-xl md:text-2xl font-bold font-comic text-[var(--color-neon-cyan)]">
          DIMENSION: {n} QUEENS
        </div>
        <div className="flex gap-4 md:gap-8 text-sm md:text-lg">
          <div className="flex flex-col items-center">
            <span className="text-gray-400">TIME</span>
            <span className="font-mono text-white text-xl">{formatTime(time)}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-gray-400">MOVES</span>
            <span className="font-mono text-white text-xl">{moves}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-gray-400 text-red-400">INVALID</span>
            <span className="font-mono text-red-500 text-xl">{invalidMoves}</span>
          </div>
        </div>
      </div>

      {/* Board */}
      <div className="relative z-10 flex-1 flex items-center justify-center w-full">
        <div 
          className="grid border-4 border-gray-800 shadow-[0_0_30px_rgba(0,240,255,0.2)] bg-black/50 backdrop-blur-sm"
          style={{ 
            gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))`,
            width: 'min(90vw, 60vh)',
            height: 'min(90vw, 60vh)'
          }}
        >
          {board.map((row, r) => (
            row.map((cell, c) => {
              const isBlack = (r + c) % 2 === 1;
              const isAttacked = cell === 0 && currentAttacks[r][c];
              
              return (
                <div 
                  key={`${r}-${c}`}
                  id={`cell-${r}-${c}`}
                  className={`board-cell aspect-square flex items-center justify-center cursor-pointer overflow-hidden transition-all duration-200
                    ${isBlack ? 'black' : 'white'}
                    ${isAttacked ? 'bg-[rgba(255,40,70,0.35)] shadow-[inset_0_0_18px_rgba(255,30,60,0.45)] border border-transparent z-10' : 'border border-white/5'}
                  `}
                  onClick={() => handleCellClick(r, c)}
                >
                  <div className="absolute inset-0 hover-highlight opacity-0 hover:opacity-100 bg-white/5 pointer-events-none transition-opacity duration-300"></div>
                  
                  <AnimatePresence>
                    {cell === 1 && (
                      <SpiderQueen 
                        size={Math.min(40, 60 * (4/n))} 
                        color={n === 4 ? "var(--color-neon-cyan)" : n === 5 ? "var(--color-neon-magenta)" : "var(--color-neon-red)"}
                      />
                    )}
                  </AnimatePresence>
                </div>
              );
            })
          ))}
        </div>

        {/* Completion Overlay */}
        <AnimatePresence>
          {isLevelCompleted && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute inset-0 flex items-center justify-center z-50 bg-black/80 backdrop-blur-md"
            >
              <div className="text-center">
                <h2 className="text-6xl font-black text-white text-glitch mb-4" data-text={n === 6 ? "CHALLENGE COMPLETE" : "DIMENSION CLEARED"}>
                  {n === 6 ? "CHALLENGE COMPLETE" : "DIMENSION CLEARED"}
                </h2>
                <p className="text-xl text-[var(--color-neon-cyan)] animate-pulse">
                  {n === 6 ? "Submitting Final Results..." : "Traveling to next dimension..."}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
