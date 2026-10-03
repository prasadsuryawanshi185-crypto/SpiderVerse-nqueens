"use client";

import { useState, useEffect, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import { SpiderQueen } from "@/components/SpiderQueen";
import { motion, AnimatePresence } from "framer-motion";

export default function GameScreen({ params }: { params: Promise<{ level: string }> }) {
  const unwrappedParams = use(params);
  const levelStr = unwrappedParams.level;
  const n = parseInt(levelStr);
  const router = useRouter();

  const [board, setBoard] = useState<number[][]>([]);
  const [playerName, setPlayerName] = useState("");
  const [playerId, setPlayerId] = useState("");
  const [time, setTime] = useState(0);
  const [moves, setMoves] = useState(0);
  const [invalidMoves, setInvalidMoves] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [timerActive, setTimerActive] = useState(true);

  const [toastMessage, setToastMessage] = useState("");

  // Initialize board
  useEffect(() => {
    if (isNaN(n) || n < 4 || n > 6) {
      router.push("/levels");
      return;
    }

    const name = localStorage.getItem("spiderverse_player_name");
    const pId = localStorage.getItem("spiderverse_player_id");
    
    if (!name || !pId) {
      router.push("/name");
      return;
    }
    
    // Anti-cheat check (client side)
    const completed = JSON.parse(localStorage.getItem("spiderverse_completed_levels") || "{}");
    if (completed[n]) {
      alert("Attempt already used for this level.");
      router.push("/levels");
      return;
    }

    setPlayerName(name);
    setPlayerId(pId);
    
    const initialBoard = Array(n).fill(null).map(() => Array(n).fill(0));
    setBoard(initialBoard);
  }, [n, router]);

  // Timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timerActive && !isCompleted && board.length > 0) {
      interval = setInterval(() => {
        setTime((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerActive, isCompleted, board]);

  const isValidPlacement = (currentBoard: number[][], row: number, col: number) => {
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

  const checkCompletion = useCallback((currentBoard: number[][]) => {
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
        handleCompletion();
      }
    }
  }, [n]);

  const handleCompletion = async () => {
    setTimerActive(false);
    setIsCompleted(true);
    
    const score = Math.max(0, 10000 - (time * 10) - (moves * 50) - (invalidMoves * 100));

    // Submit to server
    try {
      const res = await fetch("/api/scores", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          playerName,
          playerId,
          level: n,
          time,
          moves,
          invalidMoves,
          score
        }),
      });

      if (res.ok) {
        const completed = JSON.parse(localStorage.getItem("spiderverse_completed_levels") || "{}");
        completed[n] = true;
        localStorage.setItem("spiderverse_completed_levels", JSON.stringify(completed));
        
        // Store temp result to show on completion screen
        sessionStorage.setItem("last_score", JSON.stringify({ time, moves, invalidMoves, score }));
        
        setTimeout(() => {
          router.push(`/game/${n}/completion`);
        }, 2000);
      } else {
        const data = await res.json();
        alert(`Error: ${data.error}`);
        router.push("/levels");
      }
    } catch (e) {
      console.error(e);
      alert("Failed to submit score.");
    }
  };

  const showToastError = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 2000);
  };

  const attackedCells = useCallback(() => {
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
    if (isCompleted || !board.length) return;

    const newBoard = [...board.map(r => [...r])];
    
    if (newBoard[row][col] === 1) {
      // Remove queen
      newBoard[row][col] = 0;
      setBoard(newBoard);
      setMoves(m => m + 1);
    } else {
      const attacked = attackedCells();
      if (attacked[row][col]) {
        // Prevents placement on an attacked cell
        setInvalidMoves(i => i + 1);
        showToastError("Queen cannot be placed here.");
        
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
      
      checkCompletion(newBoard);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  if (!board.length) return <div className="min-h-screen bg-black text-white flex items-center justify-center">Loading...</div>;

  const currentAttacks = attackedCells();

  return (
    <div className="min-h-screen flex flex-col items-center p-4">
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
      <div className="w-full max-w-4xl flex flex-wrap justify-between items-center mb-8 bg-black/80 border border-[var(--color-neon-cyan)] p-4 rounded-lg neon-border z-10">
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
                    ${isAttacked ? 'bg-[rgba(255,40,70,0.35)] shadow-[inset_0_0_18px_rgba(255,30,60,0.45)] border border-[rgba(255,70,90,0.65)] z-10' : 'border border-white/5'}
                  `}
                  onClick={() => handleCellClick(r, c)}
                >
                  {/* Subtle highlight for affected row/col/diag on hover */}
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
          {isCompleted && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute inset-0 flex items-center justify-center z-50 bg-black/80 backdrop-blur-md"
            >
              <div className="text-center">
                <h2 className="text-6xl font-black text-white text-glitch mb-4" data-text="DIMENSION CLEARED">
                  DIMENSION CLEARED
                </h2>
                <p className="text-xl text-[var(--color-neon-cyan)] animate-pulse">Calculating Score...</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      <div className="mt-8 z-10 w-full max-w-4xl flex justify-between">
        <button 
          onClick={() => router.push("/levels")}
          className="text-gray-400 hover:text-white transition-colors uppercase font-bold text-sm tracking-wider"
        >
          &lt; Abandon Dimension
        </button>
      </div>
    </div>
  );
}
