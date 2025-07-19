import React, { useLayoutEffect } from 'react';
import { Alert } from 'react-native';
import { useLocalSearchParams, useRouter, useNavigation } from 'expo-router';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { WineForm } from '@/components/wine/WineForm';
import { useRecords } from '@/context/RecordsContext';
import { WineFormData } from '@/types/wine';
import { ValidationError } from '@/types/common';

export default function EditWineScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const navigation = useNavigation();
  const { wines, updateWine, loading } = useRecords();

  const wine = wines.find(w => w.id === id);

  useLayoutEffect(() => {
    if (wine) {
      navigation.setOptions({
        title: `${wine.name.length > 15 ? wine.name.substring(0, 15) + '...' : wine.name}を編集`,
      });
    }
  }, [navigation, wine]);

  if (!wine) {
    return (
      <ThemedView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 }}>
        <ThemedText style={{ fontSize: 18, textAlign: 'center', marginBottom: 24 }}>
          編集するワインが見つかりません
        </ThemedText>
      </ThemedView>
    );
  }

  const handleSubmit = async (formData: WineFormData) => {
    try {
      await updateWine(wine.id, {
        name: formData.name,
        region: formData.region || undefined,
        grape: formData.grape || undefined,
        vintage: formData.vintage,
        rating: formData.rating,
        notes: formData.notes || undefined,
        photoUri: formData.photoUri
      });

      Alert.alert(
        '更新完了',
        'ワインの情報を更新しました',
        [
          {
            text: 'OK',
            onPress: () => router.back()
          }
        ]
      );
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error; // Let WineForm handle validation errors
      }
      throw new Error('ワインの更新に失敗しました');
    }
  };

  const handleCancel = () => {
    router.back();
  };

  const initialData: WineFormData = {
    name: wine.name,
    region: wine.region || '',
    grape: wine.grape || '',
    vintage: wine.vintage,
    rating: wine.rating,
    notes: wine.notes || '',
    photoUri: wine.photoUri
  };

  return (
    <ThemedView style={{ flex: 1 }}>
      <WineForm
        initialData={initialData}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        submitButtonText="更新"
        isLoading={loading}
      />
    </ThemedView>
  );
}