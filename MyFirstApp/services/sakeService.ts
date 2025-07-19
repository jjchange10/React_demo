import { databaseService } from './databaseProvider';
import { Sake, SakeCreateInput, SakeUpdateInput, SakeValidation } from '../types/sake';
import { DatabaseError } from '../types/common';

export class SakeService {
  private readonly tableName = 'sakes';

  async create(data: SakeCreateInput): Promise<Sake> {
    try {
      // Validate input data
      SakeValidation.validateCreate(data);

      // Convert data for database storage
      const dbData = {
        name: data.name,
        brewery: data.brewery || null,
        type: data.type || null,
        region: data.region || null,
        rating: data.rating,
        notes: data.notes || null,
        photo_uri: data.photoUri || null
      };

      // Create record in database
      const id = await databaseService.create(this.tableName, dbData);

      // Fetch and return the created record
      const createdRecord = await this.findById(id);
      if (!createdRecord) {
        throw new DatabaseError('Failed to retrieve created sake record');
      }

      return createdRecord;
    } catch (error) {
      console.error('Sake creation failed:', error);
      throw error;
    }
  }

  async findById(id: string): Promise<Sake | null> {
    try {
      const row = await databaseService.findById(this.tableName, id);
      return row ? databaseService.mapRowToSake(row) : null;
    } catch (error) {
      console.error('Sake findById failed:', error);
      throw error;
    }
  }

  async findAll(): Promise<Sake[]> {
    try {
      const rows = await databaseService.findAll(this.tableName, 'created_at DESC');
      return rows.map(row => databaseService.mapRowToSake(row));
    } catch (error) {
      console.error('Sake findAll failed:', error);
      throw error;
    }
  }

  async update(id: string, data: SakeUpdateInput): Promise<Sake> {
    try {
      // Validate input data
      SakeValidation.validateUpdate(data);

      // Check if record exists
      const existingRecord = await this.findById(id);
      if (!existingRecord) {
        throw new DatabaseError(`Sake record not found with id: ${id}`);
      }

      // Convert data for database storage
      const dbData: Record<string, any> = {};
      if (data.name !== undefined) dbData.name = data.name;
      if (data.brewery !== undefined) dbData.brewery = data.brewery || null;
      if (data.type !== undefined) dbData.type = data.type || null;
      if (data.region !== undefined) dbData.region = data.region || null;
      if (data.rating !== undefined) dbData.rating = data.rating;
      if (data.notes !== undefined) dbData.notes = data.notes || null;
      if (data.photoUri !== undefined) dbData.photo_uri = data.photoUri || null;

      // Update record in database
      await databaseService.update(this.tableName, id, dbData);

      // Fetch and return the updated record
      const updatedRecord = await this.findById(id);
      if (!updatedRecord) {
        throw new DatabaseError('Failed to retrieve updated sake record');
      }

      return updatedRecord;
    } catch (error) {
      console.error('Sake update failed:', error);
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      // Check if record exists
      const existingRecord = await this.findById(id);
      if (!existingRecord) {
        throw new DatabaseError(`Sake record not found with id: ${id}`);
      }

      // Delete record from database
      await databaseService.delete(this.tableName, id);
    } catch (error) {
      console.error('Sake deletion failed:', error);
      throw error;
    }
  }

  async count(): Promise<number> {
    try {
      return await databaseService.count(this.tableName);
    } catch (error) {
      console.error('Sake count failed:', error);
      throw error;
    }
  }

  async findByRating(minRating: number, maxRating: number = 5): Promise<Sake[]> {
    try {
      const query = `SELECT * FROM ${this.tableName} WHERE rating >= ? AND rating <= ? ORDER BY rating DESC, created_at DESC`;
      const rows = await databaseService.executeSelect(query, [minRating, maxRating]);
      return rows.map(row => databaseService.mapRowToSake(row));
    } catch (error) {
      console.error('Sake findByRating failed:', error);
      throw error;
    }
  }

  async findByBrewery(brewery: string): Promise<Sake[]> {
    try {
      const query = `SELECT * FROM ${this.tableName} WHERE brewery LIKE ? ORDER BY created_at DESC`;
      const rows = await databaseService.executeSelect(query, [`%${brewery}%`]);
      return rows.map(row => databaseService.mapRowToSake(row));
    } catch (error) {
      console.error('Sake findByBrewery failed:', error);
      throw error;
    }
  }

  async findByType(type: string): Promise<Sake[]> {
    try {
      const query = `SELECT * FROM ${this.tableName} WHERE type = ? ORDER BY created_at DESC`;
      const rows = await databaseService.executeSelect(query, [type]);
      return rows.map(row => databaseService.mapRowToSake(row));
    } catch (error) {
      console.error('Sake findByType failed:', error);
      throw error;
    }
  }

  async findByRegion(region: string): Promise<Sake[]> {
    try {
      const query = `SELECT * FROM ${this.tableName} WHERE region LIKE ? ORDER BY created_at DESC`;
      const rows = await databaseService.executeSelect(query, [`%${region}%`]);
      return rows.map(row => databaseService.mapRowToSake(row));
    } catch (error) {
      console.error('Sake findByRegion failed:', error);
      throw error;
    }
  }

  async getAverageRating(): Promise<number> {
    try {
      const query = `SELECT AVG(rating) as avg_rating FROM ${this.tableName}`;
      const results = await databaseService.executeSelect(query);
      return results[0]?.avg_rating || 0;
    } catch (error) {
      console.error('Sake getAverageRating failed:', error);
      throw error;
    }
  }

  async getTopRated(limit: number = 10): Promise<Sake[]> {
    try {
      const query = `SELECT * FROM ${this.tableName} ORDER BY rating DESC, created_at DESC LIMIT ?`;
      const rows = await databaseService.executeSelect(query, [limit]);
      return rows.map(row => databaseService.mapRowToSake(row));
    } catch (error) {
      console.error('Sake getTopRated failed:', error);
      throw error;
    }
  }

  async getTypeDistribution(): Promise<{ type: string; count: number }[]> {
    try {
      const query = `SELECT type, COUNT(*) as count FROM ${this.tableName} WHERE type IS NOT NULL GROUP BY type ORDER BY count DESC`;
      const results = await databaseService.executeSelect(query);
      return results.map(row => ({ type: row.type, count: row.count }));
    } catch (error) {
      console.error('Sake getTypeDistribution failed:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const sakeService = new SakeService();