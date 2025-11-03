# 🚂 Railway Deployment Guide - Roblox MCP Node.js Server

Comprehensive step-by-step guide untuk deploy Roblox MCP Node.js Server ke Railway dengan optimisasi production.

## 📋 Prerequisites

### Required Accounts & Tools
- ✅ **GitHub Account** - Untuk repository hosting
- ✅ **Railway Account** - https://railway.app (free tier available)
- ✅ **Node.js 18+** - Untuk development dan testing
- ✅ **Git** - Untuk version control

### Pre-Deployment Checklist
- ✅ Code sudah di-push ke GitHub repository
- ✅ Environment variables sudah preparadas
- ✅ HMAC secret sudah di-generate dengan secure value
- ✅ Database migration plan sudah ready
- ✅ Health check endpoint sudah di-test locally

## 🚀 Step-by-Step Deployment

### Phase 1: Repository Preparation

#### 1.1 Prepare GitHub Repository
```bash
# Initialize repository (jika belum)
cd roblox-mcp-nodejs
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: Roblox MCP Node.js Server - Production Ready"

# Set main branch
git branch -M main

# Add remote origin (replace dengan your actual repo URL)
git remote add origin https://github.com/yourusername/roblox-mcp-nodejs.git

# Push to GitHub
git push -u origin main
```

#### 1.2 Verify Repository Structure
Pastikan repository contains:
```
roblox-mcp-nodejs/
├── package.json              ✅ Required
├── src/
│   └── server.js            ✅ Required
├── .env.example             ✅ Recommended
├── README.md                ✅ Required
├── docker/                  ✅ Optional
├── examples/                ✅ Recommended
└── .gitignore              ✅ Required
```

### Phase 2: Railway Project Setup

#### 2.1 Create Railway Project
1. **Login** ke Railway dashboard: https://railway.app
2. **Click "New Project"**
3. **Select "Deploy from GitHub repo"**
4. **Choose** `roblox-mcp-nodejs` repository
5. **Click "Deploy Now"**

#### 2.2 Wait for Initial Deployment
- Railway akan auto-detect Node.js project
- Build process akan dimulai otomatis
- Typical build time: 2-4 menit
- Monitor progress di Railway dashboard

### Phase 3: Environment Configuration

#### 3.1 Set Critical Environment Variables
Di Railway dashboard, pergi ke **Variables** tab dan add:

**🔐 SECURITY (CRITICAL)**
```bash
ROBLOX_MCP_HMAC_SECRET=your_very_secure_secret_32_chars_minimum_1234567890
```

**⚙️ SERVER CONFIGURATION**
```bash
NODE_ENV=production
PORT=3000
```

**💾 DATABASE**
```bash
DB_PATH=./data/roblox_mcp.db
```

**📊 LOGGING**
```bash
LOG_LEVEL=info
ROBLOX_MCP_VERBOSE=false
```

**🛡️ SECURITY FEATURES**
```bash
ENABLE_RATE_LIMITING=true
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
ENABLE_SECURITY_HEADERS=true
CORS_ORIGIN=*
```

#### 3.2 Generate Secure HMAC Secret
**Command line:**
```bash
# Generate secure secret
openssl rand -base64 32
# atau
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**Expected Output:**
```
8Xg7mR2kP9vN5sB3wL1cQ6dE4tY8uI0oA3fG7hJ2kM5nP8qR9sT1uV3wX5yZ7b
```

#### 3.3 Railway-Specific Variables
```bash
# Railway akan auto-set these, tapi kita bisa override jika perlu
RAILWAY_PUBLIC_DOMAIN=your-app.railway.app
RAILWAY_BUILD_COMMAND=npm ci --only=production
RAILWAY_START_COMMAND=npm start
```

### Phase 4: Build Configuration

#### 4.1 Verify Build Settings
Di Railway **Settings** > **Build**, verify:

```bash
Build Command: npm ci --only=production
Root Directory: (kosong - use repository root)
```

#### 4.2 Configure Build Output
Di Railway **Settings** > **Deploy**, verify:

```bash
Root Directory: (kosong - use repository root)
```

### Phase 5: Database Setup

#### 5.1 Create Data Directory
Railway environment variable:
```bash
DATA_DIR=/tmp/data
```

#### 5.2 Initialize Database
Via Railway shell atau code, database akan auto-initialized pada first run.

### Phase 6: SSL Certificate (Auto)

Railway automatically provides:
- ✅ **Free SSL Certificate** (Let's Encrypt)
- ✅ **Automatic HTTPS Redirect**
- ✅ **Custom Domain Support** (if configured)

### Phase 7: Deployment Testing

#### 7.1 Health Check Test
```bash
# Replace dengan actual Railway URL
curl https://your-app.railway.app/health

