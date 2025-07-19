import { wineService } from '../../services/wineService';
import { databaseService } from '../../services/databaseProvider';
import { WineCreateInput, WineUpdateInput } from '../../types/wine';
import { ValidationError, DatabaseError } from '../../types/common';

// Mock the database service for integration tests
jest.mock('../../services/databaseProvider');

const mockDatabaseService = databaseService as jest.Mocked<typeof databaseService>;

// Integration tests for wine flow
describe('Wine Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup database service mocks
    mockDatabaseService.initialize.mockResolvedValue();
    mockDatabaseService.close.mockResolvedValue();
    mockDatabaseService.generateId.mockReturnValue('test-wine-id');
    mockDatabaseService.mapRowToWine.mockImplementation((row) => ({
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
    }));
    
    // Reset database state
    mockDatabaseService.create.mockReset();
    mockDatabaseService.findById.mockReset();
    mockDatabaseService.findAll.mockReset();
    mockDatabaseService.update.mockReset();
    mockDatabaseService.delete.mockReset();
    mockDatabaseService.count.mockReset();
  });

  describe('Complete Wine CRUD Flow', () => {
    it('should create, read, update, and delete wine successfully', async () => {
      // Mock database responses for create operation
      const mockDbRow = {
        id: 'test-wine-id',
        name: 'Integration Test Wine',
        region: 'Test Region',
        grape: 'Test Grape',
        vintage: 2020,
        rating: 4,
        notes: 'Integration test notes',
        photo_uri: 'test://photo.jpg',
        created_at: '2023-01-01T00:00:00.000Z',
        updated_at: '2023-01-01T00:00:00.000Z'
      };

      mockDatabaseService.create.mockResolvedValue('test-wine-id');
      mockDatabaseService.findById.mockResolvedValue(mockDbRow);
      mockDatabaseService.findAll.mockResolvedValue([mockDbRow]);
      mockDatabaseService.update.mockResolvedValue();
      mockDatabaseService.delete.mockResolvedValue();

      // Create wine
      const createData: WineCreateInput = {
        name: 'Integration Test Wine',
        region: 'Test Region',
        grape: 'Test Grape',
        vintage: 2020,
        rating: 4,
        notes: 'Integration test notes',
        photoUri: 'test://photo.jpg'
      };

      const createdWine = await wineService.create(createData);
      
      expect(createdWine).toBeDefined();
      expect(createdWine.id).toBe('test-wine-id');
      expect(createdWine.name).toBe(createData.name);
      expect(createdWine.region).toBe(createData.region);
      expect(createdWine.grape).toBe(createData.grape);
      expect(createdWine.vintage).toBe(createData.vintage);
      expect(createdWine.rating).toBe(createData.rating);
      expect(createdWine.notes).toBe(createData.notes);
      expect(createdWine.photoUri).toBe(createData.photoUri);

      // Verify database operations were called
      expect(mockDatabaseService.create).toHaveBeenCalledWith('wines', {
        name: 'Integration Test Wine',
        region: 'Test Region',
        grape: 'Test Grape',
        vintage: 2020,
        rating: 4,
        notes: 'Integration test notes',
        photo_uri: 'test://photo.jpg'
      });
      expect(mockDatabaseService.findById).toHaveBeenCalledWith('wines', 'test-wine-id');

      // Read wine by ID
      const foundWine = await wineService.findById(createdWine.id);
      expect(foundWine).toEqual(createdWine);

      // Read all wines
      const allWines = await wineService.findAll();
      expect(allWines).toHaveLength(1);
      expect(allWines[0]).toEqual(createdWine);

      // Update wine - mock updated response
      const updatedMockRow = {
        ...mockDbRow,
        name: 'Updated Integration Test Wine',
        rating: 5,
        notes: 'Updated integration test notes',
        updated_at: '2023-01-02T00:00:00.000Z'
      };
      mockDatabaseService.findById.mockResolvedValue(updatedMockRow);

      const updateData: WineUpdateInput = {
        name: 'Updated Integration Test Wine',
        rating: 5,
        notes: 'Updated integration test notes'
      };

      const updatedWine = await wineService.update(createdWine.id, updateData);
      
      expect(updatedWine.id).toBe(createdWine.id);
      expect(updatedWine.name).toBe(updateData.name);
      expect(updatedWine.rating).toBe(updateData.rating);
      expect(updatedWine.notes).toBe(updateData.notes);
      expect(updatedWine.region).toBe(createdWine.region); // Unchanged

      // Verify update was called
      expect(mockDatabaseService.update).toHaveBeenCalledWith('wines', 'test-wine-id', {
        name: 'Updated Integration Test Wine',
        rating: 5,
        notes: 'Updated integration test notes'
      });

      // Delete wine - mock deletion
      mockDatabaseService.findById.mockResolvedValueOnce(mockDbRow).mockResolvedValueOnce(null);
      mockDatabaseService.findAll.mockResolvedValue([]);

      await wineService.delete(createdWine.id);

      // Verify deletion was called
      expect(mockDatabaseService.delete).toHaveBeenCalledWith('wines', 'test-wine-id');
    });

    it('should handle multiple wines correctly', async () => {
      // Mock multiple wine responses
      const mockWines = [
        {
          id: 'wine-1',
          name: 'Wine 1',
          region: 'Region 1',
          rating: 4,
          createdAt: new Date('2023-01-01'),
          updatedAt: new Date('2023-01-01')
        },
        {
          id: 'wine-2',
          name: 'Wine 2',
          region: 'Region 2',
          rating: 5,
          createdAt: new Date('2023-01-02'),
          updatedAt: new Date('2023-01-02')
        },
        {
          id: 'wine-3',
          name: 'Wine 3',
          region: 'Region 1',
          rating: 3,
          createdAt: new Date('2023-01-03'),
          updatedAt: new Date('2023-01-03')
        }
      ];

      // Setup mocks for creation
      mockDatabaseService.generateId.mockReturnValueOnce('wine-1')
        .mockReturnValueOnce('wine-2')
        .mockReturnValueOnce('wine-3');
      
      mockDatabaseService.create.mockResolvedValueOnce('wine-1')
        .mockResolvedValueOnce('wine-2')
        .mockResolvedValueOnce('wine-3');
      
      mockDatabaseService.findById.mockImplementation((table, id) => {
        const mockDbRow = mockWines.find(w => w.id === id);
        return Promise.resolve(mockDbRow ? {
          ...mockDbRow,
          photo_uri: null,
          created_at: mockDbRow.createdAt.toISOString(),
          updated_at: mockDbRow.updatedAt.toISOString(),
          grape: null,
          vintage: null,
          notes: null
        } : null);
      });

      // Create wines
      const wineData1: WineCreateInput = {
        name: 'Wine 1',
        region: 'Region 1',
        rating: 4
      };

      const wineData2: WineCreateInput = {
        name: 'Wine 2',
        region: 'Region 2',
        rating: 5
      };

      const wineData3: WineCreateInput = {
        name: 'Wine 3',
        region: 'Region 1',
        rating: 3
      };

      const wine1 = await wineService.create(wineData1);
      const wine2 = await wineService.create(wineData2);
      const wine3 = await wineService.create(wineData3);

      // Setup additional mocks for bulk operations
      mockDatabaseService.findAll.mockResolvedValue(mockWines.map(w => ({
        ...w,
        photo_uri: null,
        created_at: w.createdAt.toISOString(),
        updated_at: w.updatedAt.toISOString(),
        grape: null,
        vintage: null,
        notes: null
      })));
      
      mockDatabaseService.count.mockResolvedValue(3);

      // Test findAll
      const allWines = await wineService.findAll();
      expect(allWines).toHaveLength(3);

      // Test count
      const count = await wineService.count();
      expect(count).toBe(3);
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle validation errors properly', async () => {
      const invalidData: WineCreateInput = {
        name: '', // Invalid: empty name
        rating: 0 // Invalid: rating out of range
      };

      await expect(wineService.create(invalidData)).rejects.toThrow(ValidationError);
    });

    it('should handle database errors properly', async () => {
      // Mock findById to return null for non-existent wine
      mockDatabaseService.findById.mockResolvedValue(null);

      // Try to find non-existent wine
      const nonExistentWine = await wineService.findById('non-existent-id');
      expect(nonExistentWine).toBeNull();

      // Try to update non-existent wine
      await expect(wineService.update('non-existent-id', { name: 'Test' }))
        .rejects.toThrow(DatabaseError);

      // Try to delete non-existent wine
      await expect(wineService.delete('non-existent-id'))
        .rejects.toThrow(DatabaseError);
    });
  });

  describe('Data Persistence Integration', () => {
    it('should persist data correctly across operations', async () => {
      // Create wine
      const createData: WineCreateInput = {
        name: 'Persistence Test Wine',
        region: 'Test Region',
        rating: 4
      };

      const mockCreatedWine = {
        id: 'persistence-wine-id',
        name: 'Persistence Test Wine',
        region: 'Test Region',
        rating: 4,
        notes: null,
        photo_uri: null,
        grape: null,
        vintage: null,
        created_at: '2023-01-01T00:00:00.000Z',
        updated_at: '2023-01-01T00:00:00.000Z'
      };

      const mockUpdatedWine = {
        ...mockCreatedWine,
        rating: 5,
        notes: 'Added notes',
        updated_at: '2023-01-01T01:00:00.000Z'
      };

      mockDatabaseService.generateId.mockReturnValue('persistence-wine-id');
      mockDatabaseService.create.mockResolvedValue('persistence-wine-id');
      mockDatabaseService.findById.mockResolvedValueOnce(mockCreatedWine)
        .mockResolvedValueOnce(mockCreatedWine)
        .mockResolvedValueOnce(mockUpdatedWine)
        .mockResolvedValueOnce(mockUpdatedWine);
      mockDatabaseService.update.mockResolvedValue();

      const createdWine = await wineService.create(createData);
      const originalCreatedAt = createdWine.createdAt;

      // Update wine multiple times
      await wineService.update(createdWine.id, { rating: 5 });
      await wineService.update(createdWine.id, { notes: 'Added notes' });
      
      // Verify final state
      const finalWine = await wineService.findById(createdWine.id);
      
      expect(finalWine).toBeDefined();
      expect(finalWine!.name).toBe(createData.name);
      expect(finalWine!.region).toBe(createData.region);
      expect(finalWine!.rating).toBe(5);
      expect(finalWine!.notes).toBe('Added notes');
      expect(finalWine!.createdAt).toEqual(originalCreatedAt);
      expect(finalWine!.updatedAt.getTime()).toBeGreaterThan(originalCreatedAt.getTime());
    });
  });
});