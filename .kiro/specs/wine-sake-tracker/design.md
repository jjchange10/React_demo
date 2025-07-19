# Design Document

## Overview

ワインと日本酒の記録・管理・推薦アプリのフロントエンド設計です。React Native + Expo Router を使用し、既存のMyFirstAppプロジェクト構造を拡張して実装します。ローカルストレージ（AsyncStorage + SQLite）を使用してデータを管理し、将来的にバックエンドAPIとの連携も可能な設計とします。

## Architecture

### 技術スタック
- **フレームワーク**: React Native 0.79.5 + Expo SDK 53
- **ルーティング**: Expo Router v5 (file-based routing)
- **状態管理**: React Context + useReducer
- **データストレージ**: 
  - AsyncStorage (設定・軽量データ)
  - Expo SQLite (構造化データ)
- **画像管理**: Expo Image Picker + FileSystem
- **UI**: React Native標準コンポーネント + カスタムコンポーネント
- **言語**: TypeScript

### アプリケーション構造
```
MyFirstApp/
├── app/
│   ├── (tabs)/
│   │   ├── index.tsx          # ホーム画面（おすすめ表示）
│   │   ├── records.tsx        # 記録一覧画面
│   │   └── add.tsx           # 記録追加画面
│   ├── record/
│   │   ├── [id].tsx          # 記録詳細画面
│   │   └── edit/[id].tsx     # 記録編集画面
│   └── _layout.tsx
├── components/
│   ├── wine/
│   │   ├── WineForm.tsx      # ワイン入力フォーム
│   │   ├── WineCard.tsx      # ワイン表示カード
│   │   └── WineList.tsx      # ワイン一覧
│   ├── sake/
│   │   ├── SakeForm.tsx      # 日本酒入力フォーム
│   │   ├── SakeCard.tsx      # 日本酒表示カード
│   │   └── SakeList.tsx      # 日本酒一覧
│   ├── common/
│   │   ├── RecordCard.tsx    # 共通記録カード
│   │   ├── RatingInput.tsx   # 評価入力
│   │   ├── PhotoPicker.tsx   # 写真選択
│   │   └── RecommendationCard.tsx # おすすめカード
│   └── ui/
├── services/
│   ├── database.ts           # SQLite操作
│   ├── storage.ts           # AsyncStorage操作
│   ├── recommendation.ts    # おすすめロジック
│   └── imageService.ts      # 画像管理
├── types/
│   ├── wine.ts              # ワイン型定義
│   ├── sake.ts              # 日本酒型定義
│   └── common.ts            # 共通型定義
└── context/
    └── RecordsContext.tsx   # 記録データ管理
```

## Components and Interfaces

### データモデル

#### Wine型
```typescript
interface Wine {
  id: string;
  name: string;
  region?: string;
  grape?: string;
  vintage?: number;
  rating: number; // 1-5
  notes?: string;
  photoUri?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

#### Sake型
```typescript
interface Sake {
  id: string;
  name: string;
  brewery?: string;
  type?: string; // 純米、吟醸、大吟醸等
  region?: string;
  rating: number; // 1-5
  notes?: string;
  photoUri?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

#### Recommendation型
```typescript
interface Recommendation {
  id: string;
  type: 'wine' | 'sake';
  name: string;
  reason: string;
  similarity: number;
  suggestedItem: Wine | Sake;
}
```

### 主要コンポーネント

#### RecordsContext
```typescript
interface RecordsContextType {
  wines: Wine[];
  sakes: Sake[];
  recommendations: Recommendation[];
  addWine: (wine: Omit<Wine, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  addSake: (sake: Omit<Sake, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateWine: (id: string, wine: Partial<Wine>) => Promise<void>;
  updateSake: (id: string, sake: Partial<Sake>) => Promise<void>;
  deleteWine: (id: string) => Promise<void>;
  deleteSake: (id: string) => Promise<void>;
  refreshRecommendations: () => Promise<void>;
}
```

#### WineForm / SakeForm
- 入力フォームコンポーネント
- バリデーション機能
- 写真選択機能
- 評価入力（星評価）

#### RecordCard
- ワイン・日本酒共通の表示カード
- 写真、名前、評価、メモのプレビュー
- タップで詳細画面へ遷移

#### RecommendationCard
- おすすめ表示用カード
- 推薦理由の表示
- 類似度に基づく表示順序

## Data Models

### SQLite スキーマ

#### wines テーブル
```sql
CREATE TABLE wines (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  region TEXT,
  grape TEXT,
  vintage INTEGER,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  notes TEXT,
  photo_uri TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### sakes テーブル
```sql
CREATE TABLE sakes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  brewery TEXT,
  type TEXT,
  region TEXT,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  notes TEXT,
  photo_uri TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### ローカルストレージ構造
- `@wine_sake_app/user_preferences`: ユーザー設定
- `@wine_sake_app/last_sync`: 最終同期時刻（将来のAPI連携用）

## Error Handling

### エラー分類
1. **バリデーションエラー**: 入力値の検証失敗
2. **データベースエラー**: SQLite操作の失敗
3. **ファイルシステムエラー**: 画像保存の失敗
4. **ネットワークエラー**: 将来のAPI連携時

### エラーハンドリング戦略
- Toast通知によるユーザーフレンドリーなエラー表示
- エラーログの記録（開発時のみ）
- 自動リトライ機能（データベース操作）
- フォールバック表示（画像読み込み失敗時）

### エラーメッセージ
```typescript
const ERROR_MESSAGES = {
  VALIDATION: {
    REQUIRED_NAME: '名前は必須です',
    REQUIRED_RATING: '評価は必須です',
    INVALID_RATING: '評価は1-5の範囲で入力してください'
  },
  DATABASE: {
    SAVE_FAILED: '保存に失敗しました',
    DELETE_FAILED: '削除に失敗しました',
    LOAD_FAILED: 'データの読み込みに失敗しました'
  },
  IMAGE: {
    SAVE_FAILED: '画像の保存に失敗しました',
    LOAD_FAILED: '画像の読み込みに失敗しました'
  }
};
```

## Testing Strategy

### テスト分類
1. **Unit Tests**: 個別コンポーネントとサービス関数
2. **Integration Tests**: データベース操作とContext
3. **E2E Tests**: 主要ユーザーフロー

### テスト対象
- フォームバリデーション
- データベースCRUD操作
- おすすめアルゴリズム
- 画像保存・読み込み
- ナビゲーション

### テストツール
- Jest: Unit/Integration tests
- React Native Testing Library: Component tests
- Detox: E2E tests（将来的に）

### テストデータ
- モックワイン・日本酒データ
- テスト用画像ファイル
- 各種エラーケースのシミュレーション

## UI/UX Design Considerations

### デザインシステム
- 既存のThemedText/ThemedViewコンポーネントを活用
- ダークモード対応
- 日本語フォント最適化

### ナビゲーション
- タブベースナビゲーション（ホーム、記録、追加）
- スタックナビゲーション（詳細、編集画面）
- 戻るボタンとスワイプジェスチャー

### レスポンシブ対応
- iPhone/Android各サイズ対応
- タブレット表示最適化
- 横画面対応

### アクセシビリティ
- スクリーンリーダー対応
- 適切なコントラスト比
- タッチターゲットサイズ最適化