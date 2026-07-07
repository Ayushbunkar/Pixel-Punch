import { URLSearchParams } from 'url';

const TELEGRAM_API_BASE_URL = "https://api.telegram.org/bot";

export async function sendTelegramNotification(message: string, chatId: string): Promise<{ success: boolean; error?: string }> {
  try {
    if (!chatId) {
      console.error("[telegram.provider] Chat ID is missing for Telegram notification.");
      return { success: false, error: "Telegram chat ID is missing." };
    }
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      console.error("Telegram service is not configured (TELEGRAM_BOT_TOKEN is missing).");
      return { success: false, error: "Telegram service not configured." };
    }

    const params = new URLSearchParams({
      chat_id: chatId,
      text: message,
      parse_mode: "HTML", // or MarkdownV2
    });

    const url = `${TELEGRAM_API_BASE_URL}${botToken}/sendMessage?${params.toString()}`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("[telegram.provider] Telegram API error:", response.status, text);
      return { success: false, error: `Telegram API returned status ${response.status}.` };
    }

    return { success: true };

  } catch (error: any) {
    console.error("[telegram.provider] Unexpected error:", error);
    return { success: false, error: error?.message || "An unexpected server error occurred." };
  }
}
