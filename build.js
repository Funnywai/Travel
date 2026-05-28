const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, 'travel-tracker.html');
let html = fs.readFileSync(htmlPath, 'utf-8');

const mapsKey = process.env.GOOGLE_MAPS_API_KEY || '';
const geocodeKey = process.env.GOOGLE_GEOCODE_API_KEY || '';

html = html.replace(/__GOOGLE_MAPS_API_KEY__/g, mapsKey);
html = html.replace(/__GOOGLE_GEOCODE_API_KEY__/g, geocodeKey);

fs.writeFileSync(htmlPath, html);

console.log(mapsKey ? 'GOOGLE_MAPS_API_KEY injected' : 'WARNING: GOOGLE_MAPS_API_KEY not set');
console.log(geocodeKey ? 'GOOGLE_GEOCODE_API_KEY injected' : 'WARNING: GOOGLE_GEOCODE_API_KEY not set');
