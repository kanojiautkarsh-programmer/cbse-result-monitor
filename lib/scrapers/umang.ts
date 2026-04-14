import { Update, getMockUpdates } from './cbse';

export async function fetchUMANGUpdates(): Promise<Update[]> {
  const now = new Date().toISOString();
  const updates: Update[] = [];

  try {
    const response = await fetch('https://umang.gov.in/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (response.ok) {
      const html = await response.text().catch(() => '');
      const hasEduContent = html.toLowerCase().includes('education') || 
                           html.toLowerCase().includes('cbse') ||
                           html.toLowerCase().includes('result') ||
                           html.toLowerCase().includes('board');

      if (hasEduContent) {
        updates.push({
          id: `umang-active-${Date.now()}`,
          source: 'umang',
          title: 'UMANG - Education Services Available',
          description: 'UMANG app provides government services including education results. Download the app for CBSE result checking.',
          url: 'https://umang.gov.in/',
          timestamp: now,
          checkedAt: now,
        });
      }
    }
  } catch (error) {
    console.log('Error fetching UMANG:', error);
  }

  if (updates.length === 0) {
    updates.push(...getMockUpdates('umang'));
  }

  return updates;
}

export async function checkUMANGCBSE(): Promise<Update | null> {
  const now = new Date().toISOString();
  
  const umangServices = [
    'https://web.umang.gov.in/',
    'https://umang.gov.in/services',
  ];

  for (const service of umangServices) {
    try {
      const response = await fetch(service, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });

      if (response.ok) {
        return {
          id: `umang-services-${Date.now()}`,
          source: 'umang',
          title: 'UMANG Education Services',
          description: 'Check UMANG app for CBSE Class 10 result services.',
          url: service,
          timestamp: now,
          checkedAt: now,
        };
      }
    } catch {
      continue;
    }
  }

  return null;
}
