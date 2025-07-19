import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { RecordsProvider } from '../../context/RecordsContext';
import { wineService } from '../../services/wineService';
import { sakeService } from '../../services/sakeService';
import { recommendationService } from '../../services/recommendationService';

// Import screens
import HomeScreen from '../../app/(tabs)/index';
import RecordsScreen from '../../app/(tabs)/records';
import AddScreen from '../../app/(tabs)/add';

// Mock services
jest.mock('../../services/wineService');
jest.mock('../../services/sakeService');
jest.mock('../../services/recommendationService');
jest.mock('../../services/toastService', () => ({
  toastService: {
    showSuccess: jest.fn(),
    showError: jest.fn(),
    showInfo: jest.fn(),
    showWarning: jest.fn()
  }
}));
jest.mock('../../services/retryService', () => ({
  retryService: {
    executeDbOperation: jest.fn((operation) => operation())
  }
}));

// Mock navigation dependencies
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    canGoBack: jest.fn(() => true)
  }),
  useLocalSearchParams: () => ({}),
  useFocusEffect: jest.fn()
}));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons'
}));

const mockWineService = wineService as jest.Mocked<typeof wineService>;
const mockSakeService = sakeService as jest.Mocked<typeof sakeService>;
const mockRecommendationService = recommendationService as jest.Mocked<typeof recommendationService>;

const Tab = createBottomTabNavigator();

// Test navigation wrapper
function TestNavigationWrapper() {
  return (
    <NavigationContainer>
      <RecordsProvider>
        <Tab.Navigator
          screenOptions={{
            headerShown: false,
            tabBarTestID: 'tab-bar'
          }}
        >
          <Tab.Screen
            name="Home"
            component={HomeScreen}
            options={{
              title: 'ホーム',
              tabBarTestID: 'home-tab'
            }}
          />
          <Tab.Screen
            name="Records"
            component={RecordsScreen}
            options={{
              title: '記録',
              tabBarTestID: 'records-tab'
            }}
          />
          <Tab.Screen
            name="Add"
            component={AddScreen}
            options={{
              title: '追加',
              tabBarTestID: 'add-tab'
            }}
          />
        </Tab.Navigator>
      </RecordsProvider>
    </NavigationContainer>
  );
}

