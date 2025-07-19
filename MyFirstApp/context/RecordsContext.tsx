import { createContext, useContext, useReducer, useEffect, type ReactNode } from 'react';
import { Wine, WineCreateInput, WineUpdateInput } from '../types/wine';
import { Sake, SakeCreateInput, SakeUpdateInput } from '../types/sake';
import { Recommendation, DatabaseError, ValidationError } from '../types/common';
import { wineService } from '../services/wineService';
import { sakeService } from '../services/sakeService';
import { recommendationService } from '../services/recommendationService';
import { toastService } from '../services/toastService';
import { errorMessageService } from '../services/errorMessages';
import { retryService } from '../services/retryService';

// State interface
interface RecordsState {
  wines: Wine[];
  sakes: Sake[];
  recommendations: Recommendation[];
  loading: boolean;
  error: string | null;
}

// Action types
type RecordsAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_WINES'; payload: Wine[] }
  | { type: 'SET_SAKES'; payload: Sake[] }
  | { type: 'SET_RECOMMENDATIONS'; payload: Recommendation[] }
  | { type: 'ADD_WINE'; payload: Wine }
  | { type: 'ADD_SAKE'; payload: Sake }
  | { type: 'UPDATE_WINE'; payload: Wine }
  | { type: 'UPDATE_SAKE'; payload: Sake }
  | { type: 'DELETE_WINE'; payload: string }
  | { type: 'DELETE_SAKE'; payload: string }
  | { type: 'RESET_STATE' };

// Context interface
interface RecordsContextType {
  // State
  wines: Wine[];
  sakes: Sake[];
  recommendations: Recommendation[];
  loading: boolean;
  error: string | null;
  
  // Wine operations
  addWine: (wine: WineCreateInput) => Promise<void>;
  updateWine: (id: string, wine: WineUpdateInput) => Promise<void>;
  deleteWine: (id: string) => Promise<void>;
  
  // Sake operations
  addSake: (sake: SakeCreateInput) => Promise<void>;
  updateSake: (id: string, sake: SakeUpdateInput) => Promise<void>;
  deleteSake: (id: string) => Promise<void>;
  
  // Utility operations
  refreshData: () => Promise<void>;
  refreshRecommendations: () => Promise<void>;
  clearError: () => void;
}

// Initial state
const initialState: RecordsState = {
  wines: [],
  sakes: [],
  recommendations: [],
  loading: false,
  error: null,
};

// Reducer function
function recordsReducer(state: RecordsState, action: RecordsAction): RecordsState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    
    case 'SET_WINES':
      return { ...state, wines: action.payload };
    
    case 'SET_SAKES':
      return { ...state, sakes: action.payload };
    
    case 'SET_RECOMMENDATIONS':
      return { ...state, recommendations: action.payload };
    
    case 'ADD_WINE':
      return { ...state, wines: [action.payload, ...state.wines] };
    
    case 'ADD_SAKE':
      return { ...state, sakes: [action.payload, ...state.sakes] };
    
    case 'UPDATE_WINE':
      return {
        ...state,
        wines: state.wines.map(wine => 
          wine.id === action.payload.id ? action.payload : wine
        )
      };
    
    case 'UPDATE_SAKE':
      return {
        ...state,
        sakes: state.sakes.map(sake => 
          sake.id === action.payload.id ? action.payload : sake
        )
      };
    
    case 'DELETE_WINE':
      return {
        ...state,
        wines: state.wines.filter(wine => wine.id !== action.payload)
      };
    
    case 'DELETE_SAKE':
      return {
        ...state,
        sakes: state.sakes.filter(sake => sake.id !== action.payload)
      };
    
    case 'RESET_STATE':
      return initialState;
    
    default:
      return state;
  }
}

// Create context
const RecordsContext = createContext<RecordsContextType | undefined>(undefined);

// Provider component
interface RecordsProviderProps {
  children: ReactNode;
}

