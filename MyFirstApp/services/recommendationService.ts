import { Wine } from '../types/wine';
import { Sake } from '../types/sake';
import { Recommendation, RecordType } from '../types/common';
import { wineService } from './wineService';
import { sakeService } from './sakeService';

// 推薦アルゴリズムの設定
const RECOMMENDATION_CONFIG = {
  MIN_RECORDS_FOR_RECOMMENDATIONS: 3, // 推薦に必要な最小記録数
  MAX_RECOMMENDATIONS: 5, // 最大推薦数
  HIGH_RATING_THRESHOLD: 4, // 高評価とみなす閾値
  SIMILARITY_THRESHOLD: 0.3, // 類似度の最小閾値
};

// 類似度計算のための重み
const SIMILARITY_WEIGHTS = {
  wine: {
    region: 0.4,
    grape: 0.4,
    vintage: 0.2,
  },
  sake: {
    brewery: 0.3,
    type: 0.4,
    region: 0.3,
  },
};

// ユーザーの好みプロファイル
interface UserPreferences {
  wine: {
    preferredRegions: { [region: string]: number };
    preferredGrapes: { [grape: string]: number };
    preferredVintageRange: { min: number; max: number } | null;
    averageRating: number;
  };
  sake: {
    preferredBreweries: { [brewery: string]: number };
    preferredTypes: { [type: string]: number };
    preferredRegions: { [region: string]: number };
    averageRating: number;
  };
}

class RecommendationService {
  private recommendationCounter = 0;

  // ユニークIDを生成
  private generateUniqueId(prefix: string): string {
    this.recommendationCounter++;
    return `${prefix}_${Date.now()}_${this.recommendationCounter}`;
  }
  // ユーザーの評価履歴を分析して好みプロファイルを生成
  private analyzeUserPreferences(wines: Wine[], sakes: Sake[]): UserPreferences {
    const preferences: UserPreferences = {
      wine: {
        preferredRegions: {},
        preferredGrapes: {},
        preferredVintageRange: null,
        averageRating: 0,
      },
      sake: {
        preferredBreweries: {},
        preferredTypes: {},
        preferredRegions: {},
        averageRating: 0,
      },
    };

    // ワインの好み分析
    if (wines.length > 0) {
      const highRatedWines = wines.filter(w => w.rating >= RECOMMENDATION_CONFIG.HIGH_RATING_THRESHOLD);
      
      // 地域の好み
      highRatedWines.forEach(wine => {
        if (wine.region) {
          preferences.wine.preferredRegions[wine.region] = 
            (preferences.wine.preferredRegions[wine.region] || 0) + wine.rating;
        }
      });

      // 品種の好み
      highRatedWines.forEach(wine => {
        if (wine.grape) {
          preferences.wine.preferredGrapes[wine.grape] = 
            (preferences.wine.preferredGrapes[wine.grape] || 0) + wine.rating;
        }
      });

      // ヴィンテージの好み
      const vintages = highRatedWines
        .filter(w => w.vintage)
        .map(w => w.vintage!)
        .sort((a, b) => a - b);
      
      if (vintages.length > 0) {
        preferences.wine.preferredVintageRange = {
          min: vintages[0],
          max: vintages[vintages.length - 1],
        };
      }

      // 平均評価
      preferences.wine.averageRating = wines.reduce((sum, w) => sum + w.rating, 0) / wines.length;
    }

    // 日本酒の好み分析
    if (sakes.length > 0) {
      const highRatedSakes = sakes.filter(s => s.rating >= RECOMMENDATION_CONFIG.HIGH_RATING_THRESHOLD);
      
      // 蔵元の好み
      highRatedSakes.forEach(sake => {
        if (sake.brewery) {
          preferences.sake.preferredBreweries[sake.brewery] = 
            (preferences.sake.preferredBreweries[sake.brewery] || 0) + sake.rating;
        }
      });

      // 種類の好み
      highRatedSakes.forEach(sake => {
        if (sake.type) {
          preferences.sake.preferredTypes[sake.type] = 
            (preferences.sake.preferredTypes[sake.type] || 0) + sake.rating;
        }
      });

      // 地域の好み
      highRatedSakes.forEach(sake => {
        if (sake.region) {
          preferences.sake.preferredRegions[sake.region] = 
            (preferences.sake.preferredRegions[sake.region] || 0) + sake.rating;
        }
      });

      // 平均評価
      preferences.sake.averageRating = sakes.reduce((sum, s) => sum + s.rating, 0) / sakes.length;
    }

    return preferences;
  }

