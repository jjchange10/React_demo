import { BaseRecord, ValidationUtils, ValidationError } from './common';

export interface Sake extends BaseRecord {
  name: string;
  brewery?: string;
  type?: string; // 純米、吟醸、大吟醸等
  region?: string;
}

export interface SakeFormData {
  name: string;
  brewery?: string;
  type?: string;
  region?: string;
  rating: number;
  notes?: string;
  photoUri?: string;
}

export interface SakeCreateInput extends Omit<Sake, 'id' | 'createdAt' | 'updatedAt'> {}

export interface SakeUpdateInput extends Partial<Omit<Sake, 'id' | 'createdAt' | 'updatedAt'>> {}

// Sake type constants
export const SAKE_TYPES = [
  '純米酒',
  '本醸造酒',
  '吟醸酒',
  '純米吟醸酒',
  '大吟醸酒',
  '純米大吟醸酒',
  '特別純米酒',
  '特別本醸造酒',
  'その他'
] as const;

export type SakeType = typeof SAKE_TYPES[number];

// Sake validation functions
export const SakeValidation = {
  validateCreate: (data: SakeCreateInput): void => {
    ValidationUtils.validateAll([
      () => ValidationUtils.isRequired(data.name, '銘柄名'),
      () => ValidationUtils.isValidRating(data.rating),
      () => ValidationUtils.isValidString(data.name, '銘柄名', 100),
      () => ValidationUtils.isValidString(data.brewery, '蔵元', 100),
      () => ValidationUtils.isValidString(data.type, '種類', 50),
      () => ValidationUtils.isValidString(data.region, '産地', 100),
      () => ValidationUtils.isValidString(data.notes, 'メモ', 500),
      () => SakeValidation.isValidSakeType(data.type)
    ]);
  },

  validateUpdate: (data: SakeUpdateInput): void => {
    const validations: (() => void)[] = [];
    
    if (data.name !== undefined) {
      validations.push(() => ValidationUtils.isRequired(data.name, '銘柄名'));
      validations.push(() => ValidationUtils.isValidString(data.name, '銘柄名', 100));
    }
    
    if (data.rating !== undefined) {
      validations.push(() => ValidationUtils.isValidRating(data.rating));
    }
    
    if (data.brewery !== undefined) {
      validations.push(() => ValidationUtils.isValidString(data.brewery, '蔵元', 100));
    }
    
    if (data.type !== undefined) {
      validations.push(() => ValidationUtils.isValidString(data.type, '種類', 50));
      validations.push(() => SakeValidation.isValidSakeType(data.type));
    }
    
    if (data.region !== undefined) {
      validations.push(() => ValidationUtils.isValidString(data.region, '産地', 100));
    }
    
    if (data.notes !== undefined) {
      validations.push(() => ValidationUtils.isValidString(data.notes, 'メモ', 500));
    }
    
    ValidationUtils.validateAll(validations);
  },

  validateFormData: (data: SakeFormData): void => {
    ValidationUtils.validateAll([
      () => ValidationUtils.isRequired(data.name, '銘柄名'),
      () => ValidationUtils.isValidRating(data.rating),
      () => ValidationUtils.isValidString(data.name, '銘柄名', 100),
      () => ValidationUtils.isValidString(data.brewery, '蔵元', 100),
      () => ValidationUtils.isValidString(data.type, '種類', 50),
      () => ValidationUtils.isValidString(data.region, '産地', 100),
      () => ValidationUtils.isValidString(data.notes, 'メモ', 500),
      () => SakeValidation.isValidSakeType(data.type)
    ]);
  },

  isValidSakeType: (type: string | undefined): void => {
    if (type !== undefined && type !== '' && !SAKE_TYPES.includes(type as SakeType)) {
      throw new ValidationError(`無効な日本酒の種類です: ${type}`, 'type', type);
    }
  }
};