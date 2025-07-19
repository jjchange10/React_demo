import { ValidationError, DatabaseError } from '../types/common';

export type Language = 'ja' | 'en';

export interface ErrorMessages {
  validation: {
    requiredName: string;
    requiredRating: string;
    invalidRating: string;
    invalidYear: string;
    stringTooLong: string;
    requiredBrewery: string;
    requiredRegion: string;
    requiredGrape: string;
    requiredType: string;
  };
  database: {
    saveFailed: string;
    deleteFailed: string;
    loadFailed: string;
    updateFailed: string;
    notFound: string;
    connectionFailed: string;
  };
  image: {
    saveFailed: string;
    loadFailed: string;
    pickFailed: string;
    invalidFormat: string;
  };
  network: {
    connectionFailed: string;
    timeout: string;
    serverError: string;
  };
  general: {
    unknownError: string;
    operationFailed: string;
    tryAgain: string;
  };
}

const messages: Record<Language, ErrorMessages> = {
  ja: {
    validation: {
      requiredName: '名前は必須です',
      requiredRating: '評価は必須です',
      invalidRating: '評価は1-5の範囲で入力してください',
      invalidYear: '年は1800年から来年の範囲で入力してください',
      stringTooLong: '文字数が上限を超えています',
      requiredBrewery: '蔵元は必須です',
      requiredRegion: '産地は必須です',
      requiredGrape: '品種は必須です',
      requiredType: '種類は必須です',
    },
    database: {
      saveFailed: '保存に失敗しました',
      deleteFailed: '削除に失敗しました',
      loadFailed: 'データの読み込みに失敗しました',
      updateFailed: '更新に失敗しました',
      notFound: 'データが見つかりません',
      connectionFailed: 'データベースへの接続に失敗しました',
    },
    image: {
      saveFailed: '画像の保存に失敗しました',
      loadFailed: '画像の読み込みに失敗しました',
      pickFailed: '画像の選択に失敗しました',
      invalidFormat: '対応していない画像形式です',
    },
    network: {
      connectionFailed: 'ネットワークに接続できません',
      timeout: '通信がタイムアウトしました',
      serverError: 'サーバーエラーが発生しました',
    },
    general: {
      unknownError: '予期しないエラーが発生しました',
      operationFailed: '操作に失敗しました',
      tryAgain: 'もう一度お試しください',
    },
  },
  en: {
    validation: {
      requiredName: 'Name is required',
      requiredRating: 'Rating is required',
      invalidRating: 'Rating must be between 1 and 5',
      invalidYear: 'Year must be between 1800 and next year',
      stringTooLong: 'Text exceeds maximum length',
      requiredBrewery: 'Brewery is required',
      requiredRegion: 'Region is required',
      requiredGrape: 'Grape variety is required',
      requiredType: 'Type is required',
    },
    database: {
      saveFailed: 'Failed to save data',
      deleteFailed: 'Failed to delete data',
      loadFailed: 'Failed to load data',
      updateFailed: 'Failed to update data',
      notFound: 'Data not found',
      connectionFailed: 'Failed to connect to database',
    },
    image: {
      saveFailed: 'Failed to save image',
      loadFailed: 'Failed to load image',
      pickFailed: 'Failed to pick image',
      invalidFormat: 'Unsupported image format',
    },
    network: {
      connectionFailed: 'Cannot connect to network',
      timeout: 'Connection timeout',
      serverError: 'Server error occurred',
    },
    general: {
      unknownError: 'An unexpected error occurred',
      operationFailed: 'Operation failed',
      tryAgain: 'Please try again',
    },
  },
};

export class ErrorMessageService {
  private static instance: ErrorMessageService;
  private currentLanguage: Language = 'ja';

  static getInstance(): ErrorMessageService {
    if (!ErrorMessageService.instance) {
      ErrorMessageService.instance = new ErrorMessageService();
    }
    return ErrorMessageService.instance;
  }

  setLanguage(language: Language): void {
    this.currentLanguage = language;
  }

  getCurrentLanguage(): Language {
    return this.currentLanguage;
  }

  getMessages(): ErrorMessages {
    return messages[this.currentLanguage];
  }

  formatError(error: unknown, operation?: string): string {
    const msgs = this.getMessages();

    if (error instanceof ValidationError) {
      // Try to match specific validation errors
      if (error.message.includes('必須') || error.message.includes('required')) {
        if (error.field === 'name') return msgs.validation.requiredName;
        if (error.field === 'rating') return msgs.validation.requiredRating;
        if (error.field === 'brewery') return msgs.validation.requiredBrewery;
        if (error.field === 'region') return msgs.validation.requiredRegion;
        if (error.field === 'grape') return msgs.validation.requiredGrape;
        if (error.field === 'type') return msgs.validation.requiredType;
      }
      
      if (error.message.includes('評価') || error.message.includes('rating')) {
        return msgs.validation.invalidRating;
      }
      
      if (error.message.includes('年') || error.message.includes('year')) {
        return msgs.validation.invalidYear;
      }
      
      if (error.message.includes('文字') || error.message.includes('length')) {
        return msgs.validation.stringTooLong;
      }
      
      return error.message;
    }

    if (error instanceof DatabaseError) {
      if (error.message.includes('not found') || error.message.includes('見つかりません')) {
        return msgs.database.notFound;
      }
      
      if (error.message.includes('connection') || error.message.includes('接続')) {
        return msgs.database.connectionFailed;
      }
      
      // Map operation-specific database errors
      if (operation) {
        if (operation.includes('保存') || operation.includes('save') || operation.includes('create')) {
          return msgs.database.saveFailed;
        }
        if (operation.includes('削除') || operation.includes('delete')) {
          return msgs.database.deleteFailed;
        }
        if (operation.includes('更新') || operation.includes('update')) {
          return msgs.database.updateFailed;
        }
        if (operation.includes('読み込み') || operation.includes('load') || operation.includes('find')) {
          return msgs.database.loadFailed;
        }
      }
      
      return error.message;
    }

    if (error instanceof Error) {
      // Check for image-related errors
      if (error.message.includes('image') || error.message.includes('画像')) {
        if (error.message.includes('save') || error.message.includes('保存')) {
          return msgs.image.saveFailed;
        }
        if (error.message.includes('load') || error.message.includes('読み込み')) {
          return msgs.image.loadFailed;
        }
        if (error.message.includes('pick') || error.message.includes('選択')) {
          return msgs.image.pickFailed;
        }
        if (error.message.includes('format') || error.message.includes('形式')) {
          return msgs.image.invalidFormat;
        }
      }
      
      // Check for network-related errors
      if (error.message.includes('network') || error.message.includes('ネットワーク')) {
        return msgs.network.connectionFailed;
      }
      if (error.message.includes('timeout') || error.message.includes('タイムアウト')) {
        return msgs.network.timeout;
      }
      if (error.message.includes('server') || error.message.includes('サーバー')) {
        return msgs.network.serverError;
      }
      
      return error.message;
    }

    // Fallback for unknown errors
    return operation ? `${operation}: ${msgs.general.unknownError}` : msgs.general.unknownError;
  }

  getRetryMessage(): string {
    return this.getMessages().general.tryAgain;
  }
}

// Export singleton instance
export const errorMessageService = ErrorMessageService.getInstance();