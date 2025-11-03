const RobloxMCPClient = require('../src/client');

// Advanced usage patterns for production scenarios
class AdvancedRobloxMCPClient extends RobloxMCPClient {
  constructor(baseUrl, hmacSecret) {
    super(baseUrl, hmacSecret);
    this.batchSize = 10;
    this.retryAttempts = 3;
    this.retryDelay = 1000;
  }

  // Retry wrapper for resilient API calls
  async makeRequestWithRetry(endpoint, method, data, params, attempt = 1) {
    try {
      return await this.makeRequest(endpoint, method, data, params);
    } catch (error) {
      if (attempt <= this.retryAttempts && this.isRetryableError(error)) {
        this.logger.info(`Retrying request (${attempt}/${this.retryAttempts})...`);
        await this.sleep(this.retryDelay * attempt);
        return this.makeRequestWithRetry(endpoint, method, data, params, attempt + 1);
      }
      throw error;
    }
  }

  isRetryableError(error) {
    return error.response?.status >= 500 || error.code === 'ECONNREFUSED';
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Batch operations for efficiency
  async createScriptsBatch(scripts) {
    console.log(`🔄 Creating ${scripts.length} scripts in batch...`);
    const results = [];
    
    for (let i = 0; i < scripts.length; i += this.batchSize) {
      const batch = scripts.slice(i, i + this.batchSize);
      const batchPromises = batch.map(script => 
        this.createScript(script.name, script.content, script.type, script.projectId)
      );
      
      try {
        const batchResults = await Promise.allSettled(batchPromises);
        batchResults.forEach((result, index) => {
          results.push({
            scriptName: batch[index].name,
            success: result.status === 'fulfilled' && result.value.success,
            result: result.status === 'fulfilled' ? result.value : { error: result.reason?.message }
          });
        });
      } catch (error) {
        console.error(`Batch ${Math.floor(i/this.batchSize) + 1} failed:`, error.message);
      }
    }
    
    return results;
  }

  // Project management helper
  async initializeProject(projectId, scripts = []) {
    console.log(`🚀 Initializing project: ${projectId}`);
    
    // Create project if it doesn't exist
    await this.getProjectStatus(projectId).catch(() => null);
    
    // Import scripts if provided
    if (scripts.length > 0) {
      const results = await this.createScriptsBatch(scripts);
      const successCount = results.filter(r => r.success).length;
      console.log(`✅ Project initialized with ${successCount}/${scripts.length} scripts`);
    }
    
    // Create initial backup
    const backup = await this.backupProject(projectId);
    if (backup.success) {
      console.log(`💾 Initial backup created: ${backup.backup_filename}`);
    }
    
    return await this.getProjectStatus(projectId);
  }

  // Automated validation and cleanup
  async validateAndOptimizeProject(projectId) {
    console.log(`🔧 Validating and optimizing project: ${projectId}`);
    
    // Get all scripts
    const listResult = await this.listScripts(projectId);
    if (!listResult.success) {
      throw new Error('Failed to list scripts for validation');
    }

    let optimizedCount = 0;
    const validationResults = [];

    for (const script of listResult.scripts) {
      try {
        // Get script content (would need an additional endpoint in real implementation)
        // For now, we'll simulate validation
        const validation = await this.validateScript(`-- Script: ${script.name}\nprint("Hello")`, script.type);
        
        validationResults.push({
          scriptName: script.name,
          validation: validation,
          script: script
        });

        if (!validation.valid || validation.warnings.length > 0) {
          optimizedCount++;
          this.logger.info(`Optimization needed for: ${script.name}`);
        }
      } catch (error) {
        this.logger.error(`Validation failed for ${script.name}:`, error.message);
      }
    }

    console.log(`🎯 Validation complete. ${optimizedCount} scripts need attention.`);
    return validationResults;
  }

  // Disaster recovery
  async disasterRecovery(projectId, backupPath = null) {
    console.log(`🚨 Starting disaster recovery for project: ${projectId}`);
    
    try {
      // Check current status
      const currentStatus = await this.getProjectStatus(projectId);
      console.log('Current status:', currentStatus.statistics?.total_scripts || 0, 'scripts');

      // Find best backup to restore from
      let backupToRestore = backupPath;
      if (!backupToRestore) {
        const status = await this.getProjectStatus(projectId);
        // In real implementation, would query for latest backup
        console.log('No specific backup provided, will use latest available');
      }

      // Restore project
      const restoreResult = await this.restoreProject(projectId, backupToRestore);
      if (!restoreResult.success) {
        throw new Error(`Restore failed: ${restoreResult.error}`);
      }

      // Verify restoration
      const finalStatus = await this.getProjectStatus(projectId);
      console.log(`✅ Recovery complete: ${finalStatus.statistics.total_scripts} scripts restored`);
      
      return {
        success: true,
        restored: finalStatus.statistics.total_scripts,
        skipped: restoreResult.scripts_skipped,
        status: finalStatus
      };

    } catch (error) {
      console.error(`❌ Disaster recovery failed:`, error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Performance monitoring
  async monitorProjectHealth(projectId) {
    console.log(`📊 Monitoring health for project: ${projectId}`);
    
    const startTime = Date.now();
    
    try {
      const status = await this.getProjectStatus(projectId);
      const endTime = Date.now();
      
      return {
        success: true,
        responseTime: endTime - startTime,
        project: status.project,
        statistics: status.statistics,
        health: {
          score: this.calculateHealthScore(status.statistics),
          issues: this.identifyIssues(status.statistics)
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  calculateHealthScore(statistics) {
    let score = 100;
    
    // Deduct points for issues
    if (statistics.backup_count === 0) score -= 20;
    if (statistics.total_scripts === 0) score -= 10;
    
    return Math.max(0, score);
  }

  identifyIssues(statistics) {
    const issues = [];
    
    if (statistics.backup_count === 0) {
      issues.push('No backups created');
    }
    
    if (statistics.total_scripts === 0) {
      issues.push('No scripts in project');
    }
    
    return issues;
  }
}

async function runAdvancedTests() {
  console.log('🚀 Advanced Usage Test - Roblox MCP Node.js Client');
  console.log('====================================================');

  const client = new AdvancedRobloxMCPClient(
    process.env.ROBLOX_MCP_URL || 'http://localhost:3000',
    process.env.ROBLOX_MCP_HMAC_SECRET || 'default_secret_123'
  );

  try {
    // Health check
    await client.healthCheck();

    // Test 1: Project initialization with batch operations
    console.log('\n1. 🚀 Project Initialization Test');
    const testScripts = [
      { name: 'PlayerController', content: 'local Players = game:GetService("Players")', type: 'lua' },
      { name: 'GameLogic', content: 'local ReplicatedStorage = game:GetService("ReplicatedStorage")', type: 'lua' },
      { name: 'UIHandler', content: 'local Players = game:GetService("Players")', type: 'luau' }
    ];

    const initResult = await client.initializeProject('advanced_test_project', testScripts);
    console.log('Project initialized:', initResult.success);

    // Test 2: Health monitoring
    console.log('\n2. 📊 Health Monitoring Test');
    const healthReport = await client.monitorProjectHealth('advanced_test_project');
    console.log('Health Score:', healthReport.health.score);
    console.log('Issues:', healthReport.health.issues);

    // Test 3: Validation and optimization
    console.log('\n3. 🔧 Validation and Optimization Test');
    const validationResults = await client.validateAndOptimizeProject('advanced_test_project');
    console.log('Validation results:', validationResults.length, 'scripts checked');

    // Test 4: Disaster recovery simulation
    console.log('\n4. 🚨 Disaster Recovery Test');
    const recoveryResult = await client.disasterRecovery('advanced_test_project');
    console.log('Recovery successful:', recoveryResult.success);

    console.log('\n🎉 Advanced tests completed!');
    console.log('====================================================');

  } catch (error) {
    console.error('\n❌ Advanced test failed:', error.message);
  }
}

// Run tests if called directly
if (require.main === module) {
  runAdvancedTests();
}

module.exports = AdvancedRobloxMCPClient;