import { NextRequest, NextResponse } from "next/server";
import { getSubmission } from "@/shared/database/db.service";
import {
  NotificationService,
  EmailNotificationProvider,
  TelegramNotificationProvider,
} from "@/shared/services/notification.service";
import { Logger } from "@/shared/utils/logger";

// Helper to get the base URL dynamically
const getBaseUrl = (req: NextRequest) => {
  const vercelUrl = process.env.VERCEL_URL;
  if (vercelUrl) {
    return `https://${vercelUrl}`;
  }
  const host = req.headers.get("host");
  return `http://${host}`;
};

export async function POST(req: NextRequest) {
  Logger.info("[Notify Email API] Received request");

  let body: { submissionId?: string; email?: string; scanType?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { submissionId, email, scanType } = body;

  if (!submissionId || !email || !scanType) {
    return NextResponse.json(
      { error: "Missing required fields: submissionId, email, scanType." },
      { status: 400 }
    );
  }

  // Validate email format
  if (!email.includes("@")) {
    return NextResponse.json({ error: "Invalid email address." }, { status: 400 });
  }

  // Retrieve the stored submission
  const submission = await getSubmission(submissionId);
  if (!submission) {
    Logger.error(`[Notify Email API] Submission not found: ${submissionId}`);
    return NextResponse.json({ error: "Submission not found." }, { status: 404 });
  }

  // Extract contact info from the stored submission
  const contact = submission.contact || {};
  const firstname = contact.firstname || submission.firstname || "";
  const lastname  = contact.lastname  || submission.lastname  || "";
  const company   = (contact.company || submission.company?.name || submission.company || "N/A") as string;
  const tier      = submission.tier ?? "";

  const notificationService = new NotificationService([
    new EmailNotificationProvider(),
    new TelegramNotificationProvider(),
  ]);

  const userEmail         = email.trim();
  const teamEmail         = process.env.TEAM_EMAIL_ADDRESS;
  const telegramChatIdTeam = process.env.TELEGRAM_CHAT_ID_TEAM;
  const baseUrl           = getBaseUrl(req);

  const isOpportunity = scanType === "opportunity";
  const reportPath    = isOpportunity
    ? `result/opportunity?id=${submissionId}&unlock=true`
    : `ai/cost-scan/results?id=${submissionId}&unlock=true`;
  const reportName    = isOpportunity ? "Opportunity Scan" : "Cost Scan";

  // ── Send user email (PDF attachment) ──────────────────────────────────────
  Logger.info(`[Notify Email API] Sending user email to: ${userEmail}`);
  try {
    const emailResults = await notificationService.sendNotification("user_email", {
      submissionId,
      email: userEmail,
      scanType: scanType as "cost" | "opportunity",
      recipientName: `${firstname} ${lastname}`.trim() || userEmail,
    });
    // Check if the email provider reported success
    const emailResult = emailResults.find(r => r.error !== "Telegram provider does not handle this notification type.");
    if (emailResult && !emailResult.success) {
      Logger.error(`[Notify Email API] Email provider returned failure: ${emailResult.error}`);
    } else {
      Logger.info("[Notify Email API] User email sent successfully.");
    }
  } catch (err) {
    Logger.error("[Notify Email API] Failed to send user email:", err);
  }

  // ── Send team email (non-blocking) ────────────────────────────────────────
  if (teamEmail) {
    notificationService
      .sendNotification("team_email", {
        submissionId,
        email: teamEmail,
        scanType: scanType as "cost" | "opportunity",
        recipientName: "Pixel Punch Team",
      })
      .then(() => Logger.info("[Notify Email API] Team email sent."))
      .catch((err) => Logger.error("[Notify Email API] Team email error:", err));
  }

  // ── Send Telegram notification to team ────────────────────────────────────
  if (telegramChatIdTeam) {
    const telegramMessage =
      `New ${reportName} — Email Unlock!\n` +
      ` \n` +
      `Submission ID: ${submissionId}\n` +
      `Company: ${company}\n` +
      `Contact: ${firstname} ${lastname} (${userEmail})\n` +
      `Tier: ${tier}\n` +
      ` \n` +
      `View Report: ${baseUrl}/${reportPath}`;

    notificationService
      .sendNotification("telegram_team", {
        message: telegramMessage,
        chatId: telegramChatIdTeam,
      })
      .then(() => Logger.info("[Notify Email API] Telegram notification sent."))
      .catch((err) => Logger.error("[Notify Email API] Telegram error:", err));
  } else {
    Logger.warn("[Notify Email API] TELEGRAM_CHAT_ID_TEAM not set — Telegram skipped.");
  }

  return NextResponse.json(
    { success: true, message: "Report email sent successfully!" },
    { status: 200 }
  );
}
