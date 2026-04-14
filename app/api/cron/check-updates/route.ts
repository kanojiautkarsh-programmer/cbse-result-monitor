import type { NextRequest } from 'next/server';
import { addUpdate, setLastChecked, saveRedditDiscussions } from '@/lib/storage';
import {
  fetchRedditUpdates,
  fetchTopRedditDiscussions,
  fetchNewRedditPosts,
  fetchCBSESiteUpdates,
  checkCBSEResultPortal,
  fetchDigiLockerUpdates,
  checkDigiLockerCBSE,
  fetchUMANGUpdates,
  checkUMANGCBSE,
  fetchNewsUpdates,
  fetchDirectResultNews,
  fetchXUpdates,
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
    const counts = { reddit: 0, cbse: 0, digilocker: 0, umang: 0, news: 0, x: 0 };

    const [
      redditUpdates,
      newRedditPosts,
      cbseUpdates,
      cbsePortal,
      digilockerUpdates,
      digilockerCBSE,
      umangUpdates,
      umangCBSE,
      newsUpdates,
      directNews,
      xUpdates,
    ] = await Promise.all([
      fetchRedditUpdates(),
      fetchNewRedditPosts(),
      fetchCBSESiteUpdates(),
      checkCBSEResultPortal(),
      fetchDigiLockerUpdates(),
      checkDigiLockerCBSE(),
      fetchUMANGUpdates(),
      checkUMANGCBSE(),
      fetchNewsUpdates(),
      fetchDirectResultNews(),
      fetchXUpdates(),
    ]);

    allUpdates.push(...redditUpdates, ...newRedditPosts);
    counts.reddit = redditUpdates.length + newRedditPosts.length;

    allUpdates.push(...cbseUpdates);
    counts.cbse = cbseUpdates.length;
    if (cbsePortal) {
      allUpdates.push(cbsePortal);
      counts.cbse++;
    }

    allUpdates.push(...digilockerUpdates);
    counts.digilocker = digilockerUpdates.length;
    if (digilockerCBSE) {
      allUpdates.push(digilockerCBSE);
      counts.digilocker++;
    }

    allUpdates.push(...umangUpdates);
    counts.umang = umangUpdates.length;
    if (umangCBSE) {
      allUpdates.push(umangCBSE);
      counts.umang++;
    }

    allUpdates.push(...newsUpdates, ...directNews);
    counts.news = newsUpdates.length + directNews.length;

    allUpdates.push(...xUpdates);
    counts.x = xUpdates.length;

    const seenIds = new Set<string>();
    const uniqueUpdates = allUpdates.filter(update => {
      if (seenIds.has(update.id)) return false;
      seenIds.add(update.id);
      return true;
    });

    for (const update of uniqueUpdates) {
      await addUpdate(update);
    }

    const discussions = await fetchTopRedditDiscussions();
    await saveRedditDiscussions(discussions);

    const now = new Date().toISOString();
    await setLastChecked(now);

    console.log(`Check complete. Found ${uniqueUpdates.length} unique updates.`);

    return Response.json({
      success: true,
      timestamp: now,
      updatesFound: uniqueUpdates.length,
      bySource: counts,
      schedule: 'Every 6 hours (daily on free tier)',
      sources: ['Reddit', 'CBSE.gov.in', 'DigiLocker', 'UMANG', 'News Sites', 'X/Twitter'],
      manualTrigger: 'POST to this endpoint with CRON_SECRET for manual updates',
    });
  } catch (error) {
    console.error('Error during update check:', error);
    return Response.json(
      { success: false, error: 'Failed to check updates' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const result = await GET(request);
  return result;
}
