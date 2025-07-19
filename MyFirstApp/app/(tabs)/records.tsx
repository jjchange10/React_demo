import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { WineList } from '@/components/wine/WineList';
import { SakeList } from '@/components/sake/SakeList';
import { useRecords } from '@/context/RecordsContext';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Wine } from '@/types/wine';
import { Sake } from '@/types/sake';

type TabType = 'wine' | 'sake';

export default function RecordsScreen() {
  const router = useRouter();
  const { wines, sakes, loading, refreshData } = useRecords();
  const [activeTab, setActiveTab] = useState<TabType>('wine');

  const tintColor = useThemeColor({}, 'tint');
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');

  const handleWinePress = (wine: Wine) => {
    router.push(`/wine/${wine.id}`);
  };

  const handleSakePress = (sake: Sake) => {
    router.push(`/sake/${sake.id}`);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ThemedView style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <ThemedText style={styles.headerTitle}>記録一覧</ThemedText>
        </View>

      {/* Tab Switcher */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'wine' && { backgroundColor: tintColor }
          ]}
          onPress={() => setActiveTab('wine')}
        >
          <ThemedText
            style={[
              styles.tabText,
              activeTab === 'wine' && { color: 'white' }
            ]}
          >
            🍷 ワイン ({wines.length})
          </ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'sake' && { backgroundColor: tintColor }
          ]}
          onPress={() => setActiveTab('sake')}
        >
          <ThemedText
            style={[
              styles.tabText,
              activeTab === 'sake' && { color: 'white' }
            ]}
          >
            🍶 日本酒 ({sakes.length})
          </ThemedText>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {activeTab === 'wine' ? (
          <WineList
            wines={wines}
            onWinePress={handleWinePress}
            onRefresh={refreshData}
            refreshing={loading}
            emptyMessage="ワインの記録がありません"
          />
        ) : (
          <SakeList
            sakes={sakes}
            onSakePress={handleSakePress}
            onRefresh={refreshData}
            refreshing={loading}
            emptyMessage="日本酒の記録がありません"
          />
        )}
        </View>
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
  header: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    lineHeight: 32,
    paddingTop: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
    alignItems: 'center',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
});