import { databaseService } from './databaseProvider';
import { Wine, WineCreateInput, WineUpdateInput, WineValidation } from '../types/wine';
import { DatabaseError } from '../types/common';

export class WineService {
  private readonly tableName = 'wines';

  async create(data: WineCreateInput): Promise<Wine> {
    try {
      // Validate input data
      WineValidation.validateCreate(data);

      // Convert data for database storage
      const dbData = {
        name: data.name,
        region: data.region || null,
        grape: data.grape || null,
        vintage: data.vintage || null,
        rating: data.rating,
        notes: data.notes || null,
        photo_uri: data.photoUri || null
      };

      // Create record in database
      const id = await databaseService.create(this.tableName, dbData);

      // Fetch and return the created record
      const createdRecord = await this.findById(id);
      if (!createdRecord) {
        throw new DatabaseError('Failed to retrieve created wine record');
      }

      return createdRecord;
    } catch (error) {
      console.error('Wine creation failed:', error);
      throw error;
    }
  }

  async findById(id: string): Promise<Wine | null> {
    try {
      const row = await databaseService.findById(this.tableName, id);
      return row ? databaseService.mapRowToWine(row) : null;
    } catch (error) {
      console.error('Wine findById failed:', error);
      throw error;
    }
  }

  async findAll(): Promise<Wine[]> {
    try {
      const rows = await databaseService.findAll(this.tableName, 'created_at DESC');
      return rows.map(row => databaseService.mapRowToWine(row));
    } catch (error) {
      console.error('Wine findAll failed:', error);
      throw error;
    }
  }

  async update(id: string, data: WineUpdateInput): Promise<Wine> {
    try {
      // Validate input data
      WineValidation.validateUpdate(data);

      // Check if record exists
      const existingRecord = await this.findById(id);
      if (!existingRecord) {
        throw new DatabaseError(`Wine record not found with id: ${id}`);
      }

      // Convert data for database storage
      const dbData: Record<string, any> = {};
      if (data.name !== undefined) dbData.name = data.name;
      if (data.region !== undefined) dbData.region = data.region || null;
      if (data.grape !== undefined) dbData.grape = data.grape || null;
      if (data.vintage !== undefined) dbData.vintage = data.vintage || null;
      if (data.rating !== undefined) dbData.rating = data.rating;
      if (data.notes !== undefined) dbData.notes = data.notes || null;
      if (data.photoUri !== undefined) dbData.photo_uri = data.photoUri || null;

      // Update record in database
      await databaseService.update(this.tableName, id, dbData);

      // Fetch and return the updated record
      const updatedRecord = await this.findById(id);
      if (!updatedRecord) {
        throw new DatabaseError('Failed to retrieve updated wine record');
      }

      return updatedRecord;
    } catch (error) {
      console.error('Wine update failed:', error);
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      // Check if record exists
      const existingRecord = await this.findById(id);
      if (!existingRecord) {
        throw new DatabaseError(`Wine record not found with id: ${id}`);
      }

      // Delete record from database
      await databaseService.delete(this.tableName, id);
    } catch (error) {
      console.error('Wine deletion failed:', error);
      throw error;
    }
  }

  async count(): Promise<number> {
    try {
      return await databaseService.count(this.tableName);
    } catch (error) {
      console.error('Wine count failed:', error);
      throw error;
    }
  }

  async findByRating(minRating: number, maxRating: number = 5): Promise<Wine[]> {
    try {
      const query = `SELECT * FROM ${this.tableName} WHERE rating >= ? AND rating <= ? ORDER BY rating DESC, created_at DESC`;
      const rows = await databaseService.executeSelect(query, [minRating, maxRating]);
      return rows.map(row => databaseService.mapRowToWine(row));
    } catch (error) {
      console.error('Wine findByRating failed:', error);
      throw error;
    }
  }

  async findByRegion(region: string): Promise<Wine[]> {
    try {
      const query = `SELECT * FROM ${this.tableName} WHERE region LIKE ? ORDER BY created_at DESC`;
      const rows = await databaseService.executeSelect(query, [`%${region}%`]);
      return rows.map(row => databaseService.mapRowToWine(row));
    } catch (error) {
      console.error('Wine findByRegion failed:', error);
      throw error;
    }
  }

  async findByGrape(grape: string): Promise<Wine[]> {
    try {
      const query = `SELECT * FROM ${this.tableName} WHERE grape LIKE ? ORDER BY created_at DESC`;
      const rows = await databaseService.executeSelect(query, [`%${grape}%`]);
      return rows.map(row => databaseService.mapRowToWine(row));
    } catch (error) {
      console.error('Wine findByGrape failed:', error);
      throw error;
    }
  }

  async getAverageRating(): Promise<number> {
    try {
      const query = `SELECT AVG(rating) as avg_rating FROM ${this.tableName}`;
      const results = await databaseService.executeSelect(query);
      return results[0]?.avg_rating || 0;
    } catch (error) {
      console.error('Wine getAverageRating failed:', error);
      throw error;
    }
  }

  async getTopRated(limit: number = 10): Promise<Wine[]> {
    try {
      const query = `SELECT * FROM ${this.tableName} ORDER BY rating DESC, created_at DESC LIMIT ?`;
      const rows = await databaseService.executeSelect(query, [limit]);
      return rows.map(row => databaseService.mapRowToWine(row));
    } catch (error) {
      console.error('Wine getTopRated failed:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const wineService = new WineService();