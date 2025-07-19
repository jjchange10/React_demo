import { BaseRecord, ValidationUtils } from './common';

export interface Wine extends BaseRecord {
  name: string;
  region?: string;
  grape?: string;
  vintage?: number;
}

export interface WineFormData {
  name: string;
  region?: string;
  grape?: string;
  vintage?: number;
  rating: number;
  notes?: string;
  photoUri?: string;
}

export interface WineCreateInput extends Omit<Wine, 'id' | 'createdAt' | 'updatedAt'> {}

export interface WineUpdateInput extends Partial<Omit<Wine, 'id' | 'createdAt' | 'updatedAt'>> {}

// Wine validation functions
export const WineValidation = {
  validateCreate: (data: WineCreateInput): void => {
    ValidationUtils.validateAll([
      () => ValidationUtils.isRequired(data.name, 'ワイン名'),
      () => ValidationUtils.isValidRating(data.rating, '評価'),
      () => ValidationUtils.isValidString(data.name, 'ワイン名', 100),
      () => ValidationUtils.isValidString(data.region, '産地', 100),
      () => ValidationUtils.isValidString(data.grape, '品種', 100),
      () => ValidationUtils.isValidString(data.notes, 'メモ', 500),
      () => ValidationUtils.isValidYear(data.vintage, 'ヴィンテージ')
    ]);
  },

  validateUpdate: (data: WineUpdateInput): void => {
    const validations: (() => void)[] = [];
    
    if (data.name !== undefined) {
      validations.push(() => ValidationUtils.isRequired(data.name, 'ワイン名'));
      validations.push(() => ValidationUtils.isValidString(data.name, 'ワイン名', 100));
    }
    
    if (data.rating !== undefined) {
      validations.push(() => ValidationUtils.isValidRating(data.rating, '評価'));
    }
    
    if (data.region !== undefined) {
      validations.push(() => ValidationUtils.isValidString(data.region, '産地', 100));
    }
    
    if (data.grape !== undefined) {
      validations.push(() => ValidationUtils.isValidString(data.grape, '品種', 100));
    }
    
    if (data.notes !== undefined) {
      validations.push(() => ValidationUtils.isValidString(data.notes, 'メモ', 500));
    }
    
    if (data.vintage !== undefined) {
      validations.push(() => ValidationUtils.isValidYear(data.vintage, 'ヴィンテージ'));
    }
    
    ValidationUtils.validateAll(validations);
  },

  validateFormData: (data: WineFormData): void => {
    ValidationUtils.validateAll([
      () => ValidationUtils.isRequired(data.name, 'ワイン名'),
      () => ValidationUtils.isValidRating(data.rating, '評価'),
      () => ValidationUtils.isValidString(data.name, 'ワイン名', 100),
      () => ValidationUtils.isValidString(data.region, '産地', 100),
      () => ValidationUtils.isValidString(data.grape, '品種', 100),
      () => ValidationUtils.isValidString(data.notes, 'メモ', 500),
      () => ValidationUtils.isValidYear(data.vintage, 'ヴィンテージ')
    ]);
  }
};