  // ワイン同士の類似度を計算
  private calculateWineSimilarity(wine1: Wine, wine2: Wine): number {
    let similarity = 0;
    let totalWeight = 0;

    // 地域の類似度
    if (wine1.region && wine2.region) {
      const regionSimilarity = wine1.region.toLowerCase() === wine2.region.toLowerCase() ? 1 : 0;
      similarity += regionSimilarity * SIMILARITY_WEIGHTS.wine.region;
      totalWeight += SIMILARITY_WEIGHTS.wine.region;
    }

    // 品種の類似度
    if (wine1.grape && wine2.grape) {
      const grapeSimilarity = wine1.grape.toLowerCase() === wine2.grape.toLowerCase() ? 1 : 0;
      similarity += grapeSimilarity * SIMILARITY_WEIGHTS.wine.grape;
      totalWeight += SIMILARITY_WEIGHTS.wine.grape;
    }

    // ヴィンテージの類似度
    if (wine1.vintage && wine2.vintage) {
      const vintageDiff = Math.abs(wine1.vintage - wine2.vintage);
      const vintageSimilarity = Math.max(0, 1 - vintageDiff / 10); // 10年差で類似度0
      similarity += vintageSimilarity * SIMILARITY_WEIGHTS.wine.vintage;
      totalWeight += SIMILARITY_WEIGHTS.wine.vintage;
    }

    return totalWeight > 0 ? similarity / totalWeight : 0;
  }

  // 日本酒同士の類似度を計算
  private calculateSakeSimilarity(sake1: Sake, sake2: Sake): number {
    let similarity = 0;
    let totalWeight = 0;

    // 蔵元の類似度
    if (sake1.brewery && sake2.brewery) {
      const brewerySimilarity = sake1.brewery.toLowerCase() === sake2.brewery.toLowerCase() ? 1 : 0;
      similarity += brewerySimilarity * SIMILARITY_WEIGHTS.sake.brewery;
      totalWeight += SIMILARITY_WEIGHTS.sake.brewery;
    }

    // 種類の類似度
    if (sake1.type && sake2.type) {
      const typeSimilarity = sake1.type === sake2.type ? 1 : 0;
      similarity += typeSimilarity * SIMILARITY_WEIGHTS.sake.type;
      totalWeight += SIMILARITY_WEIGHTS.sake.type;
    }

    // 地域の類似度
    if (sake1.region && sake2.region) {
      const regionSimilarity = sake1.region.toLowerCase() === sake2.region.toLowerCase() ? 1 : 0;
      similarity += regionSimilarity * SIMILARITY_WEIGHTS.sake.region;
      totalWeight += SIMILARITY_WEIGHTS.sake.region;
    }

    return totalWeight > 0 ? similarity / totalWeight : 0;
  }

  // 好みに基づいてワインをスコアリング
  private scoreWineByPreferences(wine: Wine, preferences: UserPreferences['wine']): number {
    let score = 0;

    // 地域スコア
    if (wine.region && preferences.preferredRegions[wine.region]) {
      score += preferences.preferredRegions[wine.region] * 0.4;
    }

    // 品種スコア
    if (wine.grape && preferences.preferredGrapes[wine.grape]) {
      score += preferences.preferredGrapes[wine.grape] * 0.4;
    }

    // ヴィンテージスコア
    if (wine.vintage && preferences.preferredVintageRange) {
      const { min, max } = preferences.preferredVintageRange;
      if (wine.vintage >= min && wine.vintage <= max) {
        score += preferences.averageRating * 0.2;
      }
    }

    return score;
  }

