import { databaseService } from '../../services/databaseProvider';
import { wineService } from '../../services/wineService';
import { sakeService } from '../../services/sakeService';

// Mock the database service for E2E tests
jest.mock('../../services/databaseProvider');

// Mock navigation
const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  replace: jest.fn(),
  push: jest.fn(),
  pop: jest.fn(),
  popToTop: jest.fn(),
  dispatch: jest.fn(),
  reset: jest.fn(),
  isFocused: jest.fn(() => true),
  canGoBack: jest.fn(() => true),
  getId: jest.fn(),
  getParent: jest.fn(),
  getState: jest.fn(),
  addListener: jest.fn(),
  removeListener: jest.fn(),
  setOptions: jest.fn(),
  setParams: jest.fn(),
};

// Mock route
const mockRoute = {
  key: 'test-key',
  name: 'test-route',
  params: {},
  path: undefined,
};

// Mock image picker
jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn(() => Promise.resolve({
    canceled: false,
    assets: [{
      uri: 'test://photo.jpg',
      width: 100,
      height: 100,
      type: 'image'
    }]
  })),
  MediaTypeOptions: {
    Images: 'Images'
  },
  requestMediaLibraryPermissionsAsync: jest.fn(() => Promise.resolve({
    status: 'granted'
  }))
}));

// Mock toast service
jest.mock('../../services/toastService', () => ({
  toastService: {
    showSuccess: jest.fn(),
    showError: jest.fn(),
    showInfo: jest.fn(),
    showWarning: jest.fn()
  }
}));

const mockDatabaseService = databaseService as jest.Mocked<typeof databaseService>;

