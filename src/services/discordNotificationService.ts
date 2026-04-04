import { NotificationType } from '../enums/notification.enums';
import { Notification } from '../models/notificationModel';
import { NotificationDelivery } from '../models/notificationDeliveryModel';

export class DiscordNotificationService {
  /**
     * Send a notification to Discord by storing it in the database
     */
  static async sendNotification({
    type,
    username
  }: {
    type: NotificationType;
    username: string;
  }): Promise<void> {
    const notification = await Notification.findOne({ type }).lean();
    if (!notification) {
      throw new Error(`Notification definition for type '${type}' not found.`);
    }

    console.log(`[Discord] Notify ${username}: ${notification.title} - ${notification.summary}`);

    // Record delivery attempt // TODO: can I do findAndUpdate instead of create
    await NotificationDelivery.create({
      notificationId: notification._id,
      username,
      deliveredAt: null,
      attempts: 0,
      lastAttemptAt: null,
      error: null,
      claimedAt: null
    });
  }

  static async sendGameFinished(username: string) {
    await this.sendNotification({
      type: NotificationType.GAME_FINISHED,
      username
    });
  }

  static async sendNewChallenge(username: string) {
    await this.sendNotification({
      type: NotificationType.NEW_CHALLENGE,
      username
    });
  }

  static async sendGameDeleted(username: string) {
    await this.sendNotification({
      type: NotificationType.GAME_DELETED,
      username
    });
  }

  static async sendYourTurn(username: string) {
    await this.sendNotification({
      type: NotificationType.YOUR_TURN,
      username
    });
  }
}
