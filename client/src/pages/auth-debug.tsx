import React, { useState } from 'react';

export default function AuthDebug() {
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [userInfo, setUserInfo] = useState<any>(null);

  const testAuth = async () => {
    try {
      // First, create a test session
      const authResponse = await fetch('/api/auth/test', {
        method: 'POST',
        credentials: 'include'
      });
      
      if (authResponse.ok) {
        console.log('✅ Test auth successful');
        
        // Now check if we can get user info
        const userResponse = await fetch('/api/me', {
          credentials: 'include'
        });
        
        if (userResponse.ok) {
          const userData = await userResponse.json();
          setUserInfo(userData);
          console.log('✅ User data retrieved:', userData);
        } else {
          console.error('❌ Failed to get user data:', userResponse.status);
        }
      }
    } catch (error) {
      console.error('❌ Auth test failed:', error);
    }
  };

  const checkCookies = async () => {
    try {
      const response = await fetch('/api/debug/cookies', {
        credentials: 'include'
      });
      const data = await response.json();
      setDebugInfo(data);
      console.log('Debug info:', data);
    } catch (error) {
      console.error('❌ Debug check failed:', error);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Authentication Debug</h1>
      
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold mb-2">Document Cookies:</h2>
          <code className="bg-gray-100 p-2 rounded block">
            {document.cookie || 'No cookies found'}
          </code>
        </div>
        
        <div className="space-x-2">
          <button
            onClick={testAuth}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Test Authentication
          </button>
          
          <button
            onClick={checkCookies}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            Check Cookies
          </button>
          
          <a
            href="/api/auth/google"
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 inline-block"
          >
            Test Google OAuth
          </a>
        </div>
        
        {debugInfo && (
          <div>
            <h2 className="text-lg font-semibold mb-2">Debug Info:</h2>
            <pre className="bg-gray-100 p-4 rounded overflow-auto">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </div>
        )}
        
        {userInfo && (
          <div>
            <h2 className="text-lg font-semibold mb-2">User Info:</h2>
            <pre className="bg-gray-100 p-4 rounded overflow-auto">
              {JSON.stringify(userInfo, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}