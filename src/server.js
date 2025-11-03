const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs-extra');

const config = require('./config');
const DatabaseService = require('./database');
const RobloxToolsService = require('./robloxToolsService');

class MCPServer {
  constructor() {
    this.app = express();
    this.db = new DatabaseService(config.dbPath);
    this.robloxTools = new RobloxToolsService();
    this.logger = config.initializeLogger();
    this.setupMiddleware();
    this.setupRoutes();
  }

  setupMiddleware() {
    // Railway proxy configuration untuk Railway deployment
    this.app.set('trust proxy', 1);
    
    // Security headers
    if (config.enableSecurityHeaders) {
      this.app.use(helmet());
    }

    // CORS
    this.app.use(cors({
      origin: config.corsOrigin === '*' ? true : config.corsOrigin,
      credentials: true
    }));

    // Rate limiting with Railway proxy support
    if (config.enableRateLimiting) {
      const limiter = rateLimit({
        windowMs: config.rateLimitWindowMs,
        max: config.rateLimitMaxRequests,
        message: {
          error: 'Too many requests from this IP, please try again later.',
          code: 'RATE_LIMIT_EXCEEDED'
        },
        standardHeaders: true,
        legacyHeaders: false,
        // Railway proxy-friendly configuration
        keyGenerator: (req) => {
          // Use real client IP instead of proxy IP
          return req.ip || req.connection.remoteAddress || 'unknown';
        }
      });
      this.app.use('/api/', limiter);
    }

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));

    // Request logging
    this.app.use((req, res, next) => {
      this.logger.info(`${req.method} ${req.path} - ${req.ip}`);
      next();
    });
  }

  setupRoutes() {
    // Enhanced health check dengan performance metrics
    this.app.get('/health', (req, res) => {
      const dbStatus = this.db ? 'connected' : 'disconnected';
      const memoryUsage = process.memoryUsage();
      
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: {
          rss: Math.round(memoryUsage.rss / 1024 / 1024) + ' MB',
          heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024) + ' MB',
          heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024) + ' MB'
        },
        database: {
          status: dbStatus,
          path: config.dbPath
        },
        version: require('../package.json').version,
        railway: {
          proxy: req.app.get('trust proxy') ? 'enabled' : 'disabled',
          rateLimit: config.enableRateLimiting ? 'enabled' : 'disabled'
        }
      });
    });

    // API routes (Web UI friendly - no auth required for read operations)
    this.app.post('/api/create_script', this.validateRequest, this.handleCreateScript.bind(this));
    this.app.get('/api/list_scripts', this.handleListScripts.bind(this)); // No auth for list
    this.app.put('/api/update_script', this.validateRequest, this.handleUpdateScript.bind(this));
    this.app.delete('/api/delete_script', this.validateRequest, this.handleDeleteScript.bind(this));
    this.app.get('/api/get_project_status', this.handleGetProjectStatus.bind(this)); // No auth for status
    this.app.post('/api/validate_script', this.handleValidateScript.bind(this)); // No auth for validation
    this.app.post('/api/backup_project', this.validateRequest, this.handleBackupProject.bind(this));
    this.app.post('/api/restore_project', this.validateRequest, this.handleRestoreProject.bind(this));

    // MCP Protocol support
    this.app.post('/mcp/function', this.validateRequest, this.handleMCPFunction.bind(this));

    // HMAC Secret endpoint untuk MCP client configuration
    this.app.get('/api/get_hmac_secret', (req, res) => {
      res.json({
        hmac_secret: config.hmacSecret,
        timestamp: new Date().toISOString(),
        note: 'Keep this secret secure and use it to configure your MCP client'
      });
    });

    // Performance monitoring endpoint
    this.app.get('/api/performance', (req, res) => {
      const fs = require('fs');
      let dbSize = 'unknown';
      
      try {
        if (fs.existsSync(config.dbPath)) {
          const stats = fs.statSync(config.dbPath);
          dbSize = Math.round(stats.size / 1024) + ' KB';
        }
      } catch (error) {
        this.logger.warn('Could not get database size:', error.message);
      }
      
      const performance = {
        memory: process.memoryUsage(),
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        database: {
          path: config.dbPath,
          size: dbSize
        },
        server: {
          nodeEnv: config.nodeEnv,
          port: config.port,
          proxy: req.app.get('trust proxy') ? 'enabled' : 'disabled'
        }
      };
      res.json(performance);
    });

    // Serve static files for web interface
    this.app.use(express.static(path.join(__dirname, '../public')));
    
    // Catch all route - serve index.html for SPA
    this.app.get('*', (req, res) => {
      // Skip API routes and health check
      if (req.path.startsWith('/api/') || req.path === '/health' || req.path.startsWith('/mcp/')) {
        return res.status(404).json({ error: 'API endpoint not found' });
      }
      res.sendFile(path.join(__dirname, '../public/index.html'));
    });

    // Error handling
    this.app.use(this.errorHandler.bind(this));
  }

  validateRequest(req, res, next) {
    try {
      // Add request timeout untuk database operations
      req.setTimeout(config.dbQueryTimeout || 30000, () => {
        res.status(408).json({
          success: false,
          error: 'Request timeout - operation took too long',
          code: 'REQUEST_TIMEOUT'
        });
      });

      const signature = req.headers['x-signature'] || req.headers['authorization']?.replace('Bearer ', '');
      
      if (!signature) {
        return res.status(401).json({
          success: false,
          error: 'Missing signature',
          code: 'MISSING_SIGNATURE'
        });
      }

      const data = JSON.stringify(req.body);
      const timestamp = req.headers['x-timestamp'] || '';

      // Check timestamp (prevent replay attacks)
      const now = Date.now();
      const requestTime = parseInt(timestamp);
      if (timestamp && Math.abs(now - requestTime) > 300000) { // 5 minutes
        return res.status(401).json({
          success: false,
          error: 'Request timestamp too old',
          code: 'TIMESTAMP_EXPIRED'
        });
      }

      // Validate HMAC
      const expectedSignature = config.generateHmac(data + timestamp);
      if (!config.validateHmac(data + timestamp, signature)) {
        return res.status(401).json({
          success: false,
          error: 'Invalid signature',
          code: 'INVALID_SIGNATURE'
        });
      }

      next();
    } catch (error) {
      this.logger.error('Request validation error:', error);
      res.status(500).json({
        success: false,
        error: 'Request validation failed',
        code: 'VALIDATION_ERROR'
      });
    }
  }

  // Handler methods for all 8 tools
  async handleCreateScript(req, res) {
    try {
      const { name, content, script_type = 'lua', project_id = 'default' } = req.body;
      
      if (!name || !content) {
        return res.status(400).json({
          success: false,
          error: 'Name and content are required',
          code: 'MISSING_PARAMETERS'
        });
      }

      const result = await this.robloxTools.createScript(name, content, script_type, project_id);
      res.json(result);
    } catch (error) {
      this.logger.error('Create script error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
        code: 'CREATE_SCRIPT_ERROR'
      });
    }
  }

  async handleListScripts(req, res) {
    try {
      const { project_id = 'default' } = req.query;
      const result = await this.robloxTools.listScripts(project_id);
      res.json(result);
    } catch (error) {
      this.logger.error('List scripts error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
        code: 'LIST_SCRIPTS_ERROR'
      });
    }
  }

  async handleUpdateScript(req, res) {
    try {
      const { name, content, project_id = 'default' } = req.body;
      
      if (!name || !content) {
        return res.status(400).json({
          success: false,
          error: 'Name and content are required',
          code: 'MISSING_PARAMETERS'
        });
      }

      const result = await this.robloxTools.updateScript(name, content, project_id);
      res.json(result);
    } catch (error) {
      this.logger.error('Update script error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
        code: 'UPDATE_SCRIPT_ERROR'
      });
    }
  }

  async handleDeleteScript(req, res) {
    try {
      const { name, project_id = 'default' } = req.body;
      
      if (!name) {
        return res.status(400).json({
          success: false,
          error: 'Name is required',
          code: 'MISSING_PARAMETERS'
        });
      }

      const result = await this.robloxTools.deleteScript(name, project_id);
      res.json(result);
    } catch (error) {
      this.logger.error('Delete script error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
        code: 'DELETE_SCRIPT_ERROR'
      });
    }
  }

  async handleGetProjectStatus(req, res) {
    try {
      const { project_id = 'default' } = req.query;
      const result = await this.robloxTools.getProjectStatus(project_id);
      res.json(result);
    } catch (error) {
      this.logger.error('Get project status error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
        code: 'GET_PROJECT_STATUS_ERROR'
      });
    }
  }

  async handleValidateScript(req, res) {
    try {
      const { content, script_type = 'lua' } = req.body;
      
      if (!content) {
        return res.status(400).json({
          valid: false,
          error: 'Content is required',
          code: 'MISSING_PARAMETERS'
        });
      }

      const result = await this.robloxTools.validateScript(content, script_type);
      res.json(result);
    } catch (error) {
      this.logger.error('Validate script error:', error);
      res.status(500).json({
        valid: false,
        error: error.message,
        code: 'VALIDATE_SCRIPT_ERROR'
      });
    }
  }

  async handleBackupProject(req, res) {
    try {
      const { project_id = 'default' } = req.body;
      const result = await this.robloxTools.backupProject(project_id);
      res.json(result);
    } catch (error) {
      this.logger.error('Backup project error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
        code: 'BACKUP_PROJECT_ERROR'
      });
    }
  }

  async handleRestoreProject(req, res) {
    try {
      const { project_id, backup_path = null } = req.body;
      
      if (!project_id) {
        return res.status(400).json({
          success: false,
          error: 'project_id is required',
          code: 'MISSING_PARAMETERS'
        });
      }

      const result = await this.robloxTools.restoreProject(project_id, backup_path);
      res.json(result);
    } catch (error) {
      this.logger.error('Restore project error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
        code: 'RESTORE_PROJECT_ERROR'
      });
    }
  }

  // MCP Protocol handler
  async handleMCPFunction(req, res) {
    try {
      const { function: funcName, parameters = {} } = req.body;
      
      const functionMap = {
        'create_script': 'createScript',
        'list_scripts': 'listScripts', 
        'update_script': 'updateScript',
        'delete_script': 'deleteScript',
        'get_project_status': 'getProjectStatus',
        'validate_script': 'validateScript',
        'backup_project': 'backupProject',
        'restore_project': 'restoreProject'
      };

      const method = functionMap[funcName];
      if (!method) {
        return res.status(400).json({
          success: false,
          error: `Unknown function: ${funcName}`,
          code: 'UNKNOWN_FUNCTION'
        });
      }

      // Map parameters based on function
      let args = [];
      switch (funcName) {
        case 'create_script':
          args = [parameters.name, parameters.content, parameters.script_type, parameters.project_id];
          break;
        case 'update_script':
          args = [parameters.name, parameters.content, parameters.project_id];
          break;
        case 'delete_script':
          args = [parameters.name, parameters.project_id];
          break;
        case 'get_project_status':
          args = [parameters.project_id];
          break;
        case 'validate_script':
          args = [parameters.content, parameters.script_type];
          break;
        case 'backup_project':
          args = [parameters.project_id];
          break;
        case 'restore_project':
          args = [parameters.project_id, parameters.backup_path];
          break;
        case 'list_scripts':
          args = [parameters.project_id];
          break;
      }

      const result = await this.robloxTools[method](...args);
      res.json(result);
    } catch (error) {
      this.logger.error('MCP function error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
        code: 'MCP_FUNCTION_ERROR'
      });
    }
  }

  errorHandler(err, req, res, next) {
    this.logger.error('Unhandled error:', err);

    res.status(500).json({
      success: false,
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
      ...(config.isDevelopment && { stack: err.stack })
    });
  }

  async start() {
    try {
      // Initialize database
      await this.db.initialize();
      await this.robloxTools.initialize();

      const server = this.app.listen(config.port, () => {
        console.log('🚀 Roblox MCP Node.js Server Started');
        console.log('=================================');
        config.printSummary();
        console.log('=================================');
        console.log('🛠️  Available Endpoints:');
        console.log('   POST /api/create_script');
        console.log('   GET  /api/list_scripts');
        console.log('   PUT  /api/update_script');
        console.log('   DELETE /api/delete_script');
        console.log('   GET  /api/get_project_status');
        console.log('   POST /api/validate_script');
        console.log('   POST /api/backup_project');
        console.log('   POST /api/restore_project');
        console.log('   POST /mcp/function');
        console.log('   GET  /health');
        console.log('=================================');
        console.log('🎯 Ready for MCP connections!');
        
        if (config.railwayStaticUrl) {
          console.log(`🌐 Public URL: ${config.railwayStaticUrl}`);
        }
      });

      // Graceful shutdown
      process.on('SIGTERM', () => {
        this.logger.info('SIGTERM received, shutting down gracefully');
        server.close(() => {
          this.logger.info('Process terminated');
          process.exit(0);
        });
      });

    } catch (error) {
      this.logger.error('Failed to start server:', error);
      process.exit(1);
    }
  }
}

// CLI initialization for database
if (require.main === module && process.argv.includes('--init')) {
  const db = new DatabaseService();
  db.initialize().then(() => {
    console.log('✅ Database initialized successfully');
    process.exit(0);
  }).catch(err => {
    console.error('❌ Database initialization failed:', err);
    process.exit(1);
  });
}

// Start server when run directly
if (require.main === module) {
  const server = new MCPServer();
  server.start();
}

module.exports = MCPServer;