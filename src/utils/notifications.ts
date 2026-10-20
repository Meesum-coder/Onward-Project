import { isWithinQuietHours } from './routineCalculations.ts';

export interface InAppNotification {
  id: string;
  title: string;
  message: string;
  timestamp: Date;
  type: 'reminder' | 'streak' | 'info';
}

export type NotificationPermissionState = 'granted' | 'denied' | 'default' | 'unsupported';

export function getNotificationPermissionState(): NotificationPermissionState {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
}

export async function requestBrowserNotificationPermission(): Promise<NotificationPermissionState> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  try {
    const res = await Notification.requestPermission();
    return res;
  } catch (err) {
    console.error('Error requesting notification permission:', err);
    return Notification.permission;
  }
}

export function dispatchNotification({
  title,
  body,
  wakeTime,
  sleepTime,
  quietHoursEnabled,
  onInAppFallback,
}: {
  title: string;
  body: string;
  wakeTime?: string;
  sleepTime?: string;
  quietHoursEnabled: boolean;
  onInAppFallback?: (n: InAppNotification) => void;
}): boolean {
  const now = new Date();

  // FR-042: Check quiet hours
  if (quietHoursEnabled && wakeTime && sleepTime) {
    if (isWithinQuietHours(now, wakeTime, sleepTime)) {
      // Suppressed during quiet hours
      return false;
    }
  }

  // Check browser notification support
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(title, {
        body,
        icon: '/favicon.ico',
      });
      return true;
    } catch {
      // Fallback to in-app notification
    }
  }

  // FR-044: In-app fallback notification
  if (onInAppFallback) {
    onInAppFallback({
      id: `toast_${Date.now()}_${Math.random()}`,
      title,
      message: body,
      timestamp: now,
      type: 'reminder',
    });
  }

  return false;
}
