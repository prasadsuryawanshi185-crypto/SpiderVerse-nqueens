import { NextResponse } from 'next/server';
import { clientPromise, dbName } from '@/lib/mongodb';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const deviceId = cookieStore.get('spiderverse_device_id')?.value;

    if (!deviceId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db(dbName);
    const attempt = await db.collection('attempts').findOne({ deviceId });

    if (!attempt) {
      return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
    }

    // Initialize levelStartTime if it doesn't exist
    if (!attempt.levelStartTime && attempt.status !== 'completed') {
      const now = new Date();
      await db.collection('attempts').updateOne(
        { deviceId },
        { $set: { levelStartTime: now, currentMoves: 0, currentInvalidMoves: 0, currentBoard: null } }
      );
      attempt.levelStartTime = now;
      attempt.currentMoves = 0;
      attempt.currentInvalidMoves = 0;
      attempt.currentBoard = null;
    }

    return NextResponse.json({ attempt });
  } catch (error) {
    console.error("Error fetching attempt:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const cookieStore = await cookies();
    const deviceId = cookieStore.get('spiderverse_device_id')?.value;
    if (!deviceId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { board, moves, invalidMoves } = await req.json();

    const client = await clientPromise;
    const db = client.db(dbName);
    
    await db.collection('attempts').updateOne(
      { deviceId, status: 'in_progress' },
      { $set: { currentBoard: board, currentMoves: moves, currentInvalidMoves: invalidMoves, updatedAt: new Date() } }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

function isValidNQueens(board: number[][], expectedN: number): boolean {
  if (!board || board.length !== expectedN) return false;
  let queens = 0;
  for (let r = 0; r < expectedN; r++) {
    for (let c = 0; c < expectedN; c++) {
      if (board[r][c] === 1) queens++;
    }
  }
  if (queens !== expectedN) return false;

  for (let r = 0; r < expectedN; r++) {
    for (let c = 0; c < expectedN; c++) {
      if (board[r][c] === 1) {
        for (let i = 0; i < expectedN; i++) {
          for (let j = 0; j < expectedN; j++) {
            if (i === r && j === c) continue;
            if (board[i][j] === 1) {
              if (i === r || j === c || Math.abs(i - r) === Math.abs(j - c)) return false;
            }
          }
        }
      }
    }
  }
  return true;
}

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const deviceId = cookieStore.get('spiderverse_device_id')?.value;

    if (!deviceId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { level, board, moves, invalidMoves, isTimeout } = await req.json();

    const client = await clientPromise;
    const db = client.db(dbName);
    const collection = db.collection('attempts');
    const attempt = await collection.findOne({ deviceId });
    
    if (!attempt) return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
    if (attempt.status === 'completed') return NextResponse.json({ error: "Challenge already completed" }, { status: 403 });

    if (isTimeout) {
      const startTime = attempt.levelStartTime ? new Date(attempt.levelStartTime).getTime() : Date.now();
      const actualTimeSpent = Math.max(0, Math.floor((Date.now() - startTime) / 1000));
      
      const newTotalTime = (attempt.totalTime || 0) + actualTimeSpent;

      const updateDoc = {
        $set: {
          totalTime: Math.min(newTotalTime, 420), // Cap at 420 seconds (7 mins) for consistency
          status: 'completed',
          completedAt: new Date(),
          currentBoard: null,
        }
      };

      await collection.updateOne({ deviceId }, updateDoc);

      return NextResponse.json({ 
        success: true, 
        isCompleted: true 
      });
    }

    if (attempt.currentLevel !== level) return NextResponse.json({ error: "Level mismatch" }, { status: 400 });

    // Validate board strictly on backend
    if (!isValidNQueens(board, level)) {
      return NextResponse.json({ error: "Invalid board state." }, { status: 400 });
    }

    // Trust backend time calculation
    const startTime = attempt.levelStartTime ? new Date(attempt.levelStartTime).getTime() : Date.now();
    const actualTimeSpent = Math.max(0, Math.floor((Date.now() - startTime) / 1000));
    
    // Prevent moves from being lower than what we synced
    const finalMoves = Math.max(attempt.currentMoves || 0, moves || 0);
    const finalInvalid = Math.max(attempt.currentInvalidMoves || 0, invalidMoves || 0);

    const newTotalTime = (attempt.totalTime || 0) + actualTimeSpent;
    const newTotalMoves = (attempt.totalMoves || 0) + finalMoves;
    const newTotalInvalidMoves = (attempt.totalInvalidMoves || 0) + finalInvalid;
    
    const nextLevel = level + 1;
    const isCompleted = nextLevel > 6;

    const updateDoc = {
      $set: {
        [`levels.${level}`]: { time: actualTimeSpent, moves: finalMoves, invalidMoves: finalInvalid },
        totalTime: newTotalTime,
        totalMoves: newTotalMoves,
        totalInvalidMoves: newTotalInvalidMoves,
        currentLevel: isCompleted ? 6 : nextLevel,
        status: isCompleted ? 'completed' : 'in_progress',
        levelStartTime: isCompleted ? null : new Date(), // Reset timer for next level
        currentBoard: null,
        currentMoves: 0,
        currentInvalidMoves: 0,
        updatedAt: new Date(),
        ...(isCompleted && { completedAt: new Date() })
      }
    };

    await collection.updateOne({ deviceId }, updateDoc);

    return NextResponse.json({ 
      success: true, 
      nextLevel: isCompleted ? null : nextLevel,
      isCompleted 
    });

  } catch (error) {
    console.error("Error updating attempt:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
