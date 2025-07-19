import React, { useState } from 'react';
import { 
  View, 
  TouchableOpacity, 
  Image, 
  StyleSheet, 
  Alert,
  Dimensions 
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useThemeColor } from '@/hooks/useThemeColor';

interface PhotoPickerProps {
  photoUri?: string;
  onPhotoSelected: (uri: string | null) => void;
  label?: string;
  error?: string;
  disabled?: boolean;
}

const { width } = Dimensions.get('window');
const PHOTO_SIZE = Math.min(width * 0.4, 150);

export function PhotoPicker({
  photoUri,
  onPhotoSelected,
  label,
  error,
  disabled = false
}: PhotoPickerProps) {
  const tintColor = useThemeColor({}, 'tint');
  const iconColor = useThemeColor({}, 'icon');
  const backgroundColor = useThemeColor({}, 'background');
  const [isLoading, setIsLoading] = useState(false);

  const requestPermissions = async () => {
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    const { status: mediaStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (cameraStatus !== 'granted' || mediaStatus !== 'granted') {
      Alert.alert(
        '権限が必要です',
        'カメラとフォトライブラリへのアクセス権限が必要です。',
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
  };

  const showImagePicker = async () => {
    if (disabled || isLoading) return;
    
    const hasPermissions = await requestPermissions();
    if (!hasPermissions) return;

    Alert.alert(
      '写真を選択',
      '写真の取得方法を選択してください',
      [
        { text: 'キャンセル', style: 'cancel' },
        { text: 'カメラ', onPress: () => openCamera() },
        { text: 'フォトライブラリ', onPress: () => openImageLibrary() },
        ...(photoUri ? [{ text: '写真を削除', onPress: () => removePhoto(), style: 'destructive' as const }] : [])
      ]
    );
  };

  const openCamera = async () => {
    setIsLoading(true);
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        onPhotoSelected(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert('エラー', 'カメラの起動に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const openImageLibrary = async () => {
    setIsLoading(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        onPhotoSelected(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Image library error:', error);
      Alert.alert('エラー', 'フォトライブラリの起動に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const removePhoto = () => {
    onPhotoSelected(null);
  };

  return (
    <ThemedView style={styles.container}>
      {label && (
        <ThemedText style={styles.label}>{label}</ThemedText>
      )}
      
      <TouchableOpacity
        style={[
          styles.photoContainer,
          { 
            borderColor: error ? '#FF6B6B' : iconColor,
            opacity: disabled ? 0.5 : 1 
          }
        ]}
        onPress={showImagePicker}
        disabled={disabled || isLoading}
        accessibilityRole="button"
        accessibilityLabel={photoUri ? "写真を変更" : "写真を追加"}
      >
        {photoUri ? (
          <Image 
            source={{ uri: photoUri }} 
            style={styles.photo}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.placeholder}>
            <ThemedText style={[styles.placeholderIcon, { color: iconColor }]}>
              📷
            </ThemedText>
            <ThemedText style={[styles.placeholderText, { color: iconColor }]}>
              {isLoading ? '読み込み中...' : '写真を追加'}
            </ThemedText>
          </View>
        )}
      </TouchableOpacity>

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
  photoContainer: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    borderRadius: 8,
    borderWidth: 2,
    borderStyle: 'dashed',
    overflow: 'hidden',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  placeholderIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  placeholderText: {
    fontSize: 14,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 14,
    marginTop: 4,
  },
});