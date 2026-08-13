export default async function handler(req, res) {
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
  };

  async function fetchDay(date) {
    try {
      const r = await fetch(
        `https://www.thesportsdb.com/api/v1/json/3/eventsday.php?d=${date}&s=Soccer`,
        { headers, signal: AbortSignal.timeout(6000) }
      );
      const data = await r.json();
      return data.events || [];
    } catch {
      return [];
    }
  }

  try {
    const now = Date.now();
    const dates = [0, 1, 2].map(offset => {
      return new Date(now + offset * 86400000).toISOString().split('T')[0];
    });

    const results = await Promise.all(dates.map(fetchDay));
    const seen = new Set();
    const events = [];
    for (const day of results) {
      for (const ev of day) {
        const key = ev.idEvent || (ev.strHomeTeam + ev.strAwayTeam + ev.dateEvent);
        if (!seen.has(key)) { seen.add(key); events.push(ev); }
      }
    }

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 's-maxage=900, stale-while-revalidate=1800');
    res.status(200).json({ events: events.slice(0, 40) });
  } catch (e) {
    res.status(200).json({ events: [] });
  }
}
