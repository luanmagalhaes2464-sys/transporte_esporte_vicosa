import nodemailer from "nodemailer";
import { env } from "@/config/env";

export interface EmailProvider {
  send(input: { to: string; subject: string; html: string }): Promise<{ sent: boolean; reason?: string }>;
}

class DisabledEmailProvider implements EmailProvider {
  async send() { return { sent: false, reason: "disabled" }; }
}

class ResendEmailProvider implements EmailProvider {
  async send(input: { to: string; subject: string; html: string }) {
    const e = env();
    if (!e.EMAIL_API_KEY) throw new Error("EMAIL_NOT_CONFIGURED");
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${e.EMAIL_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: e.EMAIL_FROM, to: [input.to], subject: input.subject, html: input.html }),
      signal: AbortSignal.timeout(8000)
    });
    if (!res.ok) throw new Error("EMAIL_PROVIDER_ERROR");
    return { sent: true };
  }
}

class SmtpEmailProvider implements EmailProvider {
  async send(input: { to: string; subject: string; html: string }) {
    const e = env();
    if (!e.SMTP_HOST || !e.SMTP_PORT || !e.SMTP_USER || !e.SMTP_PASSWORD) throw new Error("EMAIL_NOT_CONFIGURED");
    const transporter = nodemailer.createTransport({
      host: e.SMTP_HOST,
      port: e.SMTP_PORT,
      secure: e.SMTP_SECURE,
      auth: { user: e.SMTP_USER, pass: e.SMTP_PASSWORD }
    });
    await transporter.sendMail({ from: e.EMAIL_FROM, to: input.to, subject: input.subject, html: input.html });
    return { sent: true };
  }
}

export function emailProvider(): EmailProvider {
  if (env().EMAIL_PROVIDER === "resend") return new ResendEmailProvider();
  if (env().EMAIL_PROVIDER === "smtp") return new SmtpEmailProvider();
  return new DisabledEmailProvider();
}

export async function sendEmail(input: { to: string; subject: string; html: string }) {
  return emailProvider().send(input);
}
