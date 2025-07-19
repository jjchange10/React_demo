import React from 'react';
import { FlatList, StyleSheet, RefreshControl } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { SakeCard } from './SakeCard';
import { Sake } from '@/types/sake';
import { useThemeColor } from '@/hooks/useThemeColor';

interface SakeListProps {
  sakes: Sake[];
  onSakePress: (sake: Sake) => void;
  onRefresh?: () => void;
  refreshing?: boolean;
  emptyMessage?: string;
}

export function SakeList({ 
  sakes, 
  onSakePress, 
  onRefresh,
  refreshing = false,
  emptyMessage = '日本酒の記録がありません'
}: SakeListProps) {
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');

  const renderSakeCard = ({ item }: { item: Sake }) => (
    <SakeCard sake={item} onPress={onSakePress} />
  );

  const renderEmptyState = () => (
    <ThemedView style={styles.emptyContainer}>
      <ThemedText style={[styles.emptyIcon, { color: textColor + '66' }]}>
        🍶
      </ThemedText>
      <ThemedText style={[styles.emptyText, { color: textColor + '99' }]}>
        {emptyMessage}
      </ThemedText>
      <ThemedText style={[styles.emptySubtext, { color: textColor + '66' }]}>
        「追加」ボタンから最初の日本酒を記録してみましょう
      </ThemedText>
    </ThemedView>
  );

  const keyExtractor = (item: Sake) => item.id;

  return (
    <FlatList
      data={sakes}
      renderItem={renderSakeCard}
      keyExtractor={keyExtractor}
      style={[styles.container, { backgroundColor }]}
      contentContainerStyle={sakes.length === 0 ? styles.emptyContentContainer : styles.contentContainer}
      showsVerticalScrollIndicator={false}
      ListEmptyComponent={renderEmptyState}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={textColor}
          />
        ) : undefined
      }
      // Performance optimizations
      removeClippedSubviews={true}
      maxToRenderPerBatch={10}
      windowSize={10}
      initialNumToRender={10}
      getItemLayout={(data, index) => ({
        length: 120, // Approximate height of SakeCard
        offset: 120 * index,
        index,
      })}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingVertical: 8,
  },
  emptyContentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});