
// shared/config/index.ts

interface AppConfig {
  telegram: {
    botToken: string;
    chatIdTeam: string;
  };
  brevo: {
    apiKey: string;
  };
  pdf: {
    puppeteerExecutablePath?: string;
  };
  email: {
    teamEmail: string;
  };
  // Add other configurations as needed
}

class ConfigError extends Error {
  constructor(message: string) {
    super(`Configuration Error: ${message}`);
    this.name = 'ConfigError';
  }
}

function validateEnv(key: string, value: string | undefined): string {
  if (!value) {
    throw new ConfigError(`Missing required environment variable: ${key}`);
  }
  return value;
}

const config: AppConfig = {
  telegram: {
    botToken: validateEnv('TELEGRAM_BOT_TOKEN', process.env.TELEGRAM_BOT_TOKEN),
    chatIdTeam: validateEnv('TELEGRAM_CHAT_ID_TEAM', process.env.TELEGRAM_CHAT_ID_TEAM),
  },
  brevo: {
    apiKey: validateEnv('BREVO_API_KEY', process.env.BREVO_API_KEY),
  },
  pdf: {
    puppeteerExecutablePath: process.env.PUPPETEER_EXECUTABLE_PATH, // Optional
  },
  email: {
    teamEmail: validateEnv('TEAM_EMAIL_ADDRESS', process.env.TEAM_EMAIL_ADDRESS),
  },
};

export default config;
