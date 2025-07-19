// サービス層の動作確認用テストファイル
import { databaseService } from './services/databaseProvider';
import { wineService } from './services/wineService';
import { sakeService } from './services/sakeService';
import { imageService } from './services/imageService';

// データベース接続テスト
async function testDatabaseConnection(): Promise<void> {
  console.log('=== データベース接続テスト ===');
  try {
    await databaseService.initialize();
    const isHealthy = await databaseService.healthCheck();
    console.log('✅ データベース接続:', isHealthy ? '成功' : '失敗');
    
    // テーブル作成確認
    const wineCount = await databaseService.count('wines');
    const sakeCount = await databaseService.count('sakes');
    console.log('✅ ワインテーブル:', wineCount, '件');
    console.log('✅ 日本酒テーブル:', sakeCount, '件');
  } catch (error: any) {
    console.error('❌ データベーステスト失敗:', error.message);
  }
}

// ワインサービステスト
async function testWineService(): Promise<void> {
  console.log('\n=== ワインサービステスト ===');
  try {
    // ワイン作成テスト
    const testWine = {
      name: 'テスト赤ワイン',
      region: 'フランス・ボルドー',
      grape: 'カベルネ・ソーヴィニヨン',
      vintage: 2020,
      rating: 4,
      notes: 'テスト用のワインです'
    };
    
    const createdWine = await wineService.create(testWine);
    console.log('✅ ワイン作成成功:', createdWine.name);
    
    // ワイン検索テスト
    const foundWine = await wineService.findById(createdWine.id);
    console.log('✅ ワイン検索成功:', foundWine ? foundWine.name : 'なし');
    
    // ワイン更新テスト
    const updatedWine = await wineService.update(createdWine.id, {
      rating: 5,
      notes: '更新されたメモ'
    });
    console.log('✅ ワイン更新成功:', updatedWine.rating);
    
    // ワイン一覧取得テスト
    const allWines = await wineService.findAll();
    console.log('✅ ワイン一覧取得:', allWines.length, '件');
    
    // 評価別検索テスト
    const highRatedWines = await wineService.findByRating(4);
    console.log('✅ 高評価ワイン検索:', highRatedWines.length, '件');
    
  } catch (error: any) {
    console.error('❌ ワインサービステスト失敗:', error.message);
  }
}

// 日本酒サービステスト
async function testSakeService(): Promise<void> {
  console.log('\n=== 日本酒サービステスト ===');
  try {
    // 日本酒作成テスト
    const testSake = {
      name: '獺祭',
      brewery: '旭酒造',
      type: '純米大吟醸酒',
      region: '山口県',
      rating: 5,
      notes: 'テスト用の日本酒です'
    };
    
    const createdSake = await sakeService.create(testSake);
    console.log('✅ 日本酒作成成功:', createdSake.name);
    
    // 日本酒検索テスト
    const foundSake = await sakeService.findById(createdSake.id);
    console.log('✅ 日本酒検索成功:', foundSake ? foundSake.name : 'なし');
    
    // 蔵元別検索テスト
    const brewerySearch = await sakeService.findByBrewery('旭酒造');
    console.log('✅ 蔵元別検索:', brewerySearch.length, '件');
    
    // 種類別検索テスト
    const typeSearch = await sakeService.findByType('純米大吟醸酒');
    console.log('✅ 種類別検索:', typeSearch.length, '件');
    
    // 日本酒一覧取得テスト
    const allSakes = await sakeService.findAll();
    console.log('✅ 日本酒一覧取得:', allSakes.length, '件');
    
  } catch (error: any) {
    console.error('❌ 日本酒サービステスト失敗:', error.message);
  }
}

// 画像サービステスト
async function testImageService(): Promise<void> {
  console.log('\n=== 画像サービステスト ===');
  try {
    // 画像ディレクトリ初期化テスト
    await imageService.initialize();
    console.log('✅ 画像ディレクトリ初期化成功');
    
    // ストレージ使用量テスト
    const storageUsage = await imageService.getStorageUsage();
    console.log('✅ ストレージ使用量:', Math.round(storageUsage / 1024), 'KB');
    
    // 画像ディレクトリパス取得テスト
    const imageDir = imageService.getImageDirectory();
    console.log('✅ 画像ディレクトリ:', imageDir);
    
  } catch (error: any) {
    console.error('❌ 画像サービステスト失敗:', error.message);
  }
}

// バリデーションテスト
async function testValidation(): Promise<void> {
  console.log('\n=== バリデーションテスト ===');
  try {
    // 無効なワインデータでテスト
    try {
      await wineService.create({
        name: '', // 空の名前
        rating: 6, // 無効な評価
        vintage: 1700 // 無効な年
      });
      console.log('❌ バリデーションが機能していません');
    } catch (validationError: any) {
      console.log('✅ ワインバリデーション正常動作:', validationError.message);
    }
    
    // 無効な日本酒データでテスト
    try {
      await sakeService.create({
        name: '', // 空の名前
        rating: 0, // 無効な評価
        type: '無効な種類' // 無効な種類
      });
      console.log('❌ バリデーションが機能していません');
    } catch (validationError: any) {
      console.log('✅ 日本酒バリデーション正常動作:', validationError.message);
    }
    
  } catch (error: any) {
    console.error('❌ バリデーションテスト失敗:', error.message);
  }
}

// 全テスト実行
export async function runAllTests(): Promise<void> {
  console.log('🚀 サービス層テスト開始\n');
  
  await testDatabaseConnection();
  await testWineService();
  await testSakeService();
  await testImageService();
  await testValidation();
  
  console.log('\n✨ テスト完了');
}

// 個別テスト実行用のエクスポート
export {
  testDatabaseConnection,
  testWineService,
  testSakeService,
  testImageService,
  testValidation
};