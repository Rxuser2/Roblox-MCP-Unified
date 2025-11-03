const DatabaseService = require('./database');
const config = require('./config');
const winston = require('winston');

class RobloxToolsService {
  constructor() {
    this.db = new DatabaseService(config.dbPath);
    this.logger = config.initializeLogger();
  }

  async initialize() {
    await this.db.initialize();
    this.logger.info('Roblox Tools Service initialized');
  }

  // Tool 1: Create Script
  async createScript(name, content, scriptType = 'lua', projectId = 'default') {
    try {
      // Check if script name already exists
      const existing = await this.db.executeQuery(
        "SELECT id FROM scripts WHERE name = ? AND project_id = ?",
        [name, projectId]
      );

      if (existing && existing.length > 0) {
        return {
          success: false,
          error: `Script with name '${name}' already exists in project '${projectId}'`,
          script_id: null
        };
      }

      // Insert new script
      const metadata = JSON.stringify({ created_by: "mcp_server" });
      const result = await this.db.runQuery(
        "INSERT INTO scripts (name, content, type, project_id, metadata) VALUES (?, ?, ?, ?, ?)",
        [name, content, scriptType, projectId, metadata]
      );

      // Ensure project exists
      await this.db.runQuery(
        "INSERT OR IGNORE INTO projects (id, name, description) VALUES (?, ?, ?)",
        [projectId, `Project ${projectId}`, `Auto-created project ${projectId}`]
      );

      const response = {
        success: true,
        message: `Script '${name}' created successfully`,
        script_id: result.lastID,
        name: name,
        type: scriptType,
        project_id: projectId,
        created_at: new Date().toISOString()
      };

      if (config.verbose) {
        this.logger.info(`Script created: ${name} (ID: ${result.lastID})`);
      }

      return response;

    } catch (error) {
      this.logger.error(`Error creating script ${name}:`, error);
      return {
        success: false,
        error: `Failed to create script: ${error.message}`,
        script_id: null
      };
    }
  }

  // Tool 2: List Scripts
  async listScripts(projectId = 'default') {
    try {
      const scripts = await this.db.executeQuery(
        "SELECT id, name, type, created_at, updated_at FROM scripts WHERE project_id = ? ORDER BY updated_at DESC",
        [projectId]
      );

      const response = {
        success: true,
        project_id: projectId,
        scripts: scripts,
        count: scripts.length,
        listed_at: new Date().toISOString()
      };

      if (config.verbose) {
        this.logger.info(`Listed ${scripts.length} scripts in project ${projectId}`);
      }

      return response;

    } catch (error) {
      this.logger.error(`Error listing scripts:`, error);
      return {
        success: false,
        error: `Failed to list scripts: ${error.message}`,
        scripts: [],
        count: 0
      };
    }
  }

  // Tool 3: Update Script
  async updateScript(name, content, projectId = 'default') {
    try {
      // Check if script exists
      const existing = await this.db.executeQuery(
        "SELECT id, name FROM scripts WHERE name = ? AND project_id = ?",
        [name, projectId]
      );

      if (!existing || existing.length === 0) {
        return {
          success: false,
          error: `Script '${name}' not found in project '${projectId}'`,
          script_id: null
        };
      }

      // Update script
      await this.db.runQuery(
        "UPDATE scripts SET content = ?, updated_at = ? WHERE name = ? AND project_id = ?",
        [content, new Date().toISOString(), name, projectId]
      );

      const response = {
        success: true,
        message: `Script '${name}' updated successfully`,
        script_id: existing[0].id,
        name: name,
        project_id: projectId,
        updated_at: new Date().toISOString()
      };

      if (config.verbose) {
        this.logger.info(`Script updated: ${name}`);
      }

      return response;

    } catch (error) {
      this.logger.error(`Error updating script ${name}:`, error);
      return {
        success: false,
        error: `Failed to update script: ${error.message}`,
        script_id: null
      };
    }
  }

  // Tool 4: Delete Script
  async deleteScript(name, projectId = 'default') {
    try {
      // Check if script exists
      const existing = await this.db.executeQuery(
        "SELECT id, name FROM scripts WHERE name = ? AND project_id = ?",
        [name, projectId]
      );

      if (!existing || existing.length === 0) {
        return {
          success: false,
          error: `Script '${name}' not found in project '${projectId}'`,
          script_id: null
        };
      }

      // Delete script
      await this.db.runQuery(
        "DELETE FROM scripts WHERE name = ? AND project_id = ?",
        [name, projectId]
      );

      const response = {
        success: true,
        message: `Script '${name}' deleted successfully`,
        script_id: existing[0].id,
        name: name,
        project_id: projectId,
        deleted_at: new Date().toISOString()
      };

      if (config.verbose) {
        this.logger.info(`Script deleted: ${name}`);
      }

      return response;

    } catch (error) {
      this.logger.error(`Error deleting script ${name}:`, error);
      return {
        success: false,
        error: `Failed to delete script: ${error.message}`,
        script_id: null
      };
    }
  }

