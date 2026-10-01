require('dotenv').config();
const express = require('express');
const cors = require('cors');
const dns = require('node:dns');
const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

// Parse URL-encoded bodies (as sent by HTML forms).
app.use(express.urlencoded({ extended: false }));

app.use('/public', express.static(`${process.cwd()}/public`));

// In-memory storage for URL mappings.
const urls = new Map();
let nextId = 1;

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

// Endpoint to create a short URL.
app.post('/api/shorturl', function(req, res) {
  const originalUrl = req.body.url;
  let parsedUrl;

  try {
    parsedUrl = new URL(originalUrl);
  } catch (error) {
    return res.json({ error: 'invalid url' });
  }

  if (!['http:', 'https:'].includes(parsedUrl.protocol) || !parsedUrl.hostname) {
    return res.json({ error: 'invalid url' });
  }

  dns.lookup(parsedUrl.hostname, function(error) {
    if (error) {
      return res.json({ error: 'invalid url' });
    }

    const shortUrl = nextId++;
    urls.set(shortUrl, originalUrl);
    res.json({ original_url: originalUrl, short_url: shortUrl });
  });
});

// Endpoint to redirect to the original URL based on the short URL.
app.get('/api/shorturl/:shortUrl', function(req, res) {
  const originalUrl = urls.get(Number(req.params.shortUrl));

  if (!originalUrl) {
    return res.status(404).json({ error: 'short url not found' });
  }

  res.redirect(originalUrl);
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
