const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

const https = require('https');
app.use(express.json());

// Serve static assets from 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// API Endpoint: Scrape public Finn.no job advertisement (Concept #2 B2C Scraper)
app.post('/api/scrape-finn', (req, res) => {
  const { url } = req.body || {};
  if (!url || !url.includes('finn.no')) {
    return res.status(400).json({ error: 'Vennligst oppgi en gyldig Finn.no-lenke (f.eks. https://www.finn.no/job/ad/...)' });
  }

  https.get(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
      'Accept-Language': 'nb-NO,nb;q=0.9,no;q=0.8'
    }
  }, (finnRes) => {
    let html = '';
    finnRes.on('data', (chunk) => { html += chunk; });
    finnRes.on('end', () => {
      const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
      const descMatch = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i);
      // Strip scripts, styles, and HTML tags from body to extract job text
      const bodyClean = html
        .replace(/<script[\s\S]*?<\/script>/gi, ' ')
        .replace(/<style[\s\S]*?<\/style>/gi, ' ')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      const title = titleMatch ? titleMatch[1].replace(/\s*\|\s*FINN\.no/i, '').trim() : 'Finn.no Stilling';
      const summary = descMatch ? descMatch[1].trim() : '';
      const snippet = bodyClean.slice(0, 2800);

      res.json({
        title,
        summary,
        extractedText: `STILLING FRA FINN.NO: ${title}\nOPPSUMMERING: ${summary}\nDETALJER: ${snippet}`
      });
    });
  }).on('error', (err) => {
    res.status(500).json({ error: 'Kunne ikke hente Finn.no-siden direkte: ' + err.message });
  });
});

// Serve NorskLive Pro AI Trainer at /norsk
app.get(['/norsk', '/norsk/*'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'norsk', 'index.html'));
});

// Fallback route to index.html for SPA behavior
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
