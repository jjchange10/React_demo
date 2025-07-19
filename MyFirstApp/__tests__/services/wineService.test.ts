import { wineService } from '../../services/wineService';
import { databaseService } from '../../services/databaseProvider';
import { Wine, WineCreateInput, WineUpdateInput } from '../../types/wine';
import { DatabaseError, ValidationError } from '../../types/common';

// Mock the database service
jest.mock('../../services/databaseProvider');

const mockDatabaseService = databaseService as jest.Mocked<typeof databaseService>;

describe('WineService', () => {
  const mockWine: Wine = {
    id: 'test-wine-id',
    name: 'Test Wine',
    region: 'Test Region',
    grape: 'Test Grape',
    vintage: 2020,
    rating: 4,
    notes: 'Test notes',
    photoUri: 'test://photo.jpg',
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01')
  };

  const mockDbRow = {
    id: 'test-wine-id',
    name: 'Test Wine',
    region: 'Test Region',
    grape: 'Test Grape',
    vintage: 2020,
    rating: 4,
    notes: 'Test notes',
    photo_uri: 'test://photo.jpg',
    created_at: '2023-01-01T00:00:00.000Z',
    updated_at: '2023-01-01T00:00:00.000Z'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockDatabaseService.mapRowToWine.mockReturnValue(mockWine);
  });

  describe('create', () => {
    const validCreateInput: WineCreateInput = {
      name: 'Test Wine',
      region: 'Test Region',
      grape: 'Test Grape',
      vintage: 2020,
      rating: 4,
      notes: 'Test notes',
      photoUri: 'test://photo.jpg'
    };

    it('should create wine successfully', async () => {
      mockDatabaseService.create.mockResolvedValue('test-wine-id');
      mockDatabaseService.findById.mockResolvedValue(mockDbRow);

      const result = await wineService.create(validCreateInput);

      expect(mockDatabaseService.create).toHaveBeenCalledWith('wines', {
        name: 'Test Wine',
        region: 'Test Region',
        grape: 'Test Grape',
        vintage: 2020,
        rating: 4,
        notes: 'Test notes',
        photo_uri: 'test://photo.jpg'
      });
      expect(result).toEqual(mockWine);
    });

    it('should create wine with minimal data', async () => {
      const minimalInput: WineCreateInput = {
        name: 'Minimal Wine',
        rating: 3
      };

      mockDatabaseService.create.mockResolvedValue('test-wine-id');
      mockDatabaseService.findById.mockResolvedValue(mockDbRow);

      await wineService.create(minimalInput);

      expect(mockDatabaseService.create).toHaveBeenCalledWith('wines', {
        name: 'Minimal Wine',
        region: null,
        grape: null,
        vintage: null,
        rating: 3,
        notes: null,
        photo_uri: null
      });
    });

    it('should throw ValidationError for invalid input', async () => {
      const invalidInput: WineCreateInput = {
        name: '',
        rating: 0
      };

      await expect(wineService.create(invalidInput)).rejects.toThrow(ValidationError);
      expect(mockDatabaseService.create).not.toHaveBeenCalled();
    });

    it('should throw DatabaseError if creation fails', async () => {
      mockDatabaseService.create.mockRejectedValue(new DatabaseError('Creation failed'));

      await expect(wineService.create(validCreateInput)).rejects.toThrow(DatabaseError);
    });

    it('should throw DatabaseError if created record cannot be retrieved', async () => {
      mockDatabaseService.create.mockResolvedValue('test-wine-id');
      mockDatabaseService.findById.mockResolvedValue(null);

      await expect(wineService.create(validCreateInput)).rejects.toThrow(DatabaseError);
    });
  });

  describe('findById', () => {
    it('should find wine by ID', async () => {
      mockDatabaseService.findById.mockResolvedValue(mockDbRow);

      const result = await wineService.findById('test-wine-id');

      expect(mockDatabaseService.findById).toHaveBeenCalledWith('wines', 'test-wine-id');
      expect(result).toEqual(mockWine);
    });

    it('should return null if wine not found', async () => {
      mockDatabaseService.findById.mockResolvedValue(null);

      const result = await wineService.findById('nonexistent-id');

      expect(result).toBeNull();
    });

    it('should throw error on database failure', async () => {
      mockDatabaseService.findById.mockRejectedValue(new DatabaseError('Query failed'));

      await expect(wineService.findById('test-wine-id')).rejects.toThrow(DatabaseError);
    });
  });

  describe('findAll', () => {
    it('should find all wines', async () => {
      mockDatabaseService.findAll.mockResolvedValue([mockDbRow]);

      const result = await wineService.findAll();

      expect(mockDatabaseService.findAll).toHaveBeenCalledWith('wines', 'created_at DESC');
      expect(result).toEqual([mockWine]);
    });

    it('should return empty array if no wines found', async () => {
      mockDatabaseService.findAll.mockResolvedValue([]);

      const result = await wineService.findAll();

      expect(result).toEqual([]);
    });

    it('should throw error on database failure', async () => {
      mockDatabaseService.findAll.mockRejectedValue(new DatabaseError('Query failed'));

      await expect(wineService.findAll()).rejects.toThrow(DatabaseError);
    });
  });

  describe('update', () => {
    const validUpdateInput: WineUpdateInput = {
      name: 'Updated Wine',
      rating: 5
    };

    it('should update wine successfully', async () => {
      mockDatabaseService.findById.mockResolvedValueOnce(mockDbRow).mockResolvedValueOnce(mockDbRow);
      mockDatabaseService.update.mockResolvedValue();

      const result = await wineService.update('test-wine-id', validUpdateInput);

      expect(mockDatabaseService.update).toHaveBeenCalledWith('wines', 'test-wine-id', {
        name: 'Updated Wine',
        rating: 5
      });
      expect(result).toEqual(mockWine);
    });

    it('should throw DatabaseError if wine not found', async () => {
      mockDatabaseService.findById.mockResolvedValue(null);

      await expect(wineService.update('nonexistent-id', validUpdateInput))
        .rejects.toThrow(DatabaseError);
    });

    it('should throw ValidationError for invalid input', async () => {
      const invalidInput: WineUpdateInput = {
        name: '',
        rating: 0
      };

      await expect(wineService.update('test-wine-id', invalidInput))
        .rejects.toThrow(ValidationError);
    });

    it('should handle partial updates', async () => {
      const partialUpdate: WineUpdateInput = { rating: 5 };
      
      mockDatabaseService.findById.mockResolvedValueOnce(mockDbRow).mockResolvedValueOnce(mockDbRow);
      mockDatabaseService.update.mockResolvedValue();

      await wineService.update('test-wine-id', partialUpdate);

      expect(mockDatabaseService.update).toHaveBeenCalledWith('wines', 'test-wine-id', {
        rating: 5
      });
    });

    it('should handle null values in update', async () => {
      const updateWithNulls: WineUpdateInput = {
        region: undefined,
        grape: '',
        vintage: undefined
      };
      
      mockDatabaseService.findById.mockResolvedValueOnce(mockDbRow).mockResolvedValueOnce(mockDbRow);
      mockDatabaseService.update.mockResolvedValue();

      await wineService.update('test-wine-id', updateWithNulls);

      expect(mockDatabaseService.update).toHaveBeenCalledWith('wines', 'test-wine-id', {
        grape: null
      });
    });
  });

  describe('delete', () => {
    it('should delete wine successfully', async () => {
      mockDatabaseService.findById.mockResolvedValue(mockDbRow);
      mockDatabaseService.delete.mockResolvedValue();

      await wineService.delete('test-wine-id');

      expect(mockDatabaseService.delete).toHaveBeenCalledWith('wines', 'test-wine-id');
    });

    it('should throw DatabaseError if wine not found', async () => {
      mockDatabaseService.findById.mockResolvedValue(null);

      await expect(wineService.delete('nonexistent-id')).rejects.toThrow(DatabaseError);
      expect(mockDatabaseService.delete).not.toHaveBeenCalled();
    });

    it('should throw error on database failure', async () => {
      mockDatabaseService.findById.mockResolvedValue(mockDbRow);
      mockDatabaseService.delete.mockRejectedValue(new DatabaseError('Delete failed'));

      await expect(wineService.delete('test-wine-id')).rejects.toThrow(DatabaseError);
    });
  });

  describe('count', () => {
    it('should return wine count', async () => {
      mockDatabaseService.count.mockResolvedValue(5);

      const result = await wineService.count();

      expect(mockDatabaseService.count).toHaveBeenCalledWith('wines');
      expect(result).toBe(5);
    });

    it('should throw error on database failure', async () => {
      mockDatabaseService.count.mockRejectedValue(new DatabaseError('Count failed'));

      await expect(wineService.count()).rejects.toThrow(DatabaseError);
    });
  });

  describe('findByRating', () => {
    it('should find wines by rating range', async () => {
      mockDatabaseService.executeSelect.mockResolvedValue([mockDbRow]);

      const result = await wineService.findByRating(4, 5);

      expect(mockDatabaseService.executeSelect).toHaveBeenCalledWith(
        'SELECT * FROM wines WHERE rating >= ? AND rating <= ? ORDER BY rating DESC, created_at DESC',
        [4, 5]
      );
      expect(result).toEqual([mockWine]);
    });

    it('should use default max rating', async () => {
      mockDatabaseService.executeSelect.mockResolvedValue([mockDbRow]);

      await wineService.findByRating(4);

      expect(mockDatabaseService.executeSelect).toHaveBeenCalledWith(
        expect.any(String),
        [4, 5]
      );
    });
  });

  describe('findByRegion', () => {
    it('should find wines by region', async () => {
      mockDatabaseService.executeSelect.mockResolvedValue([mockDbRow]);

      const result = await wineService.findByRegion('France');

      expect(mockDatabaseService.executeSelect).toHaveBeenCalledWith(
        'SELECT * FROM wines WHERE region LIKE ? ORDER BY created_at DESC',
        ['%France%']
      );
      expect(result).toEqual([mockWine]);
    });
  });

  describe('findByGrape', () => {
    it('should find wines by grape', async () => {
      mockDatabaseService.executeSelect.mockResolvedValue([mockDbRow]);

      const result = await wineService.findByGrape('Cabernet');

      expect(mockDatabaseService.executeSelect).toHaveBeenCalledWith(
        'SELECT * FROM wines WHERE grape LIKE ? ORDER BY created_at DESC',
        ['%Cabernet%']
      );
      expect(result).toEqual([mockWine]);
    });
  });

  describe('getAverageRating', () => {
    it('should return average rating', async () => {
      mockDatabaseService.executeSelect.mockResolvedValue([{ avg_rating: 4.2 }]);

      const result = await wineService.getAverageRating();

      expect(mockDatabaseService.executeSelect).toHaveBeenCalledWith(
        'SELECT AVG(rating) as avg_rating FROM wines'
      );
      expect(result).toBe(4.2);
    });

    it('should return 0 if no results', async () => {
      mockDatabaseService.executeSelect.mockResolvedValue([]);

      const result = await wineService.getAverageRating();

      expect(result).toBe(0);
    });
  });

  describe('getTopRated', () => {
    it('should return top rated wines', async () => {
      mockDatabaseService.executeSelect.mockResolvedValue([mockDbRow]);

      const result = await wineService.getTopRated(5);

      expect(mockDatabaseService.executeSelect).toHaveBeenCalledWith(
        'SELECT * FROM wines ORDER BY rating DESC, created_at DESC LIMIT ?',
        [5]
      );
      expect(result).toEqual([mockWine]);
    });

    it('should use default limit', async () => {
      mockDatabaseService.executeSelect.mockResolvedValue([mockDbRow]);

      await wineService.getTopRated();

      expect(mockDatabaseService.executeSelect).toHaveBeenCalledWith(
        expect.any(String),
        [10]
      );
    });
  });
});