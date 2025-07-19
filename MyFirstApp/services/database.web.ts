// Web環境用のモックデータベースサービス
import { Wine } from '../types/wine';
import { Sake } from '../types/sake';
import { DatabaseError } from '../types/common';

// Web環境用のインメモリストレージ
class WebDatabaseService {
  private isInitialized = false;
  private storage: { [key: string]: any[] } = {
    wines: [],
    sakes: []
  };

  async initialize(): Promise<void> {
    try {
      if (this.isInitialized) {
        return;
      }

      // Web環境では localStorage を使用してデータを永続化
      const storedWines = localStorage.getItem('wines');
      const storedSakes = localStorage.getItem('sakes');

      if (storedWines) {
        this.storage.wines = JSON.parse(storedWines);
      }
      if (storedSakes) {
        this.storage.sakes = JSON.parse(storedSakes);
      }

      this.isInitialized = true;
      console.log('Web Database initialized successfully');
    } catch (error) {
      console.error('Web Database initialization failed:', error);
      throw new DatabaseError(`Web Database initialization failed: ${error}`);
    }
  }

  async executeQuery(query: string, params: any[] = []): Promise<any> {
    // Web環境では簡単なモック実装
    console.log('Mock query executed:', query, params);
    return { changes: 1, insertId: Date.now() };
  }

  async executeSelect(query: string, params: any[] = []): Promise<any[]> {
    // Web環境では簡単なモック実装
    console.log('Mock select executed:', query, params);
    return [];
  }

  generateId(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

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

  // CRUD operations for Web
  async create(table: string, data: Record<string, any>): Promise<string> {
    try {
      await this.initialize();
      
      const id = this.generateId();
      const now = new Date().toISOString();
      
      const record = {
        id,
        created_at: now,
        updated_at: now,
        ...data
      };

      this.storage[table].push(record);
      this.saveToLocalStorage(table);
      
      console.log(`Created record in ${table} with id: ${id}`);
      return id;
    } catch (error) {
      console.error(`Create operation failed for table ${table}:`, error);
      throw new DatabaseError(`Failed to create record in ${table}: ${error}`);
    }
  }

  async findById(table: string, id: string): Promise<any | null> {
    try {
      await this.initialize();
      const record = this.storage[table].find(item => item.id === id);
      return record || null;
    } catch (error) {
      console.error(`Find by ID failed for table ${table}:`, error);
      throw new DatabaseError(`Failed to find record in ${table}: ${error}`);
    }
  }

  async findAll(table: string, orderBy: string = 'created_at DESC'): Promise<any[]> {
    try {
      await this.initialize();
      const records = [...this.storage[table]];
      
      // Simple sorting by created_at
      records.sort((a, b) => {
        if (orderBy.includes('DESC')) {
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        }
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      });
      
      console.log(`Found ${records.length} records in ${table}`);
      return records;
    } catch (error) {
      console.error(`Find all failed for table ${table}:`, error);
      throw new DatabaseError(`Failed to fetch records from ${table}: ${error}`);
    }
  }

  async update(table: string, id: string, data: Record<string, any>): Promise<void> {
    try {
      await this.initialize();
      
      const index = this.storage[table].findIndex(item => item.id === id);
      if (index === -1) {
        throw new DatabaseError(`No record found with id: ${id}`);
      }

      const now = new Date().toISOString();
      this.storage[table][index] = {
        ...this.storage[table][index],
        ...data,
        updated_at: now
      };

      this.saveToLocalStorage(table);
      console.log(`Updated record in ${table} with id: ${id}`);
    } catch (error) {
      console.error(`Update operation failed for table ${table}:`, error);
      throw new DatabaseError(`Failed to update record in ${table}: ${error}`);
    }
  }

  async delete(table: string, id: string): Promise<void> {
    try {
      await this.initialize();
      
      const index = this.storage[table].findIndex(item => item.id === id);
      if (index === -1) {
        throw new DatabaseError(`No record found with id: ${id}`);
      }

      this.storage[table].splice(index, 1);
      this.saveToLocalStorage(table);
      console.log(`Deleted record from ${table} with id: ${id}`);
    } catch (error) {
      console.error(`Delete operation failed for table ${table}:`, error);
      throw new DatabaseError(`Failed to delete record from ${table}: ${error}`);
    }
  }

  async count(table: string): Promise<number> {
    try {
      await this.initialize();
      return this.storage[table].length;
    } catch (error) {
      console.error(`Count operation failed for table ${table}:`, error);
      throw new DatabaseError(`Failed to count records in ${table}: ${error}`);
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.initialize();
      return true;
    } catch (error) {
      console.error('Database health check failed:', error);
      return false;
    }
  }

  private saveToLocalStorage(table: string): void {
    try {
      localStorage.setItem(table, JSON.stringify(this.storage[table]));
    } catch (error) {
      console.warn('Failed to save to localStorage:', error);
    }
  }

  // Stub methods for compatibility
  async executeTransaction(operations: (() => Promise<void>)[]): Promise<void> {
    for (const operation of operations) {
      await operation();
    }
  }

  async withRetry<T>(operation: () => Promise<T>, maxRetries: number = 3): Promise<T> {
    return await operation();
  }

  async close(): Promise<void> {
    console.log('Web database connection closed');
  }
}

// Export singleton instance
export const databaseService = new WebDatabaseService();