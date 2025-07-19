import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { WineForm } from '@/components/wine/WineForm';
import { SakeForm } from '@/components/sake/SakeForm';
import { useRecords } from '@/context/RecordsContext';
import { useThemeColor } from '@/hooks/useThemeColor';
import { WineFormData } from '@/types/wine';
import { SakeFormData } from '@/types/sake';
import { ValidationError } from '@/types/common';

type AddType = 'wine' | 'sake' | null;

export default function AddScreen() {
  const { addWine, addSake, loading } = useRecords();
  const [selectedType, setSelectedType] = useState<AddType>(null);

  const tintColor = useThemeColor({}, 'tint');

  const handleAddWine = async (formData: WineFormData) => {
    try {
      await addWine({
        name: formData.name,
        region: formData.region || undefined,
        grape: formData.grape || undefined,
        vintage: formData.vintage,
        rating: formData.rating,
        notes: formData.notes || undefined,
        photoUri: formData.photoUri
      });

      setSelectedType(null);
      Alert.alert('追加完了', 'ワインを追加しました');
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error; // Let WineForm handle validation errors
      }
      throw new Error('ワインの追加に失敗しました');
    }
  };

  const handleAddSake = async (formData: SakeFormData) => {
    try {
      await addSake({
        name: formData.name,
        brewery: formData.brewery || undefined,
        type: formData.type || undefined,
        region: formData.region || undefined,
        rating: formData.rating,
        notes: formData.notes || undefined,
        photoUri: formData.photoUri
      });

      setSelectedType(null);
      Alert.alert('追加完了', '日本酒を追加しました');
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error; // Let SakeForm handle validation errors
      }
      throw new Error('日本酒の追加に失敗しました');
    }
  };

  const handleCancel = () => {
    setSelectedType(null);
  };

  if (selectedType === 'wine') {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <ThemedView style={styles.content}>
          <View style={styles.header}>
            <ThemedText style={styles.headerTitle}>ワインを追加</ThemedText>
          </View>
          <WineForm
            onSubmit={handleAddWine}
            onCancel={handleCancel}
            submitButtonText="追加"
            isLoading={loading}
          />
        </ThemedView>
      </SafeAreaView>
    );
  }

  if (selectedType === 'sake') {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <ThemedView style={styles.content}>
          <View style={styles.header}>
            <ThemedText style={styles.headerTitle}>日本酒を追加</ThemedText>
          </View>
          <SakeForm
            onSubmit={handleAddSake}
            onCancel={handleCancel}
            submitButtonText="追加"
            isLoading={loading}
          />
        </ThemedView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ThemedView style={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <ThemedText style={styles.headerTitle}>記録を追加</ThemedText>
        <ThemedText style={styles.headerSubtitle}>
          追加したい種類を選択してください
        </ThemedText>
      </View>

      {/* Selection Options */}
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.optionsContainer}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity
          style={[styles.optionCard, { borderColor: tintColor }]}
          onPress={() => setSelectedType('wine')}
          disabled={loading}
        >
          <View style={styles.optionIcon}>
            <ThemedText style={styles.optionEmoji}>🍷</ThemedText>
          </View>
          <ThemedText style={styles.optionTitle}>ワイン</ThemedText>
          <ThemedText style={styles.optionDescription}>
            ワインの記録を追加します{'\n'}
            名前、産地、品種、ヴィンテージなど
          </ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.optionCard, { borderColor: tintColor }]}
          onPress={() => setSelectedType('sake')}
          disabled={loading}
        >
          <View style={styles.optionIcon}>
            <ThemedText style={styles.optionEmoji}>🍶</ThemedText>
          </View>
          <ThemedText style={styles.optionTitle}>日本酒</ThemedText>
          <ThemedText style={styles.optionDescription}>
            日本酒の記録を追加します{'\n'}
            銘柄名、蔵元、種類、産地など
          </ThemedText>
        </TouchableOpacity>
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
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 32,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    lineHeight: 32,
    paddingTop: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    opacity: 0.7,
    textAlign: 'center',
    lineHeight: 22,
    paddingTop: 2,
  },
  scrollView: {
    flex: 1,
  },
  optionsContainer: {
    paddingHorizontal: 16,
    paddingTop: 32,
    paddingBottom: 150,
    gap: 16,
  },
  optionCard: {
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderWidth: 2,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    minHeight: 180,
    justifyContent: 'center',
  },
  optionIcon: {
    marginBottom: 16,
  },
  optionEmoji: {
    fontSize: 48,
  },
  optionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  optionDescription: {
    fontSize: 14,
    opacity: 0.7,
    textAlign: 'center',
    lineHeight: 20,
  },
});