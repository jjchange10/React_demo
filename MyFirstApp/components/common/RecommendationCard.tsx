import React from 'react';
import { 
  View, 
  TouchableOpacity, 
  StyleSheet, 
  Dimensions 
} from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Recommendation } from '@/types/common';

interface RecommendationCardProps {
  recommendation: Recommendation;
  onPress?: () => void;
}

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 32;

export function RecommendationCard({ recommendation, onPress }: RecommendationCardProps) {
  const tintColor = useThemeColor({}, 'tint');
  const iconColor = useThemeColor({}, 'icon');
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');

  const getSimilarityColor = (similarity: number) => {
    if (similarity >= 0.8) return '#4CAF50'; // Green
    if (similarity >= 0.6) return '#FF9800'; // Orange
    return '#2196F3'; // Blue
  };

  const getSimilarityText = (similarity: number) => {
    if (similarity >= 0.8) return '非常におすすめ';
    if (similarity >= 0.6) return 'おすすめ';
    return '試してみる価値あり';
  };

  const getTypeIcon = (type: string) => {
    return type === 'wine' ? '🍷' : '🍶';
  };

  const getTypeLabel = (type: string) => {
    return type === 'wine' ? 'ワイン' : '日本酒';
  };

  return (
    <TouchableOpacity
      style={[
        styles.card,
        { 
          backgroundColor,
          shadowColor: textColor,
        }
      ]}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`${recommendation.name}のおすすめ`}
    >
      <View style={styles.content}>
        {/* ヘッダー部分 */}
        <View style={styles.header}>
          <View style={styles.typeContainer}>
            <ThemedText style={styles.typeIcon}>
              {getTypeIcon(recommendation.type)}
            </ThemedText>
            <ThemedText style={[styles.typeLabel, { color: iconColor }]}>
              {getTypeLabel(recommendation.type)}
            </ThemedText>
          </View>
          
          <View style={[
            styles.similarityBadge, 
            { backgroundColor: getSimilarityColor(recommendation.similarity) + '20' }
          ]}>
            <ThemedText style={[
              styles.similarityText, 
              { color: getSimilarityColor(recommendation.similarity) }
            ]}>
              {getSimilarityText(recommendation.similarity)}
            </ThemedText>
          </View>
        </View>

        {/* メイン情報 */}
        <ThemedText style={styles.title} numberOfLines={2}>
          {recommendation.name}
        </ThemedText>

        {/* 推薦理由 */}
        <View style={styles.reasonContainer}>
          <ThemedText style={[styles.reasonLabel, { color: tintColor }]}>
            おすすめの理由
          </ThemedText>
          <ThemedText style={[styles.reasonText, { color: iconColor }]} numberOfLines={3}>
            {recommendation.reason}
          </ThemedText>
        </View>

        {/* 類似度表示 */}
        <View style={styles.footer}>
          <View style={styles.similarityContainer}>
            <View style={styles.similarityLabelContainer}>
              <ThemedText style={[styles.similarityLabel, { color: iconColor }]}>
                類似度
              </ThemedText>
              <ThemedText style={[styles.similarityPercentage, { color: getSimilarityColor(recommendation.similarity) }]}>
                {Math.min(Math.max(Math.round(recommendation.similarity * 100), 0), 100)}%
              </ThemedText>
            </View>
            <View style={[styles.similarityBar, { backgroundColor: getSimilarityColor(recommendation.similarity) + '20' }]}>
              <View 
                style={[
                  styles.similarityFill,
                  { 
                    width: `${Math.min(Math.max(recommendation.similarity * 100, 0), 100)}%`,
                    backgroundColor: getSimilarityColor(recommendation.similarity)
                  }
                ]}
              />
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 16,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  content: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  typeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeIcon: {
    fontSize: 20,
    marginRight: 6,
  },
  typeLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  similarityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  similarityText: {
    fontSize: 12,
    fontWeight: '600',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    lineHeight: 24,
    paddingTop: 2,
  },
  reasonContainer: {
    marginBottom: 16,
  },
  reasonLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
    lineHeight: 20,
    paddingTop: 1,
  },
  reasonText: {
    fontSize: 14,
    lineHeight: 20,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
    paddingTop: 16,
    marginTop: 4,
  },
  similarityContainer: {
    flexDirection: 'column',
  },
  similarityLabelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  similarityLabel: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
    paddingTop: 1,
  },
  similarityBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  similarityFill: {
    height: '100%',
    borderRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  similarityPercentage: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 18,
    paddingTop: 1,
  },
});