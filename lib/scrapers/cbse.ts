import { Update } from '../storage';

export type { Update };

const CBSE_RESULT_URLS = [
  { url: 'https://cbse.gov.in/', name: 'CBSE Official' },
  { url: 'https://cbse.nic.in/', name: 'CBSE NIC' },
  { url: 'https://results.gov.in/', name: 'Results.gov.in' },
];

const RESULT_KEYWORDS = ['result', 'class 10', 'matric', 'secondary', 'marks', 'score', 'declared', 'announced'];

export async function fetchCBSESiteUpdates(): Promise<Update[]> {
  const updates: Update[] = [];
  const now = new Date().toISOString();

  for (const site of CBSE_RESULT_URLS) {
    try {
      const response = await fetch(site.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });

      if (!response.ok) continue;

      const html = await response.text();
      const lowerHtml = html.toLowerCase();
      const hasResultContent = RESULT_KEYWORDS.some(kw => lowerHtml.includes(kw));

      if (hasResultContent) {
        updates.push({
          id: `cbse-${site.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
          source: 'cbse',
          title: `CBSE Updates on ${site.name}`,
          description: `Potential result-related content found on ${site.name}. Visit the official website for the latest updates.`,
          url: site.url,
          timestamp: now,
          checkedAt: now,
        });
      }
    } catch (error) {
      console.log(`Error fetching ${site.name}:`, error);
    }
  }

  if (updates.length === 0) {
    updates.push({
      id: `cbse-official-${Date.now()}`,
      source: 'cbse',
      title: 'CBSE Class 10 Result 2026 - Expected Soon',
      description: 'CBSE Class 10 results for 2026 are expected to be announced in May 2026. Keep checking cbse.gov.in for official announcements.',
      url: 'https://cbse.gov.in/',
      timestamp: now,
      checkedAt: now,
    });
  }

  return updates;
}

export async function checkCBSEResultPortal(): Promise<Update | null> {
  const now = new Date().toISOString();
  
  const resultPortals = [
    'https://cbse.gov.in/results.html',
    'https://cbse.nic.in/newsite/',
  ];

  for (const portal of resultPortals) {
    try {
      const response = await fetch(portal, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });

      if (response.ok) {
        return {
          id: `cbse-portal-${Date.now()}`,
          source: 'cbse',
          title: 'CBSE Result Portal Active',
          description: 'The CBSE result checking portal appears to be accessible. Results may be available soon!',
          url: portal,
          timestamp: now,
          checkedAt: now,
        };
      }
    } catch (error) {
      continue;
    }
  }

  return null;
}

export { getMockUpdates };

function getMockUpdates(source: 'cbse' | 'digilocker' | 'umang'): Update[] {
  const now = new Date().toISOString();
  const mockData = {
    cbse: {
      title: 'CBSE Class 10 Result 2026 - Check Official Website',
      description: 'CBSE Class 10 results expected to be announced in May 2026. Visit cbse.gov.in for official announcements and result checking.',
      url: 'https://cbse.gov.in/',
    },
    digilocker: {
      title: 'DigiLocker - Get CBSE Results Digitally',
      description: 'DigiLocker typically hosts CBSE results within hours of official announcement. Link your Aadhaar for seamless access.',
      url: 'https://digilocker.gov.in/',
    },
    umang: {
      title: 'UMANG App - Check CBSE Results on Mobile',
      description: 'UMANG app provides CBSE result checking services. Download from official sources for authentic results.',
      url: 'https://umang.gov.in/',
    },
  };

  return [{
    id: `${source}-info-${Date.now()}`,
    source,
    title: mockData[source].title,
    description: mockData[source].description,
    url: mockData[source].url,
    timestamp: now,
    checkedAt: now,
  }];
}
