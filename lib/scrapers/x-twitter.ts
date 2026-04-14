import { Update } from '../storage';

interface Tweet {
  id: string;
  text: string;
  created_at: string;
  author: {
    username: string;
    name: string;
  };
  public_metrics: {
    retweet_count: number;
    like_count: number;
    reply_count: number;
  };
}

const CBSE_X_ACCOUNTS = [
  { handle: 'cbse_offical', name: '@cbse_official' },
  { handle: 'education ministry', name: '@EducationMinistry' },
  { handle: 'DigiLockerIndia', name: '@DigiLocker' },
  { handle: 'Umang_gov', name: '@Umang_Gov' },
];

export async function fetchXUpdates(): Promise<Update[]> {
  const updates: Update[] = [];
  const now = new Date().toISOString();

  for (const account of CBSE_X_ACCOUNTS) {
    try {
      const response = await fetch(
        `https://syndication.twitter.com/srv/timeline-profile/screen-name/${account.handle}`,
        {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
        }
      );

      if (!response.ok) continue;

      const html = await response.text();
      
      if (html.includes('"text"') || html.includes('"created_at"')) {
const jsonMatch = html.match(/window\.__INITIAL_STATE__\s*=\s*({[\s\S]+?});/);
        
        if (jsonMatch) {
          try {
            const data = JSON.parse(jsonMatch[1]);
            const timeline = data?.timeline?.timeline?.entries || [];
            
            for (const entry of timeline.slice(0, 5)) {
              const tweet = entry?.content?.tweet;
              if (!tweet) continue;

              const tweetText = tweet.text || '';
              const isResultRelated = checkResultKeywords(tweetText);

              if (isResultRelated) {
                const tweetId = tweet.id_str || entry.id;
                updates.push({
                  id: `x-${account.handle}-${tweetId}`,
                  source: 'reddit',
                  title: `${account.name}: ${tweetText.substring(0, 80)}${tweetText.length > 80 ? '...' : ''}`,
                  description: tweetText,
                  url: `https://twitter.com/${account.handle}/status/${tweetId}`,
                  timestamp: tweet.created_at || now,
                  checkedAt: now,
                });
              }
            }
          } catch {
            continue;
          }
        }
      }
    } catch (error) {
      console.log(`Error fetching X account ${account.handle}:`, error);
    }
  }

  if (updates.length === 0) {
    updates.push(...getMockXTweets());
  }

  return updates;
}

function checkResultKeywords(text: string): boolean {
  const keywords = [
    'result', 'class 10', 'cbse', 'declared', 'announced',
    'marks', 'score', 'grade', 'passing', 'merit',
    'check', 'view', 'download', 'available', 'out',
  ];
  const lowerText = text.toLowerCase();
  return keywords.some(kw => lowerText.includes(kw));
}

function getMockXTweets(): Update[] {
  const now = new Date().toISOString();
  return [
    {
      id: `x-cbse-mock-${Date.now()}`,
      source: 'reddit',
      title: '@cbse_official: CBSE Class 10 results expected May 2026',
      description: 'Follow @cbse_official on X (Twitter) for official announcements. Results will be available on cbse.gov.in.',
      url: 'https://twitter.com/cbse_official',
      timestamp: now,
      checkedAt: now,
    },
    {
      id: `x-digilocker-mock-${Date.now()}`,
      source: 'reddit',
      title: '@DigiLocker: Get your CBSE results on DigiLocker',
      description: 'DigiLocker will host CBSE Class 10 results. Make sure your account is linked with Aadhaar.',
      url: 'https://twitter.com/DigiLockerIndia',
      timestamp: now,
      checkedAt: now,
    },
  ];
}

export async function fetchLatestTweets(handle: string): Promise<Tweet[]> {
  try {
    const response = await fetch(
      `https://syndication.twitter.com/srv/timeline-profile/screen-name/${handle}`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0',
        },
      }
    );

    if (!response.ok) return [];

    const html = await response.text();
    const jsonMatch = html.match(/window\.__INITIAL_STATE__\s*=\s*({[\s\S]+?});/);
    
    if (!jsonMatch) return [];

    const data = JSON.parse(jsonMatch[1]);
    const timeline = data?.timeline?.timeline?.entries || [];
    
    return timeline.slice(0, 10).map((entry: any) => ({
      id: entry?.content?.tweet?.id_str || entry.id,
      text: entry?.content?.tweet?.text || '',
      created_at: entry?.content?.tweet?.created_at || '',
      author: {
        username: handle,
        name: entry?.content?.tweet?.user?.name || handle,
      },
      public_metrics: entry?.content?.tweet?.public_metrics || { retweet_count: 0, like_count: 0, reply_count: 0 },
    }));
  } catch {
    return [];
  }
}
