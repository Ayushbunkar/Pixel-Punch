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

    const url = `${TELEGRAM_API_BASE_URL}${botToken}/sendMessage`;
    const requestBody = {
      chat_id: chatId,
      text: message,
      parse_mode: "HTML",
    };

    // Log request details
    console.log(`[telegram.provider] Sending Telegram message to chat ID: ${chatId}`);
    console.log(`[telegram.provider] Request URL: ${url}`);
    console.log(`[telegram.provider] Request Payload: ${JSON.stringify(requestBody)}`);
    console.log(`[telegram.provider] Bot Token (masked): ${botToken.substring(0, 5)}...${botToken.substring(botToken.length - 5)}`);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    const responseText = await response.text();
    console.log(`[telegram.provider] Telegram API Response Status: ${response.status}`);
    console.log(`[telegram.provider] Telegram API Response Body: ${responseText}`);

    if (!response.ok) {
      console.error("[telegram.provider] Telegram API error:", response.status, responseText);
      return { success: false, error: `Telegram API returned status ${response.status}: ${responseText}` };
    }

    return { success: true };

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[telegram.provider] Unexpected error:", errorMessage);
    return { success: false, error: errorMessage || "An unexpected server error occurred." };
  }
}
