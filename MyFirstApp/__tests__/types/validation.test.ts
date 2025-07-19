import { ValidationUtils, ValidationError } from '../../types/common';
import { WineValidation } from '../../types/wine';
import { SakeValidation, SAKE_TYPES } from '../../types/sake';

describe('ValidationUtils', () => {
  describe('isRequired', () => {
    it('should pass for valid values', () => {
      expect(() => ValidationUtils.isRequired('test', 'field')).not.toThrow();
      expect(() => ValidationUtils.isRequired(0, 'field')).not.toThrow();
      expect(() => ValidationUtils.isRequired(false, 'field')).not.toThrow();
    });

    it('should throw ValidationError for empty values', () => {
      expect(() => ValidationUtils.isRequired('', 'field')).toThrow(ValidationError);
      expect(() => ValidationUtils.isRequired(null, 'field')).toThrow(ValidationError);
      expect(() => ValidationUtils.isRequired(undefined, 'field')).toThrow(ValidationError);
    });

    it('should include field name in error message', () => {
      expect(() => ValidationUtils.isRequired('', 'テスト項目')).toThrow('テスト項目は必須です');
    });
  });

  describe('isValidRating', () => {
    it('should pass for valid ratings', () => {
      [1, 2, 3, 4, 5].forEach(rating => {
        expect(() => ValidationUtils.isValidRating(rating)).not.toThrow();
      });
    });

    it('should throw ValidationError for invalid ratings', () => {
      [0, 6, -1, 1.5, NaN].forEach(rating => {
        expect(() => ValidationUtils.isValidRating(rating)).toThrow(ValidationError);
      });
    });

    it('should include custom field name in error message', () => {
      expect(() => ValidationUtils.isValidRating(0, 'カスタム評価')).toThrow('評価は1-5の範囲で入力してください');
    });
  });

  describe('isValidYear', () => {
    const currentYear = new Date().getFullYear();

    it('should pass for valid years', () => {
      expect(() => ValidationUtils.isValidYear(2000)).not.toThrow();
      expect(() => ValidationUtils.isValidYear(currentYear)).not.toThrow();
      expect(() => ValidationUtils.isValidYear(currentYear + 1)).not.toThrow();
      expect(() => ValidationUtils.isValidYear(undefined)).not.toThrow();
    });

    it('should throw ValidationError for invalid years', () => {
      expect(() => ValidationUtils.isValidYear(1799)).toThrow(ValidationError);
      expect(() => ValidationUtils.isValidYear(currentYear + 2)).toThrow(ValidationError);
      expect(() => ValidationUtils.isValidYear(2000.5)).toThrow(ValidationError);
    });

    it('should include field name in error message', () => {
      expect(() => ValidationUtils.isValidYear(1799, 'ヴィンテージ'))
        .toThrow(`ヴィンテージは1800年から${currentYear + 1}年の範囲で入力してください`);
    });
  });

  describe('isValidString', () => {
    it('should pass for valid strings', () => {
      expect(() => ValidationUtils.isValidString('test', 'field', 10)).not.toThrow();
      expect(() => ValidationUtils.isValidString('', 'field', 10)).not.toThrow();
      expect(() => ValidationUtils.isValidString(undefined, 'field', 10)).not.toThrow();
    });

    it('should throw ValidationError for strings exceeding max length', () => {
      expect(() => ValidationUtils.isValidString('toolong', 'field', 5)).toThrow(ValidationError);
    });

    it('should include field name and max length in error message', () => {
      expect(() => ValidationUtils.isValidString('toolong', 'テスト項目', 5))
        .toThrow('テスト項目は5文字以内で入力してください');
    });
  });

  describe('validateAll', () => {
    it('should pass when all validations succeed', () => {
      const validations = [
        () => ValidationUtils.isRequired('test', 'field1'),
        () => ValidationUtils.isValidRating(4, 'field2')
      ];

      expect(() => ValidationUtils.validateAll(validations)).not.toThrow();
    });

    it('should collect all validation errors', () => {
      const validations = [
        () => ValidationUtils.isRequired('', 'field1'),
        () => ValidationUtils.isValidRating(0, 'field2'),
        () => ValidationUtils.isValidString('toolong', 'field3', 5)
      ];

      expect(() => ValidationUtils.validateAll(validations)).toThrow(ValidationError);
    });

    it('should combine error messages', () => {
      const validations = [
        () => ValidationUtils.isRequired('', 'field1'),
        () => ValidationUtils.isValidRating(0, 'field2')
      ];

      try {
        ValidationUtils.validateAll(validations);
        fail('Expected ValidationError to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect(error.message).toContain('field1は必須です');
        expect(error.message).toContain('評価は1-5の範囲で入力してください');
      }
    });

    it('should re-throw non-ValidationError exceptions', () => {
      const validations = [
        () => { throw new Error('Non-validation error'); }
      ];

      expect(() => ValidationUtils.validateAll(validations)).toThrow('Non-validation error');
    });
  });
});

describe('WineValidation', () => {
  describe('validateCreate', () => {
    const validWineData = {
      name: 'Test Wine',
      region: 'Test Region',
      grape: 'Test Grape',
      vintage: 2020,
      rating: 4,
      notes: 'Test notes',
      photoUri: 'test://photo.jpg'
    };

    it('should pass for valid wine data', () => {
      expect(() => WineValidation.validateCreate(validWineData)).not.toThrow();
    });

    it('should pass for minimal valid wine data', () => {
      const minimalData = {
        name: 'Test Wine',
        rating: 4
      };
      expect(() => WineValidation.validateCreate(minimalData)).not.toThrow();
    });

    it('should throw ValidationError for missing required fields', () => {
      expect(() => WineValidation.validateCreate({ ...validWineData, name: '' }))
        .toThrow(ValidationError);
      expect(() => WineValidation.validateCreate({ ...validWineData, rating: undefined as any }))
        .toThrow(ValidationError);
    });

    it('should throw ValidationError for invalid rating', () => {
      expect(() => WineValidation.validateCreate({ ...validWineData, rating: 0 }))
        .toThrow(ValidationError);
      expect(() => WineValidation.validateCreate({ ...validWineData, rating: 6 }))
        .toThrow(ValidationError);
    });

    it('should throw ValidationError for invalid vintage', () => {
      expect(() => WineValidation.validateCreate({ ...validWineData, vintage: 1799 }))
        .toThrow(ValidationError);
    });

    it('should throw ValidationError for strings exceeding max length', () => {
      const longString = 'a'.repeat(101);
      expect(() => WineValidation.validateCreate({ ...validWineData, name: longString }))
        .toThrow(ValidationError);
      expect(() => WineValidation.validateCreate({ ...validWineData, region: longString }))
        .toThrow(ValidationError);
    });
  });

  describe('validateUpdate', () => {
    it('should pass for valid partial update data', () => {
      expect(() => WineValidation.validateUpdate({ name: 'Updated Wine' })).not.toThrow();
      expect(() => WineValidation.validateUpdate({ rating: 5 })).not.toThrow();
      expect(() => WineValidation.validateUpdate({})).not.toThrow();
    });

    it('should throw ValidationError for invalid fields', () => {
      expect(() => WineValidation.validateUpdate({ name: '' })).toThrow(ValidationError);
      expect(() => WineValidation.validateUpdate({ rating: 0 })).toThrow(ValidationError);
      expect(() => WineValidation.validateUpdate({ vintage: 1799 })).toThrow(ValidationError);
    });
  });

  describe('validateFormData', () => {
    const validFormData = {
      name: 'Test Wine',
      region: 'Test Region',
      grape: 'Test Grape',
      vintage: 2020,
      rating: 4,
      notes: 'Test notes',
      photoUri: 'test://photo.jpg'
    };

    it('should pass for valid form data', () => {
      expect(() => WineValidation.validateFormData(validFormData)).not.toThrow();
    });

    it('should throw ValidationError for invalid form data', () => {
      expect(() => WineValidation.validateFormData({ ...validFormData, name: '' }))
        .toThrow(ValidationError);
      expect(() => WineValidation.validateFormData({ ...validFormData, rating: 0 }))
        .toThrow(ValidationError);
    });
  });
});

describe('SakeValidation', () => {
  describe('validateCreate', () => {
    const validSakeData = {
      name: 'Test Sake',
      brewery: 'Test Brewery',
      type: '純米酒',
      region: 'Test Region',
      rating: 5,
      notes: 'Test notes',
      photoUri: 'test://photo.jpg'
    };

    it('should pass for valid sake data', () => {
      expect(() => SakeValidation.validateCreate(validSakeData)).not.toThrow();
    });

    it('should pass for minimal valid sake data', () => {
      const minimalData = {
        name: 'Test Sake',
        rating: 4
      };
      expect(() => SakeValidation.validateCreate(minimalData)).not.toThrow();
    });

    it('should throw ValidationError for missing required fields', () => {
      expect(() => SakeValidation.validateCreate({ ...validSakeData, name: '' }))
        .toThrow(ValidationError);
      expect(() => SakeValidation.validateCreate({ ...validSakeData, rating: undefined as any }))
        .toThrow(ValidationError);
    });

    it('should throw ValidationError for invalid sake type', () => {
      expect(() => SakeValidation.validateCreate({ ...validSakeData, type: '無効な種類' }))
        .toThrow(ValidationError);
    });

    it('should pass for valid sake types', () => {
      SAKE_TYPES.forEach(type => {
        expect(() => SakeValidation.validateCreate({ ...validSakeData, type }))
          .not.toThrow();
      });
    });
  });

  describe('validateUpdate', () => {
    it('should pass for valid partial update data', () => {
      expect(() => SakeValidation.validateUpdate({ name: 'Updated Sake' })).not.toThrow();
      expect(() => SakeValidation.validateUpdate({ type: '純米酒' })).not.toThrow();
      expect(() => SakeValidation.validateUpdate({})).not.toThrow();
    });

    it('should throw ValidationError for invalid fields', () => {
      expect(() => SakeValidation.validateUpdate({ name: '' })).toThrow(ValidationError);
      expect(() => SakeValidation.validateUpdate({ rating: 0 })).toThrow(ValidationError);
      expect(() => SakeValidation.validateUpdate({ type: '無効な種類' })).toThrow(ValidationError);
    });
  });

  describe('isValidSakeType', () => {
    it('should pass for valid sake types', () => {
      SAKE_TYPES.forEach(type => {
        expect(() => SakeValidation.isValidSakeType(type)).not.toThrow();
      });
    });

    it('should pass for undefined and empty string', () => {
      expect(() => SakeValidation.isValidSakeType(undefined)).not.toThrow();
      expect(() => SakeValidation.isValidSakeType('')).not.toThrow();
    });

    it('should throw ValidationError for invalid sake types', () => {
      expect(() => SakeValidation.isValidSakeType('無効な種類')).toThrow(ValidationError);
      expect(() => SakeValidation.isValidSakeType('ビール')).toThrow(ValidationError);
    });

    it('should include type in error message', () => {
      expect(() => SakeValidation.isValidSakeType('無効な種類'))
        .toThrow('無効な日本酒の種類です: 無効な種類');
    });
  });
});