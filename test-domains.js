// Test script to check domain behavior
import https from 'https';

console.log('Testing both domains...');

// Test kindra-jagohtrade.replit.app
const options1 = {
  hostname: 'kindra-jagohtrade.replit.app',
  port: 443,
  path: '/api/auth/google',
  method: 'GET'
};

console.log('Testing kindra-jagohtrade.replit.app...');
const req1 = https.request(options1, (res) => {
  console.log('Status:', res.statusCode);
  console.log('Headers:', res.headers);
  console.log('Location:', res.headers.location);
  
  if (res.headers.location) {
    const url = new URL(res.headers.location);
    console.log('Redirect URI in OAuth URL:', url.searchParams.get('redirect_uri'));
  }
});

req1.on('error', (e) => {
  console.error('Error with kindra-jagohtrade:', e.message);
});

req1.end();

// Test ca9e9deb... domain
const options2 = {
  hostname: 'ca9e9deb-b0f0-46ea-a081-8c85171c0808-00-1ti2lvpbxeuft.worf.replit.dev',
  port: 443,
  path: '/api/auth/google',
  method: 'GET'
};

console.log('\nTesting ca9e9deb... domain...');
const req2 = https.request(options2, (res) => {
  console.log('Status:', res.statusCode);
  console.log('Headers:', res.headers);
  console.log('Location:', res.headers.location);
  
  if (res.headers.location) {
    const url = new URL(res.headers.location);
    console.log('Redirect URI in OAuth URL:', url.searchParams.get('redirect_uri'));
  }
});

req2.on('error', (e) => {
  console.error('Error with ca9e9deb... domain:', e.message);
});

req2.end();