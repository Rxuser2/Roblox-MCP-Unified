// Comprehensive test suite untuk Roblox MCP Node.js Server
const RobloxMCPClient = require('../src/client');

class ComprehensiveTestSuite {
  constructor(baseUrl = 'http://localhost:3000', hmacSecret = 'test_secret_123') {
    this.client = new RobloxMCPClient(baseUrl, hmacSecret);
    this.testResults = [];
    this.startTime = Date.now();
  }

  async runAllTests() {
    console.log('🧪 Starting Comprehensive Test Suite');
    console.log('=====================================');
    console.log(`Base URL: ${this.client.baseUrl}`);
    console.log(`HMAC Secret: ${this.client.hmacSecret ? '***' : 'Not set'}`);
    console.log('');

    // Test suite execution
    const tests = [
      { name: 'Health Check', test: () => this.testHealthCheck() },
      { name: 'Database Initialization', test: () => this.testDatabaseInit() },
      { name: 'Create Script', test: () => this.testCreateScript() },
      { name: 'List Scripts', test: () => this.testListScripts() },
      { name: 'Update Script', test: () => this.testUpdateScript() },
      { name: 'Validate Script', test: () => this.testValidateScript() },
      { name: 'Get Project Status', test: () => this.testGetProjectStatus() },
      { name: 'Backup Project', test: () => this.testBackupProject() },
      { name: 'Delete Script', test: () => this.testDeleteScript() },
      { name: 'Restore Project', test: () => this.testRestoreProject() },
      { name: 'Error Handling', test: () => this.testErrorHandling() },
      { name: 'Rate Limiting', test: () => this.testRateLimiting() },
      { name: 'Security Features', test: () => this.testSecurityFeatures() }
    ];

    for (const { name, test } of tests) {
      try {
        console.log(`\n🔍 Running: ${name}`);
        const result = await test();
        this.testResults.push({ name, success: true, ...result });
        console.log(`✅ ${name}: SUCCESS`);
      } catch (error) {
        this.testResults.push({ name, success: false, error: error.message });
        console.log(`❌ ${name}: FAILED - ${error.message}`);
      }
    }

    this.printSummary();
    return this.testResults;
  }

  async testHealthCheck() {
    const response = await this.client.healthCheck();
    
    if (response.status !== 'healthy') {
      throw new Error(`Server not healthy: ${response.status}`);
    }
    
    if (!response.timestamp) {
      throw new Error('Missing timestamp in response');
    }
    
    if (!response.uptime) {
      throw new Error('Missing uptime in response');
    }

    return {
      status: response.status,
      uptime: response.uptime,
      timestamp: response.timestamp
    };
  }

  async testDatabaseInit() {
    // Test dengan creating script untuk verify database working
    const testScript = {
      name: 'TestInitScript',
      content: '-- Test database initialization\nprint("Database init test")',
      script_type: 'lua',
      project_id: 'test_db_init'
    };

    const result = await this.client.createScript(
      testScript.name,
      testScript.content,
      testScript.script_type,
      testScript.project_id
    );

    if (!result.success) {
      throw new Error(`Database init failed: ${result.error}`);
    }

    return {
      scriptId: result.script_id,
      project: testScript.project_id
    };
  }

  async testCreateScript() {
    const scripts = [
      { name: 'PlayerController', content: 'local Players = game:GetService("Players")', type: 'lua' },
      { name: 'GameManager', content: 'local ReplicatedStorage = game:GetService("ReplicatedStorage")', type: 'luau' }
    ];

    const results = [];
    for (const script of scripts) {
      const result = await this.client.createScript(script.name, script.content, script.type, 'create_test');
      if (!result.success) {
        throw new Error(`Failed to create script ${script.name}: ${result.error}`);
      }
      results.push({ name: script.name, id: result.script_id });
    }

    return {
      createdScripts: results.length,
      scripts: results
    };
  }

  async testListScripts() {
    // First create a script untuk test listing
    await this.client.createScript('ListTestScript', 'print("Listing test")', 'lua', 'list_test');
    
    const result = await this.client.listScripts('list_test');
    
    if (!result.success) {
      throw new Error(`List scripts failed: ${result.error}`);
    }
    
    if (result.count === 0) {
      throw new Error('No scripts found after creation');
    }

    return {
      count: result.count,
      scripts: result.scripts
    };
  }

