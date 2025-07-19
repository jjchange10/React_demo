import React from 'react';
import { View, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Sake } from '@/types/sake';

interface SakeCardProps {
  sake: Sake;
  onPress: (sake: Sake) => void;
}

export function SakeCard({ sake, onPress }: SakeCardProps) {
  const backgroundColor = useThemeColor({}, 'background');
  const borderColor = useThemeColor({}, 'icon');
  const textColor = useThemeColor({}, 'text');

  const renderRating = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <ThemedText key={index} style={styles.star}>
        {index < rating ? '★' : '☆'}
      </ThemedText>
    ));
  };

  const formatDetails = () => {
    const details = [];
    if (sake.brewery) details.push(sake.brewery);
    if (sake.type) details.push(sake.type);
    if (sake.region) details.push(sake.region);
    return details.join(' • ');
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        { 
          backgroundColor,
          borderColor: borderColor + '30' // Add transparency
        }
      ]}
      onPress={() => onPress(sake)}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`日本酒: ${sake.name}`}
    >
      <ThemedView style={styles.content}>
        {/* Photo */}
        <View style={styles.photoContainer}>
          {sake.photoUri ? (
            <Image 
              source={{ uri: sake.photoUri }} 
              style={styles.photo}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.photoPlaceholder, { borderColor }]}>
              <ThemedText style={[styles.photoPlaceholderText, { color: borderColor }]}>
                🍶
              </ThemedText>
            </View>
          )}
        </View>

        {/* Content */}
        <View style={styles.textContent}>
          {/* Sake Name */}
          <ThemedText style={styles.name} numberOfLines={1}>
            {sake.name}
          </ThemedText>

          {/* Details */}
          {formatDetails() && (
            <ThemedText style={[styles.details, { color: textColor + 'CC' }]} numberOfLines={1}>
              {formatDetails()}
            </ThemedText>
          )}

          {/* Rating */}
          <View style={styles.ratingContainer}>
            <View style={styles.stars}>
              {renderRating(sake.rating)}
            </View>
            <ThemedText style={[styles.ratingText, { color: textColor + 'CC' }]}>
              ({sake.rating}/5)
            </ThemedText>
          </View>

          {/* Notes Preview */}
          {sake.notes && (
            <ThemedText style={[styles.notes, { color: textColor + '99' }]} numberOfLines={2}>
              {sake.notes}
            </ThemedText>
          )}

          {/* Date */}
          <ThemedText style={[styles.date, { color: textColor + '66' }]}>
            {new Date(sake.createdAt).toLocaleDateString('ja-JP')}
          </ThemedText>
        </View>
      </ThemedView>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
  },
  content: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: 'rgba(255,255,255,0.95)',
  },
  photoContainer: {
    marginRight: 16,
  },
  photo: {
    width: 90,
    height: 90,
    borderRadius: 12,
  },
  photoPlaceholder: {
    width: 90,
    height: 90,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(78,205,196,0.1)',
  },
  photoPlaceholderText: {
    fontSize: 36,
  },
  textContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
    flexShrink: 1,
    lineHeight: 24,
    paddingTop: 2,
  },
  details: {
    fontSize: 14,
    marginBottom: 8,
    flexShrink: 1,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  stars: {
    flexDirection: 'row',
    marginRight: 8,
  },
  star: {
    fontSize: 16,
    color: '#FFD700',
    marginRight: 2,
  },
  ratingText: {
    fontSize: 12,
  },
  notes: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  date: {
    fontSize: 12,
    alignSelf: 'flex-end',
  },
});