export function RecordsProvider({ children }: RecordsProviderProps) {
  const [state, dispatch] = useReducer(recordsReducer, initialState);

  // Helper function to handle errors
  const handleError = async (error: unknown, operation: string, showToast: boolean = true) => {
    console.error(`${operation} failed:`, error);
    
    const errorMessage = errorMessageService.formatError(error, operation);
    dispatch({ type: 'SET_ERROR', payload: errorMessage });
    
    if (showToast) {
      await toastService.showError(errorMessage);
    }
  };

  // Wine operations
  const addWine = async (wineData: WineCreateInput): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      
      const newWine = await retryService.executeDbOperation(
        () => wineService.create(wineData),
        'ワインの追加'
      );
      
      dispatch({ type: 'ADD_WINE', payload: newWine });
      await toastService.showSuccess('ワインを追加しました');
      
      // Refresh recommendations after adding new wine
      await refreshRecommendations();
    } catch (error) {
      await handleError(error, 'ワインの追加');
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const updateWine = async (id: string, wineData: WineUpdateInput): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      
      const updatedWine = await retryService.executeDbOperation(
        () => wineService.update(id, wineData),
        'ワインの更新'
      );
      
      dispatch({ type: 'UPDATE_WINE', payload: updatedWine });
      await toastService.showSuccess('ワインを更新しました');
      
      // Refresh recommendations after updating wine
      await refreshRecommendations();
    } catch (error) {
      await handleError(error, 'ワインの更新');
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const deleteWine = async (id: string): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      
      await retryService.executeDbOperation(
        () => wineService.delete(id),
        'ワインの削除'
      );
      
      dispatch({ type: 'DELETE_WINE', payload: id });
      await toastService.showSuccess('ワインを削除しました');
      
      // Refresh recommendations after deleting wine
      await refreshRecommendations();
    } catch (error) {
      await handleError(error, 'ワインの削除');
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Sake operations
  const addSake = async (sakeData: SakeCreateInput): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      
      const newSake = await retryService.executeDbOperation(
        () => sakeService.create(sakeData),
        '日本酒の追加'
      );
      
      dispatch({ type: 'ADD_SAKE', payload: newSake });
      await toastService.showSuccess('日本酒を追加しました');
      
      // Refresh recommendations after adding new sake
      await refreshRecommendations();
    } catch (error) {
      await handleError(error, '日本酒の追加');
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const updateSake = async (id: string, sakeData: SakeUpdateInput): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      
      const updatedSake = await retryService.executeDbOperation(
        () => sakeService.update(id, sakeData),
        '日本酒の更新'
      );
      
      dispatch({ type: 'UPDATE_SAKE', payload: updatedSake });
      await toastService.showSuccess('日本酒を更新しました');
      
      // Refresh recommendations after updating sake
      await refreshRecommendations();
    } catch (error) {
      await handleError(error, '日本酒の更新');
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const deleteSake = async (id: string): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      
      await retryService.executeDbOperation(
        () => sakeService.delete(id),
        '日本酒の削除'
      );
      
      dispatch({ type: 'DELETE_SAKE', payload: id });
      await toastService.showSuccess('日本酒を削除しました');
      
      // Refresh recommendations after deleting sake
      await refreshRecommendations();
    } catch (error) {
      await handleError(error, '日本酒の削除');
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Utility operations
  const refreshData = async (): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      
      const [wines, sakes] = await Promise.all([
        retryService.executeDbOperation(() => wineService.findAll(), 'ワインデータの読み込み'),
        retryService.executeDbOperation(() => sakeService.findAll(), '日本酒データの読み込み')
      ]);
      
      dispatch({ type: 'SET_WINES', payload: wines });
      dispatch({ type: 'SET_SAKES', payload: sakes });
      
      // Also refresh recommendations
      await refreshRecommendations();
    } catch (error) {
      await handleError(error, 'データの読み込み', false); // Don't show toast for background refresh
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const refreshRecommendations = async (): Promise<void> => {
    try {
      const recommendations = await recommendationService.generateRecommendations();
      dispatch({ type: 'SET_RECOMMENDATIONS', payload: recommendations });
    } catch (error) {
      console.error('Recommendations refresh failed:', error);
      // Don't throw error for recommendations as it's not critical
      dispatch({ type: 'SET_RECOMMENDATIONS', payload: [] });
    }
  };

  const clearError = (): void => {
    dispatch({ type: 'SET_ERROR', payload: null });
  };

  // Load initial data on mount
  useEffect(() => {
    refreshData();
  }, []);

  // Context value
  const contextValue: RecordsContextType = {
    // State
    wines: state.wines,
    sakes: state.sakes,
    recommendations: state.recommendations,
    loading: state.loading,
    error: state.error,
    
    // Wine operations
    addWine,
    updateWine,
    deleteWine,
    
    // Sake operations
    addSake,
    updateSake,
    deleteSake,
    
    // Utility operations
    refreshData,
    refreshRecommendations,
    clearError,
  };

  return (
    <RecordsContext.Provider value={contextValue}>
      {children}
    </RecordsContext.Provider>
  );
}

// Custom hook to use the context
export function useRecords(): RecordsContextType {
  const context = useContext(RecordsContext);
  
  if (context === undefined) {
    throw new Error('useRecords must be used within a RecordsProvider');
  }
  
  return context;
}

// Export context for testing purposes
export { RecordsContext };