import React from 'react';
import { StyleSheet } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

interface ValidationMessageProps {
  error?: string;
  success?: string;
}

export function ValidationMessage({ error, success }: ValidationMessageProps) {
  if (!error && !success) return null;

  return (
    <ThemedView style={styles.container}>
      {error && (
        <ThemedText style={[styles.text, styles.errorText]}>
          {error}
        </ThemedText>
      )}
      {success && (
        <ThemedText style={[styles.text, styles.successText]}>
          {success}
        </ThemedText>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 4,
  },
  text: {
    fontSize: 14,
  },
  errorText: {
    color: '#FF6B6B',
  },
  successText: {
    color: '#4CAF50',
  },
});