  // 好みに基づいて日本酒をスコアリング
  private scoreSakeByPreferences(sake: Sake, preferences: UserPreferences['sake']): number {
    let score = 0;

    // 蔵元スコア
    if (sake.brewery && preferences.preferredBreweries[sake.brewery]) {
      score += preferences.preferredBreweries[sake.brewery] * 0.3;
    }

    // 種類スコア
    if (sake.type && preferences.preferredTypes[sake.type]) {
      score += preferences.preferredTypes[sake.type] * 0.4;
    }

    // 地域スコア
    if (sake.region && preferences.preferredRegions[sake.region]) {
      score += preferences.preferredRegions[sake.region] * 0.3;
    }

    return score;
  }

  // 推薦理由を生成
  private generateRecommendationReason(
    item: Wine | Sake, 
    type: RecordType, 
    preferences: UserPreferences,
    similarity?: number
  ): string {
    const reasons: string[] = [];

    if (type === 'wine') {
      const wine = item as Wine;
      const winePrefs = preferences.wine;

      if (wine.region && winePrefs.preferredRegions[wine.region]) {
        reasons.push(`好みの産地「${wine.region}」`);
      }
      if (wine.grape && winePrefs.preferredGrapes[wine.grape]) {
        reasons.push(`好みの品種「${wine.grape}」`);
      }
      if (wine.vintage && winePrefs.preferredVintageRange) {
        const { min, max } = winePrefs.preferredVintageRange;
        if (wine.vintage >= min && wine.vintage <= max) {
          reasons.push(`好みのヴィンテージ範囲（${min}-${max}年）`);
        }
      }
    } else {
      const sake = item as Sake;
      const sakePrefs = preferences.sake;

      if (sake.brewery && sakePrefs.preferredBreweries[sake.brewery]) {
        reasons.push(`好みの蔵元「${sake.brewery}」`);
      }
      if (sake.type && sakePrefs.preferredTypes[sake.type]) {
        reasons.push(`好みの種類「${sake.type}」`);
      }
      if (sake.region && sakePrefs.preferredRegions[sake.region]) {
        reasons.push(`好みの産地「${sake.region}」`);
      }
    }

    if (similarity && similarity > RECOMMENDATION_CONFIG.SIMILARITY_THRESHOLD) {
      reasons.push(`類似度${Math.round(similarity * 100)}%`);
    }

    return reasons.length > 0 
      ? reasons.join('、') + 'に基づく推薦'
      : '新しい発見のための推薦';
  }

