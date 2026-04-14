import { Update, getMockUpdates } from './cbse';

export async function fetchUMANGUpdates(): Promise<Update[]> {
  try {
    const response = await fetch('https://umang.gov.in/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });
    
    if (!response.ok) {
      return getMockUpdates('umang');
    }
    
    const html = await response.text();
    
    if (html.includes('CBSE') || html.includes('Result') || html.includes('Education')) {
      return [{
        id: 'umang-education-' + Date.now(),
        source: 'umang',
        title: 'UMANG Education Services',
        description: 'Education-related services may include CBSE results on UMANG portal.',
        url: 'https://umang.gov.in/',
        timestamp: new Date().toISOString(),
        checkedAt: new Date().toISOString(),
      }];
    }
  } catch (error) {
    console.log('Error fetching UMANG, using fallback data');
  }
  
  return getMockUpdates('umang');
}
