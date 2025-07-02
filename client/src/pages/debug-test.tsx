import React from 'react';

export default function DebugTest() {
  console.log("DebugTest component rendering");
  return (
    <div style={{ padding: '20px', backgroundColor: 'yellow', minHeight: '100vh' }}>
      <h1 style={{ color: 'red', fontSize: '24px' }}>DEBUG TEST PAGE</h1>
      <p style={{ color: 'black', fontSize: '18px' }}>If you can see this, routing is working!</p>
      <div style={{ backgroundColor: 'blue', color: 'white', padding: '20px', marginTop: '20px' }}>
        <h2>PWA Download Section Placeholder</h2>
        <p>This would be where the PWA download functionality appears</p>
      </div>
    </div>
  );
}