# Expected response:
{
  "status": "healthy",
  "timestamp": "2025-11-03T10:08:05.000Z",
  "uptime": 1234,
  "memory": { ... },
  "version": "1.0.0"
}
```

#### 7.2 API Functionality Test
```bash
# Test create script
curl -X POST https://your-app.railway.app/api/create_script \
  -H "Content-Type: application/json" \
  -H "X-Signature: your_signature" \
  -H "X-Timestamp: $(date +%s000)" \
  -d '{
    "name": "test_script",
    "content": "local Players = game:GetService(\"Players\")",
    "script_type": "lua",
    "project_id": "railway_test"
  }'
```

#### 7.3 Client Library Test
```bash
# Update client with Railway URL
export ROBLOX_MCP_URL=https://your-app.railway.app
export ROBLOX_MCP_HMAC_SECRET=your_very_secure_secret_32_chars_minimum_1234567890

node examples/basic-usage.js
```

### Phase 8: Production Optimization

#### 8.1 Performance Configuration
Environment variables untuk production:
```bash
# Memory optimization
NODE_OPTIONS=--max-old-space-size=512

# Connection handling
UV_THREADPOOL_SIZE=4

# Database optimization
SQLITE_CACHE_SIZE=10000
SQLITE_JOURNAL_MODE=WAL
```

#### 8.2 Monitoring Setup
```bash
# Enable detailed logging untuk monitoring
LOG_LEVEL=info
ROBLOX_MCP_VERBOSE=false

# Health monitoring interval
HEALTH_CHECK_INTERVAL=30
```

#### 8.3 Backup Strategy
```bash
# Auto-backup enabled
ENABLE_AUTO_BACKUP=true
BACKUP_INTERVAL_HOURS=24
BACKUP_RETENTION_DAYS=30
```

## 🔧 Advanced Railway Configuration

### Custom Build Commands
Railway supports advanced build configuration via `railway.json`:

```json
{
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm ci --only=production && npm run build",
    "watchPatterns": ["src/**", "*.js"]
  },
  "deploy": {
    "startCommand": "npm start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10,
    "sleepApplication": false
  }
}
```

### Resource Limits
Configure resource allocation di Railway dashboard:

```yaml
Memory: 512 MB (recommended minimum)
CPU: 0.5 vCPU (adequate untuk MCP server)
Storage: 1 GB (untuk database dan logs)
```

### Environment-Specific Deployments
Setup multiple environments:

**Production:**
```bash
NODE_ENV=production
LOG_LEVEL=info
ROBLOX_MCP_VERBOSE=false
ENABLE_RATE_LIMITING=true
```

**Staging:**
```bash
NODE_ENV=staging
LOG_LEVEL=debug
ROBLOX_MCP_VERBOSE=true
ENABLE_RATE_LIMITING=false
```

## 🚨 Troubleshooting Guide

### Common Railway Issues

#### Issue 1: Build Failed
```bash
Error: npm ERR! peer dep missing
```
**Solution:**
```bash
# Update package.json dependencies
npm audit fix
# Re-commit dan push
git add package*.json
git commit -m "Fix dependencies"
git push
```

#### Issue 2: Port Binding Error
```bash
Error: listen EADDRINUSE :::3000
```
**Solution:**
```bash
# Update server.js untuk Railway port
const PORT = process.env.PORT || 3000;
# Railway provides PORT env variable automatically
```

#### Issue 3: Database Connection
```bash
Error: SQLITE_CANTOPEN: unable to open database file
```
**Solution:**
```bash
# Use absolute path untuk Railway
export DB_PATH=/tmp/data/roblox_mcp.db
# Create directory dalam server startup
```

#### Issue 4: HMAC Authentication Failed
```bash
Error: Invalid signature
```
**Solution:**
```bash
# Ensure timestamp format (milliseconds)
const timestamp = Date.now().toString();
# Not: Math.floor(Date.now() / 1000)
```

### Railway-Specific Commands

#### Access Railway Shell
```bash
# Via Railway dashboard > your service > Shell
# Or via CLI:
railway shell
```

#### View Real-time Logs
```bash
# Via Railway dashboard
# Or via CLI:
railway logs --tail
```

#### Deploy Specific Branch
```bash
# Via Railway dashboard > Deployments > Trigger Deployment
# Or via CLI:
railway deploy --branch feature-branch
```

#### Environment Variables Management
```bash
# Via CLI:
railway variables set ROBLOX_MCP_HMAC_SECRET=your_secret
railway variables list
railway variables remove VARIABLE_NAME
```

### Performance Optimization

#### 1. **Startup Time Optimization**
```javascript
// server.js optimization
const express = require('express');
const path = require('path');

