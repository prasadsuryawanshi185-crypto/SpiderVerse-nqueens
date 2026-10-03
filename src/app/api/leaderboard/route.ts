import { NextResponse } from 'next/server';
import { clientPromise, dbName } from '@/lib/mongodb';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const deviceId = cookieStore.get('spiderverse_device_id')?.value;

    const client = await clientPromise;
    const db = client.db(dbName);
    const collection = db.collection('attempts');

    // Fetch all completed attempts, sorted by totalTime ASC, totalMoves ASC, totalInvalidMoves ASC
    const leaderboardDocs = await collection
      .find({ status: 'completed' })
      .sort({ totalTime: 1, totalMoves: 1, totalInvalidMoves: 1 })
      .toArray();

    const leaderboard = leaderboardDocs.map((doc) => ({
      username: doc.username,
      totalTime: doc.totalTime,
      totalMoves: doc.totalMoves,
      totalInvalidMoves: doc.totalInvalidMoves,
      completedAt: doc.completedAt,
      isCurrentPlayer: doc.deviceId === deviceId
    }));

    return NextResponse.json({ leaderboard }, { status: 200 });
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
