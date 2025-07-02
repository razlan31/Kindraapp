import React from 'react';

export default function TestLandingPage() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Test Landing Page</h1>
        <p className="text-xl text-gray-600 mb-8">This is a test to verify routing is working</p>
        <div className="bg-blue-50 p-8 rounded-lg border-2 border-blue-200">
          <h2 className="text-2xl font-bold text-blue-800 mb-4">PWA Download Section</h2>
          <p className="text-blue-600">This would be where the PWA download functionality appears</p>
        </div>
      </div>
    </div>
  );
}