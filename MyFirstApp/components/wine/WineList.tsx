import React from 'react';
import { FlatList, StyleSheet, RefreshControl } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { WineCard } from './WineCard';
import { Wine } from '@/types/wine';
import { useThemeColor } from '@/hooks/useThemeColor';

interface WineListProps {
  wines: Wine[];
  onWinePress: (wine: Wine) => void;
  onRefresh?: () => void;
  refreshing?: boolean;
  emptyMessage?: string;
}

export function WineList({ 
  wines, 
  onWinePress, 
  onRefresh,
  refreshing = false,
  emptyMessage = 'ワインの記録がありません'
}: WineListProps) {
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');

  const renderWineCard = ({ item }: { item: Wine }) => (
    <WineCard wine={item} onPress={onWinePress} />
  );

  const renderEmptyState = () => (
    <ThemedView style={styles.emptyContainer}>
      <ThemedText style={[styles.emptyIcon, { color: textColor + '66' }]}>
        🍷
      </ThemedText>
      <ThemedText style={[styles.emptyText, { color: textColor + '99' }]}>
        {emptyMessage}
      </ThemedText>
      <ThemedText style={[styles.emptySubtext, { color: textColor + '66' }]}>
        「追加」ボタンから最初のワインを記録してみましょう
      </ThemedText>
    </ThemedView>
  );

  const keyExtractor = (item: Wine) => item.id;

  return (
    <FlatList
      data={wines}
      renderItem={renderWineCard}
      keyExtractor={keyExtractor}
      style={[styles.container, { backgroundColor }]}
      contentContainerStyle={wines.length === 0 ? styles.emptyContentContainer : styles.contentContainer}
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
        length: 120, // Approximate height of WineCard
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