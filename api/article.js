import { parse } from 'node-html-parser';

export default async function handler(req, res) {
  const { url } = req.query;
  if (!url) { res.status(400).json({ error: 'url required' }); return; }

  try {
    const r = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5'
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(8000)
    });

    if (!r.ok) { res.status(200).json({ content: '' }); return; }

    const html = await r.text();
    const root = parse(html);

    // Strip noise
    ['script', 'style', 'nav', 'header', 'footer', 'aside', 'figure', 'figcaption',
     '[class*="related"]', '[class*="sidebar"]', '[class*="promo"]', '[class*="newsletter"]',
     '[class*="social"]', '[id*="comment"]', '[class*="comment"]'
    ].forEach(function(sel) {
      try { root.querySelectorAll(sel).forEach(function(el) { el.remove(); }); } catch(e) {}
    });

    // Try content selectors in priority order
    var selectors = [
      'article',
      '[itemprop="articleBody"]',
      '[class*="article-body"]',
      '[class*="article-content"]',
      '[class*="story-body"]',
      '[class*="story-content"]',
      '[class*="post-content"]',
      '[class*="entry-content"]',
      '[class*="body-copy"]',
      '[class*="article__body"]',
      'main'
    ];

    var content = '';
    for (var i = 0; i < selectors.length; i++) {
      var el;
      try { el = root.querySelector(selectors[i]); } catch(e) { continue; }
      if (!el) continue;
      var paras = el.querySelectorAll('p');
      var text = paras
        .map(function(p) { return p.text.trim(); })
        .filter(function(t) { return t.length > 40; })
        .join('\n\n');
      if (text.length > 300) { content = text; break; }
    }

    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=7200');
    res.status(200).json({ content: content });
  } catch(e) {
    res.status(200).json({ content: '' });
  }
}
