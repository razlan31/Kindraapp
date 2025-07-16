// CRITICAL BREAKTHROUGH: I found a completely different angle that I missed
// NEW ANGLE DISCOVERED: The OAuth callback and React app may be running in different contexts

console.log('🔍 CRITICAL BREAKTHROUGH INVESTIGATION');
console.log('🔍 Testing if OAuth callback and React app are in different execution contexts');

// Test 1: Check if OAuth callback actually sets cookies that browsers can access
const testOAuthFlow = async () => {
  console.log('\n=== CRITICAL TEST 1: OAuth Callback Cookie Setting ===');
  
  try {
    // Simulate OAuth callback
    const response = await fetch('http://localhost:5000/api/auth/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include'
    });
    
    console.log('OAuth callback response status:', response.status);
    console.log('OAuth callback response headers:', [...response.headers.entries()]);
    
    const setCookieHeader = response.headers.get('Set-Cookie');
    console.log('Set-Cookie header from OAuth callback:', setCookieHeader);
    
    // Check if browser actually received and stored the cookie
    const cookieCheck = await fetch('http://localhost:5000/api/debug/cookies', {
      credentials: 'include'
    });
    
    console.log('Cookie check response:', await cookieCheck.text());
    
  } catch (error) {
    console.error('OAuth callback test failed:', error);
  }
};

// Test 2: Check if React app can manually set and read cookies
const testReactAppCookieAccess = () => {
  console.log('\n=== CRITICAL TEST 2: React App Cookie Access ===');
  
  // Try to manually set a cookie
  document.cookie = 'manual_test=react_app_set; Path=/; SameSite=Lax';
  console.log('After manual cookie setting, document.cookie:', document.cookie);
  
  // Try to read existing cookies
  console.log('All cookies accessible to React app:', document.cookie);
  
  // Check if session cookie is present
  const hasSessionCookie = document.cookie.includes('connect.sid');
  console.log('Session cookie present in React app:', hasSessionCookie);
};

// Test 3: Check if there's a domain/port mismatch
const testDomainMismatch = () => {
  console.log('\n=== CRITICAL TEST 3: Domain/Port Analysis ===');
  
  console.log('Current window location:', window.location.href);
  console.log('Current hostname:', window.location.hostname);
  console.log('Current port:', window.location.port);
  console.log('Current protocol:', window.location.protocol);
  
  // Check if we're in an iframe or different origin
  console.log('Top window same as current:', window.top === window);
  console.log('Parent window same as current:', window.parent === window);
  console.log('Document domain:', document.domain);
};

// Test 4: Check if Vite dev server is interfering
const testViteInterference = () => {
  console.log('\n=== CRITICAL TEST 4: Vite Dev Server Analysis ===');
  
  // Check if requests are being proxied
  console.log('Is this a Vite dev environment?', import.meta.env.DEV);
  console.log('Base URL:', import.meta.env.BASE_URL);
  console.log('Mode:', import.meta.env.MODE);
  
  // Check if API calls are going to the right place
  const apiUrl = '/api/me';
  console.log('API URL being called:', apiUrl);
  console.log('Full URL would be:', new URL(apiUrl, window.location.href).href);
};

// Run all tests
const runCriticalAnalysis = async () => {
  console.log('🚨 STARTING CRITICAL BREAKTHROUGH ANALYSIS');
  
  await testOAuthFlow();
  testReactAppCookieAccess();
  testDomainMismatch();
  testViteInterference();
  
  console.log('\n🚨 CRITICAL ANALYSIS COMPLETE');
};

// Execute immediately
runCriticalAnalysis();