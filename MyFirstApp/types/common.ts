export interface BaseRecord {
  id: string;
  rating: number; // 1-5
  notes?: string;
  photoUri?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type RecordType = 'wine' | 'sake';

export interface Recommendation {
  id: string;
  type: RecordType;
  name: string;
  reason: string;
  similarity: number;
  suggestedItem: any; // Will be Wine | Sake when imported
}

export class DatabaseError extends Error {
  code?: string;
  details?: string;

  constructor(message: string, code?: string, details?: string) {
    super(message);
    this.name = 'DatabaseError';
    this.code = code;
    this.details = details;
  }
}

export class ValidationError extends Error {
  field?: string;
  value?: any;

  constructor(message: string, field?: string, value?: any) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
    this.value = value;
  }
}

// Validation utility functions
export const ValidationUtils = {
  isRequired: (value: any, fieldName: string): void => {
    if (value === null || value === undefined || value === '') {
      throw new ValidationError(`${fieldName}は必須です`, fieldName, value);
    }
  },

  isValidRating: (rating: number, fieldName: string = 'rating'): void => {
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      throw new ValidationError('評価は1-5の範囲で入力してください', fieldName, rating);
    }
  },

  isValidYear: (year: number | undefined, fieldName: string = 'vintage'): void => {
    if (year !== undefined) {
      const currentYear = new Date().getFullYear();
      if (!Number.isInteger(year) || year < 1800 || year > currentYear + 1) {
        throw new ValidationError(`${fieldName}は1800年から${currentYear + 1}年の範囲で入力してください`, fieldName, year);
      }
    }
  },

  isValidString: (value: string | undefined, fieldName: string, maxLength: number = 255): void => {
    if (value !== undefined && value.length > maxLength) {
      throw new ValidationError(`${fieldName}は${maxLength}文字以内で入力してください`, fieldName, value);
    }
  },

  validateAll: (validations: (() => void)[]): void => {
    const errors: ValidationError[] = [];
    
    for (const validation of validations) {
      try {
        validation();
      } catch (error) {
        if (error instanceof ValidationError) {
          errors.push(error);
        } else {
          throw error;
        }
      }
    }
    
    if (errors.length > 0) {
      const message = errors.map(e => e.message).join(', ');
      throw new ValidationError(message);
    }
  }
};