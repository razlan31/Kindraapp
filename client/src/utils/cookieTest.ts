// INVESTIGATION #4: Frontend cookie transmission failure diagnostic
export function diagnoseCookieTransmission() {
  console.log('🔍 INVESTIGATION #4: Frontend cookie transmission diagnostic');
  
  // Test 1: Check document.cookie access
  const allCookies = document.cookie;
  console.log('🔍 Test 1 - Document.cookie access:', {
    hasAccess: typeof document.cookie !== 'undefined',
    cookieString: allCookies,
    cookieCount: allCookies.split(';').filter(c => c.trim()).length
  });
  
  // Test 2: Check for session cookie specifically
  const sessionCookie = allCookies.split(';').find(c => c.trim().startsWith('connect.sid='));
  console.log('🔍 Test 2 - Session cookie presence:', {
    hasSessionCookie: !!sessionCookie,
    sessionCookieValue: sessionCookie?.trim() || 'NOT FOUND'
  });
  
  // Test 3: Test cookie setting and reading
  const testCookieName = 'kindra_test_cookie';
  document.cookie = `${testCookieName}=test_value; path=/; SameSite=Lax`;
  const testCookieRead = document.cookie.includes(testCookieName);
  console.log('🔍 Test 3 - Cookie read/write test:', {
    canWriteCookies: testCookieRead,
    testCookieFound: testCookieRead
  });
  
  // Test 4: Check HTTP-only cookie handling
  console.log('🔍 Test 4 - HTTP-only cookie analysis:', {
    httpOnlyNote: 'HTTP-only cookies are not accessible via document.cookie',
    possibleCause: 'Session cookie might be HTTP-only, preventing JavaScript access'
  });
  
  // Test 5: Same-site and security analysis
  console.log('🔍 Test 5 - Cookie security analysis:', {
    location: window.location.href,
    protocol: window.location.protocol,
    domain: window.location.hostname,
    port: window.location.port,
    sameSiteIssue: 'SameSite=Lax should work for localhost'
  });
  
  return {
    hasDocumentCookieAccess: typeof document.cookie !== 'undefined',
    hasSessionCookie: !!sessionCookie,
    canWriteCookies: testCookieRead,
    allCookies: allCookies
  };
}

// INVESTIGATION #4: Advanced cookie transmission test
export async function testCookieTransmissionInFetch() {
  console.log('🔍 INVESTIGATION #4: Testing cookie transmission in fetch requests');
  
  // Before request
  const cookiesBefore = document.cookie;
  console.log('🔍 Cookies before request:', cookiesBefore);
  
  try {
    const response = await fetch('/api/debug/cookies', {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Cache-Control': 'no-cache'
      }
    });
    
    const data = await response.json();
    console.log('🔍 Server received cookies:', data);
    
    return {
      clientCookies: cookiesBefore,
      serverReceivedCookies: data.cookies,
      cookieTransmissionWorking: data.cookies.includes('connect.sid')
    };
  } catch (error) {
    console.error('🔍 Cookie transmission test failed:', error);
    return { error: error.message };
  }
}