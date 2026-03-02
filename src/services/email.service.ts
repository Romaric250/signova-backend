// src/services/email.service.ts
import { Resend } from "resend";
import { env } from "../config/env";
import logger from "../utils/logger";

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;
const from = env.EMAIL_FROM;

// Email colors - match app theme
const colors = {
  bg: "#0f1914",
  card: "#16261e",
  border: "#1e3328",
  primary: "#38E078",
  text: "#e5e7eb",
  textMuted: "#9ca3af",
  white: "#ffffff",
};

function wrapEmail(content: string, title?: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title || "SignNova"}</title>
</head>
<body style="margin:0;padding:0;font-family:'Segoe UI',system-ui,-apple-system,sans-serif;background-color:${colors.bg};color:${colors.text};line-height:1.6;-webkit-font-smoothing:antialiased;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${colors.bg};min-height:100vh;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;margin:0 auto;">
          <tr>
            <td style="padding:32px;background-color:${colors.card};border:1px solid ${colors.border};border-radius:12px;box-shadow:0 4px 6px rgba(0,0,0,0.2);">
              <div style="margin-bottom:24px;">
                <span style="display:inline-block;padding:8px 12px;background-color:${colors.primary};color:${colors.bg};font-weight:700;font-size:14px;border-radius:8px;">SignNova</span>
              </div>
              ${content}
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:24px 0 0;font-size:12px;color:${colors.textMuted};">
              SignNova · Breaking barriers in communication
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function buttonHtml(href: string, label: string): string {
  return `
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0 0;">
  <tr>
    <td>
      <a href="${href}" style="display:inline-block;padding:14px 28px;background-color:${colors.primary};color:${colors.bg};font-weight:600;font-size:15px;text-decoration:none;border-radius:8px;border:none;">${label}</a>
    </td>
  </tr>
</table>`;
}

async function send(to: string, subject: string, html: string): Promise<void> {
  if (!resend) {
    logger.info(`Email (no Resend key): to=${to} subject=${subject}`);
    return;
  }
  try {
    const { error } = await resend.emails.send({
      from,
      to,
      subject,
      html,
    });
    if (error) {
      logger.error(`Resend error: ${JSON.stringify(error)}`);
      throw error;
    }
    logger.info(`Email sent to ${to}: ${subject}`);
  } catch (e) {
    logger.error(`Failed to send email to ${to}:`, e);
    throw e;
  }
}

export async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  await send(to, subject, wrapEmail(html, subject));
}

export async function sendVerificationEmail(email: string, url: string): Promise<void> {
  const subject = "Verify your SignNova email";
  const content = `
    <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:${colors.white};">Verify your email</h1>
    <p style="margin:0 0 12px;font-size:16px;color:${colors.text};">Click the button below to verify your SignNova account and get started.</p>
    ${buttonHtml(url, "Verify email")}
    <p style="margin:24px 0 0;font-size:14px;color:${colors.textMuted};">If you didn't create an account, you can safely ignore this email.</p>
  `;
  await send(email, subject, wrapEmail(content, subject));
}

export async function sendOTPEmail(email: string, code: string): Promise<void> {
  const subject = "Your SignNova verification code";
  const content = `
    <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:${colors.white};">Verification code</h1>
    <p style="margin:0 0 8px;font-size:16px;color:${colors.text};">Your code is:</p>
    <p style="margin:0 0 16px;font-size:28px;font-weight:700;letter-spacing:4px;color:${colors.primary};">${code}</p>
    <p style="margin:0;font-size:14px;color:${colors.textMuted};">This code expires in 10 minutes.</p>
  `;
  await send(email, subject, wrapEmail(content, subject));
}

export async function sendPasswordResetEmail(email: string, resetToken: string): Promise<void> {
  const url = `${env.FRONTEND_URL}/reset-password?token=${encodeURIComponent(resetToken)}`;
  const subject = "Reset your SignNova password";
  const content = `
    <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:${colors.white};">Reset your password</h1>
    <p style="margin:0 0 12px;font-size:16px;color:${colors.text};">We received a request to reset your password. Click the button below to choose a new one.</p>
    ${buttonHtml(url, "Reset password")}
    <p style="margin:24px 0 0;font-size:14px;color:${colors.textMuted};">This link expires in 1 hour. If you didn't request this, you can safely ignore this email.</p>
  `;
  await send(email, subject, wrapEmail(content, subject));
}

export async function sendWelcomeEmail(email: string, name: string): Promise<void> {
  const subject = "Welcome to SignNova";
  const content = `
    <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:${colors.white};">Welcome, ${name}!</h1>
    <p style="margin:0 0 12px;font-size:16px;color:${colors.text};">Thank you for joining SignNova. You can now start learning sign language and connecting with others.</p>
    ${buttonHtml(`${env.FRONTEND_URL}/app`, "Go to SignNova")}
  `;
  await send(email, subject, wrapEmail(content, subject));
}

export async function sendGroupJoinEmail(
  email: string,
  userName: string,
  groupName: string,
  inviterName: string
): Promise<void> {
  const subject = `You joined ${groupName}`;
  const inviterText = inviterName ? ` (invited by ${inviterName})` : "";
  const content = `
    <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:${colors.white};">Group joined</h1>
    <p style="margin:0 0 12px;font-size:16px;color:${colors.text};">Hi ${userName},</p>
    <p style="margin:0 0 12px;font-size:16px;color:${colors.text};">You have joined the group <strong style="color:${colors.white};">${groupName}</strong>${inviterText}.</p>
    ${buttonHtml(`${env.FRONTEND_URL}/app/groups`, "View groups")}
  `;
  await send(email, subject, wrapEmail(content, subject));
}

export async function sendGroupRemovedEmail(
  email: string,
  userName: string,
  groupName: string
): Promise<void> {
  const subject = `Removed from ${groupName}`;
  const content = `
    <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:${colors.white};">Removed from group</h1>
    <p style="margin:0 0 12px;font-size:16px;color:${colors.text};">Hi ${userName},</p>
    <p style="margin:0 0 12px;font-size:16px;color:${colors.text};">You have been removed from the group <strong style="color:${colors.white};">${groupName}</strong>.</p>
    ${buttonHtml(`${env.FRONTEND_URL}/app/groups`, "View groups")}
  `;
  await send(email, subject, wrapEmail(content, subject));
}

export async function sendNewChatEmail(
  email: string,
  userName: string,
  otherUserName: string
): Promise<void> {
  const subject = `${otherUserName} started a chat with you`;
  const content = `
    <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:${colors.white};">New chat</h1>
    <p style="margin:0 0 12px;font-size:16px;color:${colors.text};">Hi ${userName},</p>
    <p style="margin:0 0 12px;font-size:16px;color:${colors.text};"><strong style="color:${colors.white};">${otherUserName}</strong> has started a chat with you on SignNova.</p>
    ${buttonHtml(`${env.FRONTEND_URL}/app/chats`, "View chats")}
  `;
  await send(email, subject, wrapEmail(content, subject));
}
