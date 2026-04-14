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
];

const SEARCH_TERMS = [
  'cbse class 10 result 2026',
  'class 10 board result',
  'cbse 10th marks',
  'result checking site',
  'cbse portal result',
];

const SUBREDDITS = ['cbse', 'IndiaEducation', 'delhi', 'mumbai', 'delhiforindia'];

export async function fetchRedditUpdates(): Promise<Update[]> {
  const updates: Update[] = [];
  const seenIds = new Set<string>();

  for (const term of SEARCH_TERMS) {
    try {
      const encoded = encodeURIComponent(term);
      const response = await fetch(
        `https://www.reddit.com/r/cbse/search.json?q=${encoded}&restrict_sr=1&sort=new&limit=15&t=week`,
        {
          headers: {
            'User-Agent': 'CBSE-Result-Monitor/1.0',
          },
        }
      );

      if (!response.ok) continue;

      const data = await response.json();
      const posts: RedditPost[] = data.data.children.map((c: { data: RedditPost }) => c.data);

      for (const post of posts) {
        if (seenIds.has(post.id)) continue;
        seenIds.add(post.id);

        const description = post.selftext
          ? post.selftext.substring(0, 300) + (post.selftext.length > 300 ? '...' : '')
          : 'Discussion about CBSE results on Reddit';

        updates.push({
          id: `reddit-${post.id}`,
          source: 'reddit',
          title: post.title,
          description: description,
          url: `https://reddit.com${post.permalink}`,
          timestamp: new Date(post.created_utc * 1000).toISOString(),
          checkedAt: new Date().toISOString(),
        });
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
      'https://www.reddit.com/r/cbse/hot.json?limit=20',
      {
        headers: {
          'User-Agent': 'CBSE-Result-Monitor/1.0',
        },
      }
    );

    if (!response.ok) return [];

    const data = await response.json();
    return data.data.children.map((c: { data: RedditPost }) => ({
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
      'https://www.reddit.com/r/cbse/new.json?limit=25',
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
      const post = item.data as RedditPost;
      if (seenIds.has(post.id)) continue;
      seenIds.add(post.id);

      const title = post.title.toLowerCase();
      const isResultRelated = RESULT_KEYWORDS.some(kw => title.includes(kw.toLowerCase()));

      if (isResultRelated) {
        updates.push({
          id: `reddit-new-${post.id}`,
          source: 'reddit',
          title: post.title,
          description: post.selftext?.substring(0, 300) || 'New CBSE result discussion on Reddit',
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
