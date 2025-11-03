const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs-extra');
const winston = require('winston');

class DatabaseService {
  constructor(dbPath = './data/roblox_mcp.db') {
    this.dbPath = dbPath;
    this.ensureDataDirectory();
    this.initDatabase();
    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'logs/db.log' })
      ]
    });
  }

  ensureDataDirectory() {
    const dataDir = path.dirname(this.dbPath);
    fs.ensureDirSync(dataDir);
    
    const logsDir = './logs';
    fs.ensureDirSync(logsDir);
  }

  initDatabase() {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          this.logger.error('Error opening database:', err.message);
          reject(err);
        } else {
          this.logger.info(`Connected to SQLite database at ${this.dbPath}`);
          this.createTables().then(resolve).catch(reject);
        }
      });
    });
  }

  async createTables() {
    return new Promise((resolve, reject) => {
      const createScriptsTable = `
        CREATE TABLE IF NOT EXISTS scripts (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          content TEXT NOT NULL,
          type TEXT DEFAULT 'lua',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          project_id TEXT,
          metadata TEXT
        )
      `;

      const createProjectsTable = `
        CREATE TABLE IF NOT EXISTS projects (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          backup_count INTEGER DEFAULT 0
        )
      `;

      const createBackupsTable = `
        CREATE TABLE IF NOT EXISTS backups (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          project_id TEXT NOT NULL,
          backup_path TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          size_bytes INTEGER,
          metadata TEXT
        )
      `;

      // Execute table creation
      this.db.serialize(() => {
        this.db.run(createScriptsTable);
        this.db.run(createProjectsTable);
        this.db.run(createBackupsTable);
        
        this.db.run('CREATE INDEX IF NOT EXISTS idx_scripts_project ON scripts(project_id)');
        this.db.run('CREATE INDEX IF NOT EXISTS idx_scripts_name ON scripts(name)');
        this.db.run('CREATE INDEX IF NOT EXISTS idx_backups_project ON backups(project_id)');
      });

      this.logger.info('Database tables initialized successfully');
      resolve();
    });
  }

  executeQuery(query, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(query, params, (err, rows) => {
        if (err) {
          this.logger.error('Database query error:', err.message);
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  runQuery(query, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(query, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ lastID: this.lastID, changes: this.changes });
        }
      });
    });
  }

  // Initialize database for CLI usage
  async initialize() {
    await this.initDatabase();
    this.logger.info('Database initialization complete');
    return true;
  }
}

module.exports = DatabaseService;