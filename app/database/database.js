/**
 * Aegis Local Auth - Database Module
 * Local SQLite database with enhanced security schema and atomic transactions
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const config = require('../../config/config');
const logger = require('../services/logger');

class AegisDatabase {
  constructor() {
    this.db = null;
    this.dbPath = path.resolve(config.DATABASE_PATH);
  }

  /**
   * Initialize database connection and create tables
   */
  async initialize() {
    return new Promise((resolve, reject) => {
      try {
        // Ensure the directory exists
        const dbDir = path.dirname(this.dbPath);
        if (!fs.existsSync(dbDir)) {
          fs.mkdirSync(dbDir, { recursive: true });
        }

        logger.info(`Initializing database at: ${this.dbPath}`);

        // Create database connection with proper flags to ensure file creation
        this.db = new sqlite3.Database(this.dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
          if (err) {
            logger.error('Failed to connect to SQLite database', err);
            reject(err);
          } else {
            logger.databaseConnected(this.dbPath);
            
            // Verify the database file was created
            if (fs.existsSync(this.dbPath)) {
              const stats = fs.statSync(this.dbPath);
              logger.info(`Database file created successfully, size: ${stats.size} bytes`);
            } else {
              logger.error('Database file was not created despite successful connection');
            }
            
            this.createTables()
              .then(() => resolve())
              .catch(reject);
          }
        });
      } catch (error) {
        logger.error('Unexpected error during database initialization', error);
        reject(error);
      }
    });
  }

  /**
   * Create users table with enhanced security schema
   */
  async createTables() {
    return new Promise((resolve, reject) => {
      const createUsersTable = `
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          phone_number_hash TEXT UNIQUE NOT NULL,
          current_otp_hash TEXT,
          otp_expires_at INTEGER,
          is_verified INTEGER DEFAULT 0,
          failed_attempts INTEGER DEFAULT 0,
          is_locked INTEGER DEFAULT 0,
          created_at INTEGER DEFAULT (strftime('%s', 'now')),
          updated_at INTEGER DEFAULT (strftime('%s', 'now'))
        )
      `;

      this.db.run(createUsersTable, (err) => {
        if (err) {
          logger.error('Failed to create users table', err);
          reject(err);
        } else {
          logger.info('Users table initialized successfully');
          
          // Force a sync to ensure data is written to disk
          this.db.run('PRAGMA synchronous = FULL', (syncErr) => {
            if (syncErr) {
              logger.error('Failed to set synchronous mode', syncErr);
            } else {
              logger.info('Database synchronization mode set to FULL');
            }
            
            // Create an index for better performance
            this.db.run('CREATE INDEX IF NOT EXISTS idx_phone_hash ON users(phone_number_hash)', (indexErr) => {
              if (indexErr) {
                logger.error('Failed to create phone hash index', indexErr);
              } else {
                logger.info('Phone hash index created successfully');
              }
              resolve();
            });
          });
        }
      });
    });
  }

  /**
   * Find user by phone number hash
   */
  async findUserByPhoneHash(phoneHash) {
    return new Promise((resolve, reject) => {
      const query = 'SELECT * FROM users WHERE phone_number_hash = ?';
      this.db.get(query, [phoneHash], (err, row) => {
        if (err) {
          logger.error('Database query error', err);
          reject(err);
        } else {
          resolve(row || null);
        }
      });
    });
  }

  /**
   * Create new user or update existing user with OTP
   */
  async upsertUserWithOtp(phoneHash, otpHash, expiresAt) {
    return new Promise((resolve, reject) => {
      const query = `
        INSERT INTO users (phone_number_hash, current_otp_hash, otp_expires_at, failed_attempts, updated_at)
        VALUES (?, ?, ?, 0, strftime('%s', 'now'))
        ON CONFLICT(phone_number_hash) DO UPDATE SET
          current_otp_hash = excluded.current_otp_hash,
          otp_expires_at = excluded.otp_expires_at,
          failed_attempts = 0,
          is_locked = 0,
          updated_at = strftime('%s', 'now')
      `;

      this.db.run(query, [phoneHash, otpHash, expiresAt], function(err) {
        if (err) {
          logger.error('Failed to upsert user', err);
          reject(err);
        } else {
          resolve(this.lastID);
        }
      });
    });
  }

  /**
   * Increment failed attempts for a user
   */
  async incrementFailedAttempts(phoneHash) {
    return new Promise((resolve, reject) => {
      const query = `
        UPDATE users 
        SET failed_attempts = failed_attempts + 1,
            updated_at = strftime('%s', 'now')
        WHERE phone_number_hash = ?
      `;

      this.db.run(query, [phoneHash], function(err) {
        if (err) {
          logger.error('Failed to increment failed attempts', err);
          reject(err);
        } else {
          resolve(this.changes);
        }
      });
    });
  }

  /**
   * Lock user account
   */
  async lockUser(phoneHash) {
    return new Promise((resolve, reject) => {
      const query = `
        UPDATE users 
        SET is_locked = 1,
            updated_at = strftime('%s', 'now')
        WHERE phone_number_hash = ?
      `;

      this.db.run(query, [phoneHash], function(err) {
        if (err) {
          logger.error('Failed to lock user', err);
          reject(err);
        } else {
          resolve(this.changes);
        }
      });
    });
  }

  /**
   * Verify user with atomic transaction
   * This ensures that verification and OTP clearing happen atomically
   */
  async verifyUserWithTransaction(phoneHash) {
    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        this.db.run('BEGIN TRANSACTION');

        const updateQuery = `
          UPDATE users 
          SET is_verified = 1,
              current_otp_hash = NULL,
              otp_expires_at = NULL,
              failed_attempts = 0,
              is_locked = 0,
              updated_at = strftime('%s', 'now')
          WHERE phone_number_hash = ?
        `;

        this.db.run(updateQuery, [phoneHash], function(err) {
          if (err) {
            this.db.run('ROLLBACK');
            reject(err);
          } else if (this.changes === 0) {
            this.db.run('ROLLBACK');
            reject(new Error('User not found'));
          } else {
            this.db.run('COMMIT', (commitErr) => {
              if (commitErr) {
                reject(commitErr);
              } else {
                resolve(true);
              }
            });
          }
        });
      });
    });
  }

  /**
   * Get user statistics (for monitoring)
   */
  async getUserStats() {
    return new Promise((resolve, reject) => {
      try {
        const query = `
          SELECT 
            COUNT(*) as total_users,
            COUNT(CASE WHEN is_verified = 1 THEN 1 END) as verified_users,
            COUNT(CASE WHEN is_locked = 1 THEN 1 END) as locked_users
          FROM users
        `;

        this.db.get(query, [], (err, row) => {
          if (err) {
            logger.error('Failed to get user statistics', err);
            reject(err);
          } else {
            resolve(row);
          }
        });
      } catch (error) {
        logger.error('Unexpected error in getUserStats', error);
        reject(error);
      }
    });
  }

  /**
   * Close database connection
   */
  async close() {
    return new Promise((resolve, reject) => {
      if (this.db) {
        this.db.close((err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      } else {
        resolve();
      }
    });
  }
}

// Create and export singleton instance
const aegisDB = new AegisDatabase();

module.exports = aegisDB; 