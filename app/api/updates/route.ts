import { NextResponse } from 'next/server';
import { getUpdates, getLastChecked, getRedditDiscussions } from '@/lib/storage';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [updates, lastChecked, discussions] = await Promise.all([
      getUpdates(),
      getLastChecked(),
      getRedditDiscussions(),
    ]);

    return NextResponse.json({
      updates,
      lastChecked,
      discussions,
      totalUpdates: updates.length,
    });
  } catch (error) {
    console.error('Error fetching updates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch updates', updates: [], discussions: [] },
      { status: 500 }
    );
  }
}
