import https from 'https';
import http from 'http';

console.log('=== SYSTEMATIC OAUTH DEBUGGING ===');
console.log('Timestamp:', new Date().toISOString());

// Test both domains systematically
const domains = [
  'kindra-jagohtrade.replit.app',
  'ca9e9deb-b0f0-46ea-a081-8c85171c0808-00-1ti2lvpbxeuft.worf.replit.dev'
];

async function testDomain(domain) {
  console.log(`\n🔍 TESTING DOMAIN: ${domain}`);
  
  // Test 1: Check if test endpoint works
  try {
    const testResponse = await makeRequest(`https://${domain}/api/test`);
    console.log('✅ Test endpoint response:', JSON.stringify(testResponse, null, 2));
  } catch (error) {
    console.log('❌ Test endpoint failed:', error.message);
  }
  
  // Test 2: Check OAuth endpoint with detailed tracking
  try {
    const oauthResponse = await makeRequest(`https://${domain}/api/auth/google`, {
      followRedirects: false
    });
    console.log('📋 OAuth Response Status:', oauthResponse.statusCode);
    console.log('📋 OAuth Response Headers:', JSON.stringify(oauthResponse.headers, null, 2));
    
    // Extract redirect URI from Location header
    const location = oauthResponse.headers.location;
    if (location) {
      const redirectUriMatch = location.match(/redirect_uri=([^&]+)/);
      if (redirectUriMatch) {
        const redirectUri = decodeURIComponent(redirectUriMatch[1]);
        console.log('🎯 REDIRECT URI EXTRACTED:', redirectUri);
        console.log('🎯 PROTOCOL:', redirectUri.startsWith('https://') ? 'HTTPS ✅' : 'HTTP ❌');
      }
    }
  } catch (error) {
    console.log('❌ OAuth test failed:', error.message);
  }
}

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      headers: {
        'User-Agent': 'OAuth-Debug-Tool/1.0'
      }
    };

    const client = urlObj.protocol === 'https:' ? https : http;
    
    const req = client.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ statusCode: res.statusCode, headers: res.headers, data: jsonData });
        } catch (e) {
          resolve({ statusCode: res.statusCode, headers: res.headers, data: data });
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(10000, () => reject(new Error('Request timeout')));
    req.end();
  });
}

async function runTests() {
  for (const domain of domains) {
    await testDomain(domain);
  }
  
  console.log('\n=== ANALYSIS COMPLETE ===');
}

runTests().catch(console.error);