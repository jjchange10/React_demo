// Simple test to verify database initialization
const { InitializationService } = require('./services/initialization');

async function testInitialization() {
  try {
    console.log('Testing app initialization...');
    await InitializationService.initialize();
    console.log('✅ Initialization test passed');
  } catch (error) {
    console.error('❌ Initialization test failed:', error);
  }
}

testInitialization();