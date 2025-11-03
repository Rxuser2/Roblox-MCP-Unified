const crypto = require('crypto');
const axios = require('axios');

class RobloxMCPClient {
  constructor(baseUrl = 'http://localhost:3000', hmacSecret = 'your_hmac_secret_here') {
    this.baseUrl = baseUrl;
    this.hmacSecret = hmacSecret;
    this.logger = {
      info: (msg) => console.log(`ℹ️  ${msg}`),
      error: (msg) => console.error(`❌ ${msg}`),
      success: (msg) => console.log(`✅ ${msg}`)
    };
  }

  generateSignature(data, timestamp) {
    return crypto
      .createHmac('sha256', this.hmacSecret)
      .update(data + timestamp, 'utf8')
      .digest('hex');
  }

  async makeRequest(endpoint, method = 'GET', data = {}, params = {}) {
    const timestamp = Date.now().toString();
    const dataStr = JSON.stringify(data);
    const signature = this.generateSignature(dataStr, timestamp);

    const config = {
      method,
      url: `${this.baseUrl}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        'X-Signature': signature,
        'X-Timestamp': timestamp
      },
      ...(method !== 'GET' && { data }),
      ...(method === 'GET' && { params })
    };

    try {
      const response = await axios(config);
      return response.data;
    } catch (error) {
      this.logger.error(`Request failed: ${error.message}`);
      throw error;
    }
  }

  // Tool 1: Create Script
  async createScript(name, content, scriptType = 'lua', projectId = 'default') {
    this.logger.info(`Creating script: ${name}`);
    return await this.makeRequest('/api/create_script', 'POST', {
      name, content, script_type: scriptType, project_id: projectId
    });
  }

  // Tool 2: List Scripts
  async listScripts(projectId = 'default') {
    this.logger.info(`Listing scripts for project: ${projectId}`);
    return await this.makeRequest('/api/list_scripts', 'GET', {}, { project_id: projectId });
  }

  // Tool 3: Update Script
  async updateScript(name, content, projectId = 'default') {
    this.logger.info(`Updating script: ${name}`);
    return await this.makeRequest('/api/update_script', 'PUT', {
      name, content, project_id: projectId
    });
  }

  // Tool 4: Delete Script
  async deleteScript(name, projectId = 'default') {
    this.logger.info(`Deleting script: ${name}`);
    return await this.makeRequest('/api/delete_script', 'DELETE', {
      name, project_id: projectId
    });
  }

  // Tool 5: Get Project Status
  async getProjectStatus(projectId = 'default') {
    this.logger.info(`Getting status for project: ${projectId}`);
    return await this.makeRequest('/api/get_project_status', 'GET', {}, { project_id: projectId });
  }

  // Tool 6: Validate Script
  async validateScript(content, scriptType = 'lua') {
    this.logger.info('Validating script content');
    return await this.makeRequest('/api/validate_script', 'POST', {
      content, script_type: scriptType
    });
  }

  // Tool 7: Backup Project
  async backupProject(projectId = 'default') {
    this.logger.info(`Backing up project: ${projectId}`);
    return await this.makeRequest('/api/backup_project', 'POST', {
      project_id: projectId
    });
  }

  // Tool 8: Restore Project
  async restoreProject(projectId, backupPath = null) {
    this.logger.info(`Restoring project: ${projectId}`);
    return await this.makeRequest('/api/restore_project', 'POST', {
      project_id: projectId, backup_path: backupPath
    });
  }

  // Health check
  async healthCheck() {
    this.logger.info('Performing health check');
    return await this.makeRequest('/health', 'GET');
  }
}

module.exports = RobloxMCPClient;