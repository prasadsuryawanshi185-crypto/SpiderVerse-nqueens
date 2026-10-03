import { NextResponse } from 'next/server';
import { clientPromise, dbName } from '@/lib/mongodb';

export async function GET(req: Request, { params }: { params: Promise<{ level: string }> }) {
  try {
    const unwrappedParams = await params;
    const level = parseInt(unwrappedParams.level);
    
    if (isNaN(level) || level < 4 || level > 6) {
      return NextResponse.json({ error: "Invalid level" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(dbName);
    const collection = db.collection('scores');

    // Fetch top 10 scores for the given level, sorted by score DESC, then time ASC
    const leaderboard = await collection
      .find({ level })
      .sort({ score: -1, time: 1 })
      .limit(10)
      .project({ _id: 0, playerName: 1, time: 1, moves: 1, invalidMoves: 1, score: 1, createdAt: 1 })
      .toArray();

    return NextResponse.json({ leaderboard }, { status: 200 });
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
