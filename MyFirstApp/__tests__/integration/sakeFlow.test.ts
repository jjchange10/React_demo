import { sakeService } from '../../services/sakeService';
import { databaseService } from '../../services/databaseProvider';
import { SakeCreateInput, SakeUpdateInput } from '../../types/sake';
import { ValidationError, DatabaseError } from '../../types/common';

// Mock the database service for integration tests
jest.mock('../../services/databaseProvider');

const mockDatabaseService = databaseService as jest.Mocked<typeof databaseService>;

// Integration tests for sake flow
describe('Sake Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup database service mocks
    mockDatabaseService.initialize.mockResolvedValue();
    mockDatabaseService.close.mockResolvedValue();
    mockDatabaseService.generateId.mockReturnValue('test-sake-id');
    mockDatabaseService.mapRowToSake.mockImplementation((row) => ({
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
    }));
    
    // Reset database state
    mockDatabaseService.create.mockReset();
    mockDatabaseService.findById.mockReset();
    mockDatabaseService.findAll.mockReset();
    mockDatabaseService.update.mockReset();
    mockDatabaseService.delete.mockReset();
    mockDatabaseService.count.mockReset();
  });

  describe('Complete Sake CRUD Flow', () => {
    it('should create, read, update, and delete sake successfully', async () => {
      // Mock database responses
      const mockDbRow = {
        id: 'test-sake-id',
        name: 'Integration Test Sake',
        brewery: 'Test Brewery',
        type: '純米酒',
        region: 'Test Region',
        rating: 5,
        notes: 'Integration test notes',
        photo_uri: 'test://photo.jpg',
        created_at: '2023-01-01T00:00:00.000Z',
        updated_at: '2023-01-01T00:00:00.000Z'
      };

      mockDatabaseService.create.mockResolvedValue('test-sake-id');
      mockDatabaseService.findById.mockResolvedValue(mockDbRow);
      mockDatabaseService.findAll.mockResolvedValue([mockDbRow]);
      mockDatabaseService.update.mockResolvedValue();
      mockDatabaseService.delete.mockResolvedValue();

      // Create sake
      const createData: SakeCreateInput = {
        name: 'Integration Test Sake',
        brewery: 'Test Brewery',
        type: '純米酒',
        region: 'Test Region',
        rating: 5,
        notes: 'Integration test notes',
        photoUri: 'test://photo.jpg'
      };

      const createdSake = await sakeService.create(createData);
      
      expect(createdSake).toBeDefined();
      expect(createdSake.id).toBeDefined();
      expect(createdSake.name).toBe(createData.name);
      expect(createdSake.brewery).toBe(createData.brewery);
      expect(createdSake.type).toBe(createData.type);
      expect(createdSake.region).toBe(createData.region);
      expect(createdSake.rating).toBe(createData.rating);
      expect(createdSake.notes).toBe(createData.notes);
      expect(createdSake.photoUri).toBe(createData.photoUri);
      expect(createdSake.createdAt).toBeInstanceOf(Date);
      expect(createdSake.updatedAt).toBeInstanceOf(Date);

      // Read sake by ID
      const foundSake = await sakeService.findById(createdSake.id);
      expect(foundSake).toEqual(createdSake);

      // Read all sakes
      const allSakes = await sakeService.findAll();
      expect(allSakes).toHaveLength(1);
      expect(allSakes[0]).toEqual(createdSake);

      // Update sake
      const updateData: SakeUpdateInput = {
        name: 'Updated Integration Test Sake',
        rating: 4,
        notes: 'Updated integration test notes'
      };

      const updatedSake = await sakeService.update(createdSake.id, updateData);
      
      expect(updatedSake.id).toBe(createdSake.id);
      expect(updatedSake.name).toBe(updateData.name);
      expect(updatedSake.rating).toBe(updateData.rating);
      expect(updatedSake.notes).toBe(updateData.notes);
      expect(updatedSake.brewery).toBe(createdSake.brewery); // Unchanged
      expect(updatedSake.type).toBe(createdSake.type); // Unchanged
      expect(updatedSake.region).toBe(createdSake.region); // Unchanged
      expect(updatedSake.updatedAt.getTime()).toBeGreaterThan(createdSake.updatedAt.getTime());

      // Delete sake
      await sakeService.delete(createdSake.id);

      // Verify deletion
      const deletedSake = await sakeService.findById(createdSake.id);
      expect(deletedSake).toBeNull();

      const allSakesAfterDelete = await sakeService.findAll();
      expect(allSakesAfterDelete).toHaveLength(0);
    });

    it('should handle multiple sakes correctly', async () => {
      // Create multiple sakes
      const sakeData1: SakeCreateInput = {
        name: '獺祭',
        brewery: '旭酒造',
        type: '純米大吟醸酒',
        region: '山口県',
        rating: 5
      };

      const sakeData2: SakeCreateInput = {
        name: '久保田',
        brewery: '朝日酒造',
        type: '純米酒',
        region: '新潟県',
        rating: 4
      };

      const sakeData3: SakeCreateInput = {
        name: '八海山',
        brewery: '八海醸造',
        type: '純米酒',
        region: '新潟県',
        rating: 4
      };

      const sake1 = await sakeService.create(sakeData1);
      const sake2 = await sakeService.create(sakeData2);
      const sake3 = await sakeService.create(sakeData3);

      // Test findAll
      const allSakes = await sakeService.findAll();
      expect(allSakes).toHaveLength(3);

      // Test count
      const count = await sakeService.count();
      expect(count).toBe(3);

      // Test findByRating
      const highRatedSakes = await sakeService.findByRating(4, 5);
      expect(highRatedSakes).toHaveLength(3);

      // Test findByType
      const junmaiSakes = await sakeService.findByType('純米酒');
      expect(junmaiSakes).toHaveLength(2);
      expect(junmaiSakes.map(s => s.name)).toContain('久保田');
      expect(junmaiSakes.map(s => s.name)).toContain('八海山');

      // Test findByRegion
      const niigataSakes = await sakeService.findByRegion('新潟県');
      expect(niigataSakes).toHaveLength(2);
      expect(niigataSakes.map(s => s.name)).toContain('久保田');
      expect(niigataSakes.map(s => s.name)).toContain('八海山');

      // Test findByBrewery
      const asahiSakes = await sakeService.findByBrewery('朝日酒造');
      expect(asahiSakes).toHaveLength(1);
      expect(asahiSakes[0].name).toBe('久保田');

      // Test getAverageRating
      const avgRating = await sakeService.getAverageRating();
      expect(avgRating).toBeCloseTo(4.33); // (5 + 4 + 4) / 3 ≈ 4.33

      // Test getTopRated
      const topRated = await sakeService.getTopRated(2);
      expect(topRated).toHaveLength(2);
      expect(topRated[0].rating).toBe(5); // 獺祭

      // Test getTypeDistribution
      const typeDistribution = await sakeService.getTypeDistribution();
      expect(typeDistribution).toHaveLength(2);
      
      const junmaiCount = typeDistribution.find(t => t.type === '純米酒')?.count;
      const daiginjoCount = typeDistribution.find(t => t.type === '純米大吟醸酒')?.count;
      
      expect(junmaiCount).toBe(2);
      expect(daiginjoCount).toBe(1);
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle validation errors properly', async () => {
      const invalidData: SakeCreateInput = {
        name: '', // Invalid: empty name
        rating: 6 // Invalid: rating out of range
      };

      await expect(sakeService.create(invalidData)).rejects.toThrow(ValidationError);
    });

    it('should handle invalid sake type', async () => {
      const invalidTypeData: SakeCreateInput = {
        name: 'Test Sake',
        type: '無効な種類', // Invalid sake type
        rating: 4
      };

      await expect(sakeService.create(invalidTypeData)).rejects.toThrow(ValidationError);
    });

    it('should handle database errors properly', async () => {
      // Try to find non-existent sake
      const nonExistentSake = await sakeService.findById('non-existent-id');
      expect(nonExistentSake).toBeNull();

      // Try to update non-existent sake
      await expect(sakeService.update('non-existent-id', { name: 'Test' }))
        .rejects.toThrow(DatabaseError);

      // Try to delete non-existent sake
      await expect(sakeService.delete('non-existent-id'))
        .rejects.toThrow(DatabaseError);
    });
  });

  describe('Data Persistence Integration', () => {
    it('should persist data correctly across operations', async () => {
      // Create sake
      const createData: SakeCreateInput = {
        name: 'Persistence Test Sake',
        brewery: 'Test Brewery',
        type: '純米酒',
        rating: 4
      };

      const createdSake = await sakeService.create(createData);
      const originalCreatedAt = createdSake.createdAt;

      // Update sake multiple times
      await sakeService.update(createdSake.id, { rating: 5 });
      await sakeService.update(createdSake.id, { notes: 'Added notes' });
      
      // Verify final state
      const finalSake = await sakeService.findById(createdSake.id);
      
      expect(finalSake).toBeDefined();
      expect(finalSake!.name).toBe(createData.name);
      expect(finalSake!.brewery).toBe(createData.brewery);
      expect(finalSake!.type).toBe(createData.type);
      expect(finalSake!.rating).toBe(5);
      expect(finalSake!.notes).toBe('Added notes');
      expect(finalSake!.createdAt).toEqual(originalCreatedAt);
      expect(finalSake!.updatedAt.getTime()).toBeGreaterThan(originalCreatedAt.getTime());
    });
  });
});