
// shared/utils/browser-factory.ts

import { Browser, launch, executablePath as puppeteerCoreExecutablePath } from "puppeteer-core";
import chromium from "@sparticuz/chromium-min";
import fs from "fs";
import { Logger } from "./logger";
import config from "../config";

export class BrowserFactory {
  public static async create(): Promise<Browser> {
    let executablePath: string | undefined;
    let launchArgs: string[] = ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"];
    let browserInstance: Browser;

    Logger.debug(`[BrowserFactory] NODE_ENV: ${process.env.NODE_ENV}, VERCEL: ${process.env.VERCEL}, PUPPETEER_EXECUTABLE_PATH (from config): ${config.pdf.puppeteerExecutablePath}`);

    const isVercel = process.env.VERCEL === '1';
    const isDevelopment = process.env.NODE_ENV === 'development' && !isVercel;

    if (isDevelopment) {
      Logger.info("[BrowserFactory] Detected development environment. Launching Puppeteer without explicit executablePath.");
      // In development, Puppeteer uses its bundled Chromium. No explicit executablePath needed.
      // We still need to ensure the args are set.
    } else if (isVercel) {
      Logger.info("[BrowserFactory] Detected Vercel environment. Using @sparticuz/chromium-min with remote binary.");
      try {
        // chromium-min requires a remote URL to download the Chromium binary
        const chromiumRemoteUrl = "https://github.com/Sparticuz/chromium/releases/download/v149.0.0/chromium-v149.0.0-pack.tar";
        executablePath = await chromium.executablePath(chromiumRemoteUrl);
        launchArgs = [...chromium.args, ...launchArgs];
      } catch (e: any) {
        Logger.error(`[BrowserFactory] chromium.executablePath() failed in Vercel environment: ${e.message}`);
        throw new Error(`Failed to find Chromium executable for Vercel: ${e.message}`);
      }
    } else { // Production (non-Vercel) or explicit PUPPETEER_EXECUTABLE_PATH provided
      Logger.info("[BrowserFactory] Detected non-development, non-Vercel environment. Attempting to resolve executablePath.");
      executablePath = config.pdf.puppeteerExecutablePath;

      if (!executablePath) {
        Logger.info("[BrowserFactory] PUPPETEER_EXECUTABLE_PATH not set. Attempting to auto-detect Chromium.");
        try {
          executablePath = puppeteerCoreExecutablePath();
          if (executablePath) {
            Logger.info(`[BrowserFactory] Using puppeteer-core auto-detected Chromium at: ${executablePath}`);
          } else {
            Logger.warn("[BrowserFactory] puppeteer-core could not auto-detect Chromium executable.");
          }
        } catch (e: any) {
          Logger.warn(`[BrowserFactory] Error during puppeteer-core auto-detection: ${e.message}`);
        }
      }
 
      if (!executablePath && process.platform === "win32") {
        Logger.info("[BrowserFactory] Running on Windows. Searching standard Google Chrome install locations...");
        const standardWindowsPaths = [
          "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
          "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
          `${process.env.LOCALAPPDATA || "C:\\Users\\Default\\AppData\\Local"}\\Google\\Chrome\\Application\\chrome.exe`,
          `${process.env.USERPROFILE || "C:\\Users\\Default"}\\AppData\\Local\\Google\\Chrome\\Application\\chrome.exe`
        ];
        for (const p of standardWindowsPaths) {
          if (fs.existsSync(p)) {
            executablePath = p;
            Logger.info(`[BrowserFactory] Auto-detected Google Chrome at: ${executablePath}`);
            break;
          }
        }
      }

      if (!executablePath) {
        const errorMessage = `Chromium executable path is undefined. For non-development, non-Vercel environments, please ensure PUPPETEER_EXECUTABLE_PATH is set or Chromium is installed in a standard location.`;
        Logger.error(`[BrowserFactory] ${errorMessage}`);
        throw new Error(errorMessage);
      }

      if (!fs.existsSync(executablePath)) {
        const errorMessage = `Chromium executable not found at: ${executablePath}. Please ensure the path is correct.`;
        Logger.error(`[BrowserFactory] ${errorMessage}`);
        throw new Error(errorMessage);
      }
    }

    Logger.info(`[BrowserFactory] Resolved executablePath: ${executablePath || 'N/A (development)'}`);
    Logger.info(`[BrowserFactory] Launch args: ${JSON.stringify(launchArgs)}`);
    Logger.info(`[BrowserFactory] Launching Puppeteer with executablePath: ${executablePath || 'N/A (development)'}`);

    try {
      const launchOptions: Parameters<typeof launch>[0] = {
        args: launchArgs,
        headless: true,
      };

      if (executablePath) {
        launchOptions.executablePath = executablePath;
      }

      browserInstance = await launch(launchOptions);
      Logger.info(`[BrowserFactory] BrowserFactory result: Browser launched successfully.`);
      return browserInstance;
    } catch (error: any) {
      Logger.error(`[BrowserFactory] Error launching Puppeteer: ${error.message}`);
      throw error; // Re-throw original error
    }
  }
}
