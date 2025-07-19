import React from 'react';
import { View, TouchableOpacity, StyleSheet, ScrollView, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useRecords } from '@/context/RecordsContext';
import { useThemeColor } from '@/hooks/useThemeColor';
import { RecommendationCard } from '@/components/common/RecommendationCard';
import { Recommendation } from '@/types/common';

export default function HomeScreen() {
  const router = useRouter();
  const { wines, sakes, recommendations } = useRecords();
  const tintColor = useThemeColor({}, 'tint');

  const totalRecords = wines.length + sakes.length;
  const averageRating = totalRecords > 0 
    ? ((wines.reduce((sum, wine) => sum + wine.rating, 0) + sakes.reduce((sum, sake) => sum + sake.rating, 0)) / totalRecords).toFixed(1)
    : '0';

  // Handle recommendation item tap
  const handleRecommendationPress = (recommendation: Recommendation) => {
    const item = recommendation.suggestedItem;
    if (recommendation.type === 'wine') {
      router.push(`/wine/${item.id}`);
    } else {
      router.push(`/sake/${item.id}`);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ThemedView style={styles.content}>
        <ScrollView 
          style={styles.scrollView} 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <ThemedText style={styles.title}>Taste Journal</ThemedText>
            <ThemedText style={styles.subtitle}>
              ワインと日本酒の記録帳
            </ThemedText>
          </View>
          <View style={styles.headerEmoji}>
            <ThemedText style={styles.emojiText}>🍷</ThemedText>
          </View>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: '#FF6B6B20' }]}>
            <View style={styles.statIconContainer}>
              <ThemedText style={styles.statIcon}>🍷</ThemedText>
            </View>
            <ThemedText style={styles.statNumber}>{wines.length}</ThemedText>
            <ThemedText style={styles.statLabel}>ワイン</ThemedText>
          </View>
          
          <View style={[styles.statCard, { backgroundColor: '#4ECDC420' }]}>
            <View style={styles.statIconContainer}>
              <ThemedText style={styles.statIcon}>🍶</ThemedText>
            </View>
            <ThemedText style={styles.statNumber}>{sakes.length}</ThemedText>
            <ThemedText style={styles.statLabel}>日本酒</ThemedText>
          </View>
          
          <View style={[styles.statCard, { backgroundColor: '#45B7D120' }]}>
            <View style={styles.statIconContainer}>
              <ThemedText style={styles.statIcon}>⭐</ThemedText>
            </View>
            <ThemedText style={styles.statNumber}>{averageRating}</ThemedText>
            <ThemedText style={styles.statLabel}>平均評価</ThemedText>
          </View>
        </View>

        {/* Recommendations Section */}
        {totalRecords === 0 ? (
          <View style={styles.emptyState}>
            <ThemedText style={styles.emptyIcon}>🍾</ThemedText>
            <ThemedText style={styles.emptyTitle}>記録を始めましょう</ThemedText>
            <ThemedText style={styles.emptyText}>
              最初のワインや日本酒を記録して、{'\n'}
              あなたの味わい体験を残しましょう
            </ThemedText>
          </View>
        ) : totalRecords < 3 ? (
          <View style={styles.recommendationsContainer}>
            <ThemedText style={styles.sectionTitle}>おすすめ</ThemedText>
            <View style={styles.insufficientDataContainer}>
              <ThemedText style={styles.insufficientDataIcon}>📊</ThemedText>
              <ThemedText style={styles.insufficientDataTitle}>
                もっと記録を追加してください
              </ThemedText>
              <ThemedText style={styles.insufficientDataText}>
                おすすめ機能を利用するには、{'\n'}
                最低3件の記録が必要です（現在: {totalRecords}件）
              </ThemedText>
            </View>
          </View>
        ) : (
          <View style={styles.recommendationsContainer}>
            <ThemedText style={styles.sectionTitle}>あなたへのおすすめ</ThemedText>
            {recommendations.length > 0 ? (
              <FlatList
                data={recommendations}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <RecommendationCard
                    recommendation={item}
                    onPress={() => handleRecommendationPress(item)}
                  />
                )}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.recommendationsList}
              />
            ) : (
              <View style={styles.noRecommendationsContainer}>
                <ThemedText style={styles.noRecommendationsIcon}>🤔</ThemedText>
                <ThemedText style={styles.noRecommendationsText}>
                  現在おすすめを生成中です...{'\n'}
                  しばらくお待ちください
                </ThemedText>
              </View>
            )}
          </View>
        )}

        {/* Recent Activity Summary */}
        {totalRecords > 0 && (
          <View style={styles.recentContainer}>
            <ThemedText style={styles.sectionTitle}>記録サマリー</ThemedText>
            <ThemedText style={styles.recentText}>
              合計 {totalRecords} 件の記録があります
            </ThemedText>
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.actionsContainer}>
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.actionButton, styles.primaryAction]}
              onPress={() => router.push('/(tabs)/add')}
            >
              <View style={styles.actionIconContainer}>
                <ThemedText style={styles.actionIcon}>+</ThemedText>
              </View>
              <View style={styles.actionTextContainer}>
                <ThemedText style={styles.actionButtonText}>記録を追加</ThemedText>
                <ThemedText style={styles.actionSubtext}>新しい体験を記録</ThemedText>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.secondaryAction]}
              onPress={() => router.push('/(tabs)/records')}
            >
              <View style={styles.actionIconContainer}>
                <ThemedText style={styles.actionIcon}>📊</ThemedText>
              </View>
              <View style={styles.actionTextContainer}>
                <ThemedText style={styles.actionButtonText}>記録一覧</ThemedText>
                <ThemedText style={styles.actionSubtext}>過去の記録を確認</ThemedText>
              </View>
            </TouchableOpacity>
          </View>
        </View>
        </ScrollView>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 250,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 32,
    marginBottom: 16,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 4,
    letterSpacing: -0.5,
    lineHeight: 40,
    paddingTop: 4,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.6,
    fontWeight: '500',
    lineHeight: 22,
    paddingTop: 2,
  },
  headerEmoji: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FF6B6B15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emojiText: {
    fontSize: 24,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 32,
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    minHeight: 100,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statIcon: {
    fontSize: 20,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 4,
    lineHeight: 36,
    paddingTop: 4,
  },
  statLabel: {
    fontSize: 13,
    fontWeight: '600',
    opacity: 0.8,
    textAlign: 'center',
    lineHeight: 18,
    paddingTop: 2,
  },
  actionsContainer: {
    paddingHorizontal: 16,
    marginBottom: 100,
  },
  actionRow: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  primaryAction: {
    backgroundColor: '#FF6B6B',
  },
  secondaryAction: {
    backgroundColor: '#4ECDC4',
  },
  actionIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  actionIcon: {
    fontSize: 20,
    color: 'white',
    fontWeight: '600',
  },
  actionTextContainer: {
    flex: 1,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 2,
    lineHeight: 24,
    paddingTop: 2,
  },
  actionSubtext: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
    paddingTop: 1,
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.7,
    lineHeight: 24,
  },
  recommendationsContainer: {
    paddingHorizontal: 16,
    marginBottom: 32,
  },
  recommendationsList: {
    paddingLeft: 0,
  },
  insufficientDataContainer: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 12,
  },
  insufficientDataIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  insufficientDataTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  insufficientDataText: {
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.7,
    lineHeight: 20,
  },
  noRecommendationsContainer: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 12,
  },
  noRecommendationsIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  noRecommendationsText: {
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.7,
    lineHeight: 20,
  },
  recentContainer: {
    paddingHorizontal: 16,
    marginBottom: 32,
  },
  recentText: {
    fontSize: 16,
    opacity: 0.7,
  },
});