  async testUpdateScript() {
    // Create script first
    await this.client.createScript('UpdateTestScript', 'original content', 'lua', 'update_test');
    
    const updatedContent = '-- Updated content\nprint("Script updated successfully")';
    const result = await this.client.updateScript('UpdateTestScript', updatedContent, 'update_test');
    
    if (!result.success) {
      throw new Error(`Update script failed: ${result.error}`);
    }

    return {
      scriptName: 'UpdateTestScript',
      updated: true
    };
  }

  async testValidateScript() {
    const testCases = [
      { content: 'function test()\n  print("Hello")\nend', type: 'lua', expectedValid: true },
      { content: 'loadstring("malicious code")', type: 'lua', expectedValid: true, expectedWarning: true },
      { content: '', type: 'lua', expectedValid: false, expectedError: true },
      { content: 'function broken()\n  print("missing end")', type: 'lua', expectedValid: true, expectedWarning: true }
    ];

    const results = [];
    for (const testCase of testCases) {
      const result = await this.client.validateScript(testCase.content, testCase.type);
      
      if (testCase.expectedValid && !result.valid) {
        throw new Error(`Validation failed unexpectedly for: ${testCase.content}`);
      }
      
      if (testCase.expectedError && result.valid) {
        throw new Error(`Expected invalid result but got valid for: ${testCase.content}`);
      }

      results.push({
        contentLength: result.content_length,
        valid: result.valid,
        warnings: result.warnings?.length || 0,
        errors: result.errors?.length || 0
      });
    }

    return {
      testCases: results.length,
      results: results
    };
  }

  async testGetProjectStatus() {
    // Create test project data
    await this.client.createScript('StatusTestScript', 'print("Status test")', 'lua', 'status_test');
    await this.client.createScript('StatusTestScript2', 'print("Status test 2")', 'luau', 'status_test');
    
    const result = await this.client.getProjectStatus('status_test');
    
    if (!result.success) {
      throw new Error(`Get project status failed: ${result.error}`);
    }
    
    if (!result.statistics || result.statistics.total_scripts === 0) {
      throw new Error('No statistics returned or no scripts found');
    }

    return {
      project: result.project,
      statistics: result.statistics,
      status: result.status
    };
  }

  async testBackupProject() {
    // Create test data untuk backup
    await this.client.createScript('BackupTestScript', 'print("Backup test")', 'lua', 'backup_test');
    
    const result = await this.client.backupProject('backup_test');
    
    if (!result.success) {
      throw new Error(`Backup failed: ${result.error}`);
    }
    
    if (!result.backup_path) {
      throw new Error('No backup path returned');
    }

    return {
      backupPath: result.backup_path,
      scriptsBackedUp: result.scripts_backed_up,
      backupSize: result.backup_size_bytes
    };
  }

  async testDeleteScript() {
    // Create script first
    await this.client.createScript('DeleteTestScript', 'print("Delete test")', 'lua', 'delete_test');
    
    const result = await this.client.deleteScript('DeleteTestScript', 'delete_test');
    
    if (!result.success) {
      throw new Error(`Delete script failed: ${result.error}`);
    }

    return {
      scriptName: 'DeleteTestScript',
      deleted: true
    };
  }

  async testRestoreProject() {
    // Create and backup script first
    await this.client.createScript('RestoreTestScript', 'print("Restore test")', 'lua', 'restore_test');
    const backup = await this.client.backupProject('restore_test');
    
    if (!backup.success) {
      throw new Error(`Backup for restore test failed: ${backup.error}`);
    }

    // Delete script
    await this.client.deleteScript('RestoreTestScript', 'restore_test');
    
    // Restore script
    const result = await this.client.restoreProject('restore_test', backup.backup_path);
    
    if (!result.success) {
      throw new Error(`Restore failed: ${result.error}`);
    }
    
    if (result.scripts_restored === 0) {
      throw new Error('No scripts were restored');
    }

    return {
      restored: result.scripts_restored,
      skipped: result.scripts_skipped
    };
  }

