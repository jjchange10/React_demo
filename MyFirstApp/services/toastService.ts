import { Alert, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastOptions {
  type?: ToastType;
  duration?: number;
  haptic?: boolean;
  retry?: () => void;
}

export class ToastService {
  private static instance: ToastService;
  private toastQueue: Array<{ message: string; options: ToastOptions }> = [];
  private isShowingToast = false;

  static getInstance(): ToastService {
    if (!ToastService.instance) {
      ToastService.instance = new ToastService();
    }
    return ToastService.instance;
  }

  async show(message: string, options: ToastOptions = {}): Promise<void> {
    const {
      type = 'info',
      haptic = true,
      retry
    } = options;

    // Add haptic feedback based on toast type
    if (haptic) {
      await this.triggerHaptic(type);
    }

    // For React Native, we'll use Alert for now
    // In a production app, you might want to use a library like react-native-toast-message
    if (Platform.OS === 'web') {
      // For web, we could implement a custom toast component
      console.log(`[${type.toUpperCase()}] ${message}`);
    } else {
      // For mobile, use Alert with appropriate styling
      const title = this.getAlertTitle(type);
      const buttons = retry 
        ? [
            { text: 'キャンセル', style: 'cancel' },
            { text: 'リトライ', onPress: retry }
          ]
        : [{ text: 'OK' }];

      Alert.alert(title, message, buttons);
    }
  }

  async showSuccess(message: string, options: Omit<ToastOptions, 'type'> = {}): Promise<void> {
    await this.show(message, { ...options, type: 'success' });
  }

  async showError(message: string, options: Omit<ToastOptions, 'type'> = {}): Promise<void> {
    await this.show(message, { ...options, type: 'error' });
  }

  async showWarning(message: string, options: Omit<ToastOptions, 'type'> = {}): Promise<void> {
    await this.show(message, { ...options, type: 'warning' });
  }

  async showInfo(message: string, options: Omit<ToastOptions, 'type'> = {}): Promise<void> {
    await this.show(message, { ...options, type: 'info' });
  }

  private async triggerHaptic(type: ToastType): Promise<void> {
    try {
      switch (type) {
        case 'success':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          break;
        case 'error':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          break;
        case 'warning':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          break;
        default:
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          break;
      }
    } catch (error) {
      // Haptic feedback might not be available on all devices
      console.warn('Haptic feedback not available:', error);
    }
  }

  private getAlertTitle(type: ToastType): string {
    switch (type) {
      case 'success':
        return '成功';
      case 'error':
        return 'エラー';
      case 'warning':
        return '警告';
      case 'info':
      default:
        return '情報';
    }
  }
}

// Export singleton instance
export const toastService = ToastService.getInstance();