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
  { name: 'CBSE Official', url: 'https://cbse.gov.in/', icon: '🎓' },
  { name: 'DigiLocker', url: 'https://digilocker.gov.in/', icon: '📁' },
  { name: 'UMANG', url: 'https://umang.gov.in/', icon: '📱' },
  { name: 'r/cbse', url: 'https://reddit.com/r/cbse', icon: '💬' },
];

const RESULT_KEYWORDS = ['result', 'results', 'score', 'marks', 'grades', 'pass', 'declared', 'announced', 'check', 'view', 'download'];

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

function isResultRelated(title: string, description: string): boolean {
  const text = (title + ' ' + description).toLowerCase();
  return RESULT_KEYWORDS.some(keyword => text.includes(keyword));
}

export default function Home() {
  const [updates, setUpdates] = useState<Update[]>([]);
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [lastChecked, setLastChecked] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [showNotificationBanner, setShowNotificationBanner] = useState(false);

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      setError('Notifications not supported in this browser');
      return;
    }
    
    if (Notification.permission === 'granted') {
      setNotificationsEnabled(true);
      setShowNotificationBanner(false);
      return;
    }
    
    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        setNotificationsEnabled(true);
        setShowNotificationBanner(false);
        new Notification('CBSE Result Monitor', {
          body: 'Notifications enabled! You will be alerted about new updates.',
          icon: '🔔'
        });
      }
    }
  };

  const sendNotification = (title: string, body: string) => {
    if (notificationsEnabled && Notification.permission === 'granted') {
      new Notification(title, { body, icon: '📢' });
    }
  };

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/updates');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      
      const oldUpdateCount = updates.length;
      const newUpdates = data.updates || [];
      const newDiscussions = data.discussions || [];
      
      setUpdates(newUpdates);
      setDiscussions(newDiscussions);
      setLastChecked(data.lastChecked);
      setError(null);

      if (newUpdates.length > oldUpdateCount && oldUpdateCount > 0) {
        sendNotification(
          '🔔 New CBSE Update!',
          `${newUpdates.length - oldUpdateCount} new update(s) found`
        );
      }

      const resultUpdates = newUpdates.filter((u: Update) => isResultRelated(u.title, u.description));
      if (resultUpdates.length > 0 && loading) {
        sendNotification(
          '📢 CBSE Result Related!',
          `Found ${resultUpdates.length} result-related update(s)`
        );
      }
    } catch (err) {
      setError('Failed to load updates. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [updates.length, loading]);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationsEnabled(Notification.permission === 'granted');
      if (Notification.permission === 'default') {
        setShowNotificationBanner(true);
      }
    }
    
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [fetchData]);

  useEffect(() => {
    const expectedDate = new Date('2026-05-15T00:00:00');
    
    const updateCountdown = () => {
      const now = new Date();
      const diff = expectedDate.getTime() - now.getTime();
      
      if (diff <= 0) {
        document.getElementById('days')!.textContent = '0';
        document.getElementById('hours')!.textContent = '0';
        document.getElementById('minutes')!.textContent = '0';
        document.getElementById('seconds')!.textContent = '0';
        return;
      }
      
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      document.getElementById('days')!.textContent = days.toString();
      document.getElementById('hours')!.textContent = hours.toString();
      document.getElementById('minutes')!.textContent = minutes.toString();
      document.getElementById('seconds')!.textContent = seconds.toString();
    };
    
    updateCountdown();
    const countdownInterval = setInterval(updateCountdown, 1000);
    return () => clearInterval(countdownInterval);
  }, []);

  const handleRefresh = async () => {
    setLoading(true);
    await fetchData();
    sendNotification('🔄 Refreshed', 'Latest updates loaded');
  };

  const relevantUpdates = updates.filter(u => isResultRelated(u.title, u.description));
  const relevantDiscussions = discussions.filter(d => isResultRelated(d.title, ''));

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
          
          {showNotificationBanner && (
            <div className="mt-4 glass-card rounded-xl p-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <span className="text-white">Enable notifications for instant alerts</span>
              <button
                onClick={requestNotificationPermission}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
              >
                Enable Notifications
              </button>
            </div>
          )}
          
          {notificationsEnabled && (
            <div className="mt-4 text-green-400 text-sm flex items-center justify-center gap-2">
              <span>🔔</span>
              <span>Notifications enabled</span>
            </div>
          )}
          
          <button
            onClick={handleRefresh}
            className="mt-4 px-6 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors flex items-center gap-2 mx-auto"
          >
            <span>🔄</span> Refresh Now
          </button>
        </header>

        <section className="mb-8">
          <div className="glass-card rounded-xl p-6 text-center">
            <h2 className="text-2xl font-bold mb-4">⏰ Expected Result Date</h2>
            <p className="text-zinc-400 mb-4">CBSE Class 10 Results 2026 are expected in May 2026</p>
            <div className="grid grid-cols-4 gap-4 max-w-md mx-auto">
              <div className="bg-zinc-800 rounded-lg p-3">
                <div className="text-3xl font-bold text-blue-400" id="days">--</div>
                <div className="text-xs text-zinc-500">Days</div>
              </div>
              <div className="bg-zinc-800 rounded-lg p-3">
                <div className="text-3xl font-bold text-blue-400" id="hours">--</div>
                <div className="text-xs text-zinc-500">Hours</div>
              </div>
              <div className="bg-zinc-800 rounded-lg p-3">
                <div className="text-3xl font-bold text-blue-400" id="minutes">--</div>
                <div className="text-xs text-zinc-500">Minutes</div>
              </div>
              <div className="bg-zinc-800 rounded-lg p-3">
                <div className="text-3xl font-bold text-blue-400" id="seconds">--</div>
                <div className="text-xs text-zinc-500">Seconds</div>
              </div>
            </div>
            <p className="text-sm text-zinc-500 mt-4">Results will be available on cbse.gov.in, DigiLocker, and UMANG</p>
          </div>
        </section>

        {error && (
          <div className="glass-card rounded-xl p-4 mb-6 text-red-400 text-center">
            {error}
          </div>
        )}

        {relevantUpdates.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <span className="animate-pulse">🚨</span>
              <span className="text-red-400">Result-Related Updates</span>
            </h2>
            <div className="space-y-3">
              {relevantUpdates.slice(0, 5).map((update) => (
                <a
                  key={update.id}
                  href={update.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="update-card block border-red-500/30 hover:border-red-500"
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
          </section>
        )}

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <span>📢</span> All Updates ({updates.length})
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

        {relevantDiscussions.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <span>🔥</span>
              <span className="text-orange-400">Hot Result Discussions on Reddit</span>
            </h2>
            <div className="grid gap-3">
              {relevantDiscussions.slice(0, 5).map((discussion) => (
                <a
                  key={discussion.id}
                  href={discussion.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="discussion-card border-orange-500/30 hover:border-orange-500"
                >
                  <h3 className="font-medium text-white hover:text-orange-400 transition-colors mb-2">
                    {discussion.title}
                  </h3>
                  <div className="flex items-center gap-4 text-xs text-zinc-500">
                    <span>by u/{discussion.author}</span>
                    <span>⬆️ {discussion.score}</span>
                    <span>💬 {discussion.numComments}</span>
                    <span>{formatRedditTime(discussion.created)}</span>
                  </div>
                </a>
              ))}
            </div>
          </section>
        )}

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <span>💬</span> Reddit Discussions ({discussions.length})
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
                  <h3 className="font-medium text-white hover:text-orange-400 transition-colors mb-2">
                    {discussion.title}
                  </h3>
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