  // Tool 5: Get Project Status
  async getProjectStatus(projectId = 'default') {
    try {
      // Get project info
      let project = await this.db.executeQuery(
        "SELECT * FROM projects WHERE id = ?",
        [projectId]
      );

      if (!project || project.length === 0) {
        // Create project if it doesn't exist
        await this.db.runQuery(
          "INSERT INTO projects (id, name, description) VALUES (?, ?, ?)",
          [projectId, `Project ${projectId}`, `Auto-created project ${projectId}`]
        );
        project = await this.db.executeQuery(
          "SELECT * FROM projects WHERE id = ?",
          [projectId]
        );
      }

      // Get script count and types
      const stats = await this.db.executeQuery(`
        SELECT 
          COUNT(*) as total_scripts,
          COUNT(CASE WHEN type = 'lua' THEN 1 END) as lua_scripts,
          COUNT(CASE WHEN type = 'luau' THEN 1 END) as luau_scripts,
          MAX(updated_at) as last_updated,
          MIN(created_at) as created_at
        FROM scripts 
        WHERE project_id = ?
      `, [projectId]);

      // Get backup count
      const backupResult = await this.db.executeQuery(
        "SELECT COUNT(*) as count FROM backups WHERE project_id = ?",
        [projectId]
      );
      const backupCount = backupResult[0].count;

      const response = {
        success: true,
        project: {
          id: projectId,
          name: project[0].name,
          description: project[0].description,
          created_at: project[0].created_at,
          updated_at: project[0].updated_at
        },
        statistics: {
          total_scripts: stats[0].total_scripts,
          lua_scripts: stats[0].lua_scripts,
          luau_scripts: stats[0].luau_scripts,
          backup_count: backupCount,
          last_updated: stats[0].last_updated,
          project_created: stats[0].created_at
        },
        status: "active",
        checked_at: new Date().toISOString()
      };

      if (config.verbose) {
        this.logger.info(`Project status retrieved for ${projectId}: ${stats[0].total_scripts} scripts`);
      }

      return response;

    } catch (error) {
      this.logger.error(`Error getting project status:`, error);
      return {
        success: false,
        error: `Failed to get project status: ${error.message}`,
        project: null,
        statistics: {}
      };
    }
  }

