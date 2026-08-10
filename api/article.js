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

    if (!r.ok) { res.status(200).json({ items: [] }); return; }

    const html = await r.text();
    const root = parse(html);

    // Strip noise
    ['script', 'style', 'nav', 'header', 'footer', 'aside', 'figcaption',
     '[class*="related"]', '[class*="sidebar"]', '[class*="promo"]', '[class*="newsletter"]',
     '[class*="social"]', '[id*="comment"]', '[class*="comment"]', '[class*="ad-"]',
     '[class*="advertisement"]'
    ].forEach(function(sel) {
      try { root.querySelectorAll(sel).forEach(function(el) { el.remove(); }); } catch(e) {}
    });

    const selectors = [
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

    var contentEl = null;
    for (var i = 0; i < selectors.length; i++) {
      try { contentEl = root.querySelector(selectors[i]); } catch(e) { continue; }
      if (contentEl) break;
    }

    if (!contentEl) { res.status(200).json({ items: [] }); return; }

    const items = [];
    const seenImgs = new Set();

    function resolveUrl(src) {
      if (!src || src.startsWith('data:')) return null;
      if (src.startsWith('//')) return 'https:' + src;
      if (src.startsWith('/')) {
        try { return new URL(url).origin + src; } catch(e) { return null; }
      }
      if (src.startsWith('http')) return src;
      return null;
    }

    function processImg(imgEl) {
      var src = imgEl.getAttribute('src') ||
                imgEl.getAttribute('data-src') ||
                imgEl.getAttribute('data-lazy-src') ||
                imgEl.getAttribute('data-original');
      src = resolveUrl(src);
      if (!src || seenImgs.has(src)) return;
      var w = parseInt(imgEl.getAttribute('width') || '0');
      var h = parseInt(imgEl.getAttribute('height') || '0');
      // Skip tracking pixels and tiny icons
      if ((w > 0 && w < 200) || (h > 0 && h < 150)) return;
      seenImgs.add(src);
      items.push({ t: 'img', v: src, alt: imgEl.getAttribute('alt') || '' });
    }

    contentEl.querySelectorAll('p, img, figure').forEach(function(node) {
      if (node.tagName === 'P') {
        var text = node.text.trim();
        if (text.length > 40) items.push({ t: 'p', v: text });
      } else if (node.tagName === 'IMG') {
        processImg(node);
      } else if (node.tagName === 'FIGURE') {
        var img = node.querySelector('img');
        if (img) processImg(img);
      }
    });

    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=7200');
    res.status(200).json({ items: items });
  } catch(e) {
    res.status(200).json({ items: [] });
  }
}
