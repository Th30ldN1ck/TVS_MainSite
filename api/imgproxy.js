export default async function handler(req, res) {
  const { url } = req.query;
  if (!url) { res.status(400).end(); return; }

  let decoded;
  try {
    decoded = decodeURIComponent(url);
    const parsed = new URL(decoded);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      res.status(400).end(); return;
    }
  } catch (e) {
    res.status(400).end(); return;
  }

  try {
    const origin = new URL(decoded).origin;
    const r = await fetch(decoded, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Referer': origin + '/',
        'Accept': 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(8000),
    });

    if (!r.ok) { res.status(r.status).end(); return; }

    const ct = r.headers.get('content-type') || 'image/jpeg';
    if (!ct.startsWith('image/')) { res.status(400).end(); return; }

    res.setHeader('Content-Type', ct);
    res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=604800');
    res.setHeader('Access-Control-Allow-Origin', '*');

    const buf = await r.arrayBuffer();
    res.status(200).send(Buffer.from(buf));
  } catch (e) {
    res.status(500).end();
  }
}