  // 推薦を生成
  async generateRecommendations(): Promise<Recommendation[]> {
    try {
      // 現在のデータを取得
      const [wines, sakes] = await Promise.all([
        wineService.findAll(),
        sakeService.findAll()
      ]);

      const totalRecords = wines.length + sakes.length;

      // 記録数が少ない場合は空の推薦を返す
      if (totalRecords < RECOMMENDATION_CONFIG.MIN_RECORDS_FOR_RECOMMENDATIONS) {
        return [];
      }

      // ユーザーの好みを分析
      const preferences = this.analyzeUserPreferences(wines, sakes);
      const recommendations: Recommendation[] = [];

      // ワインの推薦を生成
      if (wines.length > 0) {
        const wineRecommendations = await this.generateWineRecommendations(wines, preferences);
        recommendations.push(...wineRecommendations);
      }

      // 日本酒の推薦を生成
      if (sakes.length > 0) {
        const sakeRecommendations = await this.generateSakeRecommendations(sakes, preferences);
        recommendations.push(...sakeRecommendations);
      }

      // スコア順にソートして上位を返す
      return recommendations
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, RECOMMENDATION_CONFIG.MAX_RECOMMENDATIONS);

    } catch (error) {
      console.error('Recommendation generation failed:', error);
      return [];
    }
  }

  // ワインの推薦を生成
  private async generateWineRecommendations(
    userWines: Wine[], 
    preferences: UserPreferences
  ): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = [];
    const highRatedWines = userWines.filter(w => w.rating >= RECOMMENDATION_CONFIG.HIGH_RATING_THRESHOLD);

    // 類似ワインベースの推薦（実際のアプリでは外部APIやデータベースから取得）
    for (const wine of highRatedWines.slice(0, 3)) { // 上位3つの高評価ワインから推薦
      // ここでは既存のワインから類似したものを推薦として生成（実際の実装では外部データを使用）
      const similarWines = userWines.filter(w => 
        w.id !== wine.id && 
        this.calculateWineSimilarity(wine, w) > RECOMMENDATION_CONFIG.SIMILARITY_THRESHOLD
      );

      for (const similarWine of similarWines.slice(0, 2)) {
        const similarity = this.calculateWineSimilarity(wine, similarWine);
        const score = this.scoreWineByPreferences(similarWine, preferences.wine);
        
        if (score > 0) {
          recommendations.push({
            id: this.generateUniqueId(`wine_rec_${similarWine.id}`),
            type: 'wine',
            name: `${similarWine.name}（類似推薦）`,
            reason: this.generateRecommendationReason(similarWine, 'wine', preferences, similarity),
            similarity: similarity + score / 10, // スコアを類似度に加算
            suggestedItem: similarWine,
          });
        }
      }
    }

    // 好みベースの推薦
    const preferenceBasedWines = userWines.filter(w => {
      const score = this.scoreWineByPreferences(w, preferences.wine);
      return score > preferences.wine.averageRating && !highRatedWines.includes(w);
    });

    for (const wine of preferenceBasedWines.slice(0, 2)) {
      const score = this.scoreWineByPreferences(wine, preferences.wine);
      recommendations.push({
        id: this.generateUniqueId(`wine_pref_${wine.id}`),
        type: 'wine',
        name: `${wine.name}（好み推薦）`,
        reason: this.generateRecommendationReason(wine, 'wine', preferences),
        similarity: score / 5, // スコアを類似度に変換
        suggestedItem: wine,
      });
    }

    return recommendations;
  }

  // 日本酒の推薦を生成
  private async generateSakeRecommendations(
    userSakes: Sake[], 
    preferences: UserPreferences
  ): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = [];
    const highRatedSakes = userSakes.filter(s => s.rating >= RECOMMENDATION_CONFIG.HIGH_RATING_THRESHOLD);

    // 類似日本酒ベースの推薦
    for (const sake of highRatedSakes.slice(0, 3)) {
      const similarSakes = userSakes.filter(s => 
        s.id !== sake.id && 
        this.calculateSakeSimilarity(sake, s) > RECOMMENDATION_CONFIG.SIMILARITY_THRESHOLD
      );

      for (const similarSake of similarSakes.slice(0, 2)) {
        const similarity = this.calculateSakeSimilarity(sake, similarSake);
        const score = this.scoreSakeByPreferences(similarSake, preferences.sake);
        
        if (score > 0) {
          recommendations.push({
            id: this.generateUniqueId(`sake_rec_${similarSake.id}`),
            type: 'sake',
            name: `${similarSake.name}（類似推薦）`,
            reason: this.generateRecommendationReason(similarSake, 'sake', preferences, similarity),
            similarity: similarity + score / 10,
            suggestedItem: similarSake,
          });
        }
      }
    }

    // 好みベースの推薦
    const preferenceBasedSakes = userSakes.filter(s => {
      const score = this.scoreSakeByPreferences(s, preferences.sake);
      return score > preferences.sake.averageRating && !highRatedSakes.includes(s);
    });

    for (const sake of preferenceBasedSakes.slice(0, 2)) {
      const score = this.scoreSakeByPreferences(sake, preferences.sake);
      recommendations.push({
        id: this.generateUniqueId(`sake_pref_${sake.id}`),
        type: 'sake',
        name: `${sake.name}（好み推薦）`,
        reason: this.generateRecommendationReason(sake, 'sake', preferences),
        similarity: score / 5,
        suggestedItem: sake,
      });
    }

    return recommendations;
  }

  // 推薦設定を取得
  getRecommendationConfig() {
    return RECOMMENDATION_CONFIG;
  }

  // ユーザーの好みプロファイルを取得（デバッグ用）
  async getUserPreferences(): Promise<UserPreferences> {
    const [wines, sakes] = await Promise.all([
      wineService.findAll(),
      sakeService.findAll()
    ]);
    
    return this.analyzeUserPreferences(wines, sakes);
  }
}

// Export singleton instance
export const recommendationService = new RecommendationService();