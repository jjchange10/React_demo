import * as SQLite from 'expo-sqlite';
import { Wine } from '../types/wine';
import { Sake } from '../types/sake';
import { DatabaseError } from '../types/common';

class DatabaseService {
  private db: SQLite.SQLiteDatabase | null = null;
  private isInitialized = false;

  async initialize(): Promise<void> {
    try {
      if (this.isInitialized) {
        return;
      }

      this.db = await SQLite.openDatabaseAsync('wine_sake_tracker.db');
      await this.createTables();
      this.isInitialized = true;
      
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Database initialization failed:', error);
      throw new DatabaseError(`Database initialization failed: ${error}`);
    }
  }

  private async createTables(): Promise<void> {
    if (!this.db) {
      throw new DatabaseError('Database not initialized');
    }

    try {
      // Create wines table
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS wines (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          region TEXT,
          grape TEXT,
          vintage INTEGER,
          rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
          notes TEXT,
          photo_uri TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // Create sakes table
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS sakes (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          brewery TEXT,
          type TEXT,
          region TEXT,
          rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
          notes TEXT,
          photo_uri TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `);

      console.log('Database tables created successfully');
    } catch (error) {
      console.error('Table creation failed:', error);
      throw new DatabaseError(`Table creation failed: ${error}`);
    }
  }

  async getDatabase(): Promise<SQLite.SQLiteDatabase> {
    if (!this.isInitialized || !this.db) {
      await this.initialize();
    }
    
    if (!this.db) {
      throw new DatabaseError('Database initialization failed');
    }
    
    return this.db;
  }

  async executeQuery(query: string, params: any[] = []): Promise<any> {
    try {
      const db = await this.getDatabase();
      const result = await db.runAsync(query, params);
      return result;
    } catch (error) {
      console.error('Query execution failed:', error);
      throw new DatabaseError(`Query execution failed: ${error}`);
    }
  }

  async executeSelect(query: string, params: any[] = []): Promise<any[]> {
    try {
      const db = await this.getDatabase();
      const result = await db.getAllAsync(query, params);
      return result;
    } catch (error) {
      console.error('Select query failed:', error);
      throw new DatabaseError(`Select query failed: ${error}`);
    }
  }

  // Helper method to generate UUID
  generateId(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  // Helper method to convert database row to Wine object
  mapRowToWine(row: any): Wine {
    return {
      id: row.id,
      name: row.name,
      region: row.region,
      grape: row.grape,
      vintage: row.vintage,
      rating: row.rating,
      notes: row.notes,
      photoUri: row.photo_uri,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }

  // Helper method to convert database row to Sake object
  mapRowToSake(row: any): Sake {
    return {
      id: row.id,
      name: row.name,
      brewery: row.brewery,
      type: row.type,
      region: row.region,
      rating: row.rating,
      notes: row.notes,
      photoUri: row.photo_uri,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }

  // Generic CRUD operations
  async create(table: string, data: Record<string, any>): Promise<string> {
    try {
      const id = this.generateId();
      const now = new Date().toISOString();
      
      const columns = ['id', 'created_at', 'updated_at', ...Object.keys(data)];
      const values = [id, now, now, ...Object.values(data)];
      const placeholders = columns.map(() => '?').join(', ');
      
      const query = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`;
      
      await this.executeQuery(query, values);
      console.log(`Created record in ${table} with id: ${id}`);
      
      return id;
    } catch (error) {
      console.error(`Create operation failed for table ${table}:`, error);
      throw new DatabaseError(`Failed to create record in ${table}: ${error}`);
    }
  }

  async findById(table: string, id: string): Promise<any | null> {
    try {
      const query = `SELECT * FROM ${table} WHERE id = ?`;
      const results = await this.executeSelect(query, [id]);
      
      return results.length > 0 ? results[0] : null;
    } catch (error) {
      console.error(`Find by ID failed for table ${table}:`, error);
      throw new DatabaseError(`Failed to find record in ${table}: ${error}`);
    }
  }

  async findAll(table: string, orderBy: string = 'created_at DESC'): Promise<any[]> {
    try {
      const query = `SELECT * FROM ${table} ORDER BY ${orderBy}`;
      const results = await this.executeSelect(query);
      
      console.log(`Found ${results.length} records in ${table}`);
      return results;
    } catch (error) {
      console.error(`Find all failed for table ${table}:`, error);
      throw new DatabaseError(`Failed to fetch records from ${table}: ${error}`);
    }
  }

  async update(table: string, id: string, data: Record<string, any>): Promise<void> {
    try {
      const now = new Date().toISOString();
      const updateData = { ...data, updated_at: now };
      
      const setClause = Object.keys(updateData).map(key => `${key} = ?`).join(', ');
      const values = [...Object.values(updateData), id];
      
      const query = `UPDATE ${table} SET ${setClause} WHERE id = ?`;
      
      const result = await this.executeQuery(query, values);
      
      if (result.changes === 0) {
        throw new DatabaseError(`No record found with id: ${id}`);
      }
      
      console.log(`Updated record in ${table} with id: ${id}`);
    } catch (error) {
      console.error(`Update operation failed for table ${table}:`, error);
      throw new DatabaseError(`Failed to update record in ${table}: ${error}`);
    }
  }

  async delete(table: string, id: string): Promise<void> {
    try {
      const query = `DELETE FROM ${table} WHERE id = ?`;
      const result = await this.executeQuery(query, [id]);
      
      if (result.changes === 0) {
        throw new DatabaseError(`No record found with id: ${id}`);
      }
      
      console.log(`Deleted record from ${table} with id: ${id}`);
    } catch (error) {
      console.error(`Delete operation failed for table ${table}:`, error);
      throw new DatabaseError(`Failed to delete record from ${table}: ${error}`);
    }
  }

  async count(table: string): Promise<number> {
    try {
      const query = `SELECT COUNT(*) as count FROM ${table}`;
      const results = await this.executeSelect(query);
      
      return results[0]?.count || 0;
    } catch (error) {
      console.error(`Count operation failed for table ${table}:`, error);
      throw new DatabaseError(`Failed to count records in ${table}: ${error}`);
    }
  }

  // Transaction support
  async executeTransaction(operations: (() => Promise<void>)[]): Promise<void> {
    const db = await this.getDatabase();
    
    try {
      await db.execAsync('BEGIN TRANSACTION');
      
      for (const operation of operations) {
        await operation();
      }
      
      await db.execAsync('COMMIT');
      console.log('Transaction completed successfully');
    } catch (error) {
      await db.execAsync('ROLLBACK');
      console.error('Transaction failed, rolled back:', error);
      throw new DatabaseError(`Transaction failed: ${error}`);
    }
  }

  // Utility method for safe database operations with retry
  async withRetry<T>(operation: () => Promise<T>, maxRetries: number = 3): Promise<T> {
    let lastError: Error = new Error('Unknown error');
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        console.warn(`Database operation failed (attempt ${attempt}/${maxRetries}):`, error);
        
        if (attempt === maxRetries) {
          break;
        }
        
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 100));
      }
    }
    
    throw new DatabaseError(`Operation failed after ${maxRetries} attempts: ${lastError.message}`);
  }

  // Database health check
  async healthCheck(): Promise<boolean> {
    try {
      await this.executeSelect('SELECT 1');
      return true;
    } catch (error) {
      console.error('Database health check failed:', error);
      return false;
    }
  }

  // Close database connection
  async close(): Promise<void> {
    try {
      if (this.db) {
        await this.db.closeAsync();
        this.db = null;
        this.isInitialized = false;
        console.log('Database connection closed');
      }
    } catch (error) {
      console.error('Failed to close database:', error);
      throw new DatabaseError(`Failed to close database: ${error}`);
    }
  }
}

// Export singleton instance
export const databaseService = new DatabaseService();