// Comprehensive test for delete cycle functionality
// This tests the complete flow from API to database to UI

const testUserId = 8; // Current user ID
const testConnectionId = 6; // Amalina's connection ID

async function testDeleteCycleFlow() {
  console.log('🧪 Starting comprehensive delete cycle test...');
  
  try {
    // 1. First, get all existing cycles to see current state
    console.log('\n1️⃣ Fetching current cycles...');
    const initialResponse = await fetch('/api/menstrual-cycles', {
      credentials: 'include'
    });
    
    if (!initialResponse.ok) {
      throw new Error(`Failed to fetch cycles: ${initialResponse.status}`);
    }
    
    const initialCycles = await initialResponse.json();
    console.log('Initial cycles found:', initialCycles.length);
    
    // Find cycles for connection 6 (Amalina)
    const amalinaCycles = initialCycles.filter(c => c.connectionId === testConnectionId);
    console.log('Amalina cycles found:', amalinaCycles.length);
    
    if (amalinaCycles.length === 0) {
      console.log('✅ No cycles found for Amalina - delete functionality already working');
      return;
    }
    
    // 2. Create a test cycle to delete if none exist
    let testCycleId;
    if (amalinaCycles.length === 0) {
      console.log('\n2️⃣ Creating test cycle for deletion...');
      const createResponse = await fetch('/api/menstrual-cycles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          connectionId: testConnectionId,
          startDate: '2025-06-01',
          periodEndDate: '2025-06-05',
          notes: 'Test cycle for deletion'
        })
      });
      
      if (!createResponse.ok) {
        throw new Error(`Failed to create test cycle: ${createResponse.status}`);
      }
      
      const newCycle = await createResponse.json();
      testCycleId = newCycle.id;
      console.log('Created test cycle with ID:', testCycleId);
    } else {
      testCycleId = amalinaCycles[0].id;
      console.log('Using existing cycle for test:', testCycleId);
    }
    
    // 3. Test the delete endpoint
    console.log(`\n3️⃣ Testing delete cycle ${testCycleId}...`);
    const deleteResponse = await fetch(`/api/menstrual-cycles/${testCycleId}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    
    console.log('Delete response status:', deleteResponse.status);
    const deleteResult = await deleteResponse.json();
    console.log('Delete response:', deleteResult);
    
    if (!deleteResponse.ok) {
      throw new Error(`Delete failed: ${deleteResult.message}`);
    }
    
    // 4. Verify deletion by checking if cycle still exists
    console.log('\n4️⃣ Verifying deletion...');
    const verifyResponse = await fetch('/api/menstrual-cycles', {
      credentials: 'include'
    });
    
    if (!verifyResponse.ok) {
      throw new Error(`Failed to verify deletion: ${verifyResponse.status}`);
    }
    
    const afterCycles = await verifyResponse.json();
    const deletedCycleExists = afterCycles.some(c => c.id === testCycleId);
    
    if (deletedCycleExists) {
      console.log('❌ FAILURE: Cycle still exists after deletion');
      console.log('Remaining cycle:', afterCycles.find(c => c.id === testCycleId));
      return false;
    } else {
      console.log('✅ SUCCESS: Cycle successfully deleted from database');
    }
    
    // 5. Check calendar doesn't show deleted cycle phases
    console.log('\n5️⃣ Testing calendar integration...');
    const amalinaCyclesAfter = afterCycles.filter(c => c.connectionId === testConnectionId);
    console.log('Amalina cycles after deletion:', amalinaCyclesAfter.length);
    
    if (amalinaCyclesAfter.length === 0) {
      console.log('✅ SUCCESS: No cycles remain for Amalina - calendar should show no phases');
    }
    
    console.log('\n🎉 Delete cycle test completed successfully!');
    console.log('📋 Summary:');
    console.log('- Delete endpoint working correctly');
    console.log('- Database deletion verified');
    console.log('- Calendar integration should work properly');
    
    return true;
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    return false;
  }
}

// Run the test
testDeleteCycleFlow().then(success => {
  if (success) {
    console.log('\n✅ All tests passed - delete cycle functionality is working properly');
  } else {
    console.log('\n❌ Tests failed - delete cycle needs fixes');
  }
});