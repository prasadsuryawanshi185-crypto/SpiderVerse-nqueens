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

    // Fetch attempts that have at least finished Level 4
    const leaderboardDocs = await collection
      .find({
        $or: [
          { status: 'completed' },
          { currentLevel: { $gt: 4 } }
        ]
      })
      .sort({ 
        status: 1, // 'completed' comes before 'in_progress'
        currentLevel: -1, 
        totalTime: 1, 
        totalMoves: 1, 
        totalInvalidMoves: 1 
      })
      .toArray();

    const leaderboard = leaderboardDocs.map((doc) => ({
      username: doc.username,
      totalTime: doc.totalTime,
      totalMoves: doc.totalMoves,
      totalInvalidMoves: doc.totalInvalidMoves,
      completedAt: doc.completedAt,
      currentLevel: doc.currentLevel,
      status: doc.status,
      isCurrentPlayer: doc.deviceId === deviceId
    }));

    return NextResponse.json({ leaderboard }, { status: 200 });
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