// Lazy load heavy modules
const DatabaseService = require('./database');
const RobloxToolsService = require('./robloxToolsService');

let db, tools;
const initializeServices = async () => {
  if (!db) {
    db = new DatabaseService(config.dbPath);
    await db.initialize();
    tools = new RobloxToolsService();
    await tools.initialize();
  }
};
```

#### 2. **Memory Optimization**
```javascript
// database.js optimization
const sqlite3 = require('sqlite3').verbose();
class DatabaseService {
  constructor(dbPath) {
    this.dbPath = dbPath;
    this.db = null; // Lazy initialization
    this.initialized = false;
  }
}
```

#### 3. **Connection Pooling**
```javascript
// For production with multiple instances
const PQueue = require('p-queue');
const queue = new PQueue({ concurrency: 5 });
```

## 📊 Monitoring & Maintenance

### Railway Monitoring Features
- ✅ **Built-in Metrics** - CPU, Memory, Network
- ✅ **Log Aggregation** - Centralized logging
- ✅ **Health Checks** - Automatic monitoring
- ✅ **Alerting** - Email/Slack notifications

### Custom Monitoring
```javascript
// Add to server.js
const prometheus = require('prom-client');

// Register metrics
const httpRequestDuration = new prometheus.Histogram({
  name: 'http_request_duration_ms',
  help: 'Duration of HTTP requests in ms',
  labelNames: ['method', 'route', 'status_code']
});

app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    httpRequestDuration
      .labels(req.method, req.route?.path || req.path, res.statusCode)
      .observe(Date.now() - start);
  });
  next();
});

app.get('/metrics', (req, res) => {
  res.set('Content-Type', prometheus.register.contentType);
  res.end(prometheus.register.metrics());
});
```

### Backup Strategy
```bash
# Automated backup script
#!/bin/bash
BACKUP_DATE=$(date +%Y%m%d_%H%M%S)
curl -X POST https://your-app.railway.app/api/backup_project \
  -H "Content-Type: application/json" \
  -H "X-Signature: $SIGNATURE" \
  -d '{"project_id":"production"}' \
  > "backup_${BACKUP_DATE}.json"
```

## 🎯 Deployment Checklist

### Pre-Deployment ✅
- [ ] Code tested locally
- [ ] Environment variables prepared
- [ ] HMAC secret generated
- [ ] Database migration plan ready
- [ ] Health checks configured

### During Deployment ✅
- [ ] Repository connected to Railway
- [ ] Build successful (no errors)
- [ ] Environment variables set
- [ ] Server starts without errors
- [ ] Health endpoint responds

### Post-Deployment ✅
- [ ] Health check passes
- [ ] All API endpoints functional
- [ ] Client library works
- [ ] Logging configured
- [ ] Monitoring active
- [ ] Backups automated

### Production Ready ✅
- [ ] Rate limiting enabled
- [ ] Security headers configured
- [ ] CORS properly set
- [ ] Error handling complete
- [ ] Performance optimized
- [ ] Documentation updated

## 🚀 Success!

Setelah menyelesaikan semua steps di atas, Anda akan memiliki:

✅ **Production-ready Roblox MCP Server** di Railway  
✅ **Secure API dengan HMAC authentication**  
✅ **Automated deployments** dari GitHub  
✅ **Built-in monitoring dan logging**  
✅ **SSL/HTTPS support** otomatis  
✅ **Scalable architecture** untuk growth  

**Next Steps:**
1. Setup custom domain (optional)
2. Configure monitoring alerts
3. Setup automated backups
4. Create documentation untuk team
5. Setup CI/CD pipeline

---

**🎉 Congratulations! Roblox MCP Node.js Server berhasil di-deploy ke Railway!**

*For support dan questions, check Railway documentation atau create issue di repository.*