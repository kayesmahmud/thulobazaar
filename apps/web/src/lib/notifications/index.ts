/**
 * Notifications module - Email and SMS notifications
 */

export {
  sendUserNotification,
  sendNotificationByUserId,
} from './notifications';

// Re-export SMS types for convenience
export type { NotificationType } from '../sms';
