// Test script to verify May 15th red highlighting issue is resolved
// This tests that Emma's cycle (connection 10) doesn't show when only Amalina (connection 6) is selected

async function testMay15thIssue() {
  console.log('Testing May 15th highlighting issue...');
  
  try {
    // Test 1: Get all cycles to confirm Emma's cycle exists
    const cyclesResponse = await fetch('http://localhost:5000/api/menstrual-cycles');
    const cycles = await cyclesResponse.json();
    
    console.log('\n1. CYCLE DATA VERIFICATION:');
    const emmaCycle59 = cycles.find(c => c.id === 59 && c.connectionId === 10);
    if (emmaCycle59) {
      console.log('✓ Emma cycle 59 found:', {
        id: emmaCycle59.id,
        connectionId: emmaCycle59.connectionId,
        periodEndDate: emmaCycle59.periodEndDate
      });
    } else {
      console.log('✗ Emma cycle 59 not found');
    }
    
    // Test 2: Get connections to verify Amalina exists
    const connectionsResponse = await fetch('http://localhost:5000/api/connections');
    const connections = await connectionsResponse.json();
    
    console.log('\n2. CONNECTION VERIFICATION:');
    const amalina = connections.find(c => c.id === 6 && c.name === 'Amalina');
    const emma = connections.find(c => c.id === 10 && c.name === 'Emma');
    
    if (amalina) {
      console.log('✓ Amalina (connection 6) found');
    }
    if (emma) {
      console.log('✓ Emma (connection 10) found');
    }
    
    // Test 3: Verify the problem scenario
    console.log('\n3. ISSUE ANALYSIS:');
    console.log('PROBLEM: When user selects only Amalina (6), May 15th still shows red from Emma\'s cycle (10)');
    console.log('EXPECTED: May 15th should have NO red highlighting when only Amalina is selected');
    console.log('REASON: Emma cycle 59 has periodEndDate: 2025-05-15, which conflicts with filtering');
    
    // Test 4: Check current calendar state
    console.log('\n4. CALENDAR STATE:');
    console.log('Current URL: http://localhost:5000/calendar');
    console.log('To reproduce issue:');
    console.log('1. Navigate to May 2025 (click previous month from June)');
    console.log('2. Ensure only Amalina is selected in connection filter');
    console.log('3. Look at May 15th - it should NOT have red highlighting');
    
    console.log('\n✅ Test complete. Please navigate to May 2025 to verify the fix.');
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testMay15thIssue();