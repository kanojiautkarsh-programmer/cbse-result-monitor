import { Update } from '../storage';

interface RedditPost {
  id: string;
  title: string;
  selftext: string;
  url: string;
  author: string;
  created_utc: number;
  score: number;
  num_comments: number;
  permalink: string;
  subreddit: string;
}

const RESULT_KEYWORDS = [
  'class 10 result',
  'cbse 10th result',
  'result 2026',
  'result declared',
  'result announced',
  'cbse result link',
  'check result',
  'view result',
  'download result',
  'result out',
  'result today',
  'result tomorrow',
  'marks out',
  'grades out',
  'passing result',
  'merit list',
  'topper',
  'result website',
  'pariksha result',
  'board result',
  'scorecard',
  'marksheet',
  'cbse 10',
];

const SEARCH_TERMS = [
  'cbse class 10 result 2026',
  'cbse 10th result announcement',
  'class 10 board result date',
  'cbse result checking',
  'cbse marks',
  'cbse grade 10',
  'board exam result',
];

export async function fetchRedditUpdates(): Promise<Update[]> {
  const updates: Update[] = [];
  const seenIds = new Set<string>();

  for (const term of SEARCH_TERMS) {
    try {
      const encoded = encodeURIComponent(term);
      const response = await fetch(
        `https://www.reddit.com/search.json?q=${encoded}&sort=new&limit=20&t=month`,
        {
          headers: {
            'User-Agent': 'CBSE-Result-Monitor/1.0',
          },
        }
      );

      if (!response.ok) continue;

      const data = await response.json();
      const posts = data.data.children;

      for (const item of posts) {
        const post: RedditPost = item.data;
        
        if (post.subreddit?.toLowerCase() === 'cbse' || 
            post.subreddit?.toLowerCase() === 'india' ||
            post.subreddit?.toLowerCase() === 'delhi' ||
            post.title.toLowerCase().includes('cbse')) {
          
          if (seenIds.has(post.id)) continue;
          seenIds.add(post.id);

          const title = post.title;
          const isResultRelated = RESULT_KEYWORDS.some(kw => 
            title.toLowerCase().includes(kw.toLowerCase())
          );

          if (isResultRelated) {
            const description = post.selftext
              ? post.selftext.substring(0, 300) + (post.selftext.length > 300 ? '...' : '')
              : extractRelevantText(post.title);

            updates.push({
              id: `reddit-${post.id}`,
              source: 'reddit',
              title: title,
              description: description,
              url: `https://reddit.com${post.permalink}`,
              timestamp: new Date(post.created_utc * 1000).toISOString(),
              checkedAt: new Date().toISOString(),
            });
          }
        }
      }
    } catch (error) {
      console.error(`Error fetching Reddit for "${term}":`, error);
    }
  }

  return updates;
}

export async function fetchTopRedditDiscussions(): Promise<{
  id: string;
  title: string;
  url: string;
  author: string;
  created: number;
  score: number;
  numComments: number;
}[]> {
  try {
    const response = await fetch(
      'https://www.reddit.com/r/cbse/hot.json?limit=25',
      {
        headers: {
          'User-Agent': 'CBSE-Result-Monitor/1.0',
        },
      }
    );

    if (!response.ok) return [];

    const data = response.json();
    return (await data).data.children.map((c: { data: RedditPost }) => ({
      id: c.data.id,
      title: c.data.title,
      url: `https://reddit.com${c.data.permalink}`,
      author: c.data.author,
      created: c.data.created_utc,
      score: c.data.score,
      numComments: c.data.num_comments,
    }));
  } catch (error) {
    console.error('Error fetching top Reddit discussions:', error);
    return [];
  }
}

export async function fetchNewRedditPosts(): Promise<Update[]> {
  try {
    const response = await fetch(
      'https://www.reddit.com/r/cbse/new.json?limit=50',
      {
        headers: {
          'User-Agent': 'CBSE-Result-Monitor/1.0',
        },
      }
    );

    if (!response.ok) return [];

    const data = await response.json();
    const updates: Update[] = [];
    const seenIds = new Set<string>();

    for (const item of data.data.children) {
      const post: RedditPost = item.data;
      if (seenIds.has(post.id)) continue;
      seenIds.add(post.id);

      const title = post.title.toLowerCase();
      const isResultRelated = RESULT_KEYWORDS.some(kw => title.includes(kw.toLowerCase()));

      if (isResultRelated) {
        updates.push({
          id: `reddit-new-${post.id}`,
          source: 'reddit',
          title: post.title,
          description: post.selftext?.substring(0, 300) || extractRelevantText(post.title),
          url: `https://reddit.com${post.permalink}`,
          timestamp: new Date(post.created_utc * 1000).toISOString(),
          checkedAt: new Date().toISOString(),
        });
      }
    }

    return updates;
  } catch (error) {
    console.error('Error fetching new Reddit posts:', error);
    return [];
  }
}

function extractRelevantText(title: string): string {
  const titleLower = title.toLowerCase();
  
  if (titleLower.includes('date') || titleLower.includes('when')) {
    return 'Discussion about expected result announcement date. Check back for official updates.';
  }
  if (titleLower.includes('link') || titleLower.includes('where')) {
    return 'Discussion about where to find/check CBSE results online.';
  }
  if (titleLower.includes('delay') || titleLower.includes('postpone')) {
    return 'Discussion about potential delays in CBSE result announcement.';
  }
  if (titleLower.includes('rumor') || titleLower.includes('fake')) {
    return 'Warning about fake result links circulating online.';
  }
  
  return 'CBSE Class 10 result related discussion. Visit official sources for accurate information.';
}
