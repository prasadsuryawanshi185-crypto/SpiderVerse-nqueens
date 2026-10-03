import { NextResponse } from 'next/server';
import { clientPromise, dbName } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db(dbName);
    const collection = db.collection('attempts');

    // Fetch top 20 completed attempts, sorted by totalTime ASC, totalMoves ASC, totalInvalidMoves ASC
    const leaderboard = await collection
      .find({ status: 'completed' })
      .sort({ totalTime: 1, totalMoves: 1, totalInvalidMoves: 1 })
      .limit(20)
      .project({ _id: 0, username: 1, totalTime: 1, totalMoves: 1, totalInvalidMoves: 1, completedAt: 1 })
      .toArray();

    return NextResponse.json({ leaderboard }, { status: 200 });
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
