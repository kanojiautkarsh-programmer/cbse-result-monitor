'use client';

import { useState, useEffect, useCallback } from 'react';

interface Update {
  id: string;
  source: 'reddit' | 'cbse' | 'digilocker' | 'umang';
  title: string;
  description: string;
  url: string;
  timestamp: string;
  checkedAt: string;
}

interface Discussion {
  id: string;
  title: string;
  url: string;
  author: string;
  created: number;
  score: number;
  numComments: number;
}

const SOURCE_LABELS: Record<string, { label: string; color: string }> = {
  reddit: { label: 'Reddit', color: '#ff4500' },
  cbse: { label: 'CBSE', color: '#3b82f6' },
  digilocker: { label: 'DigiLocker', color: '#22c55e' },
  umang: { label: 'UMANG', color: '#8b5cf6' },
};

const SOURCE_LINKS = [
  {
    name: 'CBSE Official',
    url: 'https://cbse.gov.in/',
    icon: '🎓',
  },
  {
    name: 'DigiLocker',
    url: 'https://digilocker.gov.in/',
    icon: '📁',
  },
  {
    name: 'UMANG',
    url: 'https://umang.gov.in/',
    icon: '📱',
  },
  {
    name: 'r/cbse',
    url: 'https://reddit.com/r/cbse',
    icon: '💬',
  },
];

function formatTimeAgo(timestamp: string): string {
  const now = new Date();
  const date = new Date(timestamp);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} mins ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  return `${Math.floor(seconds / 86400)} days ago`;
}

function formatRedditTime(timestamp: number): string {
  return formatTimeAgo(new Date(timestamp * 1000).toISOString());
}

export default function Home() {
  const [updates, setUpdates] = useState<Update[]>([]);
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [lastChecked, setLastChecked] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/updates');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setUpdates(data.updates || []);
      setDiscussions(data.discussions || []);
      setLastChecked(data.lastChecked);
      setError(null);
    } catch (err) {
      setError('Failed to load updates. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [fetchData]);

  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="gradient-text">CBSE Class 10</span>
            <br />
            <span className="text-white">Result Updates 2026</span>
          </h1>
          <div className="flex items-center justify-center gap-4 text-sm text-zinc-400">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full live-indicator"></span>
              <span>Live Monitoring</span>
            </div>
            {lastChecked && (
              <span>Last checked: {formatTimeAgo(lastChecked)}</span>
            )}
          </div>
        </header>

        {error && (
          <div className="glass-card rounded-xl p-4 mb-6 text-red-400 text-center">
            {error}
          </div>
        )}

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <span>📢</span> Latest Updates
          </h2>
          {loading ? (
            <div className="glass-card rounded-xl p-8 text-center text-zinc-400">
              Loading updates...
            </div>
          ) : updates.length === 0 ? (
            <div className="glass-card rounded-xl p-8 text-center text-zinc-400">
              No updates yet. Check back soon!
            </div>
          ) : (
            <div className="space-y-3">
              {updates.slice(0, 10).map((update) => (
                <a
                  key={update.id}
                  href={update.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="update-card block"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h3 className="font-medium text-white">{update.title}</h3>
                    <span
                      className="source-badge"
                      style={{ backgroundColor: SOURCE_LABELS[update.source]?.color }}
                    >
                      {SOURCE_LABELS[update.source]?.label || update.source}
                    </span>
                  </div>
                  <p className="text-zinc-400 text-sm mb-2">{update.description}</p>
                  <span className="text-xs text-zinc-500">
                    {formatTimeAgo(update.timestamp)}
                  </span>
                </a>
              ))}
            </div>
          )}
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <span>🔗</span> Official Sources
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {SOURCE_LINKS.map((source) => (
              <a
                key={source.name}
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="source-link"
              >
                <span className="text-xl">{source.icon}</span>
                <span>{source.name}</span>
              </a>
            ))}
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <span>💬</span> Reddit Discussions
          </h2>
          {discussions.length === 0 ? (
            <div className="glass-card rounded-xl p-8 text-center text-zinc-400">
              No discussions found
            </div>
          ) : (
            <div className="grid gap-3">
              {discussions.slice(0, 8).map((discussion) => (
                <a
                  key={discussion.id}
                  href={discussion.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="discussion-card"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h3 className="font-medium text-white hover:text-orange-400 transition-colors">
                      {discussion.title}
                    </h3>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-zinc-500">
                    <span>by u/{discussion.author}</span>
                    <span>⬆️ {discussion.score}</span>
                    <span>💬 {discussion.numComments}</span>
                    <span>{formatRedditTime(discussion.created)}</span>
                  </div>
                </a>
              ))}
            </div>
          )}
        </section>

        <footer className="text-center text-zinc-500 text-sm">
          <p>Updates checked every hour via Vercel Cron</p>
          <p className="mt-1">
            Share this page on{' '}
            <a
              href="https://reddit.com/r/cbse"
              target="_blank"
              rel="noopener noreferrer"
              className="text-orange-400 hover:underline"
            >
              r/cbse
            </a>
          </p>
        </footer>
      </div>
    </main>
  );
}
