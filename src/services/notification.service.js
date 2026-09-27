import { Notification } from '../models/notification.model.js';

export class NotificationService {
  /**
   * Dispatch In-App Notification
   */
  static async sendNotification({ userId, title, message, type = 'GENERAL', linkUrl = '' }) {
    return Notification.create({
      user_id: userId,
      title,
      message,
      type,
      link_url: linkUrl,
    });
  }

  /**
   * Fetch User Unread Notifications
   */
  static async getUserNotifications(userId) {
    const [unread, all] = await Promise.all([
      Notification.countDocuments({ user_id: userId, is_read: false }),
      Notification.find({ user_id: userId }).sort({ createdAt: -1 }).limit(30),
    ]);

    return {
      unread_count: unread,
      notifications: all,
    };
  }

  /**
   * Mark as Read
   */
  static async markAsRead(notificationId) {
    return Notification.findByIdAndUpdate(
      notificationId,
      { is_read: true, read_at: new Date() },
      { new: true }
    );
  }

  /**
   * Mark all as read
   */
  static async markAllAsRead(userId) {
    return Notification.updateMany(
      { user_id: userId, is_read: false },
      { is_read: true, read_at: new Date() }
    );
  }
}

export default NotificationService;
