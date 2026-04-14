import { Update } from '../storage';

const NEWS_SOURCES = [
  {
    name: 'India Today',
    url: 'https://www.indiatoday.in/education-result',
    searchUrl: 'https://www.indiatoday.in/search/result?query=cbse+class+10+result',
  },
  {
    name: 'NDTV',
    url: 'https://www.ndtv.com/education',
    searchUrl: 'https://www.ndtv.com/search?searchtext=cbse+class+10+result',
  },
  {
    name: 'Times of India',
    url: 'https://timesofindia.indiatimes.com/education',
    searchUrl: 'https://timesofindia.indiatimes.com/search?q=cbse+class+10+result',
  },
  {
    name: 'Hindustan Times',
    url: 'https://www.hindustantimes.com/education',
    searchUrl: 'https://www.hindustantimes.com/education/search/?q=cbse+result',
  },
  {
    name: 'News18',
    url: 'https://www.news18.com/education',
    searchUrl: 'https://www.news18.com/search/?q=cbse+result',
  },
  {
    name: 'The Hindu',
    url: 'https://www.thehindu.com/education',
    searchUrl: 'https://www.thehindu.com/search/?searchText=cbse+result',
  },
];

export async function fetchNewsUpdates(): Promise<Update[]> {
  const updates: Update[] = [];
  const now = new Date().toISOString();

  for (const source of NEWS_SOURCES) {
    try {
      const response = await fetch(source.searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });

      if (response.ok) {
        const html = await response.text();
        
        if (html.includes('result') || html.includes('CBSE') || html.includes('cbse')) {
          updates.push({
            id: `news-${source.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
            source: 'reddit',
            title: `${source.name}: CBSE Result Updates`,
            description: `Latest CBSE Class 10 result news and updates from ${source.name}. Visit for official announcements.`,
            url: source.url,
            timestamp: now,
            checkedAt: now,
          });
        }
      }
    } catch (error) {
      console.log(`Error fetching ${source.name}:`, error);
    }
  }

  return updates;
}

export async function fetchDirectResultNews(): Promise<Update[]> {
  const updates: Update[] = [];
  const now = new Date().toISOString();

  const newsUrls = [
    'https://www.indiatoday.in/education-result/story/cbse-class-10-result-2026',
    'https://www.ndtv.com/education/cbse-class-10-result-2026',
  ];

  for (const url of newsUrls) {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });

      if (response.ok) {
        const text = await response.text();
        const titleMatch = text.match(/<title>(.*?)<\/title>/i);
        const title = titleMatch ? titleMatch[1] : 'CBSE Result News';
        
        if (!title.includes('404') && !title.includes('Page not found')) {
          updates.push({
            id: `news-direct-${Date.now()}`,
            source: 'reddit',
            title: title,
            description: 'Latest CBSE Class 10 result news. Check news websites for official announcements.',
            url: url,
            timestamp: now,
            checkedAt: now,
          });
        }
      }
    } catch {
      continue;
    }
  }

  return updates;
}
