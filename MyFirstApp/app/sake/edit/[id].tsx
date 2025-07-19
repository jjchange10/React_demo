import React, { useLayoutEffect } from 'react';
import { Alert } from 'react-native';
import { useLocalSearchParams, useRouter, useNavigation } from 'expo-router';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { SakeForm } from '@/components/sake/SakeForm';
import { useRecords } from '@/context/RecordsContext';
import { SakeFormData } from '@/types/sake';
import { ValidationError } from '@/types/common';

export default function EditSakeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const navigation = useNavigation();
  const { sakes, updateSake, loading } = useRecords();

  const sake = sakes.find(s => s.id === id);

  useLayoutEffect(() => {
    if (sake) {
      navigation.setOptions({
        title: `${sake.name.length > 15 ? sake.name.substring(0, 15) + '...' : sake.name}を編集`,
      });
    }
  }, [navigation, sake]);

  if (!sake) {
    return (
      <ThemedView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 }}>
        <ThemedText style={{ fontSize: 18, textAlign: 'center', marginBottom: 24 }}>
          編集する日本酒が見つかりません
        </ThemedText>
      </ThemedView>
    );
  }

  const handleSubmit = async (formData: SakeFormData) => {
    try {
      await updateSake(sake.id, {
        name: formData.name,
        brewery: formData.brewery || undefined,
        type: formData.type || undefined,
        region: formData.region || undefined,
        rating: formData.rating,
        notes: formData.notes || undefined,
        photoUri: formData.photoUri
      });

      Alert.alert(
        '更新完了',
        '日本酒の情報を更新しました',
        [
          {
            text: 'OK',
            onPress: () => router.back()
          }
        ]
      );
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error; // Let SakeForm handle validation errors
      }
      throw new Error('日本酒の更新に失敗しました');
    }
  };

  const handleCancel = () => {
    router.back();
  };

  const initialData: SakeFormData = {
    name: sake.name,
    brewery: sake.brewery || '',
    type: sake.type || '',
    region: sake.region || '',
    rating: sake.rating,
    notes: sake.notes || '',
    photoUri: sake.photoUri
  };

  return (
    <ThemedView style={{ flex: 1 }}>
      <SakeForm
        initialData={initialData}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        submitButtonText="更新"
        isLoading={loading}
      />
    </ThemedView>
  );
}