  async testErrorHandling() {
    const errorTests = [
      {
        name: 'Missing signature',
        request: async () => {
          const response = await fetch(`${this.client.baseUrl}/api/create_script`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: 'test', content: 'test' })
          });
          return response;
        },
        expectedStatus: 401
      },
      {
        name: 'Invalid JSON',
        request: async () => {
          const timestamp = Date.now().toString();
          const signature = this.client.generateSignature('invalid json', timestamp);
          const response = await fetch(`${this.client.baseUrl}/api/create_script`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Signature': signature,
              'X-Timestamp': timestamp
            },
            body: 'invalid json'
          });
          return response;
        },
        expectedStatus: 400
      }
    ];

    const results = [];
    for (const errorTest of errorTests) {
      try {
        const response = await errorTest.request();
        if (response.status !== errorTest.expectedStatus) {
          throw new Error(`Expected status ${errorTest.expectedStatus}, got ${response.status}`);
        }
        results.push({ test: errorTest.name, passed: true });
      } catch (error) {
        results.push({ test: errorTest.name, passed: false, error: error.message });
      }
    }

    return {
      errorTests: results,
      passed: results.filter(r => r.passed).length
    };
  }

  async testRateLimiting() {
    // Make multiple rapid requests untuk test rate limiting
    const requests = [];
    for (let i = 0; i < 5; i++) {
      const result = await this.client.getProjectStatus('rate_limit_test');
      requests.push(result.success);
    }

    // At least some requests should succeed
    const successRate = requests.filter(success => success).length / requests.length;
    if (successRate < 0.5) {
      throw new Error(`Rate limiting too aggressive: ${successRate * 100}% success rate`);
    }

    return {
      totalRequests: requests.length,
      successfulRequests: requests.filter(s => s).length,
      successRate: `${(successRate * 100).toFixed(1)}%`
    };
  }

  async testSecurityFeatures() {
    const securityTests = [];

    // Test 1: Valid HMAC signature
    try {
      const timestamp = Date.now().toString();
      const data = JSON.stringify({ name: 'security_test', content: 'test' });
      const signature = this.client.generateSignature(data, timestamp);
      
      const response = await fetch(`${this.client.baseUrl}/api/create_script`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Signature': signature,
          'X-Timestamp': timestamp
        },
        body: data
      });
      
      securityTests.push({
        test: 'Valid HMAC signature',
        passed: response.status !== 401
      });
    } catch (error) {
      securityTests.push({
        test: 'Valid HMAC signature',
        passed: false,
        error: error.message
      });
    }

    // Test 2: Invalid HMAC signature
    try {
      const response = await fetch(`${this.client.baseUrl}/api/create_script`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Signature': 'invalid_signature',
          'X-Timestamp': Date.now().toString()
        },
        body: JSON.stringify({ name: 'security_test', content: 'test' })
      });
      
      securityTests.push({
        test: 'Invalid HMAC signature rejection',
        passed: response.status === 401
      });
    } catch (error) {
      securityTests.push({
        test: 'Invalid HMAC signature rejection',
        passed: false,
        error: error.message
      });
    }

    // Test 3: CORS headers
    try {
      const response = await fetch(`${this.client.baseUrl}/health`);
      const corsHeaders = {
        'access-control-allow-origin': response.headers.get('access-control-allow-origin'),
        'access-control-allow-methods': response.headers.get('access-control-allow-methods')
      };
      
      securityTests.push({
        test: 'CORS headers present',
        passed: !!(corsHeaders['access-control-allow-origin'])
      });
    } catch (error) {
      securityTests.push({
        test: 'CORS headers present',
        passed: false,
        error: error.message
      });
    }

    return {
      securityTests: securityTests,
      passed: securityTests.filter(t => t.passed).length
    };
  }

  printSummary() {
    console.log('\n📊 TEST SUITE SUMMARY');
    console.log('======================');
    
    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter(r => r.success).length;
    const failedTests = totalTests - passedTests;
    const duration = Date.now() - this.startTime;
    
    console.log(`Total Tests: ${totalTests}`);
    console.log(`✅ Passed: ${passedTests}`);
    console.log(`❌ Failed: ${failedTests}`);
    console.log(`⏱️  Duration: ${duration}ms`);
    console.log(`📈 Success Rate: ${((passedTests/totalTests) * 100).toFixed(1)}%`);
    
    if (failedTests > 0) {
      console.log('\n❌ Failed Tests:');
      this.testResults
        .filter(r => !r.success)
        .forEach(r => console.log(`   - ${r.name}: ${r.error}`));
    }
    
    console.log('\n🎯 Overall Status:', failedTests === 0 ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED');
    console.log('======================\n');
  }
}

// CLI execution
async function runTests() {
  const baseUrl = process.env.TEST_SERVER_URL || 'http://localhost:3000';
  const hmacSecret = process.env.TEST_HMAC_SECRET || 'test_secret_123';
  
  const testSuite = new ComprehensiveTestSuite(baseUrl, hmacSecret);
  
  try {
    await testSuite.runAllTests();
    process.exit(0);
  } catch (error) {
    console.error('Test suite failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  runTests();
}

module.exports = ComprehensiveTestSuite;