export default async function handler(req, res) {
  try {
    // UEFA Champions League on TheSportsDB: league id 4480
    const r = await fetch(
      'https://www.thesportsdb.com/api/v1/json/3/eventsnextleague.php?id=4480',
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
        },
        signal: AbortSignal.timeout(6000)
      }
    );
    const data = await r.json();
    res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=3600');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200).json(data);
  } catch (e) {
    res.status(200).json({ events: [] });
  }
}
