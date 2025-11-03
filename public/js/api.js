// ====================================
// 🌐 API Communication Layer
// ====================================

class MCPAPI {
  constructor() {
    this.baseURL = window.AppConfig.apiBaseUrl;
    this.hmacSecret = window.AppConfig.getHmacSecret();
    this.requestQueue = [];
    this.isProcessing = false;
  }

  // HMAC Signature Generation
  generateSignature(data, timestamp) {
    const crypto = window.crypto || window.msCrypto;
    if (!crypto || !crypto.subtle) {
      // Fallback for older browsers
      return this.generateSignatureFallback(data + timestamp);
    }

    const encoder = new TextEncoder();
    const keyData = encoder.encode(this.hmacSecret);
    const messageData = encoder.encode(data + timestamp);

    return crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    ).then(key => {
      return crypto.subtle.sign('HMAC', key, messageData);
    }).then(signature => {
      const hashArray = Array.from(new Uint8Array(signature));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }).catch(error => {
      console.error('HMAC generation failed:', error);
      return this.generateSignatureFallback(data + timestamp);
    });
  }

  generateSignatureFallback(data) {
    // Simple fallback HMAC implementation
    const crypto = require ? require('crypto') : null;
    if (crypto) {
      return crypto.createHmac('sha256', this.hmacSecret)
        .update(data, 'utf8')
        .digest('hex');
    }
    // Very basic fallback (not secure, but works for demo)
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
  }

  // Main API Request Method
  async request(endpoint, options = {}) {
    const {
      method = 'GET',
      data = {},
      headers = {},
      requireAuth = true
    } = options;

    // Validate HMAC secret if auth required
    if (requireAuth && !window.AppConfig.isValidHmacSecret()) {
      throw new Error('HMAC secret not configured');
    }

    // Prepare request data
    const requestData = method !== 'GET' ? JSON.stringify(data) : '';
    const timestamp = window.AppConfig.getCurrentTimestamp();

    // Generate signature
    let signature = '';
    if (requireAuth) {
      signature = await this.generateSignature(requestData, timestamp);
    }

    // Prepare headers
    const requestHeaders = {
      'Content-Type': 'application/json',
      ...headers
    };

    if (requireAuth) {
      requestHeaders['X-Signature'] = signature;
      requestHeaders['X-Timestamp'] = timestamp.toString();
    }

    // Prepare fetch options
    const fetchOptions = {
      method,
      headers: requestHeaders
    };

    if (method !== 'GET' && data) {
      fetchOptions.body = requestData;
    }

    // Make request with retry logic
    return this.requestWithRetry(endpoint, fetchOptions);
  }

  async requestWithRetry(endpoint, options, retries = window.AppConfig.maxRetries) {
    const url = `${this.baseURL}${endpoint}`;
    
    try {
      const response = await fetch(url, options);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        if (response.status === 401 && retries > 0) {
          // Authentication error, might be expired token
          console.warn('Authentication failed, retrying...');
          await this.delay(1000);
          return this.requestWithRetry(endpoint, options, retries - 1);
        }
        
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      return result;
      
    } catch (error) {
      console.error(`API request failed (${retries} retries left):`, error);
      
      if (retries > 0) {
        await this.delay(1000 * (window.AppConfig.maxRetries - retries + 1));
        return this.requestWithRetry(endpoint, options, retries - 1);
      }
      
      throw error;
    }
  }

  // Delay helper
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // API Methods for each endpoint

  // Health Check
  async checkHealth() {
    return this.request('/health', { requireAuth: false });
  }

  // Script Management
  async createScript(scriptData) {
    return this.request('/api/create_script', {
      method: 'POST',
      data: scriptData
    });
  }

  async listScripts(projectId = 'default') {
    return this.request(`/api/list_scripts?project_id=${encodeURIComponent(projectId)}`, {
      method: 'GET',
      requireAuth: false // Some endpoints might not require auth for read-only operations
    });
  }

  async updateScript(scriptData) {
    return this.request('/api/update_script', {
      method: 'PUT',
      data: scriptData
    });
  }

  async deleteScript(scriptName, projectId = 'default') {
    return this.request('/api/delete_script', {
      method: 'DELETE',
      data: { name: scriptName, project_id: projectId }
    });
  }

  // Project Management
  async getProjectStatus(projectId = 'default') {
    return this.request(`/api/get_project_status?project_id=${encodeURIComponent(projectId)}`, {
      method: 'GET',
      requireAuth: false
    });
  }

  // Script Validation
  async validateScript(content, scriptType = 'lua') {
    return this.request('/api/validate_script', {
      method: 'POST',
      data: { content, script_type: scriptType },
      requireAuth: false
    });
  }

  // Backup & Restore
  async backupProject(projectId = 'default') {
    return this.request('/api/backup_project', {
      method: 'POST',
      data: { project_id: projectId }
    });
  }

  async restoreProject(projectId, backupPath = null) {
    return this.request('/api/restore_project', {
      method: 'POST',
      data: { project_id: projectId, backup_path: backupPath }
    });
  }

  // MCP Protocol
  async callMCPFunction(functionName, parameters = {}) {
    return this.request('/mcp/function', {
      method: 'POST',
      data: {
        function: functionName,
        parameters
      }
    });
  }

  // Utility Methods
  setHmacSecret(secret) {
    this.hmacSecret = secret;
    window.AppConfig.setHmacSecret(secret);
  }

  clearHmacSecret() {
    this.hmacSecret = '';
    window.AppConfig.clearHmacSecret();
  }

  // Batch Operations
  async batchOperation(operations) {
    const results = [];
    
    for (const operation of operations) {
      try {
        const result = await this[operation.method](...operation.args);
        results.push({ success: true, result, operation });
      } catch (error) {
        results.push({ success: false, error: error.message, operation });
      }
    }
    
    return results;
  }

  // Statistics & Analytics
  async getAllScripts() {
    const result = await this.listScripts();
    return result.scripts || [];
  }

  async getProjectStats() {
    const status = await this.getProjectStatus();
    const scripts = await this.getAllScripts();
    
    return {
      totalScripts: scripts.length,
      scriptsByType: scripts.reduce((acc, script) => {
        acc[script.script_type] = (acc[script.script_type] || 0) + 1;
        return acc;
      }, {}),
      projectStatus: status,
      lastUpdate: new Date().toISOString()
    };
  }

  // Error Handling
  handleAPIError(error, context = 'API Request') {
    console.error(`${context} failed:`, error);
    
    // Show user-friendly error message
    const message = this.getErrorMessage(error);
    window.NotificationSystem.show(message, 'error');
    
    return {
      success: false,
      error: message,
      details: error.message
    };
  }

  getErrorMessage(error) {
    const message = error.message || 'Unknown error occurred';
    
    // Map common error codes to user-friendly messages
    const errorMap = {
      'MISSING_SIGNATURE': 'Authentication required. Please configure HMAC secret.',
      'INVALID_SIGNATURE': 'Invalid authentication. Please check your HMAC secret.',
      'TIMESTAMP_EXPIRED': 'Request expired. Please try again.',
      'MISSING_PARAMETERS': 'Missing required parameters.',
      'RATE_LIMIT_EXCEEDED': 'Too many requests. Please wait a moment and try again.',
      'NETWORK_ERROR': 'Network connection error. Please check your internet connection.',
      'SERVER_ERROR': 'Server error. Please try again later.'
    };
    
    // Find matching error code
    for (const [code, userMessage] of Object.entries(errorMap)) {
      if (message.includes(code) || message.toLowerCase().includes(code.toLowerCase())) {
        return userMessage;
      }
    }
    
    return message;
  }
}

// Create global API instance
window.MCPAPI = new MCPAPI();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MCPAPI;
}