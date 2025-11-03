const crypto = require('crypto');
const winston = require('winston');

class Config {
  constructor() {
    this.port = process.env.PORT || 3000;
    this.nodeEnv = process.env.NODE_ENV || 'development';
    this.dbPath = process.env.DB_PATH || './data/roblox_mcp.db';
    this.hmacSecret = process.env.ROBLOX_MCP_HMAC_SECRET || 'default_secret_123';
    this.verbose = (process.env.ROBLOX_MCP_VERBOSE || 'false').toLowerCase() === 'true';
    this.corsOrigin = process.env.CORS_ORIGIN || '*';
    this.logLevel = process.env.LOG_LEVEL || 'info';
    this.logFile = process.env.LOG_FILE || './logs/app.log';
    
    // Rate limiting
    this.rateLimitWindowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000;
    this.rateLimitMaxRequests = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100;
    
    // Security
    this.enableRateLimiting = (process.env.ENABLE_RATE_LIMITING || 'true').toLowerCase() === 'true';
    this.enableSecurityHeaders = (process.env.ENABLE_SECURITY_HEADERS || 'true').toLowerCase() === 'true';
    
    // Railway
    this.railwayStaticUrl = process.env.RAILWAY_STATIC_URL;
    
    // Database optimization for Railway
    this.dbConnectionTimeout = parseInt(process.env.DB_CONNECTION_TIMEOUT) || 10000; // 10 seconds
    this.dbQueryTimeout = parseInt(process.env.DB_QUERY_TIMEOUT) || 30000; // 30 seconds
    this.enableDbPool = (process.env.ENABLE_DB_POOL || 'true').toLowerCase() === 'true';
    
    // Server timeout optimization
    this.requestTimeout = parseInt(process.env.REQUEST_TIMEOUT) || 35000;
    this.keepAliveTimeout = parseInt(process.env.KEEP_ALIVE_TIMEOUT) || 70000;
    
    // Railway storage configuration
    this.persistentDataPath = process.env.DATA_PATH || './data';
    this.dbPath = process.env.DB_PATH || `${this.persistentDataPath}/roblox_mcp.db`;
    
    this.validateConfig();
  }

  validateConfig() {
    if (this.hmacSecret.length < 16) {
      throw new Error('HMAC secret must be at least 16 characters long');
    }

    if (!['development', 'production', 'test'].includes(this.nodeEnv)) {
      throw new Error('NODE_ENV must be one of: development, production, test');
    }

    if (this.port < 1024 || this.port > 65535) {
      throw new Error('PORT must be between 1024 and 65535');
    }
  }

  generateHmac(data) {
    return crypto
      .createHmac('sha256', this.hmacSecret)
      .update(data, 'utf8')
      .digest('hex');
  }

  validateHmac(data, signature) {
    const expected = this.generateHmac(data);
    return crypto.timingSafeEqual(
      Buffer.from(expected, 'hex'),
      Buffer.from(signature, 'hex')
    );
  }

  get isDevelopment() {
    return this.nodeEnv === 'development';
  }

  get isProduction() {
    return this.nodeEnv === 'production';
  }

  get isTest() {
    return this.nodeEnv === 'test';
  }

  // Initialize logger
  initializeLogger() {
    const transports = [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple()
        )
      })
    ];

    if (this.logFile) {
      transports.push(
        new winston.transports.File({
          filename: this.logFile,
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json()
          )
        })
      );
    }

    return winston.createLogger({
      level: this.logLevel,
      transports
    });
  }

  printSummary() {
    console.log('🔧 Configuration Summary:');
    console.log(`📊 Environment: ${this.nodeEnv}`);
    console.log(`🔌 Port: ${this.port}`);
    console.log(`💾 Database: ${this.dbPath}`);
    console.log(`🔐 HMAC Secret: ${this.isDevelopment ? this.hmacSecret : '*'.repeat(this.hmacSecret.length)}`);
    console.log(`📝 Verbose: ${this.verbose}`);
    console.log(`📈 Rate Limiting: ${this.enableRateLimiting ? 'Enabled' : 'Disabled'}`);
    console.log(`🛡️  Security Headers: ${this.enableSecurityHeaders ? 'Enabled' : 'Disabled'}`);
    console.log(`⚡ DB Timeout: ${this.dbQueryTimeout}ms`);
    console.log(`🔄 Connection Pool: ${this.enableDbPool ? 'Enabled' : 'Disabled'}`);
    console.log(`🌐 Railway Static URL: ${this.railwayStaticUrl || 'Not set'}`);
  }
}

module.exports = new Config();