// Test script to verify connection update works
const fetch = require('node-fetch');

async function testConnectionUpdate() {
  try {
    const response = await fetch('http://localhost:5000/api/connections/21', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'connect.sid=s%3AyourSessionId.signature' // You'll need actual session
      },
      body: JSON.stringify({
        relationshipStage: 'Best Friend',
        startDate: '2025-06-05T00:00:00.000Z',
        birthday: '2025-05-28T00:00:00.000Z'
      })
    });
    
    console.log('Status:', response.status);
    const result = await response.json();
    console.log('Result:', result);
  } catch (error) {
    console.error('Error:', error);
  }
}

testConnectionUpdate();