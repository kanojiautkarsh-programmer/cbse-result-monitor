import { Update, getMockUpdates } from './cbse';

export async function fetchDigiLockerUpdates(): Promise<Update[]> {
  const now = new Date().toISOString();
  const updates: Update[] = [];

  try {
    const response = await fetch('https://digilocker.gov.in/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (response.ok) {
      const html = await response.text().catch(() => '');
      const hasEduContent = html.toLowerCase().includes('education') || 
                           html.toLowerCase().includes('cbse') ||
                           html.toLowerCase().includes('result');

      if (hasEduContent) {
        updates.push({
          id: `digilocker-active-${Date.now()}`,
          source: 'digilocker',
          title: 'DigiLocker - CBSE Document Available',
          description: 'DigiLocker may have CBSE-related documents. Check the DigiLocker app or website for your Class 10 result documents.',
          url: 'https://digilocker.gov.in/',
          timestamp: now,
          checkedAt: now,
        });
      }
    }
  } catch (error) {
    console.log('Error fetching DigiLocker:', error);
  }

  if (updates.length === 0) {
    updates.push(...getMockUpdates('digilocker'));
  }

  return updates;
}

export async function checkDigiLockerCBSE(): Promise<Update | null> {
  const now = new Date().toISOString();
  
  const cbseEndpoints = [
    'https://digilocker.gov.in/cbse',
    'https://digitallocker.gov.in/',
  ];

  for (const endpoint of cbseEndpoints) {
    try {
      const response = await fetch(endpoint, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });

      if (response.ok) {
        return {
          id: `digilocker-cbse-check-${Date.now()}`,
          source: 'digilocker',
          title: 'DigiLocker CBSE Section',
          description: 'Check DigiLocker for CBSE Class 10 results and documents.',
          url: endpoint,
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
