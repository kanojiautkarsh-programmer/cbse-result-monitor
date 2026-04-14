import { Update } from '../storage';

export type { Update };

export async function fetchCBSESiteUpdates(): Promise<Update[]> {
  const updates: Update[] = [];
  
  try {
    const response = await fetch('https://cbse.gov.in/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });
    
    if (!response.ok) {
      console.log('CBSE site not accessible or returned error:', response.status);
      return getMockUpdates('cbse');
    }
    
    const html = await response.text();
    
    if (html.includes('result') || html.includes('Result')) {
      updates.push({
        id: 'cbse-announcement-' + Date.now(),
        source: 'cbse',
        title: 'CBSE Official Website Update',
        description: 'Potential result-related content detected on CBSE official website.',
        url: 'https://cbse.gov.in/',
        timestamp: new Date().toISOString(),
        checkedAt: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.log('Error fetching CBSE site, using fallback data');
    return getMockUpdates('cbse');
  }
  
  if (updates.length === 0) {
    updates.push(...getMockUpdates('cbse'));
  }
  
  return updates;
}

function getMockUpdates(source: 'cbse' | 'digilocker' | 'umang'): Update[] {
  const mockData = {
    cbse: {
      title: 'CBSE Class 10 Result 2026',
      description: 'CBSE Class 10 results expected to be announced in May 2026. Keep checking for official announcements.',
      url: 'https://cbse.gov.in/',
    },
    digilocker: {
      title: 'DigiLocker Result Access',
      description: 'DigiLocker is typically updated with CBSE results within hours of official announcement. Link your Aadhaar for seamless access.',
      url: 'https://digilocker.gov.in/',
    },
    umang: {
      title: 'UMANG App Result Service',
      description: 'Check CBSE results through the UMANG app. Download from official sources for authentic results.',
      url: 'https://umang.gov.in/',
    },
  };
  
  return [{
    id: `${source}-fallback-${Date.now()}`,
    source,
    title: mockData[source].title,
    description: mockData[source].description,
    url: mockData[source].url,
    timestamp: new Date().toISOString(),
    checkedAt: new Date().toISOString(),
  }];
}

export { getMockUpdates };
