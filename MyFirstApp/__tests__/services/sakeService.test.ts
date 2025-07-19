import { sakeService } from '../../services/sakeService';
import { databaseService } from '../../services/databaseProvider';
import { Sake, SakeCreateInput, SakeUpdateInput } from '../../types/sake';
import { DatabaseError, ValidationError } from '../../types/common';

// Mock the database service
jest.mock('../../services/databaseProvider');

const mockDatabaseService = databaseService as jest.Mocked<typeof databaseService>;

describe('SakeService', () => {
  const mockSake: Sake = {
    id: 'test-sake-id',
    name: 'Test Sake',
    brewery: 'Test Brewery',
    type: '純米酒',
    region: 'Test Region',
    rating: 5,
    notes: 'Test notes',
    photoUri: 'test://photo.jpg',
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01')
  };

  const mockDbRow = {
    id: 'test-sake-id',
    name: 'Test Sake',
    brewery: 'Test Brewery',
    type: '純米酒',
    region: 'Test Region',
    rating: 5,
    notes: 'Test notes',
    photo_uri: 'test://photo.jpg',
    created_at: '2023-01-01T00:00:00.000Z',
    updated_at: '2023-01-01T00:00:00.000Z'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockDatabaseService.mapRowToSake.mockReturnValue(mockSake);
  });

  describe('create', () => {
    const validCreateInput: SakeCreateInput = {
      name: 'Test Sake',
      brewery: 'Test Brewery',
      type: '純米酒',
      region: 'Test Region',
      rating: 5,
      notes: 'Test notes',
      photoUri: 'test://photo.jpg'
    };

    it('should create sake successfully', async () => {
      mockDatabaseService.create.mockResolvedValue('test-sake-id');
      mockDatabaseService.findById.mockResolvedValue(mockDbRow);

      const result = await sakeService.create(validCreateInput);

      expect(mockDatabaseService.create).toHaveBeenCalledWith('sakes', {
        name: 'Test Sake',
        brewery: 'Test Brewery',
        type: '純米酒',
        region: 'Test Region',
        rating: 5,
        notes: 'Test notes',
        photo_uri: 'test://photo.jpg'
      });
      expect(result).toEqual(mockSake);
    });

    it('should create sake with minimal data', async () => {
      const minimalInput: SakeCreateInput = {
        name: 'Minimal Sake',
        rating: 3
      };

      mockDatabaseService.create.mockResolvedValue('test-sake-id');
      mockDatabaseService.findById.mockResolvedValue(mockDbRow);

      await sakeService.create(minimalInput);

      expect(mockDatabaseService.create).toHaveBeenCalledWith('sakes', {
        name: 'Minimal Sake',
        brewery: null,
        type: null,
        region: null,
        rating: 3,
        notes: null,
        photo_uri: null
      });
    });

    it('should throw ValidationError for invalid input', async () => {
      const invalidInput: SakeCreateInput = {
        name: '',
        rating: 0
      };

      await expect(sakeService.create(invalidInput)).rejects.toThrow(ValidationError);
      expect(mockDatabaseService.create).not.toHaveBeenCalled();
    });

    it('should throw ValidationError for invalid sake type', async () => {
      const invalidTypeInput: SakeCreateInput = {
        name: 'Test Sake',
        type: '無効な種類',
        rating: 4
      };

      await expect(sakeService.create(invalidTypeInput)).rejects.toThrow(ValidationError);
      expect(mockDatabaseService.create).not.toHaveBeenCalled();
    });

    it('should throw DatabaseError if creation fails', async () => {
      mockDatabaseService.create.mockRejectedValue(new DatabaseError('Creation failed'));

      await expect(sakeService.create(validCreateInput)).rejects.toThrow(DatabaseError);
    });

    it('should throw DatabaseError if created record cannot be retrieved', async () => {
      mockDatabaseService.create.mockResolvedValue('test-sake-id');
      mockDatabaseService.findById.mockResolvedValue(null);

      await expect(sakeService.create(validCreateInput)).rejects.toThrow(DatabaseError);
    });
  });

  describe('findById', () => {
    it('should find sake by ID', async () => {
      mockDatabaseService.findById.mockResolvedValue(mockDbRow);

      const result = await sakeService.findById('test-sake-id');

      expect(mockDatabaseService.findById).toHaveBeenCalledWith('sakes', 'test-sake-id');
      expect(result).toEqual(mockSake);
    });

    it('should return null if sake not found', async () => {
      mockDatabaseService.findById.mockResolvedValue(null);

      const result = await sakeService.findById('nonexistent-id');

      expect(result).toBeNull();
    });

    it('should throw error on database failure', async () => {
      mockDatabaseService.findById.mockRejectedValue(new DatabaseError('Query failed'));

      await expect(sakeService.findById('test-sake-id')).rejects.toThrow(DatabaseError);
    });
  });

  describe('findAll', () => {
    it('should find all sakes', async () => {
      mockDatabaseService.findAll.mockResolvedValue([mockDbRow]);

      const result = await sakeService.findAll();

      expect(mockDatabaseService.findAll).toHaveBeenCalledWith('sakes', 'created_at DESC');
      expect(result).toEqual([mockSake]);
    });

    it('should return empty array if no sakes found', async () => {
      mockDatabaseService.findAll.mockResolvedValue([]);

      const result = await sakeService.findAll();

      expect(result).toEqual([]);
    });

    it('should throw error on database failure', async () => {
      mockDatabaseService.findAll.mockRejectedValue(new DatabaseError('Query failed'));

      await expect(sakeService.findAll()).rejects.toThrow(DatabaseError);
    });
  });

  describe('update', () => {
    const validUpdateInput: SakeUpdateInput = {
      name: 'Updated Sake',
      rating: 4
    };

    it('should update sake successfully', async () => {
      mockDatabaseService.findById.mockResolvedValueOnce(mockDbRow).mockResolvedValueOnce(mockDbRow);
      mockDatabaseService.update.mockResolvedValue();

      const result = await sakeService.update('test-sake-id', validUpdateInput);

      expect(mockDatabaseService.update).toHaveBeenCalledWith('sakes', 'test-sake-id', {
        name: 'Updated Sake',
        rating: 4
      });
      expect(result).toEqual(mockSake);
    });

    it('should throw DatabaseError if sake not found', async () => {
      mockDatabaseService.findById.mockResolvedValue(null);

      await expect(sakeService.update('nonexistent-id', validUpdateInput))
        .rejects.toThrow(DatabaseError);
    });

    it('should throw ValidationError for invalid input', async () => {
      const invalidInput: SakeUpdateInput = {
        name: '',
        rating: 0
      };

      await expect(sakeService.update('test-sake-id', invalidInput))
        .rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for invalid sake type', async () => {
      const invalidTypeInput: SakeUpdateInput = {
        type: '無効な種類'
      };

      await expect(sakeService.update('test-sake-id', invalidTypeInput))
        .rejects.toThrow(ValidationError);
    });

    it('should handle partial updates', async () => {
      const partialUpdate: SakeUpdateInput = { rating: 5 };
      
      mockDatabaseService.findById.mockResolvedValueOnce(mockDbRow).mockResolvedValueOnce(mockDbRow);
      mockDatabaseService.update.mockResolvedValue();

      await sakeService.update('test-sake-id', partialUpdate);

      expect(mockDatabaseService.update).toHaveBeenCalledWith('sakes', 'test-sake-id', {
        rating: 5
      });
    });

    it('should handle null values in update', async () => {
      const updateWithNulls: SakeUpdateInput = {
        brewery: undefined,
        type: '',
        region: undefined
      };
      
      mockDatabaseService.findById.mockResolvedValueOnce(mockDbRow).mockResolvedValueOnce(mockDbRow);
      mockDatabaseService.update.mockResolvedValue();

      await sakeService.update('test-sake-id', updateWithNulls);

      expect(mockDatabaseService.update).toHaveBeenCalledWith('sakes', 'test-sake-id', {
        type: null
      });
    });
  });

  describe('delete', () => {
    it('should delete sake successfully', async () => {
      mockDatabaseService.findById.mockResolvedValue(mockDbRow);
      mockDatabaseService.delete.mockResolvedValue();

      await sakeService.delete('test-sake-id');

      expect(mockDatabaseService.delete).toHaveBeenCalledWith('sakes', 'test-sake-id');
    });

    it('should throw DatabaseError if sake not found', async () => {
      mockDatabaseService.findById.mockResolvedValue(null);

      await expect(sakeService.delete('nonexistent-id')).rejects.toThrow(DatabaseError);
      expect(mockDatabaseService.delete).not.toHaveBeenCalled();
    });

    it('should throw error on database failure', async () => {
      mockDatabaseService.findById.mockResolvedValue(mockDbRow);
      mockDatabaseService.delete.mockRejectedValue(new DatabaseError('Delete failed'));

      await expect(sakeService.delete('test-sake-id')).rejects.toThrow(DatabaseError);
    });
  });

  describe('count', () => {
    it('should return sake count', async () => {
      mockDatabaseService.count.mockResolvedValue(3);

      const result = await sakeService.count();

      expect(mockDatabaseService.count).toHaveBeenCalledWith('sakes');
      expect(result).toBe(3);
    });

    it('should throw error on database failure', async () => {
      mockDatabaseService.count.mockRejectedValue(new DatabaseError('Count failed'));

      await expect(sakeService.count()).rejects.toThrow(DatabaseError);
    });
  });

  describe('findByRating', () => {
    it('should find sakes by rating range', async () => {
      mockDatabaseService.executeSelect.mockResolvedValue([mockDbRow]);

      const result = await sakeService.findByRating(4, 5);

      expect(mockDatabaseService.executeSelect).toHaveBeenCalledWith(
        'SELECT * FROM sakes WHERE rating >= ? AND rating <= ? ORDER BY rating DESC, created_at DESC',
        [4, 5]
      );
      expect(result).toEqual([mockSake]);
    });

    it('should use default max rating', async () => {
      mockDatabaseService.executeSelect.mockResolvedValue([mockDbRow]);

      await sakeService.findByRating(4);

      expect(mockDatabaseService.executeSelect).toHaveBeenCalledWith(
        expect.any(String),
        [4, 5]
      );
    });
  });

  describe('findByBrewery', () => {
    it('should find sakes by brewery', async () => {
      mockDatabaseService.executeSelect.mockResolvedValue([mockDbRow]);

      const result = await sakeService.findByBrewery('旭酒造');

      expect(mockDatabaseService.executeSelect).toHaveBeenCalledWith(
        'SELECT * FROM sakes WHERE brewery LIKE ? ORDER BY created_at DESC',
        ['%旭酒造%']
      );
      expect(result).toEqual([mockSake]);
    });
  });

  describe('findByType', () => {
    it('should find sakes by type', async () => {
      mockDatabaseService.executeSelect.mockResolvedValue([mockDbRow]);

      const result = await sakeService.findByType('純米酒');

      expect(mockDatabaseService.executeSelect).toHaveBeenCalledWith(
        'SELECT * FROM sakes WHERE type = ? ORDER BY created_at DESC',
        ['純米酒']
      );
      expect(result).toEqual([mockSake]);
    });
  });

  describe('findByRegion', () => {
    it('should find sakes by region', async () => {
      mockDatabaseService.executeSelect.mockResolvedValue([mockDbRow]);

      const result = await sakeService.findByRegion('新潟県');

      expect(mockDatabaseService.executeSelect).toHaveBeenCalledWith(
        'SELECT * FROM sakes WHERE region LIKE ? ORDER BY created_at DESC',
        ['%新潟県%']
      );
      expect(result).toEqual([mockSake]);
    });
  });

  describe('getAverageRating', () => {
    it('should return average rating', async () => {
      mockDatabaseService.executeSelect.mockResolvedValue([{ avg_rating: 4.5 }]);

      const result = await sakeService.getAverageRating();

      expect(mockDatabaseService.executeSelect).toHaveBeenCalledWith(
        'SELECT AVG(rating) as avg_rating FROM sakes'
      );
      expect(result).toBe(4.5);
    });

    it('should return 0 if no results', async () => {
      mockDatabaseService.executeSelect.mockResolvedValue([]);

      const result = await sakeService.getAverageRating();

      expect(result).toBe(0);
    });
  });

  describe('getTopRated', () => {
    it('should return top rated sakes', async () => {
      mockDatabaseService.executeSelect.mockResolvedValue([mockDbRow]);

      const result = await sakeService.getTopRated(5);

      expect(mockDatabaseService.executeSelect).toHaveBeenCalledWith(
        'SELECT * FROM sakes ORDER BY rating DESC, created_at DESC LIMIT ?',
        [5]
      );
      expect(result).toEqual([mockSake]);
    });

    it('should use default limit', async () => {
      mockDatabaseService.executeSelect.mockResolvedValue([mockDbRow]);

      await sakeService.getTopRated();

      expect(mockDatabaseService.executeSelect).toHaveBeenCalledWith(
        expect.any(String),
        [10]
      );
    });
  });

  describe('getTypeDistribution', () => {
    it('should return type distribution', async () => {
      const mockDistribution = [
        { type: '純米酒', count: 5 },
        { type: '吟醸酒', count: 3 },
        { type: '大吟醸酒', count: 2 }
      ];
      mockDatabaseService.executeSelect.mockResolvedValue(mockDistribution);

      const result = await sakeService.getTypeDistribution();

      expect(mockDatabaseService.executeSelect).toHaveBeenCalledWith(
        'SELECT type, COUNT(*) as count FROM sakes WHERE type IS NOT NULL GROUP BY type ORDER BY count DESC'
      );
      expect(result).toEqual(mockDistribution);
    });

    it('should return empty array if no results', async () => {
      mockDatabaseService.executeSelect.mockResolvedValue([]);

      const result = await sakeService.getTypeDistribution();

      expect(result).toEqual([]);
    });

    it('should throw error on database failure', async () => {
      mockDatabaseService.executeSelect.mockRejectedValue(new DatabaseError('Query failed'));

      await expect(sakeService.getTypeDistribution()).rejects.toThrow(DatabaseError);
    });
  });
});