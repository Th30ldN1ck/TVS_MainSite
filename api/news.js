export default async function handler(req, res) {
  const key = process.env.NEWSAPI_KEY;
  if (!key) {
    res.status(500).json({ status: 'error', message: 'NEWSAPI_KEY not configured' });
    return;
  }
  try {
    const r = await fetch(
      'https://newsapi.org/v2/top-headlines?category=entertainment&language=en&pageSize=30&apiKey=' + key
    );
    const data = await r.json();
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
    res.status(200).json(data);
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.message });
  }
}