describe('Service Integration E2E Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup database service mocks
    mockDatabaseService.initialize.mockResolvedValue();
    mockDatabaseService.close.mockResolvedValue();
    mockDatabaseService.generateId.mockReturnValue('test-id');
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
  });

  describe('Wine Service Integration', () => {
    it('should complete wine creation and retrieval flow', async () => {
      // Mock database responses
      const mockDbRow = {
        id: 'test-id',
        name: 'E2E Test Wine',
        region: 'E2E Test Region',
        grape: 'E2E Test Grape',
        vintage: 2021,
        rating: 4,
        notes: 'E2E test notes',
        photo_uri: 'test://photo.jpg',
        created_at: '2023-01-01T00:00:00.000Z',
        updated_at: '2023-01-01T00:00:00.000Z'
      };

      mockDatabaseService.create.mockResolvedValue('test-id');
      mockDatabaseService.findById.mockResolvedValue(mockDbRow);
      mockDatabaseService.findAll.mockResolvedValue([mockDbRow]);

      // Create wine through service
      const wineData = {
        name: 'E2E Test Wine',
        region: 'E2E Test Region',
        grape: 'E2E Test Grape',
        vintage: 2021,
        rating: 4,
        notes: 'E2E test notes',
        photoUri: 'test://photo.jpg'
      };

      const createdWine = await wineService.create(wineData);
      
      expect(createdWine).toBeDefined();
      expect(createdWine.name).toBe(wineData.name);
      expect(createdWine.region).toBe(wineData.region);
      expect(createdWine.grape).toBe(wineData.grape);
      expect(createdWine.vintage).toBe(wineData.vintage);
      expect(createdWine.rating).toBe(wineData.rating);
      expect(createdWine.notes).toBe(wineData.notes);
      expect(createdWine.photoUri).toBe(wineData.photoUri);

      // Verify database operations were called
      expect(mockDatabaseService.create).toHaveBeenCalledWith('wines', {
        name: 'E2E Test Wine',
        region: 'E2E Test Region',
        grape: 'E2E Test Grape',
        vintage: 2021,
        rating: 4,
        notes: 'E2E test notes',
        photo_uri: 'test://photo.jpg'
      });
    });

    it('should handle wine update flow', async () => {
      // Mock original wine creation
      const originalWineDbRow = {
        id: 'test-id',
        name: 'Original Wine',
        region: 'Original Region',
        rating: 3,
        grape: null,
        vintage: null,
        notes: null,
        photo_uri: null,
        created_at: '2023-01-01T00:00:00.000Z',
        updated_at: '2023-01-01T00:00:00.000Z'
      };

      const updatedWineDbRow = {
        ...originalWineDbRow,
        name: 'Updated Wine',
        rating: 5,
        updated_at: '2023-01-01T01:00:00.000Z'
      };

      // Setup mocks for creation and update
      mockDatabaseService.create.mockResolvedValue('test-id');
      mockDatabaseService.findById.mockResolvedValueOnce(originalWineDbRow)
        .mockResolvedValueOnce(updatedWineDbRow);
      mockDatabaseService.update.mockResolvedValue();

      // First create a wine
      const existingWine = await wineService.create({
        name: 'Original Wine',
        region: 'Original Region',
        rating: 3
      });

      // Update wine
      const updatedWine = await wineService.update(existingWine.id, {
        name: 'Updated Wine',
        rating: 5
      });

      expect(updatedWine.name).toBe('Updated Wine');
      expect(updatedWine.rating).toBe(5);
      expect(updatedWine.region).toBe('Original Region'); // Unchanged
    });
  });

  describe('Sake Service Integration', () => {
    it('should complete sake creation and retrieval flow', async () => {
      // Mock database responses for sake
      const mockSakeDbRow = {
        id: 'test-id',
        name: 'E2E Test Sake',
        brewery: 'E2E Test Brewery',
        type: '純米酒',
        region: 'E2E Test Region',
        rating: 5,
        notes: 'E2E test notes',
        photo_uri: 'test://photo.jpg',
        created_at: '2023-01-01T00:00:00.000Z',
        updated_at: '2023-01-01T00:00:00.000Z'
      };

      mockDatabaseService.create.mockResolvedValue('test-id');
      mockDatabaseService.findById.mockResolvedValue(mockSakeDbRow);
      mockDatabaseService.findAll.mockResolvedValue([mockSakeDbRow]);

      // Create sake through service
      const sakeData = {
        name: 'E2E Test Sake',
        brewery: 'E2E Test Brewery',
        type: '純米酒' as const,
        region: 'E2E Test Region',
        rating: 5,
        notes: 'E2E test notes',
        photoUri: 'test://photo.jpg'
      };

      const createdSake = await sakeService.create(sakeData);
      
      expect(createdSake).toBeDefined();
      expect(createdSake.name).toBe(sakeData.name);
      expect(createdSake.brewery).toBe(sakeData.brewery);
      expect(createdSake.type).toBe(sakeData.type);
      expect(createdSake.region).toBe(sakeData.region);
      expect(createdSake.rating).toBe(sakeData.rating);
      expect(createdSake.notes).toBe(sakeData.notes);
      expect(createdSake.photoUri).toBe(sakeData.photoUri);

      // Verify sake was saved to database
      const sakes = await sakeService.findAll();
      expect(sakes).toHaveLength(1);
      expect(sakes[0]).toEqual(createdSake);
    });

    it('should handle sake update flow', async () => {
      // First create a sake
      const existingSake = await sakeService.create({
        name: 'Original Sake',
        brewery: 'Original Brewery',
        type: '純米酒' as const,
        rating: 3
      });

      // Update sake
      const updatedSake = await sakeService.update(existingSake.id, {
        name: 'Updated Sake',
        rating: 5
      });

      expect(updatedSake.name).toBe('Updated Sake');
      expect(updatedSake.rating).toBe(5);
      expect(updatedSake.brewery).toBe('Original Brewery'); // Unchanged
      expect(updatedSake.type).toBe('純米酒'); // Unchanged
    });
  });

  describe('Photo Handling Integration', () => {
    it('should handle photo URI storage and retrieval', async () => {
      const photoUri = 'test://photo.jpg';
      
      // Create wine with photo
      const wineWithPhoto = await wineService.create({
        name: 'Photo Test Wine',
        rating: 4,
        photoUri: photoUri
      });

      expect(wineWithPhoto.photoUri).toBe(photoUri);

      // Verify photo URI is persisted
      const retrievedWine = await wineService.findById(wineWithPhoto.id);
      expect(retrievedWine?.photoUri).toBe(photoUri);
    });
  });
});