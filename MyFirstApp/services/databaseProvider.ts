import { Platform } from 'react-native';

// プラットフォームに応じてデータベースサービスを選択
let databaseService: any;

if (Platform.OS === 'web') {
  // Web環境では専用のサービスを使用
  databaseService = require('./database.web').databaseService;
} else {
  // ネイティブ環境では通常のサービスを使用
  databaseService = require('./database').databaseService;
}

export { databaseService };