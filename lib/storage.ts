import { Redis } from '@upstash/redis';

const kv = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

export interface Update {
  id: string;
  source: 'reddit' | 'cbse' | 'digilocker' | 'umang';
  title: string;
  description: string;
  url: string;
  timestamp: string;
  checkedAt: string;
}

export interface RedditDiscussion {
  id: string;
  title: string;
  url: string;
  author: string;
  created: number;
  score: number;
  numComments: number;
}

const UPDATES_KEY = 'cbse:updates';
const REDDIT_KEY = 'cbse:reddit';
const LAST_CHECKED_KEY = 'cbse:lastChecked';

export async function getUpdates(): Promise<Update[]> {
  try {
    if (!process.env.KV_REST_API_URL) return [];
    const data = await kv.get<Update[]>(UPDATES_KEY);
    return data || [];
  } catch {
    return [];
  }
}

export async function saveUpdates(updates: Update[]): Promise<void> {
  if (!process.env.KV_REST_API_URL) return;
  await kv.set(UPDATES_KEY, updates);
}

export async function addUpdate(update: Update): Promise<void> {
  if (!process.env.KV_REST_API_URL) return;
  const updates = await getUpdates();
  const exists = updates.some(u => u.id === update.id);
  if (!exists) {
    updates.unshift(update);
    if (updates.length > 50) updates.pop();
    await saveUpdates(updates);
  }
}

export async function getLastChecked(): Promise<string | null> {
  try {
    if (!process.env.KV_REST_API_URL) return null;
    return await kv.get<string>(LAST_CHECKED_KEY);
  } catch {
    return null;
  }
}

export async function setLastChecked(time: string): Promise<void> {
  if (!process.env.KV_REST_API_URL) return;
  await kv.set(LAST_CHECKED_KEY, time);
}

export async function getRedditDiscussions(): Promise<RedditDiscussion[]> {
  try {
    if (!process.env.KV_REST_API_URL) return [];
    const data = await kv.get<RedditDiscussion[]>(REDDIT_KEY);
    return data || [];
  } catch {
    return [];
  }
}

export async function saveRedditDiscussions(discussions: RedditDiscussion[]): Promise<void> {
  if (!process.env.KV_REST_API_URL) return;
  await kv.set(REDDIT_KEY, discussions);
}

export { kv };
