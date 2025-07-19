import React, { useState } from 'react';
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
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { RatingInput } from '@/components/common/RatingInput';
import { PhotoPicker } from '@/components/common/PhotoPicker';
import { ValidationMessage } from '@/components/common/ValidationMessage';
import { useThemeColor } from '@/hooks/useThemeColor';
import { SakeFormData, SakeValidation, SAKE_TYPES } from '@/types/sake';
import { ValidationError } from '@/types/common';

interface SakeFormProps {
  initialData?: Partial<SakeFormData>;
  onSubmit: (data: SakeFormData) => Promise<void>;
  onCancel?: () => void;
  submitButtonText?: string;
  isLoading?: boolean;
}

export function SakeForm({
  initialData,
  onSubmit,
  onCancel,
  submitButtonText = '保存',
  isLoading = false
}: SakeFormProps) {
  const [formData, setFormData] = useState<SakeFormData>({
    name: initialData?.name || '',
    brewery: initialData?.brewery || '',
    type: initialData?.type || '',
    region: initialData?.region || '',
    rating: initialData?.rating || 1,
    notes: initialData?.notes || '',
    photoUri: initialData?.photoUri || undefined
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showTypeOptions, setShowTypeOptions] = useState(false);

  const tintColor = useThemeColor({}, 'tint');
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const borderColor = useThemeColor({}, 'icon');

  const validateForm = (): boolean => {
    try {
      SakeValidation.validateFormData(formData);
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
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      if (error instanceof ValidationError) {
        setErrors({ general: error.message });
      } else {
        Alert.alert('エラー', '日本酒の保存に失敗しました');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateField = (field: keyof SakeFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear field-specific errors when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleTypeSelect = (type: string) => {
    updateField('type', type);
    setShowTypeOptions(false);
  };

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
          {/* Sake Name - Required */}
          <View style={styles.fieldContainer}>
            <ThemedText style={styles.label}>
              銘柄名 <ThemedText style={styles.required}>*</ThemedText>
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
              placeholder="銘柄名を入力"
              placeholderTextColor={borderColor}
              maxLength={100}
              editable={!isLoading && !isSubmitting}
            />
            <ValidationMessage error={errors.name} />
          </View>

          {/* Brewery */}
          <View style={styles.fieldContainer}>
            <ThemedText style={styles.label}>蔵元</ThemedText>
            <TextInput
              style={[
                styles.textInput,
                { 
                  borderColor: errors.brewery ? '#FF6B6B' : borderColor,
                  color: textColor,
                  backgroundColor: backgroundColor
                }
              ]}
              value={formData.brewery}
              onChangeText={(text) => updateField('brewery', text)}
              placeholder="蔵元を入力（例：獺祭）"
              placeholderTextColor={borderColor}
              maxLength={100}
              editable={!isLoading && !isSubmitting}
            />
            <ValidationMessage error={errors.brewery} />
          </View>

          {/* Type */}
          <View style={styles.fieldContainer}>
            <ThemedText style={styles.label}>種類</ThemedText>
            <TouchableOpacity
              style={[
                styles.textInput,
                styles.selectInput,
                { 
                  borderColor: errors.type ? '#FF6B6B' : borderColor,
                  backgroundColor: backgroundColor
                }
              ]}
              onPress={() => setShowTypeOptions(!showTypeOptions)}
              disabled={isLoading || isSubmitting}
            >
              <ThemedText style={[
                styles.selectText,
                { color: formData.type ? textColor : borderColor }
              ]}>
                {formData.type || '種類を選択（例：純米酒）'}
              </ThemedText>
            </TouchableOpacity>
            
            {showTypeOptions && (
              <View style={[styles.optionsContainer, { backgroundColor: backgroundColor, borderColor }]}>
                <ScrollView style={styles.optionsScroll} nestedScrollEnabled>
                  {SAKE_TYPES.map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={styles.optionItem}
                      onPress={() => handleTypeSelect(type)}
                    >
                      <ThemedText style={styles.optionText}>{type}</ThemedText>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
            <ValidationMessage error={errors.type} />
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
              placeholder="産地を入力（例：山口県）"
              placeholderTextColor={borderColor}
              maxLength={100}
              editable={!isLoading && !isSubmitting}
            />
            <ValidationMessage error={errors.region} />
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
                onPress={onCancel}
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
  selectInput: {
    justifyContent: 'center',
  },
  selectText: {
    fontSize: 16,
  },
  textAreaInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 100,
  },
  optionsContainer: {
    borderWidth: 1,
    borderRadius: 8,
    marginTop: 4,
    maxHeight: 200,
  },
  optionsScroll: {
    maxHeight: 200,
  },
  optionItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  optionText: {
    fontSize: 16,
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