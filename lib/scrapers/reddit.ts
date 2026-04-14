import { Update } from './storage';

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
}

export async function fetchRedditUpdates(): Promise<Update[]> {
  const updates: Update[] = [];
  const searchTerms = ['CBSE class 10 result', 'class 10 result 2026', 'cbse 10th result'];
  
  for (const term of searchTerms) {
    try {
      const encoded = encodeURIComponent(term);
      const response = await fetch(
        `https://www.reddit.com/r/cbse/search.json?q=${encoded}&restrict_sr=1&sort=new&limit=10`,
        {
          headers: {
            'User-Agent': 'CBSE-Result-Monitor/1.0 (by u/YourBotUsername)',
          },
        }
      );
      
      if (!response.ok) continue;
      
      const data = await response.json();
      const posts: RedditPost[] = data.data.children.map((c: { data: RedditPost }) => c.data);
      
      const oneDayAgo = Date.now() / 1000 - 86400;
      
      for (const post of posts) {
        if (post.created_utc < oneDayAgo) continue;
        
        const description = post.selftext 
          ? post.selftext.substring(0, 300) + (post.selftext.length > 300 ? '...' : '')
          : 'No description available';
        
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
  title: string;
  url: string;
  author: string;
  created: number;
  score: number;
  numComments: number;
}[]> {
  try {
    const response = await fetch(
      'https://www.reddit.com/r/cbse/hot.json?limit=10',
      {
        headers: {
          'User-Agent': 'CBSE-Result-Monitor/1.0 (by u/YourBotUsername)',
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