  // Tool 6: Validate Script
  async validateScript(content, scriptType = 'lua') {
    try {
      const validationResult = {
        valid: true,
        errors: [],
        warnings: [],
        suggestions: [],
        script_type: scriptType,
        content_length: content.length,
        validated_at: new Date().toISOString()
      };

      // Basic validation checks
      if (!content.trim()) {
        validationResult.valid = false;
        validationResult.errors.push("Script content is empty");
        return validationResult;
      }

      // Lua/Luau specific validations
      if (scriptType.toLowerCase() === 'lua' || scriptType.toLowerCase() === 'luau') {
        // Check for common syntax issues
        if (content.includes('function') && !content.includes('end')) {
          validationResult.warnings.push("Possible missing 'end' keywords for functions");
        }

        // Check for common best practices
        const printCount = (content.match(/print\(/g) || []).length;
        if (printCount > 10) {
          validationResult.warnings.push("Multiple print statements detected - consider using logging");
        }

        // Check for potential issues
        if (content.includes('while true do')) {
          validationResult.warnings.push("Infinite loop detected - ensure proper exit condition");
        }
      }

      // Security checks
      const dangerousPatterns = [
        'loadstring',
        'getrawmetatable',
        'setrawmetatable',
        'debug.sethook'
      ];

      dangerousPatterns.forEach(pattern => {
        if (content.includes(pattern)) {
          validationResult.warnings.push(`Potential security concern: '${pattern}' detected`);
        }
      });

      // Overall validity
      if (validationResult.errors.length > 0) {
        validationResult.valid = false;
      }

      if (config.verbose) {
        this.logger.info(`Script validation completed: ${validationResult.valid ? 'VALID' : 'INVALID'}`);
      }

      return validationResult;

    } catch (error) {
      this.logger.error(`Error validating script:`, error);
      return {
        valid: false,
        error: `Failed to validate script: ${error.message}`,
        errors: [`Validation failed: ${error.message}`],
        warnings: [],
        suggestions: []
      };
    }
  }

  // Tool 7: Backup Project
  async backupProject(projectId = 'default') {
    try {
      const fs = require('fs-extra');
      const path = require('path');

      // Create backup directory
      const backupDir = path.join('backups', projectId);
      await fs.ensureDir(backupDir);

      const timestamp = new Date().toISOString().replace(/[:.]/g, '').slice(0, 15);
      const backupFilename = `${projectId}_backup_${timestamp}.json`;
      const backupPath = path.join(backupDir, backupFilename);

      // Get all project data
      const projectData = await this.db.executeQuery(
        "SELECT * FROM projects WHERE id = ?",
        [projectId]
      );

      const scriptsData = await this.db.executeQuery(
        "SELECT * FROM scripts WHERE project_id = ?",
        [projectId]
      );

      // Prepare backup data
      const backupData = {
        project_id: projectId,
        backup_created: new Date().toISOString(),
        project: projectData,
        scripts: scriptsData,
        backup_metadata: {
          scripts_count: scriptsData.length,
          backup_size_bytes: 0  // Will calculate after writing
        }
      };

      // Write backup file
      await fs.writeJson(backupPath, backupData, { spaces: 2 });

      // Calculate actual size
      const stats = await fs.stat(backupPath);
      const actualSize = stats.size;
      backupData.backup_metadata.backup_size_bytes = actualSize;

      // Update backup record
      const metadata = JSON.stringify({
        scripts_count: scriptsData.length,
        created_by: "mcp_server"
      });

      await this.db.runQuery(
        "INSERT INTO backups (project_id, backup_path, size_bytes, metadata) VALUES (?, ?, ?, ?)",
        [projectId, backupPath, actualSize, metadata]
      );

      // Update project backup count
      await this.db.runQuery(
        "UPDATE projects SET backup_count = backup_count + 1, updated_at = ? WHERE id = ?",
        [new Date().toISOString(), projectId]
      );

      const response = {
        success: true,
        message: `Project '${projectId}' backed up successfully`,
        backup_path: backupPath,
        backup_filename: backupFilename,
        project_id: projectId,
        scripts_backed_up: scriptsData.length,
        backup_size_bytes: actualSize,
        created_at: new Date().toISOString()
      };

      if (config.verbose) {
        this.logger.info(`Project backup created: ${backupPath} (${actualSize} bytes)`);
      }

      return response;

    } catch (error) {
      this.logger.error(`Error creating backup for project ${projectId}:`, error);
      return {
        success: false,
        error: `Failed to create backup: ${error.message}`,
        backup_path: null,
        scripts_backed_up: 0
      };
    }
  }

  // Tool 8: Restore Project
  async restoreProject(projectId, backupPath = null) {
    try {
      const fs = require('fs-extra');
      const path = require('path');

      // Find backup file
      if (!backupPath) {
        // Get latest backup for project
        const backupInfo = await this.db.executeQuery(
          "SELECT * FROM backups WHERE project_id = ? ORDER BY created_at DESC LIMIT 1",
          [projectId]
        );

        if (!backupInfo || backupInfo.length === 0) {
          return {
            success: false,
            error: `No backup found for project '${projectId}'`,
            restored_scripts: 0
          };
        }

        backupPath = backupInfo[0].backup_path;
      }

      // Check if backup file exists
      if (!await fs.pathExists(backupPath)) {
        return {
          success: false,
          error: `Backup file not found: ${backupPath}`,
          restored_scripts: 0
        };
      }

      // Load backup data
      const backupData = await fs.readJson(backupPath);
      const scriptsToRestore = backupData.scripts || [];

      // Clear existing project data
      const existingScripts = await this.db.executeQuery(
        "SELECT name FROM scripts WHERE project_id = ?",
        [projectId]
      );
      const existingNames = new Set(existingScripts.map(script => script.name));

      let restoredCount = 0;
      let skippedCount = 0;

      // Restore scripts
      for (const script of scriptsToRestore) {
        if (existingNames.has(script.name)) {
          skippedCount++;
          continue;
        }

        await this.db.runQuery(
          "INSERT INTO scripts (name, content, type, project_id, metadata, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
          [
            script.name,
            script.content,
            script.type || 'lua',
            projectId,
            script.metadata || '{}',
            script.created_at || new Date().toISOString(),
            script.updated_at || new Date().toISOString()
          ]
        );
        restoredCount++;
      }

      const response = {
        success: true,
        message: `Project '${projectId}' restored from backup`,
        backup_path: backupPath,
        project_id: projectId,
        scripts_restored: restoredCount,
        scripts_skipped: skippedCount,
        total_scripts_in_backup: scriptsToRestore.length,
        restored_at: new Date().toISOString()
      };

      if (config.verbose) {
        this.logger.info(`Project restored: ${restoredCount} scripts restored from ${backupPath}`);
      }

      return response;

    } catch (error) {
      this.logger.error(`Error restoring project ${projectId}:`, error);
      return {
        success: false,
        error: `Failed to restore project: ${error.message}`,
        restored_scripts: 0
      };
    }
  }
}

module.exports = RobloxToolsService;