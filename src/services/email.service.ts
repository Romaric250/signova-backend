// src/services/email.service.ts
import logger from "../utils/logger";

// Placeholder email service
// In production, integrate with services like SendGrid, Resend, or AWS SES

export const sendEmail = async (
  to: string,
  subject: string,
  html: string
): Promise<void> => {
  // TODO: Implement email sending logic
  logger.info(`Email would be sent to ${to}: ${subject}`);
  
  // Example implementation:
  // const transporter = nodemailer.createTransport({ ... });
  // await transporter.sendMail({ to, subject, html });
};

export const sendWelcomeEmail = async (email: string, name: string) => {
  const subject = "Welcome to SignNova!";
  const html = `
    <h1>Welcome to SignNova, ${name}!</h1>
    <p>Thank you for joining our sign language learning community.</p>
  `;
  
  await sendEmail(email, subject, html);
};

export const sendPasswordResetEmail = async (email: string, resetToken: string) => {
  const subject = "Reset your SignNova password";
  const html = `
    <h1>Password Reset Request</h1>
    <p>Click the link below to reset your password:</p>
    <a href="${process.env.FRONTEND_URL}/reset-password?token=${resetToken}">Reset Password</a>
  `;
  
  await sendEmail(email, subject, html);
};

