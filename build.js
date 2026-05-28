const fs = require('fs');
const path = require('path');

// Load .env for local dev (Vercel uses process.env directly)
try {
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split(/\r?\n/).forEach(function(line) {
      const m = line.match(/^\s*([^#=]+?)\s*=\s*(.+)/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
    });
    console.log('.env loaded');
  }
} catch(e) {}

const htmlPath = path.join(__dirname, 'travel-tracker.html');
let html = fs.readFileSync(htmlPath, 'utf-8');

const mapsKey = process.env.GOOGLE_MAPS_API_KEY || '';
const geocodeKey = process.env.GOOGLE_GEOCODE_API_KEY || '';

html = html.replace(/__GOOGLE_MAPS_API_KEY__/g, mapsKey);
html = html.replace(/__GOOGLE_GEOCODE_API_KEY__/g, geocodeKey);

fs.writeFileSync(htmlPath, html);

console.log(mapsKey ? 'GOOGLE_MAPS_API_KEY injected' : 'WARNING: GOOGLE_MAPS_API_KEY not set');
console.log(geocodeKey ? 'GOOGLE_GEOCODE_API_KEY injected' : 'WARNING: GOOGLE_GEOCODE_API_KEY not set');
