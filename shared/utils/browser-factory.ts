
// shared/utils/browser-factory.ts

import { Browser, launch, executablePath } from "puppeteer-core";
import chromium from "@sparticuz/chromium-min";
import fs from "fs";
import { Logger } from "./logger";
import config from "../config";

export class BrowserFactory {
  public static async create(): Promise<Browser> {
    let executablePath: string | undefined = config.pdf.puppeteerExecutablePath;
    let launchArgs: string[] = ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"];
    let browserInstance: Browser;

    Logger.debug(`[BrowserFactory] NODE_ENV: ${process.env.NODE_ENV}, VERCEL: ${process.env.VERCEL}, PUPPETEER_EXECUTABLE_PATH (from config): ${executablePath}`);

    // Determine environment
    const isVercel = process.env.VERCEL === '1';
    const isProduction = process.env.NODE_ENV === 'production';

    if (isVercel) {
      // Vercel environment: use @sparticuz/chromium
      Logger.info("[BrowserFactory] Detected Vercel environment. Using @sparticuz/chromium.");
      try {
        executablePath = await chromium.executablePath();
        launchArgs = [...chromium.args, ...launchArgs];
      } catch (e: any) {
        Logger.error(`[BrowserFactory] chromium.executablePath() failed in Vercel environment: ${e.message}`);
        throw new Error(`Failed to find Chromium executable for Vercel: ${e.message}`);
      }
    } else if (!executablePath) {
      // Non-Vercel, and PUPPETEER_EXECUTABLE_PATH not explicitly set: try bundled or auto-detect
      Logger.info("[BrowserFactory] PUPPETEER_EXECUTABLE_PATH not set. Attempting to use bundled or auto-detected Chromium.");
      try {
        // This path is for local development with puppeteer's bundled browser
        const puppeteerCoreExecutablePath = executablePath; // Renaming to avoid confusion
        if (puppeteerCoreExecutablePath && fs.existsSync(puppeteerCoreExecutablePath)) {
          executablePath = puppeteerCoreExecutablePath;
          Logger.info(`[BrowserFactory] Using Puppeteer's bundled Chromium at: ${executablePath}`);
        } else {
          // Fallback for Docker/VPS if chromium is installed globally
          Logger.warn("[BrowserFactory] Puppeteer's bundled Chromium not found or executablePath is undefined. Attempting to auto-detect system Chromium.");
          // This might require a more sophisticated detection for different OS/installations
          // For now, we'll rely on the user setting PUPPETEER_EXECUTABLE_PATH for Docker/VPS if not found here.
          // Or, if puppeteer-core can find it, it will.
        }
      } catch (e: any) {
        Logger.warn(`[BrowserFactory] Could not find Puppeteer's bundled Chromium: ${e.message}`);
      }
    }

    if (!executablePath || !fs.existsSync(executablePath)) {
      const errorMessage = `Chromium executable not found at: ${executablePath || ''}. Please ensure the path is correct, or @sparticuz/chromium-min is properly configured for Vercel, or Chromium is installed for Docker/VPS, or PUPPETEER_EXECUTABLE_PATH is set.`;
      Logger.error(`[BrowserFactory] ${errorMessage}`);
      throw new Error(errorMessage);
    }

    Logger.info(`[BrowserFactory] Launching Puppeteer with executablePath: ${executablePath}`);

    try {
      browserInstance = await launch({
        args: launchArgs,
        executablePath,
        headless: true,
      });
      return browserInstance;
    } catch (error: any) {
      Logger.error(`[BrowserFactory] Error launching Puppeteer: ${error.message}`);
      throw new Error(`Failed to launch browser: ${error.message}`);
    }
  }
}
