const hoursByPeriod = { "24h": 24, "7d": 168, "30d": 720, "90d": 2160 };
const regions = [
  ["Not provided", 427], ["India", 207], ["Nigeria", 108], ["United Kingdom", 63],
  ["United States", 44], ["Greece", 28], ["Ghana", 21], ["Canada", 13], ["South Africa", 11], ["Austria", 7],
].map(([region, value]) => ({ region, value }));

export function analyticsRoute(method, path, url) {
  if (method !== "GET") return;
  const period = new URL(url, "http://localhost").searchParams.get("filter");
  const window = Object.hasOwn(hoursByPeriod, period) ? period : "30d";
  const hours = hoursByPeriod[window];

  if (path === "/api/v1/admin/post-analytics") {
    const step = window === "24h" ? 1 : 24;
    const start = Math.floor((Date.now() - hours * 3_600_000) / (step * 3_600_000));
    const contentActivity = Array.from({ length: hours / step + 1 }, (_, index) => ({
      date: new Date((start + index) * step * 3_600_000).toISOString(),
      posts: index % 5 === 0 ? 0 : ((index * 7) % 16) + 2,
      likes: index % 5 === 0 ? 0 : ((index * 13) % 48) + 3,
      comments: index % 5 === 0 ? 0 : (index * 3) % 13,
    }));
    return {
      contentActivity,
      totalInteractions: contentActivity.reduce((total, day) => total + day.likes + day.comments, 0),
      activeUsers: Math.round(3 + hours / 5),
      flaggedContent: Math.round(hours / 72),
      regionalData: regions,
      regionAdditions: Math.round(hours / 14),
      topHashtags: [{ tag: "chess", count: 103 }, { tag: "tournament", count: 68 }, { tag: "bgmi", count: 42 }],
    };
  }
  if (path === "/api/v1/admin/retention-analytics") {
    const count = (perDay) => Math.round((hours / 24) * perDay);
    return {
      window, matchesRecorded: count(30), playersRecordingMatches: count(8), levelUps: count(3),
      streakUpdates: count(12), sharePrompts: count(20), playerCardShares: count(5),
      shareConversionRate: 25, notificationsQueued: count(50), notificationsDelivered: count(40),
      notificationsOpened: count(10), notificationsOptedOut: count(3), notificationsCapped: count(7),
      notificationOpenRate: 25,
    };
  }
}
