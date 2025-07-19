import React, { useState, useEffect } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { RatingInput } from '@/components/common/RatingInput';
import { PhotoPicker } from '@/components/common/PhotoPicker';
import { ValidationMessage } from '@/components/common/ValidationMessage';
import { LoadingIndicator } from '@/components/common/LoadingIndicator';
import { useThemeColor } from '@/hooks/useThemeColor';
import { WineFormData, WineValidation } from '@/types/wine';
import { ValidationError } from '@/types/common';
import { confirmationService } from '@/services/confirmationService';

interface WineFormProps {
  initialData?: Partial<WineFormData>;
  onSubmit: (data: WineFormData) => Promise<void>;
  onCancel?: () => void;
  submitButtonText?: string;
  isLoading?: boolean;
  showConfirmation?: boolean;
}

export function WineForm({
  initialData,
  onSubmit,
  onCancel,
  submitButtonText = '保存',
  isLoading = false,
  showConfirmation = true
}: WineFormProps) {
  const [formData, setFormData] = useState<WineFormData>({
    name: initialData?.name || '',
    region: initialData?.region || '',
    grape: initialData?.grape || '',
    vintage: initialData?.vintage,
    rating: initialData?.rating || 1,
    notes: initialData?.notes || '',
    photoUri: initialData?.photoUri || undefined
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const tintColor = useThemeColor({}, 'tint');
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const borderColor = useThemeColor({}, 'icon');

  const validateForm = (): boolean => {
    try {
      WineValidation.validateFormData(formData);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof ValidationError) {
        setErrors({ general: error.message });
      }
      return false;
    }
  };

  const handleSubmit = async () => {
    if (isSubmitting || isLoading) return;

    if (!validateForm()) {
      // Haptic feedback for validation error
      try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } catch (e) {
        // Ignore haptic errors
      }
      return;
    }

    // Show confirmation if enabled
    if (showConfirmation) {
      const confirmed = await confirmationService.confirmSave(hasChanges);
      if (!confirmed) return;
    }

    setIsSubmitting(true);
    try {
      // Haptic feedback for successful action
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (e) {
        // Ignore haptic errors
      }
      
      await onSubmit(formData);
      setHasChanges(false);
    } catch (error) {
      // Haptic feedback for error
      try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } catch (e) {
        // Ignore haptic errors
      }
      
      if (error instanceof ValidationError) {
        setErrors({ general: error.message });
      } else {
        Alert.alert('エラー', 'ワインの保存に失敗しました');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateField = (field: keyof WineFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
    
    // Clear field-specific errors when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleVintageChange = (text: string) => {
    const numericValue = text.replace(/[^0-9]/g, '');
    if (numericValue === '') {
      updateField('vintage', undefined);
    } else {
      const year = parseInt(numericValue, 10);
      updateField('vintage', year);
    }
  };

  const handleCancel = async () => {
    if (hasChanges && showConfirmation) {
      const confirmed = await confirmationService.confirmDiscard();
      if (!confirmed) return;
    }
    
    if (onCancel) {
      onCancel();
    }
  };

  // Track changes on mount
  useEffect(() => {
    setHasChanges(false);
  }, [initialData]);

  // Show loading overlay if loading
  if (isLoading) {
    return <LoadingIndicator message="データを読み込み中..." overlay />;
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <ThemedView style={styles.formContainer}>
          {/* Wine Name - Required */}
          <View style={styles.fieldContainer}>
            <ThemedText style={styles.label}>
              ワイン名 <ThemedText style={styles.required}>*</ThemedText>
            </ThemedText>
            <TextInput
              style={[
                styles.textInput,
                { 
                  borderColor: errors.name ? '#FF6B6B' : borderColor,
                  color: textColor,
                  backgroundColor: backgroundColor
                }
              ]}
              value={formData.name}
              onChangeText={(text) => updateField('name', text)}
              placeholder="ワイン名を入力"
              placeholderTextColor={borderColor}
              maxLength={100}
              editable={!isLoading && !isSubmitting}
            />
            <ValidationMessage error={errors.name} />
          </View>

          {/* Region */}
          <View style={styles.fieldContainer}>
            <ThemedText style={styles.label}>産地</ThemedText>
            <TextInput
              style={[
                styles.textInput,
                { 
                  borderColor: errors.region ? '#FF6B6B' : borderColor,
                  color: textColor,
                  backgroundColor: backgroundColor
                }
              ]}
              value={formData.region}
              onChangeText={(text) => updateField('region', text)}
              placeholder="産地を入力（例：フランス・ボルドー）"
              placeholderTextColor={borderColor}
              maxLength={100}
              editable={!isLoading && !isSubmitting}
            />
            <ValidationMessage error={errors.region} />
          </View>

          {/* Grape Variety */}
          <View style={styles.fieldContainer}>
            <ThemedText style={styles.label}>品種</ThemedText>
            <TextInput
              style={[
                styles.textInput,
                { 
                  borderColor: errors.grape ? '#FF6B6B' : borderColor,
                  color: textColor,
                  backgroundColor: backgroundColor
                }
              ]}
              value={formData.grape}
              onChangeText={(text) => updateField('grape', text)}
              placeholder="品種を入力（例：カベルネ・ソーヴィニヨン）"
              placeholderTextColor={borderColor}
              maxLength={100}
              editable={!isLoading && !isSubmitting}
            />
            <ValidationMessage error={errors.grape} />
          </View>

          {/* Vintage */}
          <View style={styles.fieldContainer}>
            <ThemedText style={styles.label}>ヴィンテージ</ThemedText>
            <TextInput
              style={[
                styles.textInput,
                { 
                  borderColor: errors.vintage ? '#FF6B6B' : borderColor,
                  color: textColor,
                  backgroundColor: backgroundColor
                }
              ]}
              value={formData.vintage?.toString() || ''}
              onChangeText={handleVintageChange}
              placeholder="年を入力（例：2020）"
              placeholderTextColor={borderColor}
              keyboardType="numeric"
              maxLength={4}
              editable={!isLoading && !isSubmitting}
            />
            <ValidationMessage error={errors.vintage} />
          </View>

          {/* Rating - Required */}
          <RatingInput
            rating={formData.rating}
            onRatingChange={(rating) => updateField('rating', rating)}
            label={
              <ThemedText style={styles.label}>
                評価 <ThemedText style={styles.required}>*</ThemedText>
              </ThemedText>
            }
            disabled={isLoading || isSubmitting}
            error={errors.rating}
          />

          {/* Photo */}
          <PhotoPicker
            photoUri={formData.photoUri}
            onPhotoSelected={(uri) => updateField('photoUri', uri || undefined)}
            label="写真"
            disabled={isLoading || isSubmitting}
            error={errors.photoUri}
          />

          {/* Notes */}
          <View style={styles.fieldContainer}>
            <ThemedText style={styles.label}>メモ</ThemedText>
            <TextInput
              style={[
                styles.textAreaInput,
                { 
                  borderColor: errors.notes ? '#FF6B6B' : borderColor,
                  color: textColor,
                  backgroundColor: backgroundColor
                }
              ]}
              value={formData.notes}
              onChangeText={(text) => updateField('notes', text)}
              placeholder="味わいや感想を入力"
              placeholderTextColor={borderColor}
              multiline
              numberOfLines={4}
              maxLength={500}
              textAlignVertical="top"
              editable={!isLoading && !isSubmitting}
            />
            <ValidationMessage error={errors.notes} />
          </View>

          {/* General Error */}
          <ValidationMessage error={errors.general} />

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            {onCancel && (
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={handleCancel}
                disabled={isLoading || isSubmitting}
              >
                <ThemedText style={styles.cancelButtonText}>
                  キャンセル
                </ThemedText>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity
              style={[
                styles.button,
                styles.submitButton,
                { backgroundColor: tintColor },
                (isLoading || isSubmitting) && styles.disabledButton
              ]}
              onPress={handleSubmit}
              disabled={isLoading || isSubmitting}
            >
              <ThemedText style={styles.submitButtonText}>
                {isSubmitting ? '保存中...' : submitButtonText}
              </ThemedText>
            </TouchableOpacity>
          </View>
        </ThemedView>
      </ScrollView>
    </KeyboardAvoidingView>
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
    paddingBottom: 150,
  },
  formContainer: {
    padding: 16,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  required: {
    color: '#FF6B6B',
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 48,
  },
  textAreaInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 100,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  submitButton: {
    // backgroundColor set dynamically
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#666',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.6,
  },
});