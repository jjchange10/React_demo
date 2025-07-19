import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { WineForm } from '../../components/wine/WineForm';
import { SakeForm } from '../../components/sake/SakeForm';
import { RecordsProvider, useRecords } from '../../context/RecordsContext';
import { wineService } from '../../services/wineService';
import { sakeService } from '../../services/sakeService';
import { WineFormData } from '../../types/wine';
import { SakeFormData } from '../../types/sake';

// Mock services
jest.mock('../../services/wineService');
jest.mock('../../services/sakeService');
jest.mock('../../services/recommendationService', () => ({
  recommendationService: {
    generateRecommendations: jest.fn(() => Promise.resolve([]))
  }
}));
jest.mock('../../services/toastService', () => ({
  toastService: {
    showSuccess: jest.fn(),
    showError: jest.fn()
  }
}));
jest.mock('../../services/retryService', () => ({
  retryService: {
    executeDbOperation: jest.fn((operation) => operation())
  }
}));

// Mock React Native Alert
jest.spyOn(Alert, 'alert');

const mockWineService = wineService as jest.Mocked<typeof wineService>;
const mockSakeService = sakeService as jest.Mocked<typeof sakeService>;

// Test component that uses the form with context
function TestWineFormWithContext({ onSubmitSuccess }: { onSubmitSuccess?: () => void }) {
  const { addWine, loading } = useRecords();

  const handleSubmit = async (data: WineFormData) => {
    await addWine(data);
    onSubmitSuccess?.();
  };

  return (
    <WineForm
      onSubmit={handleSubmit}
      isLoading={loading}
      submitButtonText="ワインを保存"
    />
  );
}

function TestSakeFormWithContext({ onSubmitSuccess }: { onSubmitSuccess?: () => void }) {
  const { addSake, loading } = useRecords();

  const handleSubmit = async (data: SakeFormData) => {
    await addSake(data);
    onSubmitSuccess?.();
  };

  return (
    <SakeForm
      onSubmit={handleSubmit}
      isLoading={loading}
      submitButtonText="日本酒を保存"
    />
  );
}

