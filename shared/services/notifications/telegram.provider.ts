import { URLSearchParams } from 'url';
import { Logger } from '../../utils/logger';
import config from '../../config';

const TELEGRAM_API_BASE_URL = "https://api.telegram.org/bot";

export async function sendTelegramNotification(message: string, chatId?: string): Promise<{ success: boolean; error?: string }> {
  try {
    const botToken = config.telegram.botToken;
    const targetChatId = chatId || config.telegram.chatIdTeam;

    if (!targetChatId) {
      Logger.error("[telegram.provider] Chat ID is missing for Telegram notification. Ensure TELEGRAM_CHAT_ID_TEAM is set in config or provided as an argument.");
      return { success: false, error: "Telegram chat ID is missing." };
    }

    const url = `${TELEGRAM_API_BASE_URL}${botToken}/sendMessage`;
    const requestBody = {
      chat_id: String(targetChatId),
      text: message,
      parse_mode: "HTML",
      link_preview_options: {
        is_disabled: true
      }
    };

    // Log request details
    Logger.debug(`[telegram.provider] Sending Telegram message to chat ID: ${targetChatId}`);
    Logger.debug(`[telegram.provider] Request URL: ${url}`);
    Logger.debug(`[telegram.provider] Request Payload: ${JSON.stringify(requestBody)}`);
    Logger.debug(`[telegram.provider] Bot Token (masked): ${botToken.substring(0, 5)}...${botToken.substring(botToken.length - 5)}`);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    const responseText = await response.text();
    Logger.debug(`[telegram.provider] Telegram API Response Status: ${response.status}`);
    Logger.debug(`[telegram.provider] Telegram API Response Body: ${responseText}`);

    if (!response.ok) {
      const errorResponse = JSON.parse(responseText);
      if (response.status === 400 && errorResponse.description && errorResponse.description.includes("chat not found")) {
        Logger.error(`[telegram.provider] Telegram API error: Chat not found for chat ID: ${targetChatId}. Please ensure the chat ID is correct in your .env file and the bot has access to the chat.`);
      } else {
        Logger.error("[telegram.provider] Telegram API error:", response.status, responseText);
      }
      return { success: false, error: `Telegram API returned status ${response.status}: ${responseText}` };
    }

    return { success: true };

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    Logger.error("[telegram.provider] Unexpected error:", errorMessage);
    return { success: false, error: errorMessage || "An unexpected server error occurred." };
  }
}
