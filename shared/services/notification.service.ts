import { sendReportEmail } from "./notifications/email.provider";
import { sendTelegramNotification } from "./notifications/telegram.provider";

export interface INotificationProvider {
  send(type: NotificationType, data: NotificationData): Promise<{ success: boolean; error?: string }>;
}

export type NotificationType = "user_email" | "team_email" | "telegram_team";

export interface NotificationData {
  submissionId?: string;
  email?: string;
  scanType?: string;
  recipientName?: string;
  message?: string;
  chatId?: string;
}

export class NotificationService {
  private providers: INotificationProvider[];

  constructor(providers: INotificationProvider[]) {
    this.providers = providers;
  }

  public async sendNotification(type: NotificationType, data: NotificationData): Promise<Array<{ success: boolean; error?: string }>> {
    const results: Array<{ success: boolean; error?: string }> = [];
    for (const provider of this.providers) {
      try {
        const result = await provider.send(type, data);
        results.push(result);
      } catch (error: any) {
        console.error(`[NotificationService] Error sending notification with provider:`, error);
        results.push({ success: false, error: error?.message || "An unexpected error occurred." });
      }
    }
    return results;
  }
}

// Concrete Email Provider
export class EmailNotificationProvider implements INotificationProvider {
  async send(type: NotificationType, data: NotificationData): Promise<{ success: boolean; error?: string }> {
    if (type === "user_email" || type === "team_email") {
      if (!data.submissionId || !data.email || !data.scanType) {
        return { success: false, error: "Missing required data for email notification." };
      }
      return sendReportEmail(data.submissionId, data.email, data.scanType, data.recipientName);
    }
    return { success: true, error: "Email provider does not handle this notification type." };
  }
}

// Concrete Telegram Provider
export class TelegramNotificationProvider implements INotificationProvider {
  async send(type: NotificationType, data: NotificationData): Promise<{ success: boolean; error?: string }> {
    if (type === "telegram_team") {
      if (!data.message || !data.chatId) {
        return { success: false, error: "Missing required data for Telegram notification." };
      }
      return sendTelegramNotification(data.message, data.chatId);
    }
    return { success: true, error: "Telegram provider does not handle this notification type." };
  }
}