describe('Navigation Flow E2E Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementations
    mockWineService.findAll.mockResolvedValue([]);
    mockSakeService.findAll.mockResolvedValue([]);
    mockRecommendationService.generateRecommendations.mockResolvedValue([]);
  });

  describe('Tab Navigation', () => {
    it('should navigate between all tabs correctly', async () => {
      const { getByTestId } = render(<TestNavigationWrapper />);

      // Wait for initial render
      await waitFor(() => {
        expect(getByTestId('tab-bar')).toBeTruthy();
      });

      // Should start on Home tab
      expect(getByTestId('home-screen')).toBeTruthy();

      // Navigate to Records tab
      const recordsTab = getByTestId('records-tab');
      await act(async () => {
        fireEvent.press(recordsTab);
      });

      await waitFor(() => {
        expect(getByTestId('records-screen')).toBeTruthy();
      });

      // Navigate to Add tab
      const addTab = getByTestId('add-tab');
      await act(async () => {
        fireEvent.press(addTab);
      });

      await waitFor(() => {
        expect(getByTestId('add-screen')).toBeTruthy();
      });

      // Navigate back to Home tab
      const homeTab = getByTestId('home-tab');
      await act(async () => {
        fireEvent.press(homeTab);
      });

      await waitFor(() => {
        expect(getByTestId('home-screen')).toBeTruthy();
      });
    });

    it('should maintain tab state during navigation', async () => {
      const { getByTestId } = render(<TestNavigationWrapper />);

      await waitFor(() => {
        expect(getByTestId('tab-bar')).toBeTruthy();
      });

      // Go to Records tab and interact with it
      const recordsTab = getByTestId('records-tab');
      await act(async () => {
        fireEvent.press(recordsTab);
      });

      await waitFor(() => {
        expect(getByTestId('records-screen')).toBeTruthy();
      });

      // Select wine tab in records
      const wineTabButton = getByTestId('wine-tab-button');
      await act(async () => {
        fireEvent.press(wineTabButton);
      });

      // Navigate to different tab and back
      const homeTab = getByTestId('home-tab');
      await act(async () => {
        fireEvent.press(homeTab);
      });

      await act(async () => {
        fireEvent.press(recordsTab);
      });

      // Wine tab should still be selected
      await waitFor(() => {
        expect(getByTestId('wine-tab-active')).toBeTruthy();
      });
    });
  });

  describe('Complete User Flows', () => {
    it('should complete wine addition flow', async () => {
      const mockWine = {
        id: 'wine-1',
        name: 'E2E Test Wine',
        region: 'Test Region',
        rating: 4,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockWineService.create.mockResolvedValue(mockWine);
      mockWineService.findAll.mockResolvedValue([mockWine]);

      const { getByTestId } = render(<TestNavigationWrapper />);

      await waitFor(() => {
        expect(getByTestId('tab-bar')).toBeTruthy();
      });

      // Navigate to Add screen
      const addTab = getByTestId('add-tab');
      await act(async () => {
        fireEvent.press(addTab);
      });

      await waitFor(() => {
        expect(getByTestId('add-screen')).toBeTruthy();
      });

      // Select wine type
      const wineTypeButton = getByTestId('wine-type-button');
      await act(async () => {
        fireEvent.press(wineTypeButton);
      });

      await waitFor(() => {
        expect(getByTestId('wine-form')).toBeTruthy();
      });

      // Fill wine form
      const nameInput = getByTestId('wine-name-input');
      const regionInput = getByTestId('wine-region-input');
      
      await act(async () => {
        fireEvent.changeText(nameInput, 'E2E Test Wine');
        fireEvent.changeText(regionInput, 'Test Region');
      });

      // Set rating
      const ratingButton4 = getByTestId('rating-button-4');
      await act(async () => {
        fireEvent.press(ratingButton4);
      });

      // Submit form
      const submitButton = getByTestId('submit-button');
      await act(async () => {
        fireEvent.press(submitButton);
      });

      // Should navigate to Records after successful submission
      await waitFor(() => {
        expect(getByTestId('records-screen')).toBeTruthy();
      });

      // Wine should appear in records
      await waitFor(() => {
        expect(getByTestId('wine-record-wine-1')).toBeTruthy();
      });
    });

    it('should complete sake addition flow', async () => {
      const mockSake = {
        id: 'sake-1',
        name: 'E2E Test Sake',
        brewery: 'Test Brewery',
        type: '純米酒' as const,
        rating: 5,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockSakeService.create.mockResolvedValue(mockSake);
      mockSakeService.findAll.mockResolvedValue([mockSake]);

      const { getByTestId } = render(<TestNavigationWrapper />);

      await waitFor(() => {
        expect(getByTestId('tab-bar')).toBeTruthy();
      });

      // Navigate to Add screen
      const addTab = getByTestId('add-tab');
      await act(async () => {
        fireEvent.press(addTab);
      });

      // Select sake type
      const sakeTypeButton = getByTestId('sake-type-button');
      await act(async () => {
        fireEvent.press(sakeTypeButton);
      });

      await waitFor(() => {
        expect(getByTestId('sake-form')).toBeTruthy();
      });

      // Fill sake form
      const nameInput = getByTestId('sake-name-input');
      const breweryInput = getByTestId('sake-brewery-input');
      
      await act(async () => {
        fireEvent.changeText(nameInput, 'E2E Test Sake');
        fireEvent.changeText(breweryInput, 'Test Brewery');
      });

      // Select sake type
      const typeSelector = getByTestId('sake-type-selector');
      await act(async () => {
        fireEvent.press(typeSelector);
      });

      const junmaiOption = getByTestId('type-option-純米酒');
      await act(async () => {
        fireEvent.press(junmaiOption);
      });

      // Set rating
      const ratingButton5 = getByTestId('rating-button-5');
      await act(async () => {
        fireEvent.press(ratingButton5);
      });

      // Submit form
      const submitButton = getByTestId('submit-button');
      await act(async () => {
        fireEvent.press(submitButton);
      });

      // Should navigate to Records after successful submission
      await waitFor(() => {
        expect(getByTestId('records-screen')).toBeTruthy();
      });

      // Navigate to sake tab
      const sakeTabButton = getByTestId('sake-tab-button');
      await act(async () => {
        fireEvent.press(sakeTabButton);
      });

      // Sake should appear in records
      await waitFor(() => {
        expect(getByTestId('sake-record-sake-1')).toBeTruthy();
      });
    });

    it('should show recommendations after adding records', async () => {
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
      mockWineService.findAll.mockResolvedValue([mockWine]);
      mockRecommendationService.generateRecommendations.mockResolvedValue(mockRecommendations);

      const { getByTestId } = render(<TestNavigationWrapper />);

      // Add a wine first
      const addTab = getByTestId('add-tab');
      await act(async () => {
        fireEvent.press(addTab);
      });

      const wineTypeButton = getByTestId('wine-type-button');
      await act(async () => {
        fireEvent.press(wineTypeButton);
      });

      const nameInput = getByTestId('wine-name-input');
      await act(async () => {
        fireEvent.changeText(nameInput, 'Test Wine');
      });

      const ratingButton4 = getByTestId('rating-button-4');
      await act(async () => {
        fireEvent.press(ratingButton4);
      });

      const submitButton = getByTestId('submit-button');
      await act(async () => {
        fireEvent.press(submitButton);
      });

      // Navigate to Home to see recommendations
      const homeTab = getByTestId('home-tab');
      await act(async () => {
        fireEvent.press(homeTab);
      });

      await waitFor(() => {
        expect(getByTestId('recommendations-section')).toBeTruthy();
        expect(getByTestId('recommendation-rec-1')).toBeTruthy();
      });
    });
  });

  describe('Error Handling During Navigation', () => {
    it('should handle network errors gracefully', async () => {
      const error = new Error('Network error');
      mockWineService.create.mockRejectedValue(error);

      const { getByTestId } = render(<TestNavigationWrapper />);

      // Try to add wine with network error
      const addTab = getByTestId('add-tab');
      await act(async () => {
        fireEvent.press(addTab);
      });

      const wineTypeButton = getByTestId('wine-type-button');
      await act(async () => {
        fireEvent.press(wineTypeButton);
      });

      const nameInput = getByTestId('wine-name-input');
      await act(async () => {
        fireEvent.changeText(nameInput, 'Test Wine');
      });

      const submitButton = getByTestId('submit-button');
      await act(async () => {
        fireEvent.press(submitButton);
      });

      // Should show error message but remain on form
      await waitFor(() => {
        expect(getByTestId('error-message')).toBeTruthy();
        expect(getByTestId('wine-form')).toBeTruthy();
      });

      // Should be able to navigate away
      const homeTab = getByTestId('home-tab');
      await act(async () => {
        fireEvent.press(homeTab);
      });

      await waitFor(() => {
        expect(getByTestId('home-screen')).toBeTruthy();
      });
    });

    it('should handle empty states correctly', async () => {
      // No data available
      mockWineService.findAll.mockResolvedValue([]);
      mockSakeService.findAll.mockResolvedValue([]);
      mockRecommendationService.generateRecommendations.mockResolvedValue([]);

      const { getByTestId } = render(<TestNavigationWrapper />);

      // Home should show empty recommendations
      await waitFor(() => {
        expect(getByTestId('empty-recommendations')).toBeTruthy();
      });

      // Records should show empty state
      const recordsTab = getByTestId('records-tab');
      await act(async () => {
        fireEvent.press(recordsTab);
      });

      await waitFor(() => {
        expect(getByTestId('empty-wines')).toBeTruthy();
      });

      const sakeTabButton = getByTestId('sake-tab-button');
      await act(async () => {
        fireEvent.press(sakeTabButton);
      });

      await waitFor(() => {
        expect(getByTestId('empty-sakes')).toBeTruthy();
      });
    });
  });

  describe('Deep Linking and State Restoration', () => {
    it('should handle direct navigation to specific tabs', async () => {
      const { getByTestId } = render(<TestNavigationWrapper />);

      // Simulate direct navigation to Records tab
      const recordsTab = getByTestId('records-tab');
      await act(async () => {
        fireEvent.press(recordsTab);
      });

      await waitFor(() => {
        expect(getByTestId('records-screen')).toBeTruthy();
      });

      // Should load data correctly
      expect(mockWineService.findAll).toHaveBeenCalled();
      expect(mockSakeService.findAll).toHaveBeenCalled();
    });

    it('should restore tab state after app restart simulation', async () => {
      const { getByTestId, rerender } = render(<TestNavigationWrapper />);

      // Navigate to specific tab and state
      const recordsTab = getByTestId('records-tab');
      await act(async () => {
        fireEvent.press(recordsTab);
      });

      const sakeTabButton = getByTestId('sake-tab-button');
      await act(async () => {
        fireEvent.press(sakeTabButton);
      });

      // Simulate app restart by re-rendering
      rerender(<TestNavigationWrapper />);

      // Should restore to default state (Home tab)
      await waitFor(() => {
        expect(getByTestId('home-screen')).toBeTruthy();
      });
    });
  });

  describe('Performance and Loading States', () => {
    it('should show loading states during data fetching', async () => {
      // Mock slow data loading
      let resolveWines: (value: any) => void;
      const winesPromise = new Promise((resolve) => {
        resolveWines = resolve;
      });

      mockWineService.findAll.mockReturnValue(winesPromise);
      mockSakeService.findAll.mockResolvedValue([]);

      const { getByTestId } = render(<TestNavigationWrapper />);

      // Should show loading state initially
      expect(getByTestId('loading-indicator')).toBeTruthy();

      // Complete data loading
      await act(async () => {
        resolveWines!([]);
      });

      // Loading should be gone
      await waitFor(() => {
        expect(() => getByTestId('loading-indicator')).toThrow();
      });
    });

    it('should handle concurrent navigation during loading', async () => {
      let resolveWines: (value: any) => void;
      const winesPromise = new Promise((resolve) => {
        resolveWines = resolve;
      });

      mockWineService.findAll.mockReturnValue(winesPromise);

      const { getByTestId } = render(<TestNavigationWrapper />);

      // Navigate while loading
      const recordsTab = getByTestId('records-tab');
      await act(async () => {
        fireEvent.press(recordsTab);
      });

      const addTab = getByTestId('add-tab');
      await act(async () => {
        fireEvent.press(addTab);
      });

      // Complete loading
      await act(async () => {
        resolveWines!([]);
      });

      // Should be on Add tab
      await waitFor(() => {
        expect(getByTestId('add-screen')).toBeTruthy();
      });
    });
  });
});