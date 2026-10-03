import { NextResponse } from 'next/server';
import { clientPromise, dbName } from '@/lib/mongodb';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  try {
    const { username, password, clientDeviceId } = await req.json();

    const expectedPassword = process.env.EVENT_PASSWORD || "SPIDER2026";
    if (password !== expectedPassword) {
      return NextResponse.json({ error: "Invalid event password." }, { status: 401 });
    }

    if (!username || username.trim() === "") {
      return NextResponse.json({ error: "Username is required." }, { status: 400 });
    }

    // Determine deviceId: prefer existing cookie, then client-provided, then generate new
    const cookieStore = await cookies();
    let deviceId = cookieStore.get('spiderverse_device_id')?.value;
    
    if (!deviceId && clientDeviceId) {
      deviceId = clientDeviceId;
    }
    
    if (!deviceId) {
      deviceId = crypto.randomUUID();
    }

    const client = await clientPromise;
    const db = client.db(dbName);
    const collection = db.collection('attempts');

    let attempt = await collection.findOne({ deviceId });

    if (attempt) {
      if (attempt.status === 'completed') {
        return NextResponse.json({ 
          error: "You have already played this challenge on this device.", 
          completed: true 
        }, { status: 403 });
      }
      // Resume existing attempt
    } else {
      // Create new attempt
      const newAttempt = {
        deviceId,
        username: username.trim(),
        status: 'in_progress',
        currentLevel: 4,
        levels: {},
        totalTime: 0,
        totalMoves: 0,
        totalInvalidMoves: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      await collection.insertOne(newAttempt);
      attempt = await collection.findOne({ deviceId });
    }

    // Set cookie
    cookieStore.set('spiderverse_device_id', deviceId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 365, // 1 year
      path: '/'
    });

    return NextResponse.json({ success: true, attempt });

  } catch (error) {
    console.error("Auth error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
