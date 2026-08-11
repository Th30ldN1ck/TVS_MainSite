export default async function handler(req, res) {
  const key = process.env.NEWSAPI_KEY;
  if (!key) {
    res.status(500).json({ status: 'error', message: 'NEWSAPI_KEY not configured' });
    return;
  }
  try {
    const r = await fetch(
      'https://newsapi.org/v2/top-headlines?category=sports&language=en&pageSize=30&apiKey=' + key
    );
    const data = await r.json();
    if (data.status === 'error') {
      res.status(200).json({ status: 'error', articles: [] });
      return;
    }
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
    res.status(200).json(data);
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.message });
  }
}