describe('Form to Save Flow Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockWineService.findAll.mockResolvedValue([]);
    mockSakeService.findAll.mockResolvedValue([]);
  });

  describe('Wine Form Integration', () => {
    it('should complete full wine form submission flow', async () => {
      const mockWine = {
        id: 'wine-1',
        name: 'Integration Test Wine',
        region: 'Test Region',
        grape: 'Test Grape',
        vintage: 2020,
        rating: 4,
        notes: 'Integration test notes',
        photoUri: 'test://photo.jpg',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockWineService.create.mockResolvedValue(mockWine);

      const onSubmitSuccess = jest.fn();

      const { getByTestId, getByDisplayValue } = render(
        <RecordsProvider>
          <TestWineFormWithContext onSubmitSuccess={onSubmitSuccess} />
        </RecordsProvider>
      );

      // Wait for initial load
      await waitFor(() => {
        expect(getByTestId('wine-form')).toBeTruthy();
      });

      // Fill out the form
      const nameInput = getByTestId('wine-name-input');
      const regionInput = getByTestId('wine-region-input');
      const grapeInput = getByTestId('wine-grape-input');
      const vintageInput = getByTestId('wine-vintage-input');
      const notesInput = getByTestId('wine-notes-input');
      const submitButton = getByTestId('submit-button');

      await act(async () => {
        fireEvent.changeText(nameInput, 'Integration Test Wine');
        fireEvent.changeText(regionInput, 'Test Region');
        fireEvent.changeText(grapeInput, 'Test Grape');
        fireEvent.changeText(vintageInput, '2020');
        fireEvent.changeText(notesInput, 'Integration test notes');
      });

      // Set rating to 4
      const ratingButton4 = getByTestId('rating-button-4');
      await act(async () => {
        fireEvent.press(ratingButton4);
      });

      // Submit the form
      await act(async () => {
        fireEvent.press(submitButton);
      });

      // Verify service was called with correct data
      await waitFor(() => {
        expect(mockWineService.create).toHaveBeenCalledWith({
          name: 'Integration Test Wine',
          region: 'Test Region',
          grape: 'Test Grape',
          vintage: 2020,
          rating: 4,
          notes: 'Integration test notes',
          photoUri: undefined
        });
      });

      // Verify success callback was called
      expect(onSubmitSuccess).toHaveBeenCalled();
    });

    it('should handle wine form validation errors', async () => {
      const { getByTestId } = render(
        <RecordsProvider>
          <TestWineFormWithContext />
        </RecordsProvider>
      );

      await waitFor(() => {
        expect(getByTestId('wine-form')).toBeTruthy();
      });

      const submitButton = getByTestId('submit-button');

      // Try to submit empty form
      await act(async () => {
        fireEvent.press(submitButton);
      });

      // Should show validation error for required name field
      await waitFor(() => {
        expect(getByTestId('validation-message-name')).toBeTruthy();
      });

      // Verify service was not called
      expect(mockWineService.create).not.toHaveBeenCalled();
    });

    it('should handle wine form submission with photo', async () => {
      const mockWineWithPhoto = {
        id: 'wine-photo-1',
        name: 'Wine with Photo',
        rating: 5,
        photoUri: 'file://photo.jpg',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockWineService.create.mockResolvedValue(mockWineWithPhoto);

      const { getByTestId } = render(
        <RecordsProvider>
          <TestWineFormWithContext />
        </RecordsProvider>
      );

      await waitFor(() => {
        expect(getByTestId('wine-form')).toBeTruthy();
      });

      // Fill required fields
      const nameInput = getByTestId('wine-name-input');
      await act(async () => {
        fireEvent.changeText(nameInput, 'Wine with Photo');
      });

      // Set rating
      const ratingButton5 = getByTestId('rating-button-5');
      await act(async () => {
        fireEvent.press(ratingButton5);
      });

      // Add photo
      const photoPickerButton = getByTestId('photo-picker-button');
      await act(async () => {
        fireEvent.press(photoPickerButton);
      });

      // Mock photo selection
      const photoUri = 'file://photo.jpg';
      const photoInput = getByTestId('photo-uri-input');
      await act(async () => {
        fireEvent.changeText(photoInput, photoUri);
      });

      // Submit form
      const submitButton = getByTestId('submit-button');
      await act(async () => {
        fireEvent.press(submitButton);
      });

      await waitFor(() => {
        expect(mockWineService.create).toHaveBeenCalledWith({
          name: 'Wine with Photo',
          region: '',
          grape: '',
          vintage: undefined,
          rating: 5,
          notes: '',
          photoUri: 'file://photo.jpg'
        });
      });
    });

    it('should handle wine form service errors', async () => {
      const error = new Error('Database error');
      mockWineService.create.mockRejectedValue(error);

      const { getByTestId } = render(
        <RecordsProvider>
          <TestWineFormWithContext />
        </RecordsProvider>
      );

      await waitFor(() => {
        expect(getByTestId('wine-form')).toBeTruthy();
      });

      // Fill required fields
      const nameInput = getByTestId('wine-name-input');
      await act(async () => {
        fireEvent.changeText(nameInput, 'Test Wine');
      });

      const submitButton = getByTestId('submit-button');
      await act(async () => {
        fireEvent.press(submitButton);
      });

      // Should handle error gracefully
      await waitFor(() => {
        expect(mockWineService.create).toHaveBeenCalled();
      });

      // Form should not be reset on error
      expect(getByDisplayValue('Test Wine')).toBeTruthy();
    });
  });

  describe('Sake Form Integration', () => {
    it('should complete full sake form submission flow', async () => {
      const mockSake = {
        id: 'sake-1',
        name: 'Integration Test Sake',
        brewery: 'Test Brewery',
        type: '純米酒' as const,
        region: 'Test Region',
        rating: 5,
        notes: 'Integration test notes',
        photoUri: 'test://photo.jpg',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockSakeService.create.mockResolvedValue(mockSake);

      const onSubmitSuccess = jest.fn();

      const { getByTestId } = render(
        <RecordsProvider>
          <TestSakeFormWithContext onSubmitSuccess={onSubmitSuccess} />
        </RecordsProvider>
      );

      await waitFor(() => {
        expect(getByTestId('sake-form')).toBeTruthy();
      });

      // Fill out the form
      const nameInput = getByTestId('sake-name-input');
      const breweryInput = getByTestId('sake-brewery-input');
      const regionInput = getByTestId('sake-region-input');
      const notesInput = getByTestId('sake-notes-input');

      await act(async () => {
        fireEvent.changeText(nameInput, 'Integration Test Sake');
        fireEvent.changeText(breweryInput, 'Test Brewery');
        fireEvent.changeText(regionInput, 'Test Region');
        fireEvent.changeText(notesInput, 'Integration test notes');
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

      // Set rating to 5
      const ratingButton5 = getByTestId('rating-button-5');
      await act(async () => {
        fireEvent.press(ratingButton5);
      });

      // Submit the form
      const submitButton = getByTestId('submit-button');
      await act(async () => {
        fireEvent.press(submitButton);
      });

      // Verify service was called with correct data
      await waitFor(() => {
        expect(mockSakeService.create).toHaveBeenCalledWith({
          name: 'Integration Test Sake',
          brewery: 'Test Brewery',
          type: '純米酒',
          region: 'Test Region',
          rating: 5,
          notes: 'Integration test notes',
          photoUri: undefined
        });
      });

      expect(onSubmitSuccess).toHaveBeenCalled();
    });

    it('should handle sake form validation errors', async () => {
      const { getByTestId } = render(
        <RecordsProvider>
          <TestSakeFormWithContext />
        </RecordsProvider>
      );

      await waitFor(() => {
        expect(getByTestId('sake-form')).toBeTruthy();
      });

      const submitButton = getByTestId('submit-button');

      // Try to submit empty form
      await act(async () => {
        fireEvent.press(submitButton);
      });

      // Should show validation error for required name field
      await waitFor(() => {
        expect(getByTestId('validation-message-name')).toBeTruthy();
      });

      expect(mockSakeService.create).not.toHaveBeenCalled();
    });
  });

  describe('Form State Management Integration', () => {
    it('should maintain form state during editing', async () => {
      const { getByTestId, getByDisplayValue } = render(
        <RecordsProvider>
          <TestWineFormWithContext />
        </RecordsProvider>
      );

      await waitFor(() => {
        expect(getByTestId('wine-form')).toBeTruthy();
      });

      // Fill form partially
      const nameInput = getByTestId('wine-name-input');
      const regionInput = getByTestId('wine-region-input');

      await act(async () => {
        fireEvent.changeText(nameInput, 'Partial Wine');
        fireEvent.changeText(regionInput, 'Partial Region');
      });

      // Verify form maintains state
      expect(getByDisplayValue('Partial Wine')).toBeTruthy();
      expect(getByDisplayValue('Partial Region')).toBeTruthy();

      // Continue filling form
      const grapeInput = getByTestId('wine-grape-input');
      await act(async () => {
        fireEvent.changeText(grapeInput, 'Test Grape');
      });

      // All fields should still be present
      expect(getByDisplayValue('Partial Wine')).toBeTruthy();
      expect(getByDisplayValue('Partial Region')).toBeTruthy();
      expect(getByDisplayValue('Test Grape')).toBeTruthy();
    });

    it('should handle form reset properly', async () => {
      const { getByTestId, queryByDisplayValue } = render(
        <RecordsProvider>
          <TestWineFormWithContext />
        </RecordsProvider>
      );

      await waitFor(() => {
        expect(getByTestId('wine-form')).toBeTruthy();
      });

      // Fill form
      const nameInput = getByTestId('wine-name-input');
      await act(async () => {
        fireEvent.changeText(nameInput, 'Test Wine');
      });

      expect(queryByDisplayValue('Test Wine')).toBeTruthy();

      // Reset form (simulate cancel)
      const cancelButton = getByTestId('cancel-button');
      if (cancelButton) {
        await act(async () => {
          fireEvent.press(cancelButton);
        });

        // Form should be reset
        expect(queryByDisplayValue('Test Wine')).toBeFalsy();
      }
    });
  });

  describe('Loading State Integration', () => {
    it('should show loading state during form submission', async () => {
      let resolveCreate: (value: any) => void;
      const createPromise = new Promise((resolve) => {
        resolveCreate = resolve;
      });

      mockWineService.create.mockReturnValue(createPromise);

      const { getByTestId } = render(
        <RecordsProvider>
          <TestWineFormWithContext />
        </RecordsProvider>
      );

      await waitFor(() => {
        expect(getByTestId('wine-form')).toBeTruthy();
      });

      // Fill required fields
      const nameInput = getByTestId('wine-name-input');
      await act(async () => {
        fireEvent.changeText(nameInput, 'Test Wine');
      });

      // Submit form
      const submitButton = getByTestId('submit-button');
      await act(async () => {
        fireEvent.press(submitButton);
      });

      // Should show loading indicator
      expect(getByTestId('loading-indicator')).toBeTruthy();

      // Complete operation
      await act(async () => {
        resolveCreate!({
          id: 'wine-1',
          name: 'Test Wine',
          rating: 1,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      });

      // Loading should be gone
      await waitFor(() => {
        expect(() => getByTestId('loading-indicator')).toThrow();
      });
    });
  });
});