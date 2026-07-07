
// shared/utils/browser-factory.ts

import { Browser, launch, executablePath as puppeteerCoreExecutablePath } from "puppeteer-core";
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
        const defaultExecutablePath = puppeteerCoreExecutablePath(); // Use the imported executablePath
        if (defaultExecutablePath && fs.existsSync(defaultExecutablePath)) {
          executablePath = defaultExecutablePath;
          Logger.info(`[BrowserFactory] Using Puppeteer's bundled Chromium at: ${executablePath}`);
        } else {
          // Fallback to puppeteer-core's executablePath for auto-detection
          executablePath = puppeteerCoreExecutablePath(); // Use puppeteer-core's executablePath variable
          Logger.info(`[BrowserFactory] Using puppeteer-core auto-detected Chromium at: ${executablePath}`);
        }
      } catch (e: any) {
        Logger.warn(`[BrowserFactory] Could not find Puppeteer's bundled Chromium: ${e.message}`);
      }
    }

    if (!executablePath) {
      const errorMessage = `Chromium executable path is undefined. Please ensure PUPPETEER_EXECUTABLE_PATH is set or @sparticuz/chromium-min is configured.`;
      Logger.error(`[BrowserFactory] ${errorMessage}`);
      throw new Error(errorMessage);
    }

    if (!fs.existsSync(executablePath)) {
      const errorMessage = `Chromium executable not found at: ${executablePath}. Please ensure the path is correct.`;
      Logger.error(`[BrowserFactory] ${errorMessage}`);
      throw new Error(errorMessage);
    }

    Logger.info(`[BrowserFactory] Resolved executablePath: ${executablePath}`);
    Logger.info(`[BrowserFactory] Launch args: ${JSON.stringify(launchArgs)}`);
    // Note: Puppeteer and Chromium versions are not directly available here without additional imports or checks.
    // We rely on the environment to provide compatible versions.
    Logger.info(`[BrowserFactory] Launching Puppeteer with executablePath: ${executablePath}`);

    try {
      browserInstance = await launch({
        args: launchArgs,
        executablePath,
        headless: true,
      });
      Logger.info(`[BrowserFactory] BrowserFactory result: Browser launched successfully.`);
      return browserInstance;
    } catch (error: any) {
      Logger.error(`[BrowserFactory] Error launching Puppeteer: ${error.message}`);
      throw error; // Re-throw original error
    }
  }
}
