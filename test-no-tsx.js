// Test server without TSX compilation to check for Node.js process timeout issues
import express from 'express';
import { storage } from './server/database-storage.js';

const app = express();
app.use(express.json());

console.log('🧪 TESTING ITEM #2: Running without TSX compilation');

// Test badge initialization without TSX
async function testBadgeInitialization() {
  try {
    console.log('🔍 TESTING: Badge initialization without TSX compilation...');
    
    // Use same timeout race condition as in main server
    const initializationPromise = storage.initializeBadges();
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error('Badge initialization timed out after 8 seconds - without TSX'));
      }, 8000);
    });
    
    await Promise.race([initializationPromise, timeoutPromise]);
    console.log('✅ TESTING: Badge initialization completed successfully without TSX');
  } catch (error) {
    console.error('🚨 TESTING: Badge initialization failed without TSX:', error);
    if (error.message.includes('cancelled') || error.message.includes('timed out')) {
      console.error('🎯 TESTING: Sequelize cancellation error occurred WITHOUT TSX compilation');
    }
  }
}

// Run test
testBadgeInitialization().then(() => {
  console.log('🧪 TESTING ITEM #2: Test completed, process will exit');
  process.exit(0);
}).catch((error) => {
  console.error('🚨 TESTING ITEM #2: Test failed:', error);
  process.exit(1);
});