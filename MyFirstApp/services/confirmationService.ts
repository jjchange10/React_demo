import { Alert, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

export interface ConfirmationOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
  haptic?: boolean;
}

export class ConfirmationService {
  private static instance: ConfirmationService;

  static getInstance(): ConfirmationService {
    if (!ConfirmationService.instance) {
      ConfirmationService.instance = new ConfirmationService();
    }
    return ConfirmationService.instance;
  }

  async confirm(options: ConfirmationOptions): Promise<boolean> {
    const {
      title = '確認',
      message,
      confirmText = 'OK',
      cancelText = 'キャンセル',
      destructive = false,
      haptic = true
    } = options;

    // Trigger haptic feedback
    if (haptic) {
      await this.triggerHaptic(destructive);
    }

    return new Promise((resolve) => {
      Alert.alert(
        title,
        message,
        [
          {
            text: cancelText,
            style: 'cancel',
            onPress: () => resolve(false),
          },
          {
            text: confirmText,
            style: destructive ? 'destructive' : 'default',
            onPress: () => resolve(true),
          },
        ],
        { cancelable: true, onDismiss: () => resolve(false) }
      );
    });
  }

  async confirmDelete(itemName: string, itemType: string = 'アイテム'): Promise<boolean> {
    return this.confirm({
      title: '削除の確認',
      message: `「${itemName}」を削除しますか？\nこの操作は取り消せません。`,
      confirmText: '削除',
      cancelText: 'キャンセル',
      destructive: true,
      haptic: true,
    });
  }

  async confirmSave(hasChanges: boolean = true): Promise<boolean> {
    if (!hasChanges) {
      return true; // No changes to save
    }

    return this.confirm({
      title: '保存の確認',
      message: '変更を保存しますか？',
      confirmText: '保存',
      cancelText: 'キャンセル',
      destructive: false,
      haptic: false,
    });
  }

  async confirmDiscard(): Promise<boolean> {
    return this.confirm({
      title: '変更を破棄',
      message: '未保存の変更があります。破棄しますか？',
      confirmText: '破棄',
      cancelText: 'キャンセル',
      destructive: true,
      haptic: true,
    });
  }

  private async triggerHaptic(destructive: boolean): Promise<void> {
    try {
      if (destructive) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      } else {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (error) {
      // Haptic feedback might not be available on all devices
      console.warn('Haptic feedback not available:', error);
    }
  }
}

// Export singleton instance
export const confirmationService = ConfirmationService.getInstance();