import React, { useState, useLayoutEffect } from 'react';
import {
  View,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Share,
  Dimensions
} from 'react-native';
import { useLocalSearchParams, useRouter, useNavigation } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useRecords } from '@/context/RecordsContext';
import { Wine } from '@/types/wine';

const { width } = Dimensions.get('window');
const IMAGE_SIZE = Math.min(width * 0.8, 300);

export default function WineDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const navigation = useNavigation();
  const { wines, deleteWine, loading } = useRecords();
  const [isDeleting, setIsDeleting] = useState(false);

  const tintColor = useThemeColor({}, 'tint');
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const borderColor = useThemeColor({}, 'icon');

  const wine = wines.find((w: Wine) => w.id === id);

  useLayoutEffect(() => {
    if (wine) {
      navigation.setOptions({
        title: wine.name.length > 20 ? wine.name.substring(0, 20) + '...' : wine.name,
      });
    }
  }, [navigation, wine]);

  if (!wine) {
    return (
      <ThemedView style={styles.container}>
        <ThemedView style={styles.errorContainer}>
          <ThemedText style={styles.errorText}>
            ワインが見つかりません
          </ThemedText>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: tintColor }]}
            onPress={() => router.back()}
          >
            <ThemedText style={styles.buttonText}>戻る</ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </ThemedView>
    );
  }

  const renderRating = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <ThemedText key={index} style={styles.star}>
        {index < rating ? '★' : '☆'}
      </ThemedText>
    ));
  };

  const handleEdit = () => {
    router.push(`/wine/edit/${wine.id}`);
  };

  const handleDelete = () => {
    Alert.alert(
      'ワインを削除',
      `「${wine.name}」を削除しますか？この操作は取り消せません。`,
      [
        { text: 'キャンセル', style: 'cancel' },
        { 
          text: '削除', 
          style: 'destructive',
          onPress: confirmDelete
        }
      ]
    );
  };

  const confirmDelete = async () => {
    if (isDeleting) return;

    setIsDeleting(true);
    try {
      await deleteWine(wine.id);
      router.back();
    } catch (error) {
      Alert.alert('エラー', 'ワインの削除に失敗しました');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleShare = async () => {
    try {
      const details = [];
      if (wine.region) details.push(`産地: ${wine.region}`);
      if (wine.grape) details.push(`品種: ${wine.grape}`);
      if (wine.vintage) details.push(`ヴィンテージ: ${wine.vintage}年`);
      
      const message = [
        `🍷 ${wine.name}`,
        `評価: ${'★'.repeat(wine.rating)}${'☆'.repeat(5 - wine.rating)} (${wine.rating}/5)`,
        ...details,
        wine.notes ? `メモ: ${wine.notes}` : '',
        `記録日: ${new Date(wine.createdAt).toLocaleDateString('ja-JP')}`
      ].filter(Boolean).join('\n');

      await Share.share({
        message,
        title: `ワイン記録: ${wine.name}`
      });
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Photo */}
        <View style={styles.photoSection}>
          {wine.photoUri ? (
            <Image 
              source={{ uri: wine.photoUri }} 
              style={styles.photo}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.photoPlaceholder, { borderColor }]}>
              <ThemedText style={[styles.photoPlaceholderText, { color: borderColor }]}>
                🍷
              </ThemedText>
            </View>
          )}
        </View>

        {/* Wine Information */}
        <ThemedView style={styles.infoSection}>
          {/* Name */}
          <ThemedText style={styles.name}>{wine.name}</ThemedText>

          {/* Rating */}
          <View style={styles.ratingSection}>
            <View style={styles.stars}>
              {renderRating(wine.rating)}
            </View>
            <ThemedText style={[styles.ratingText, { color: textColor + 'CC' }]}>
              {wine.rating}/5
            </ThemedText>
          </View>

          {/* Details */}
          <View style={styles.detailsSection}>
            {wine.region && (
              <View style={styles.detailRow}>
                <ThemedText style={[styles.detailLabel, { color: textColor + 'CC' }]}>
                  産地
                </ThemedText>
                <ThemedText style={styles.detailValue}>
                  {wine.region}
                </ThemedText>
              </View>
            )}

            {wine.grape && (
              <View style={styles.detailRow}>
                <ThemedText style={[styles.detailLabel, { color: textColor + 'CC' }]}>
                  品種
                </ThemedText>
                <ThemedText style={styles.detailValue}>
                  {wine.grape}
                </ThemedText>
              </View>
            )}

            {wine.vintage && (
              <View style={styles.detailRow}>
                <ThemedText style={[styles.detailLabel, { color: textColor + 'CC' }]}>
                  ヴィンテージ
                </ThemedText>
                <ThemedText style={styles.detailValue}>
                  {wine.vintage}年
                </ThemedText>
              </View>
            )}
          </View>

          {/* Notes */}
          {wine.notes && (
            <View style={styles.notesSection}>
              <ThemedText style={[styles.sectionTitle, { color: textColor + 'CC' }]}>
                メモ
              </ThemedText>
              <ThemedText style={styles.notesText}>
                {wine.notes}
              </ThemedText>
            </View>
          )}

          {/* Timestamps */}
          <View style={styles.timestampSection}>
            <ThemedText style={[styles.timestampLabel, { color: textColor + '66' }]}>
              記録日: {formatDate(wine.createdAt)}
            </ThemedText>
            {wine.updatedAt.getTime() !== wine.createdAt.getTime() && (
              <ThemedText style={[styles.timestampLabel, { color: textColor + '66' }]}>
                更新日: {formatDate(wine.updatedAt)}
              </ThemedText>
            )}
          </View>
        </ThemedView>
      </ScrollView>

      {/* Action Buttons */}
      <ThemedView style={styles.actionSection}>
        <TouchableOpacity
          style={[styles.actionButton, styles.shareButton]}
          onPress={handleShare}
          disabled={loading}
        >
          <ThemedText style={styles.shareButtonText}>共有</ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: tintColor }]}
          onPress={handleEdit}
          disabled={loading}
        >
          <ThemedText style={styles.actionButtonText}>編集</ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={handleDelete}
          disabled={loading || isDeleting}
        >
          <ThemedText style={styles.deleteButtonText}>
            {isDeleting ? '削除中...' : '削除'}
          </ThemedText>
        </TouchableOpacity>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100, // Space for action buttons
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 24,
  },
  photoSection: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  photo: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    borderRadius: 12,
  },
  photoPlaceholder: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoPlaceholderText: {
    fontSize: 64,
  },
  infoSection: {
    padding: 24,
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 36,
    paddingTop: 4,
  },
  ratingSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  stars: {
    flexDirection: 'row',
    marginRight: 12,
  },
  star: {
    fontSize: 24,
    color: '#FFD700',
    marginRight: 4,
  },
  ratingText: {
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 24,
    paddingTop: 2,
  },
  detailsSection: {
    marginBottom: 24,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E0E0E0',
  },
  detailLabel: {
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 22,
    paddingTop: 2,
  },
  detailValue: {
    fontSize: 16,
    textAlign: 'right',
    flex: 1,
    marginLeft: 16,
  },
  notesSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    lineHeight: 24,
    paddingTop: 2,
  },
  notesText: {
    fontSize: 16,
    lineHeight: 24,
  },
  timestampSection: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E0E0E0',
    paddingTop: 16,
  },
  timestampLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  actionSection: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E0E0E0',
  },
  actionButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#666',
  },
  deleteButton: {
    backgroundColor: '#FF6B6B',
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
    paddingTop: 1,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
    paddingTop: 1,
  },
  shareButtonText: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
    paddingTop: 1,
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
    paddingTop: 1,
  },
});