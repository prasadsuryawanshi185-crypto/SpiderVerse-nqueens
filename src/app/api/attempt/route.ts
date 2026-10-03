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

    return NextResponse.json({ attempt });
  } catch (error) {
    console.error("Error fetching attempt:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const deviceId = cookieStore.get('spiderverse_device_id')?.value;

    if (!deviceId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { level, time, moves, invalidMoves } = await req.json();

    const client = await clientPromise;
    const db = client.db(dbName);
    const collection = db.collection('attempts');

    const attempt = await collection.findOne({ deviceId });
    
    if (!attempt) {
      return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
    }

    if (attempt.status === 'completed') {
      return NextResponse.json({ error: "Challenge already completed" }, { status: 403 });
    }

    if (attempt.currentLevel !== level) {
      return NextResponse.json({ error: "Level mismatch" }, { status: 400 });
    }

    // Update attempt
    const newTotalTime = (attempt.totalTime || 0) + time;
    const newTotalMoves = (attempt.totalMoves || 0) + moves;
    const newTotalInvalidMoves = (attempt.totalInvalidMoves || 0) + invalidMoves;
    const nextLevel = level + 1;
    const isCompleted = nextLevel > 6;

    const updateDoc = {
      $set: {
        [`levels.${level}`]: { time, moves, invalidMoves },
        totalTime: newTotalTime,
        totalMoves: newTotalMoves,
        totalInvalidMoves: newTotalInvalidMoves,
        currentLevel: isCompleted ? 6 : nextLevel, // Cap at 6
        status: isCompleted ? 'completed' : 'in_progress',
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
