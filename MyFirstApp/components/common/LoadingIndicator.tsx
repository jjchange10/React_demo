import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { ThemedText } from '../ThemedText';
import { ThemedView } from '../ThemedView';
import { useThemeColor } from '../../hooks/useThemeColor';

interface LoadingIndicatorProps {
  message?: string;
  size?: 'small' | 'large';
  overlay?: boolean;
}

export function LoadingIndicator({ 
  message = '読み込み中...', 
  size = 'large',
  overlay = false 
}: LoadingIndicatorProps) {
  const backgroundColor = useThemeColor({}, 'background');
  const tintColor = useThemeColor({}, 'tint');

  const containerStyle = overlay 
    ? [styles.overlay, { backgroundColor: `${backgroundColor}CC` }]
    : styles.container;

  return (
    <ThemedView style={containerStyle}>
      <View style={styles.content}>
        <ActivityIndicator 
          size={size} 
          color={tintColor}
          style={styles.spinner}
        />
        {message && (
          <ThemedText style={styles.message}>
            {message}
          </ThemedText>
        )}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinner: {
    marginBottom: 16,
  },
  message: {
    textAlign: 'center',
    fontSize: 16,
    opacity: 0.8,
  },
});