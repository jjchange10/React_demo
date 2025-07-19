import React from 'react';
import { 
  View, 
  TouchableOpacity, 
  Image, 
  StyleSheet, 
  Dimensions 
} from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Wine } from '@/types/wine';
import { Sake } from '@/types/sake';
import { RecordType } from '@/types/common';

interface RecordCardProps {
  record: Wine | Sake;
  type: RecordType;
  onPress?: () => void;
}

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 32;
const IMAGE_SIZE = 80;

export function RecordCard({ record, type, onPress }: RecordCardProps) {
  const tintColor = useThemeColor({}, 'tint');
  const iconColor = useThemeColor({}, 'icon');
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <ThemedText 
        key={index} 
        style={[
          styles.star, 
          { color: index < rating ? '#FFD700' : iconColor }
        ]}
      >
        {index < rating ? '★' : '☆'}
      </ThemedText>
    ));
  };

  const getSubtitle = () => {
    if (type === 'wine') {
      const wine = record as Wine;
      const parts = [];
      if (wine.region) parts.push(wine.region);
      if (wine.grape) parts.push(wine.grape);
      if (wine.vintage) parts.push(`${wine.vintage}年`);
      return parts.join(' • ');
    } else {
      const sake = record as Sake;
      const parts = [];
      if (sake.brewery) parts.push(sake.brewery);
      if (sake.type) parts.push(sake.type);
      if (sake.region) parts.push(sake.region);
      return parts.join(' • ');
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
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
      accessibilityLabel={`${record.name}の記録`}
    >
      <View style={styles.content}>
        {/* 画像部分 */}
        <View style={styles.imageContainer}>
          {record.photoUri ? (
            <Image 
              source={{ uri: record.photoUri }} 
              style={styles.image}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.imagePlaceholder, { backgroundColor: iconColor + '20' }]}>
              <ThemedText style={[styles.imagePlaceholderText, { color: iconColor }]}>
                {type === 'wine' ? '🍷' : '🍶'}
              </ThemedText>
            </View>
          )}
        </View>

        {/* テキスト部分 */}
        <View style={styles.textContainer}>
          <ThemedText style={styles.title} numberOfLines={1}>
            {record.name}
          </ThemedText>
          
          {getSubtitle() && (
            <ThemedText style={[styles.subtitle, { color: iconColor }]} numberOfLines={1}>
              {getSubtitle()}
            </ThemedText>
          )}

          <View style={styles.ratingContainer}>
            {renderStars(record.rating)}
          </View>

          {record.notes && (
            <ThemedText style={[styles.notes, { color: iconColor }]} numberOfLines={2}>
              {record.notes}
            </ThemedText>
          )}

          <ThemedText style={[styles.date, { color: iconColor }]}>
            {formatDate(record.createdAt)}
          </ThemedText>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  content: {
    flexDirection: 'row',
    padding: 16,
  },
  imageContainer: {
    marginRight: 16,
  },
  image: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    borderRadius: 8,
  },
  imagePlaceholder: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholderText: {
    fontSize: 32,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  star: {
    fontSize: 16,
    marginRight: 2,
  },
  notes: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  date: {
    fontSize: 12,
  },
});