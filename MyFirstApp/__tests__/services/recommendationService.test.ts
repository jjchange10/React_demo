import { recommendationService } from '../../services/recommendationService';
import { wineService } from '../../services/wineService';
import { sakeService } from '../../services/sakeService';
import { Wine } from '../../types/wine';
import { Sake } from '../../types/sake';

// Mock the services
jest.mock('../../services/wineService');
jest.mock('../../services/sakeService');

const mockWineService = wineService as jest.Mocked<typeof wineService>;
const mockSakeService = sakeService as jest.Mocked<typeof sakeService>;

describe('RecommendationService', () => {
  const mockWines: Wine[] = [
    {
      id: '1',
      name: 'Bordeaux Red',
      region: 'France',
      grape: 'Cabernet Sauvignon',
      vintage: 2018,
      rating: 5,
      notes: 'Excellent wine',
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-01')
    },
    {
      id: '2',
      name: 'Burgundy Red',
      region: 'France',
      grape: 'Pinot Noir',
      vintage: 2019,
      rating: 4,
      notes: 'Good wine',
      createdAt: new Date('2023-01-02'),
      updatedAt: new Date('2023-01-02')
    },
    {
      id: '3',
      name: 'Napa Valley Red',
      region: 'California',
      grape: 'Cabernet Sauvignon',
      vintage: 2020,
      rating: 4,
      notes: 'Nice wine',
      createdAt: new Date('2023-01-03'),
      updatedAt: new Date('2023-01-03')
    }
  ];

  const mockSakes: Sake[] = [
    {
      id: '1',
      name: '獺祭',
      brewery: '旭酒造',
      type: '純米大吟醸酒',
      region: '山口県',
      rating: 5,
      notes: 'Premium sake',
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-01')
    },
    {
      id: '2',
      name: '久保田',
      brewery: '朝日酒造',
      type: '純米酒',
      region: '新潟県',
      rating: 4,
      notes: 'Classic sake',
      createdAt: new Date('2023-01-02'),
      updatedAt: new Date('2023-01-02')
    },
    {
      id: '3',
      name: '八海山',
      brewery: '八海醸造',
      type: '純米酒',
      region: '新潟県',
      rating: 4,
      notes: 'Smooth sake',
      createdAt: new Date('2023-01-03'),
      updatedAt: new Date('2023-01-03')
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateRecommendations', () => {
    it('should return empty array when insufficient records', async () => {
      mockWineService.findAll.mockResolvedValue([mockWines[0]]);
      mockSakeService.findAll.mockResolvedValue([mockSakes[0]]);

      const recommendations = await recommendationService.generateRecommendations();

      expect(recommendations).toEqual([]);
    });

    it('should generate recommendations when sufficient records exist', async () => {
      mockWineService.findAll.mockResolvedValue(mockWines);
      mockSakeService.findAll.mockResolvedValue(mockSakes);

      const recommendations = await recommendationService.generateRecommendations();

      expect(recommendations).toBeDefined();
      expect(Array.isArray(recommendations)).toBe(true);
      expect(recommendations.length).toBeLessThanOrEqual(5); // MAX_RECOMMENDATIONS
    });

    it('should generate wine recommendations based on user preferences', async () => {
      mockWineService.findAll.mockResolvedValue(mockWines);
      mockSakeService.findAll.mockResolvedValue([]);

      const recommendations = await recommendationService.generateRecommendations();

      const wineRecommendations = recommendations.filter(r => r.type === 'wine');
      expect(wineRecommendations.length).toBeGreaterThan(0);
      
      wineRecommendations.forEach(rec => {
        expect(rec).toHaveProperty('id');
        expect(rec).toHaveProperty('type', 'wine');
        expect(rec).toHaveProperty('name');
        expect(rec).toHaveProperty('reason');
        expect(rec).toHaveProperty('similarity');
        expect(rec).toHaveProperty('suggestedItem');
        expect(typeof rec.similarity).toBe('number');
      });
    });

    it('should generate sake recommendations based on user preferences', async () => {
      mockWineService.findAll.mockResolvedValue([]);
      mockSakeService.findAll.mockResolvedValue(mockSakes);

      const recommendations = await recommendationService.generateRecommendations();

      const sakeRecommendations = recommendations.filter(r => r.type === 'sake');
      expect(sakeRecommendations.length).toBeGreaterThan(0);
      
      sakeRecommendations.forEach(rec => {
        expect(rec).toHaveProperty('id');
        expect(rec).toHaveProperty('type', 'sake');
        expect(rec).toHaveProperty('name');
        expect(rec).toHaveProperty('reason');
        expect(rec).toHaveProperty('similarity');
        expect(rec).toHaveProperty('suggestedItem');
        expect(typeof rec.similarity).toBe('number');
      });
    });

    it('should sort recommendations by similarity score', async () => {
      mockWineService.findAll.mockResolvedValue(mockWines);
      mockSakeService.findAll.mockResolvedValue(mockSakes);

      const recommendations = await recommendationService.generateRecommendations();

      if (recommendations.length > 1) {
        for (let i = 0; i < recommendations.length - 1; i++) {
          expect(recommendations[i].similarity).toBeGreaterThanOrEqual(
            recommendations[i + 1].similarity
          );
        }
      }
    });

    it('should limit recommendations to maximum count', async () => {
      mockWineService.findAll.mockResolvedValue(mockWines);
      mockSakeService.findAll.mockResolvedValue(mockSakes);

      const recommendations = await recommendationService.generateRecommendations();

      expect(recommendations.length).toBeLessThanOrEqual(5);
    });

    it('should handle service errors gracefully', async () => {
      mockWineService.findAll.mockRejectedValue(new Error('Service error'));
      mockSakeService.findAll.mockResolvedValue(mockSakes);

      const recommendations = await recommendationService.generateRecommendations();

      expect(recommendations).toEqual([]);
    });
  });

  describe('getUserPreferences', () => {
    it('should analyze wine preferences correctly', async () => {
      mockWineService.findAll.mockResolvedValue(mockWines);
      mockSakeService.findAll.mockResolvedValue([]);

      const preferences = await recommendationService.getUserPreferences();

      expect(preferences.wine).toBeDefined();
      expect(preferences.wine.preferredRegions).toBeDefined();
      expect(preferences.wine.preferredGrapes).toBeDefined();
      expect(preferences.wine.averageRating).toBeDefined();
      expect(typeof preferences.wine.averageRating).toBe('number');
    });

    it('should analyze sake preferences correctly', async () => {
      mockWineService.findAll.mockResolvedValue([]);
      mockSakeService.findAll.mockResolvedValue(mockSakes);

      const preferences = await recommendationService.getUserPreferences();

      expect(preferences.sake).toBeDefined();
      expect(preferences.sake.preferredBreweries).toBeDefined();
      expect(preferences.sake.preferredTypes).toBeDefined();
      expect(preferences.sake.preferredRegions).toBeDefined();
      expect(preferences.sake.averageRating).toBeDefined();
      expect(typeof preferences.sake.averageRating).toBe('number');
    });

    it('should calculate average ratings correctly', async () => {
      mockWineService.findAll.mockResolvedValue(mockWines);
      mockSakeService.findAll.mockResolvedValue(mockSakes);

      const preferences = await recommendationService.getUserPreferences();

      const expectedWineAverage = mockWines.reduce((sum, w) => sum + w.rating, 0) / mockWines.length;
      const expectedSakeAverage = mockSakes.reduce((sum, s) => sum + s.rating, 0) / mockSakes.length;

      expect(preferences.wine.averageRating).toBeCloseTo(expectedWineAverage);
      expect(preferences.sake.averageRating).toBeCloseTo(expectedSakeAverage);
    });

    it('should identify preferred regions for wines', async () => {
      const highRatedWines = mockWines.filter(w => w.rating >= 4);
      mockWineService.findAll.mockResolvedValue(mockWines);
      mockSakeService.findAll.mockResolvedValue([]);

      const preferences = await recommendationService.getUserPreferences();

      // Check that France appears in preferred regions (has high-rated wines)
      expect(preferences.wine.preferredRegions['France']).toBeDefined();
      expect(preferences.wine.preferredRegions['France']).toBeGreaterThan(0);
    });

    it('should identify preferred types for sake', async () => {
      mockWineService.findAll.mockResolvedValue([]);
      mockSakeService.findAll.mockResolvedValue(mockSakes);

      const preferences = await recommendationService.getUserPreferences();

      // Check that 純米酒 appears in preferred types (has high-rated sakes)
      expect(preferences.sake.preferredTypes['純米酒']).toBeDefined();
      expect(preferences.sake.preferredTypes['純米酒']).toBeGreaterThan(0);
    });
  });

  describe('getRecommendationConfig', () => {
    it('should return recommendation configuration', () => {
      const config = recommendationService.getRecommendationConfig();

      expect(config).toBeDefined();
      expect(config.MIN_RECORDS_FOR_RECOMMENDATIONS).toBe(3);
      expect(config.MAX_RECOMMENDATIONS).toBe(5);
      expect(config.HIGH_RATING_THRESHOLD).toBe(4);
      expect(config.SIMILARITY_THRESHOLD).toBe(0.3);
    });
  });

  describe('similarity calculations', () => {
    it('should calculate wine similarity based on region, grape, and vintage', async () => {
      const wine1 = mockWines[0]; // Bordeaux, Cabernet Sauvignon, 2018
      const wine2 = mockWines[2]; // Napa Valley, Cabernet Sauvignon, 2020

      mockWineService.findAll.mockResolvedValue(mockWines); // Use all wines to meet minimum requirement
      mockSakeService.findAll.mockResolvedValue([]);

      const recommendations = await recommendationService.generateRecommendations();

      // Should find some similarity due to same grape variety
      expect(recommendations.length).toBeGreaterThan(0);
    });

    it('should calculate sake similarity based on brewery, type, and region', async () => {
      const sake1 = mockSakes[1]; // 朝日酒造, 純米酒, 新潟県
      const sake2 = mockSakes[2]; // 八海醸造, 純米酒, 新潟県

      mockWineService.findAll.mockResolvedValue([]);
      mockSakeService.findAll.mockResolvedValue(mockSakes); // Use all sakes to meet minimum requirement

      const recommendations = await recommendationService.generateRecommendations();

      // Should find similarity due to same type and region
      expect(recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('recommendation reasons', () => {
    it('should generate meaningful recommendation reasons', async () => {
      mockWineService.findAll.mockResolvedValue(mockWines);
      mockSakeService.findAll.mockResolvedValue(mockSakes);

      const recommendations = await recommendationService.generateRecommendations();

      recommendations.forEach(rec => {
        expect(rec.reason).toBeDefined();
        expect(typeof rec.reason).toBe('string');
        expect(rec.reason.length).toBeGreaterThan(0);
        expect(rec.reason).toContain('推薦');
      });
    });

    it('should include preference-based reasons', async () => {
      mockWineService.findAll.mockResolvedValue(mockWines);
      mockSakeService.findAll.mockResolvedValue([]);

      const recommendations = await recommendationService.generateRecommendations();

      const preferenceRecommendations = recommendations.filter(r => 
        r.reason.includes('好み') || r.reason.includes('基づく')
      );
      
      expect(preferenceRecommendations.length).toBeGreaterThan(0);
    });
  });

  describe('edge cases', () => {
    it('should handle empty wine and sake arrays', async () => {
      mockWineService.findAll.mockResolvedValue([]);
      mockSakeService.findAll.mockResolvedValue([]);

      const recommendations = await recommendationService.generateRecommendations();

      expect(recommendations).toEqual([]);
    });

    it('should handle wines with missing optional fields', async () => {
      const winesWithMissingFields: Wine[] = [
        {
          id: '1',
          name: 'Wine 1',
          rating: 5,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: '2',
          name: 'Wine 2',
          rating: 4,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: '3',
          name: 'Wine 3',
          rating: 4,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      mockWineService.findAll.mockResolvedValue(winesWithMissingFields);
      mockSakeService.findAll.mockResolvedValue([]);

      const recommendations = await recommendationService.generateRecommendations();

      expect(recommendations).toBeDefined();
      expect(Array.isArray(recommendations)).toBe(true);
    });

    it('should handle sakes with missing optional fields', async () => {
      const sakesWithMissingFields: Sake[] = [
        {
          id: '1',
          name: 'Sake 1',
          rating: 5,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: '2',
          name: 'Sake 2',
          rating: 4,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: '3',
          name: 'Sake 3',
          rating: 4,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      mockWineService.findAll.mockResolvedValue([]);
      mockSakeService.findAll.mockResolvedValue(sakesWithMissingFields);

      const recommendations = await recommendationService.generateRecommendations();

      expect(recommendations).toBeDefined();
      expect(Array.isArray(recommendations)).toBe(true);
    });
  });
});