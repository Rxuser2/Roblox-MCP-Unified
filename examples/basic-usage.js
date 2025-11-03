const RobloxMCPClient = require('../src/client');

// Configuration
const BASE_URL = process.env.ROBLOX_MCP_URL || 'http://localhost:3000';
const HMAC_SECRET = process.env.ROBLOX_MCP_HMAC_SECRET || 'default_secret_123';

async function runBasicTests() {
  console.log('🧪 Basic Usage Test - Roblox MCP Node.js Client');
  console.log('===============================================');

  const client = new RobloxMCPClient(BASE_URL, HMAC_SECRET);

  try {
    // Health check
    console.log('\n1. 🔍 Health Check');
    const health = await client.healthCheck();
    console.log('Status:', health.status);

    // Test 1: Create a script
    console.log('\n2. 📝 Create Script Test');
    const createResult = await client.createScript(
      'PlayerController',
      'local Players = game:GetService("Players")\nlocal player = Players.LocalPlayer\nprint("PlayerController loaded!")',
      'lua',
      'test_project'
    );
    console.log('Create Result:', createResult.success ? 'SUCCESS' : 'FAILED');
    if (!createResult.success) console.log('Error:', createResult.error);

    // Test 2: List scripts
    console.log('\n3. 📋 List Scripts Test');
    const listResult = await client.listScripts('test_project');
    console.log('List Result:', listResult.success ? 'SUCCESS' : 'FAILED');
    if (listResult.success) {
      console.log(`Found ${listResult.count} scripts`);
    }

    // Test 3: Validate script
    console.log('\n4. ✅ Validate Script Test');
    const validateResult = await client.validateScript(
      'function test()\n  print("Hello World")\nend',
      'lua'
    );
    console.log('Validation Result:', validateResult.valid ? 'VALID' : 'INVALID');
    if (validateResult.warnings.length > 0) {
      console.log('Warnings:', validateResult.warnings);
    }

    // Test 4: Update script
    console.log('\n5. 🔄 Update Script Test');
    const updateResult = await client.updateScript(
      'PlayerController',
      'local Players = game:GetService("Players")\nlocal player = Players.LocalPlayer\n-- Updated content\nprint("PlayerController updated!")',
      'test_project'
    );
    console.log('Update Result:', updateResult.success ? 'SUCCESS' : 'FAILED');

    // Test 5: Get project status
    console.log('\n6. 📊 Get Project Status Test');
    const statusResult = await client.getProjectStatus('test_project');
    console.log('Status Result:', statusResult.success ? 'SUCCESS' : 'FAILED');
    if (statusResult.success) {
      console.log(`Scripts: ${statusResult.statistics.total_scripts}, Backups: ${statusResult.statistics.backup_count}`);
    }

    // Test 6: Backup project
    console.log('\n7. 💾 Backup Project Test');
    const backupResult = await client.backupProject('test_project');
    console.log('Backup Result:', backupResult.success ? 'SUCCESS' : 'FAILED');
    if (backupResult.success) {
      console.log(`Backup saved: ${backupResult.backup_filename}`);
    }

    console.log('\n🎉 Basic tests completed!');
    console.log('===============================================');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.log('\nMake sure the server is running on:', BASE_URL);
  }
}

// Run tests if called directly
if (require.main === module) {
  runBasicTests();
}

module.exports = { runBasicTests };