import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useThemeColor } from '@/hooks/useThemeColor';

interface RatingInputProps {
  rating: number;
  onRatingChange: (rating: number) => void;
  maxRating?: number;
  size?: number;
  disabled?: boolean;
  label?: string;
  error?: string;
}

export function RatingInput({
  rating,
  onRatingChange,
  maxRating = 5,
  size = 30,
  disabled = false,
  label,
  error
}: RatingInputProps) {
  const tintColor = useThemeColor({}, 'tint');
  const iconColor = useThemeColor({}, 'icon');
  
  const renderStar = (index: number) => {
    const isFilled = index < rating;
    const starColor = isFilled ? '#FFD700' : iconColor;
    
    return (
      <TouchableOpacity
        key={index}
        onPress={() => !disabled && onRatingChange(index + 1)}
        style={[styles.starButton, { opacity: disabled ? 0.5 : 1 }]}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={`${index + 1} star${index === 0 ? '' : 's'}`}
      >
        <ThemedText style={[styles.star, { fontSize: size, color: starColor }]}>
          {isFilled ? '★' : '☆'}
        </ThemedText>
      </TouchableOpacity>
    );
  };

  return (
    <ThemedView style={styles.container}>
      {label && (
        <ThemedText style={styles.label}>{label}</ThemedText>
      )}
      <View style={styles.starsContainer}>
        {Array.from({ length: maxRating }, (_, index) => renderStar(index))}
      </View>
      {error && (
        <ThemedText style={[styles.errorText, { color: '#FF6B6B' }]}>
          {error}
        </ThemedText>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  starsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starButton: {
    padding: 4,
    marginRight: 4,
  },
  star: {
    textAlign: 'center',
  },
  errorText: {
    fontSize: 14,
    marginTop: 4,
  },
});