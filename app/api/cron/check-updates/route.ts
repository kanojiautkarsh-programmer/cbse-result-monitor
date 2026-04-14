import type { NextRequest } from 'next/server';
import { addUpdate, setLastChecked, saveRedditDiscussions } from '@/lib/storage';
import {
  fetchRedditUpdates,
  fetchTopRedditDiscussions,
  fetchCBSESiteUpdates,
  fetchDigiLockerUpdates,
  fetchUMANGUpdates,
} from '@/lib/scrapers';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    console.log('Starting CBSE update check...');
    const allUpdates = [];

    const [redditUpdates, cbseUpdates, digilockerUpdates, umangUpdates] = await Promise.all([
      fetchRedditUpdates(),
      fetchCBSESiteUpdates(),
      fetchDigiLockerUpdates(),
      fetchUMANGUpdates(),
    ]);

    allUpdates.push(...redditUpdates, ...cbseUpdates, ...digilockerUpdates, ...umangUpdates);

    for (const update of allUpdates) {
      await addUpdate(update);
    }

    const discussions = await fetchTopRedditDiscussions();
    await saveRedditDiscussions(discussions);

    const now = new Date().toISOString();
    await setLastChecked(now);

    console.log(`Check complete. Found ${allUpdates.length} updates.`);

    return Response.json({
      success: true,
      timestamp: now,
      updatesFound: allUpdates.length,
      bySource: {
        reddit: redditUpdates.length,
        cbse: cbseUpdates.length,
        digilocker: digilockerUpdates.length,
        umang: umangUpdates.length,
      },
    });
  } catch (error) {
    console.error('Error during update check:', error);
    return Response.json(
      { success: false, error: 'Failed to check updates' },
      { status: 500 }
    );
  }
}
