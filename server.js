const fs = require('fs');
const http = require('http');
const path = require('path');

const HTML_FILE = path.join(__dirname, 'travel-tracker.html');
const HTML = fs.readFileSync(HTML_FILE, 'utf-8');

const ENV = {};
try {
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split(/\r?\n/).forEach(function(line) {
      const m = line.match(/^\s*([^#=]+?)\s*=\s*(.+)/);
      if (m) ENV[m[1]] = m[2].trim();
    });
    console.log('.env loaded');
  }
} catch(e) {}

const PORT = process.env.PORT || 3000;

const server = http.createServer(function(req, res) {
  if (req.url === '/' || req.url.startsWith('/#')) {
    let html = HTML
      .replace(/__GOOGLE_MAPS_API_KEY__/g, ENV.GOOGLE_MAPS_API_KEY || '')
      .replace(/__GOOGLE_GEOCODE_API_KEY__/g, ENV.GOOGLE_GEOCODE_API_KEY || '');
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
    return;
  }
  res.writeHead(404);
  res.end();
});

server.listen(PORT, function() {
  console.log('Dev server running at http://localhost:' + PORT);
});
