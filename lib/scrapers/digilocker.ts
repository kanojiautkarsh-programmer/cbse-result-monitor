import { Update, getMockUpdates } from './cbse';

export async function fetchDigiLockerUpdates(): Promise<Update[]> {
  try {
    const response = await fetch('https://digilocker.gov.in/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });
    
    if (!response.ok) {
      return getMockUpdates('digilocker');
    }
    
    const html = await response.text();
    
    if (html.includes('CBSE') || html.includes('result')) {
      return [{
        id: 'digilocker-cbse-' + Date.now(),
        source: 'digilocker',
        title: 'DigiLocker CBSE Update',
        description: 'CBSE-related content available on DigiLocker portal.',
        url: 'https://digilocker.gov.in/',
        timestamp: new Date().toISOString(),
        checkedAt: new Date().toISOString(),
      }];
    }
  } catch (error) {
    console.log('Error fetching DigiLocker, using fallback data');
  }
  
  return getMockUpdates('digilocker');
}
