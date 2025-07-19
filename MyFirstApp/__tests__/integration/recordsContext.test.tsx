import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { RecordsProvider, useRecords } from '../../context/RecordsContext';
import { wineService } from '../../services/wineService';
import { sakeService } from '../../services/sakeService';
import { recommendationService } from '../../services/recommendationService';
import { toastService } from '../../services/toastService';
import { WineCreateInput, WineUpdateInput } from '../../types/wine';
import { SakeCreateInput, SakeUpdateInput } from '../../types/sake';

// Mock all services
jest.mock('../../services/wineService');
jest.mock('../../services/sakeService');
jest.mock('../../services/recommendationService');
jest.mock('../../services/toastService');
jest.mock('../../services/retryService', () => ({
  retryService: {
    executeDbOperation: jest.fn((operation) => operation())
  }
}));

const mockWineService = wineService as jest.Mocked<typeof wineService>;
const mockSakeService = sakeService as jest.Mocked<typeof sakeService>;
const mockRecommendationService = recommendationService as jest.Mocked<typeof recommendationService>;
const mockToastService = toastService as jest.Mocked<typeof toastService>;

// Test wrapper component
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <RecordsProvider>{children}</RecordsProvider>
);

describe('RecordsContext Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementations
    mockWineService.findAll.mockResolvedValue([]);
    mockSakeService.findAll.mockResolvedValue([]);
    mockRecommendationService.generateRecommendations.mockResolvedValue([]);
    mockToastService.showSuccess.mockResolvedValue();
    mockToastService.showError.mockResolvedValue();
  });

  describe('Complete Wine Flow Integration', () => {
    it('should handle full wine lifecycle: create, update, delete', async () => {
      const mockWine = {
        id: 'wine-1',
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

      const updatedMockWine = {
        ...mockWine,
        name: 'Updated Wine',
        rating: 5,
        updatedAt: new Date('2023-01-02')
      };

      // Mock service responses
      mockWineService.create.mockResolvedValue(mockWine);
      mockWineService.update.mockResolvedValue(updatedMockWine);
      mockWineService.delete.mockResolvedValue();

      const { result } = renderHook(() => useRecords(), { wrapper });

      // Wait for initial data load
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Test wine creation
      const createData: WineCreateInput = {
        name: 'Test Wine',
        region: 'Test Region',
        grape: 'Test Grape',
        vintage: 2020,
        rating: 4,
        notes: 'Test notes',
        photoUri: 'test://photo.jpg'
      };

      await act(async () => {
        await result.current.addWine(createData);
      });

      expect(mockWineService.create).toHaveBeenCalledWith(createData);
      expect(mockToastService.showSuccess).toHaveBeenCalledWith('ワインを追加しました');
      expect(result.current.wines).toHaveLength(1);
      expect(result.current.wines[0]).toEqual(mockWine);

      // Test wine update
      const updateData: WineUpdateInput = {
        name: 'Updated Wine',
        rating: 5
      };

      await act(async () => {
        await result.current.updateWine(mockWine.id, updateData);
      });

      expect(mockWineService.update).toHaveBeenCalledWith(mockWine.id, updateData);
      expect(mockToastService.showSuccess).toHaveBeenCalledWith('ワインを更新しました');
      expect(result.current.wines[0].name).toBe('Updated Wine');
      expect(result.current.wines[0].rating).toBe(5);

      // Test wine deletion
      await act(async () => {
        await result.current.deleteWine(mockWine.id);
      });

      expect(mockWineService.delete).toHaveBeenCalledWith(mockWine.id);
      expect(mockToastService.showSuccess).toHaveBeenCalledWith('ワインを削除しました');
      expect(result.current.wines).toHaveLength(0);
    });

    it('should handle wine creation with photo correctly', async () => {
      const mockWineWithPhoto = {
        id: 'wine-photo-1',
        name: 'Wine with Photo',
        rating: 5,
        photoUri: 'file://photo.jpg',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockWineService.create.mockResolvedValue(mockWineWithPhoto);

      const { result } = renderHook(() => useRecords(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const createData: WineCreateInput = {
        name: 'Wine with Photo',
        rating: 5,
        photoUri: 'file://photo.jpg'
      };

      await act(async () => {
        await result.current.addWine(createData);
      });

      expect(result.current.wines[0].photoUri).toBe('file://photo.jpg');
      expect(mockWineService.create).toHaveBeenCalledWith(createData);
    });
  });

  describe('Complete Sake Flow Integration', () => {
    it('should handle full sake lifecycle: create, update, delete', async () => {
      const mockSake = {
        id: 'sake-1',
        name: 'Test Sake',
        brewery: 'Test Brewery',
        type: '純米酒' as const,
        region: 'Test Region',
        rating: 5,
        notes: 'Test notes',
        photoUri: 'test://photo.jpg',
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-01')
      };

      const updatedMockSake = {
        ...mockSake,
        name: 'Updated Sake',
        rating: 4,
        updatedAt: new Date('2023-01-02')
      };

      // Mock service responses
      mockSakeService.create.mockResolvedValue(mockSake);
      mockSakeService.update.mockResolvedValue(updatedMockSake);
      mockSakeService.delete.mockResolvedValue();

      const { result } = renderHook(() => useRecords(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Test sake creation
      const createData: SakeCreateInput = {
        name: 'Test Sake',
        brewery: 'Test Brewery',
        type: '純米酒',
        region: 'Test Region',
        rating: 5,
        notes: 'Test notes',
        photoUri: 'test://photo.jpg'
      };

      await act(async () => {
        await result.current.addSake(createData);
      });

      expect(mockSakeService.create).toHaveBeenCalledWith(createData);
      expect(mockToastService.showSuccess).toHaveBeenCalledWith('日本酒を追加しました');
      expect(result.current.sakes).toHaveLength(1);
      expect(result.current.sakes[0]).toEqual(mockSake);

      // Test sake update
      const updateData: SakeUpdateInput = {
        name: 'Updated Sake',
        rating: 4
      };

      await act(async () => {
        await result.current.updateSake(mockSake.id, updateData);
      });

      expect(mockSakeService.update).toHaveBeenCalledWith(mockSake.id, updateData);
      expect(mockToastService.showSuccess).toHaveBeenCalledWith('日本酒を更新しました');
      expect(result.current.sakes[0].name).toBe('Updated Sake');
      expect(result.current.sakes[0].rating).toBe(4);

      // Test sake deletion
      await act(async () => {
        await result.current.deleteSake(mockSake.id);
      });

      expect(mockSakeService.delete).toHaveBeenCalledWith(mockSake.id);
      expect(mockToastService.showSuccess).toHaveBeenCalledWith('日本酒を削除しました');
      expect(result.current.sakes).toHaveLength(0);
    });
  });

  describe('Recommendations Integration', () => {
    it('should refresh recommendations after wine operations', async () => {
      const mockWine = {
        id: 'wine-1',
        name: 'Test Wine',
        rating: 4,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const mockRecommendations = [
        {
          id: 'rec-1',
          type: 'wine' as const,
          name: 'Recommended Wine',
          reason: 'Similar to your preferences',
          similarity: 0.8,
          suggestedItem: mockWine
        }
      ];

      mockWineService.create.mockResolvedValue(mockWine);
      mockRecommendationService.generateRecommendations.mockResolvedValue(mockRecommendations);

      const { result } = renderHook(() => useRecords(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Create wine should trigger recommendation refresh
      await act(async () => {
        await result.current.addWine({
          name: 'Test Wine',
          rating: 4
        });
      });

      expect(mockRecommendationService.generateRecommendations).toHaveBeenCalled();
      expect(result.current.recommendations).toEqual(mockRecommendations);
    });

    it('should handle recommendation generation failure gracefully', async () => {
      const mockWine = {
        id: 'wine-1',
        name: 'Test Wine',
        rating: 4,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockWineService.create.mockResolvedValue(mockWine);
      mockRecommendationService.generateRecommendations.mockRejectedValue(
        new Error('Recommendation service failed')
      );

      const { result } = renderHook(() => useRecords(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Wine creation should succeed even if recommendations fail
      await act(async () => {
        await result.current.addWine({
          name: 'Test Wine',
          rating: 4
        });
      });

      expect(result.current.wines).toHaveLength(1);
      expect(result.current.recommendations).toEqual([]); // Should be empty due to failure
    });
  });

  describe('Data Persistence Integration', () => {
    it('should maintain data consistency across operations', async () => {
      const mockWines = [
        {
          id: 'wine-1',
          name: 'Wine 1',
          rating: 4,
          createdAt: new Date('2023-01-01'),
          updatedAt: new Date('2023-01-01')
        },
        {
          id: 'wine-2',
          name: 'Wine 2',
          rating: 5,
          createdAt: new Date('2023-01-02'),
          updatedAt: new Date('2023-01-02')
        }
      ];

      const mockSakes = [
        {
          id: 'sake-1',
          name: 'Sake 1',
          type: '純米酒' as const,
          rating: 5,
          createdAt: new Date('2023-01-03'),
          updatedAt: new Date('2023-01-03')
        }
      ];

      mockWineService.findAll.mockResolvedValue(mockWines);
      mockSakeService.findAll.mockResolvedValue(mockSakes);

      const { result } = renderHook(() => useRecords(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Verify initial data load
      expect(result.current.wines).toEqual(mockWines);
      expect(result.current.sakes).toEqual(mockSakes);

      // Test refresh data
      const newMockWine = {
        id: 'wine-3',
        name: 'Wine 3',
        rating: 3,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockWineService.findAll.mockResolvedValue([...mockWines, newMockWine]);

      await act(async () => {
        await result.current.refreshData();
      });

      expect(result.current.wines).toHaveLength(3);
      expect(result.current.wines[2]).toEqual(newMockWine);
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle wine service errors properly', async () => {
      const error = new Error('Database connection failed');
      mockWineService.create.mockRejectedValue(error);

      const { result } = renderHook(() => useRecords(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let thrownError;
      await act(async () => {
        try {
          await result.current.addWine({
            name: 'Test Wine',
            rating: 4
          });
        } catch (e) {
          thrownError = e;
        }
      });

      expect(thrownError).toBeDefined();
      expect(result.current.error).toBeTruthy();
      expect(mockToastService.showError).toHaveBeenCalled();
      expect(result.current.wines).toHaveLength(0);
    });

    it('should clear errors when requested', async () => {
      const { result } = renderHook(() => useRecords(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Simulate an error
      const error = new Error('Test error');
      mockWineService.create.mockRejectedValue(error);

      await act(async () => {
        try {
          await result.current.addWine({
            name: 'Test Wine',
            rating: 4
          });
        } catch (e) {
          // Expected
        }
      });

      expect(result.current.error).toBeTruthy();

      // Clear error
      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('Loading State Integration', () => {
    it('should manage loading state correctly during operations', async () => {
      let resolveCreate: (value: any) => void;
      const createPromise = new Promise((resolve) => {
        resolveCreate = resolve;
      });

      mockWineService.create.mockReturnValue(createPromise);

      const { result } = renderHook(() => useRecords(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Start wine creation
      act(() => {
        result.current.addWine({
          name: 'Test Wine',
          rating: 4
        });
      });

      // Should be loading
      expect(result.current.loading).toBe(true);

      // Complete operation
      act(() => {
        resolveCreate!({
          id: 'wine-1',
          name: 'Test Wine',
          rating: 4,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });
  });
});