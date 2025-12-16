/**
 * Browser Notification Service
 */

let notificationPermission: NotificationPermission = 'default';

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    return false;
  }

  if (Notification.permission === 'granted') {
    notificationPermission = 'granted';
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    notificationPermission = permission;
    return permission === 'granted';
  }

  return false;
}

export function hasNotificationPermission(): boolean {
  return notificationPermission === 'granted';
}

export function isTabVisible(): boolean {
  return !document.hidden;
}

interface ShowNotificationOptions {
  title: string;
  body: string;
  tag?: string;
  onClick?: () => void;
}

export function showNotification(options: ShowNotificationOptions): void {
  if (!hasNotificationPermission()) {
    return;
  }

  // Only show notification if tab is not visible
  if (isTabVisible()) {
    return;
  }

  const notification = new Notification(options.title, {
    body: options.body,
    tag: options.tag,
    icon: '/assets/vezlo.png',
    badge: '/assets/vezlo.png',
  });

  if (options.onClick) {
    notification.onclick = () => {
      window.focus();
      options.onClick?.();
      notification.close();
    };
  }
}

export function truncateMessage(message: string, maxLength: number = 50): string {
  if (message.length <= maxLength) {
    return message;
  }
  return message.substring(0, maxLength) + '...';
}

