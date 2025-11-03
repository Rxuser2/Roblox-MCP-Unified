# 🚀 Roblox MCP Node.js Server

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.x-lightgrey.svg)](https://expressjs.com/)
[![SQLite](https://img.shields.io/badge/SQLite-3-blue.svg)](https://sqlite.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**Comprehensive MCP Server untuk Roblox Development** - Solusi Node.js yang stabil dan siap produksi untuk semua kebutuhan Roblox development workflow.

## ✨ Key Features

### 🛠️ **Complete Roblox Tool Suite (8 Tools)**
- ✅ `create_script` - Create new Lua/Luau scripts
- ✅ `list_scripts` - List all scripts in project  
- ✅ `update_script` - Update existing scripts
- ✅ `delete_script` - Delete scripts
- ✅ `get_project_status` - Get project statistics
- ✅ `validate_script` - Validate script syntax dan security
- ✅ `backup_project` - Create project backups
- ✅ `restore_project` - Restore from backups

### 🚀 **Production Ready**
- 📦 **Built-in Client Library** - Include client functionality dalam server package
- 🔐 **HMAC Authentication** - Secure API communication
- 🗄️ **SQLite Database** - Persistent script storage
- 🐳 **Docker Deployment** - Ready untuk containerization
- 🚂 **Railway Deployment** - Cloud deployment ready
- 📊 **Comprehensive Logging** - Full operation tracking
- ⚡ **High Performance** - Node.js + Express optimized

### 🛡️ **Security & Reliability**
- 🔒 **Rate Limiting** - Prevent abuse
- 🛡️ **Security Headers** - Helmet.js protection
- ✅ **Input Validation** - Joi schema validation
- 🔐 **HMAC Signing** - Request authenticity verification
- 🚨 **Error Handling** - Graceful failure recovery

### 🎮 **Web Dashboard Interface**
- 🌐 **Modern Web Interface** - Beautiful dashboard untuk manajemen semua tools
- 📱 **Fully Responsive** - Perfect di desktop, tablet, dan mobile
- 🎨 **Professional Design** - Dark/Light theme dengan smooth animations
- ⚡ **Real-time Updates** - Live data dan auto-refresh capabilities
- 📊 **Analytics Dashboard** - Charts dan insights untuk project monitoring
- 🔍 **Advanced Search** - Filter dan search scripts dengan mudah
- 💾 **One-click Backup** - Manajemen backup dan restore yang mudah
- 🔐 **Secure Settings** - Konfigurasi HMAC secret dengan interface yang user-friendly

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- npm atau yarn package manager

### Installation
```bash
# Clone atau extract server files
cd roblox-mcp-nodejs

# Install dependencies
npm install

# Initialize database
npm run db:init

# Start server (development)
npm run dev

# Start server (production)
npm start
```

### Basic Usage

#### 🌐 **Web Interface (Recommended)**
```bash
# Start the server
npm start

# Buka browser dan navigasi ke:
http://localhost:3000

# Configure HMAC secret di Settings
# Enjoy the beautiful dashboard!
```

#### 📡 **API Testing**
```bash
# Test dengan basic usage
node examples/basic-usage.js

# Test dengan advanced usage
node examples/advanced-usage.js

# Test dengan production usage
node examples/production-usage.js
```

### 🎮 **Web Dashboard Features**

**Dashboard Sections:**
- 📊 **Overview** - Project statistics dan quick actions
- 📝 **Script Manager** - Create, edit, delete scripts dengan interface yang modern
- 💾 **Backup & Restore** - One-click backup management
- 📈 **Analytics** - Visual charts dan insights

**Key Benefits:**
- ✅ No command-line experience required
- ✅ Real-time script preview dengan syntax highlighting  
- ✅ Advanced search dan filtering
- ✅ Mobile-friendly responsive design
- ✅ Secure authentication configuration
- ✅ Beautiful animations dan micro-interactions

> 📖 **Detailed Guide**: Lihat [Web Interface Guide](docs/WEB-INTERFACE-GUIDE.md) untuk dokumentasi lengkap

## 🛠️ Available Tools

### 1. `create_script` 
Create new Roblox scripts dengan validation

**Parameters:**
- `name` (str): Script name (unique identifier)
- `content` (str): Script content (Lua/Luau code)  
- `script_type` (str, optional): 'lua' or 'luau' (default: 'lua')
- `project_id` (str, optional): Project identifier (default: 'default')

**Example:**
```bash
curl -X POST http://localhost:3000/api/create_script \
  -H "Content-Type: application/json" \
  -H "X-Signature: your_signature" \
  -d '{
    "name": "PlayerController",
    "content": "local Players = game:GetService(\"Players\")",
    "script_type": "lua",
    "project_id": "game_project_001"
  }'
```

### 2. `list_scripts`
List all scripts dalam project dengan metadata

**Example:**
```bash
curl -X GET "http://localhost:3000/api/list_scripts?project_id=default" \
  -H "X-Signature: your_signature"
```

### 3. `update_script`
Update existing script content

### 4. `delete_script` 
Delete script from database

### 5. `get_project_status`
Get comprehensive project statistics dan health

### 6. `validate_script`
Validate script content untuk syntax, security, dan best practices

### 7. `backup_project`
Create complete project backup dengan metadata

### 8. `restore_project`
Restore project dari backup file

## 🚂 Railway Deployment

### Prerequisites
1. GitHub repository dengan kode ini
2. Railway account di https://railway.app

### Step-by-Step Deployment

#### 1. **Setup GitHub Repository**
```bash
# Initialize git (jika belum)
git init
git add .
git commit -m "Initial commit: Roblox MCP Node.js Server"
git branch -M main
git remote add origin https://github.com/yourusername/roblox-mcp-nodejs.git
git push -u origin main
```

#### 2. **Deploy ke Railway**
1. **Login** ke Railway (https://railway.app)
2. **Click "New Project"**
3. **Select "Deploy from GitHub repo"**
4. **Choose** repository `roblox-mcp-nodejs`
5. **Click "Deploy Now"**

#### 3. **Configure Environment Variables**

Di Railway dashboard, pergi ke **Variables** tab dan add:

```bash
# Required Configuration
NODE_ENV=production
PORT=3000

# Database Configuration
DB_PATH=./data/roblox_mcp.db

# HMAC Security (CRITICAL - generate secure secret!)
ROBLOX_MCP_HMAC_SECRET=your_very_secure_hmac_secret_32_chars_minimum

# Logging
LOG_LEVEL=info
ROBLOX_MCP_VERBOSE=false

# Rate Limiting
ENABLE_RATE_LIMITING=true
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Security
ENABLE_SECURITY_HEADERS=true
CORS_ORIGIN=*
```

#### 4. **Custom Build Command (Optional)**
Di Railway, pergi ke **Settings** > **Build** dan set:

```bash
Build Command: npm ci --only=production
```

#### 5. **Deploy**
1. **Click "Deploy"** di Railway
2. **Wait** untuk deployment selesai (~2-3 menit)
3. **Copy Public URL** dari Railway dashboard
4. **Test** dengan: `curl http://your-app.railway.app/health`

### Railway Configuration File (railway.json)
```json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

## 🐳 Docker Deployment

### Local Docker Run
```bash
# Build image
docker build -f docker/Dockerfile -t roblox-mcp-server .

# Run container
docker run -p 3000:3000 \
  -e ROBLOX_MCP_HMAC_SECRET=your_hmac_secret \
  -v roblox_data:/app/data \
  roblox-mcp-server
```

### Docker Compose (Recommended)
```bash
# Start services
docker-compose -f docker/docker-compose.yml up -d

# View logs
docker-compose -f docker/docker-compose.yml logs -f

# Stop services
docker-compose -f docker/docker-compose.yml down
```

## ⚙️ Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | No | `development` | Environment mode |
| `PORT` | No | `3000` | Server port |
| `DB_PATH` | No | `./data/roblox_mcp.db` | Database file path |
| `ROBLOX_MCP_HMAC_SECRET` | Yes | - | HMAC secret for authentication |
| `ROBLOX_MCP_VERBOSE` | No | `false` | Enable verbose logging |
| `ENABLE_RATE_LIMITING` | No | `true` | Enable rate limiting |
| `RATE_LIMIT_WINDOW_MS` | No | `900000` | Rate limit window in ms |
| `RATE_LIMIT_MAX_REQUESTS` | No | `100` | Max requests per window |
| `LOG_LEVEL` | No | `info` | Log level |
| `CORS_ORIGIN` | No | `*` | CORS origin |

### Example .env File
```bash
# Production Configuration
NODE_ENV=production
PORT=3000
DB_PATH=./data/roblox_mcp.db
ROBLOX_MCP_HMAC_SECRET=your_very_secure_production_secret_32_chars_minimum
ROBLOX_MCP_VERBOSE=false
ENABLE_RATE_LIMITING=true
LOG_LEVEL=info
CORS_ORIGIN=*

# Development Configuration  
NODE_ENV=development
ROBLOX_MCP_HMAC_SECRET=dev_secret_123
ROBLOX_MCP_VERBOSE=true
LOG_LEVEL=debug
```

## 📚 API Reference

### Authentication

Semua API requests harus include HMAC signature:

```javascript
const crypto = require('crypto');

function generateSignature(data, secret) {
  return crypto
    .createHmac('sha256', secret)
    .update(data, 'utf8')
    .digest('hex');
}

// Headers yang diperlukan:
'X-Signature': generatedSignature
'X-Timestamp': Date.now().toString()
'Content-Type': 'application/json'
```

### Response Format

**Success Response:**
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { ... },
  "timestamp": "2025-11-03T10:08:05.000Z"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Error description",
  "code": "ERROR_CODE"
}
```

### Health Check
```bash
GET /health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2025-11-03T10:08:05.000Z",
  "uptime": 1234,
  "memory": { ... },
  "version": "1.0.0"
}
```

## 🧪 Testing

### Unit Tests
```bash
# Test all functionality
npm test

# Test specific functionality
node examples/basic-usage.js
node examples/advanced-usage.js
node examples/production-usage.js
```

### API Testing
```bash
# Health check
curl http://localhost:3000/health

# Create script
curl -X POST http://localhost:3000/api/create_script \
  -H "Content-Type: application/json" \
  -H "X-Signature: your_signature" \
  -d '{"name":"test","content":"print(\"Hello\")"}'

# List scripts
curl -X GET "http://localhost:3000/api/list_scripts" \
  -H "X-Signature: your_signature"
```

## 🔧 Troubleshooting

### Common Issues

#### 1. **Database Connection Error**
```
Error: SQLITE_CANTOPEN: unable to open database file
```
**Solution:**
```bash
# Check database directory permissions
ls -la data/
# Fix permissions
chmod 755 data/
# Or specify full path
export DB_PATH=/full/path/to/roblox_mcp.db
```

#### 2. **HMAC Authentication Failed**
```
Error: Invalid signature
```
**Solution:**
```bash
# Verify HMAC secret matches between client and server
echo "Client Secret: $ROBLOX_MCP_HMAC_SECRET"
echo "Server Secret: $(grep ROBLOX_MCP_HMAC_SECRET .env)"

# Ensure timestamp is recent (< 5 minutes)
const timestamp = Date.now(); // Should be current time
```

#### 3. **Port Already in Use**
```
Error: listen EADDRINUSE :::3000
```
**Solution:**
```bash
# Kill process using port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
export PORT=3001
```

#### 4. **Permission Denied (Docker)**
```
Error: EACCES: permission denied
```
**Solution:**
```bash
# Fix file permissions in container
docker exec -u root roblox-mcp-server chown -R roblox:nodejs /app
# Or mount with correct permissions
docker run -v $(pwd)/data:/app/data roblox-mcp-server
```

### Debug Mode
```bash
# Enable debug logging
export LOG_LEVEL=debug
export ROBLOX_MCP_VERBOSE=true
npm start
```

### Health Monitoring
```bash
# Monitor server health
watch -n 5 'curl -s http://localhost:3000/health | jq .'

# Monitor logs
tail -f logs/app.log
```

## 🏗️ Architecture

```
roblox-mcp-nodejs/
├── src/                       # Backend server
│   ├── server.js              # Main Express server
│   ├── database.js            # SQLite database service
│   ├── config.js              # Configuration management
│   ├── robloxToolsService.js  # Roblox tools implementation
│   └── client.js              # Built-in client library
├── public/                    # Web Interface (NEW!)
│   ├── index.html             # Main dashboard application
│   ├── css/                   # Modern UI styles
│   │   ├── style.css          # Core styling
│   │   ├── components.css     # Component styles
│   │   └── animations.css     # Smooth animations
│   ├── js/                    # Frontend JavaScript
│   │   ├── config.js          # App configuration
│   │   ├── api.js             # API communication
│   │   ├── ui.js              # UI management
│   │   ├── charts.js          # Analytics charts
│   │   └── main.js            # Main application
│   └── assets/                # Static resources
├── examples/                  # API usage examples
│   ├── basic-usage.js         # Basic functionality tests
│   ├── advanced-usage.js      # Advanced usage patterns
│   └── production-usage.js    # Production deployment tests
├── docs/                      # Documentation
│   ├── WEB-INTERFACE-GUIDE.md # Web interface documentation
│   └── RAILWAY-DEPLOYMENT.md  # Deployment guides
├── docker/                    # Docker configuration
│   ├── Dockerfile             # Container definition
│   ├── docker-compose.yml     # Multi-service setup
│   └── nginx/                 # Reverse proxy config
├── data/                      # Database files
├── logs/                      # Application logs
├── backups/                   # Project backups
├── package.json               # Dependencies
└── README.md                  # This file
```

## 🔄 Migration from Python Version

Untuk user yang migrasi dari Python version:

### API Compatibility
API endpoints tetap sama, hanya base URL berubah:
```bash
# Python version
POST /tools/create_script

# Node.js version  
POST /api/create_script
```

### Client Update
```javascript
// Python MCP client
from roblox_mcp import create_script

// Node.js MCP client
const RobloxMCPClient = require('roblox-mcp-nodejs/src/client');
const client = new RobloxMCPClient(baseUrl, hmacSecret);
await client.createScript(name, content, scriptType, projectId);
```

### Database Migration
Database structure tetap sama, tidak perlu migration.

## 🤝 Contributing

1. **Fork** repository
2. **Create** feature branch (`git checkout -b feature/AmazingFeature`)
3. **Commit** changes (`git commit -m 'Add some AmazingFeature'`)
4. **Push** to branch (`git push origin feature/AmazingFeature`)
5. **Open** Pull Request

## 📝 License

Distributed under the MIT License. See `LICENSE` for more information.

## 🆘 Support

- 📖 **Documentation**: Check this README
- 🧪 **Testing**: Run test suite sebelum deployment
- 🚀 **Deployment**: Follow Railway deployment guide
- 🐛 **Issues**: Report bugs dengan detailed reproduction steps

## 🏆 Acknowledgments

- **Express.js** - For the excellent web framework
- **Node.js** - For the powerful runtime environment
- **SQLite** - For reliable embedded database
- **Roblox Development Community** - For API insights and best practices
- **MiniMax Agent** - For comprehensive development and testing

---

**Ready untuk production deployment!** 🚀

*Built dengan ❤️ untuk Roblox developers*

### Quick Links:
- [🎮 Web Interface Guide](docs/WEB-INTERFACE-GUIDE.md) - Beautiful dashboard documentation
- [🚀 Railway Deployment Guide](#-railway-deployment)
- [🐳 Docker Setup](#-docker-deployment)
- [📚 API Documentation](#-api-reference)
- [🧪 Testing Guide](#-testing)